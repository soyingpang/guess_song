const fs = require("fs");
const https = require("https");

const RUN_DATE = process.env.VIEW_FILTER_DATE || "2026-05-26";
const MIN_VIEWS = Number(process.env.MIN_YOUTUBE_VIEWS || 3000);
const FETCH_DELAY_MS = Number(process.env.VIEW_FETCH_DELAY_MS || 350);
const FETCH_RETRIES = Number(process.env.VIEW_FETCH_RETRIES || 1);
const REFRESH_VIEW_COUNTS = process.env.REFRESH_VIEW_COUNTS === "1";

const CACHE_PATH = `.cache/youtube-view-counts-${RUN_DATE}.json`;
const REPORT_PATH = `docs/YOUTUBE_VIEW_FILTER_${RUN_DATE}.md`;
const CSV_PATH = `docs/YOUTUBE_VIEW_FILTER_${RUN_DATE}.csv`;

const SOURCE_LISTS = [
  { name: "都會詩歌", path: "hymns.json" },
  { name: "80s 歌單", path: "songlists/pop-80s.json" },
  { name: "90s 歌單", path: "songlists/pop-90s.json" },
  { name: "最近25年熱門新歌", path: "songlists/pop-recent-25.json" },
];

const POP_ALL_PATH = "songlists/pop-all.json";
const ALL_SONGLISTS_PATH = "songlists/all-songlists.json";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(path) {
  fs.mkdirSync(path, { recursive: true });
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readCache() {
  if (!fs.existsSync(CACHE_PATH)) {
    return { checkedAt: RUN_DATE, videos: {} };
  }

  const parsed = readJson(CACHE_PATH);
  return {
    checkedAt: parsed.checkedAt || RUN_DATE,
    videos: parsed.videos || {},
  };
}

function writeCache(cache) {
  ensureDir(".cache");
  fs.writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

function requestText(url, redirectDepth = 0) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "accept-encoding": "identity",
          "accept-language": "en-US,en;q=0.9,zh-Hant-HK;q=0.8,zh-Hant;q=0.7",
          "cache-control": "no-cache",
          pragma: "no-cache",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        },
      },
      (response) => {
        const location = response.headers.location;
        if (location && response.statusCode >= 300 && response.statusCode < 400) {
          if (redirectDepth >= 5) {
            reject(new Error(`Too many redirects: ${url}`));
            return;
          }
          const nextUrl = new URL(location, url).toString();
          response.resume();
          requestText(nextUrl, redirectDepth + 1).then(resolve, reject);
          return;
        }

        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if (response.statusCode >= 400) {
            reject(new Error(`HTTP ${response.statusCode}: ${url}`));
            return;
          }
          resolve(body);
        });
      }
    );

    request.on("error", reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error(`Timed out: ${url}`));
    });
  });
}

function decodeJsonString(value) {
  if (!value) return "";
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return String(value).replace(/\\u0026/g, "&").replace(/\\"/g, '"');
  }
}

function parseVideoMetadata(html, videoId) {
  const videoDetailsStart = html.indexOf('"videoDetails":{');
  const videoDetails = videoDetailsStart >= 0 ? html.slice(videoDetailsStart, videoDetailsStart + 180000) : html;
  const viewNearVideoId = videoDetails.match(
    new RegExp(`"videoId"\\s*:\\s*"${escapeRegExp(videoId)}"[\\s\\S]{0,60000}?"viewCount"\\s*:\\s*"(\\d+)"`)
  );
  const viewInDetails = videoDetails.match(/"viewCount"\s*:\s*"(\d+)"/);
  const firstViewCount = html.match(/"viewCount"\s*:\s*"(\d+)"/);
  const titleMatch = videoDetails.match(/"title"\s*:\s*"((?:\\.|[^"])*)"/);
  const authorMatch = videoDetails.match(/"author"\s*:\s*"((?:\\.|[^"])*)"/);

  const rawViewCount = viewNearVideoId?.[1] || viewInDetails?.[1] || firstViewCount?.[1] || "";
  const viewCount = rawViewCount ? Number(rawViewCount) : null;

  return {
    videoId,
    viewCount: Number.isFinite(viewCount) ? viewCount : null,
    youtubeTitle: decodeJsonString(titleMatch?.[1] || ""),
    channel: decodeJsonString(authorMatch?.[1] || ""),
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function fetchVideoMetadata(videoId) {
  const url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=en&gl=US`;
  let lastError = null;

  for (let attempt = 0; attempt <= FETCH_RETRIES; attempt += 1) {
    try {
      const html = await requestText(url);
      const metadata = parseVideoMetadata(html, videoId);
      return {
        ...metadata,
        status: metadata.viewCount == null ? "unknown" : "ok",
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      lastError = error;
      if (attempt < FETCH_RETRIES) {
        await sleep(800 + attempt * 500);
      }
    }
  }

  return {
    videoId,
    viewCount: null,
    youtubeTitle: "",
    channel: "",
    status: "error",
    error: lastError ? lastError.message : "Unknown error",
    fetchedAt: new Date().toISOString(),
  };
}

async function collectMetadata(videoIds) {
  const cache = readCache();
  const metadataById = new Map();
  let fetched = 0;

  for (let index = 0; index < videoIds.length; index += 1) {
    const videoId = videoIds[index];
    const cached = cache.videos[videoId];
    if (!REFRESH_VIEW_COUNTS && cached && ("viewCount" in cached || cached.status)) {
      metadataById.set(videoId, cached);
      continue;
    }

    const metadata = await fetchVideoMetadata(videoId);
    cache.videos[videoId] = metadata;
    metadataById.set(videoId, metadata);
    fetched += 1;

    if (metadata.viewCount == null) {
      console.log(`[${index + 1}/${videoIds.length}] ${videoId}: ${metadata.status}`);
    } else if (fetched === 1 || fetched % 25 === 0 || index === videoIds.length - 1) {
      console.log(`[${index + 1}/${videoIds.length}] ${videoId}: ${metadata.viewCount}`);
    }

    if (fetched % 20 === 0) writeCache(cache);
    if (index < videoIds.length - 1) await sleep(FETCH_DELAY_MS);
  }

  writeCache(cache);
  return metadataById;
}

function withViewMetadata(song, metadata) {
  return {
    ...song,
    viewCount: metadata.viewCount,
    viewCheckedAt: RUN_DATE,
  };
}

function buildPopAll(filteredSources) {
  const popSongs = filteredSources
    .filter((source) => source.path !== "hymns.json")
    .flatMap((source) => source.kept);

  return popSongs.map((song, index) => ({
    ...song,
    number: `POP-${String(index + 1).padStart(3, "0")}`,
  }));
}

function songStatus(viewCount) {
  if (viewCount == null) return "removed-unknown";
  return viewCount >= MIN_VIEWS ? "kept" : "removed-under-threshold";
}

function filterSource(source, metadataById) {
  const songs = readJson(source.path);
  const kept = [];
  const auditRows = [];

  for (const song of songs) {
    const metadata = metadataById.get(song.videoId) || { viewCount: null, status: "missing" };
    const status = songStatus(metadata.viewCount);
    const auditRow = {
      list: source.name,
      path: source.path,
      number: song.number || "",
      title: song.title || "",
      videoId: song.videoId || "",
      viewCount: metadata.viewCount,
      status,
      youtubeTitle: metadata.youtubeTitle || "",
      channel: metadata.channel || "",
      url: song.videoId ? `https://www.youtube.com/watch?v=${song.videoId}` : "",
      error: metadata.error || "",
    };
    auditRows.push(auditRow);

    if (status === "kept") {
      kept.push(withViewMetadata(song, metadata));
    }
  }

  return {
    ...source,
    before: songs.length,
    kept,
    removed: songs.length - kept.length,
    auditRows,
  };
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function markdownCell(value) {
  return String(value == null ? "" : value)
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|");
}

function markdownLink(title, url) {
  const label = markdownCell(title).replace(/\[/g, "\\[").replace(/\]/g, "\\]");
  return `[${label}](${url})`;
}

function writeCsv(auditRows) {
  const headers = [
    "list",
    "number",
    "title",
    "videoId",
    "viewCount",
    "status",
    "youtubeTitle",
    "channel",
    "url",
    "error",
  ];
  const lines = [
    headers.join(","),
    ...auditRows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ];
  fs.writeFileSync(CSV_PATH, `${lines.join("\n")}\n`, "utf8");
}

function markdownTable(rows) {
  if (!rows.length) return "_沒有歌曲被移除。_";

  const limitedRows = rows.slice(0, 80);
  const lines = [
    "| 歌單 | 編號 | 歌名 | 瀏覽量 | 原因 |",
    "| --- | --- | --- | ---: | --- |",
    ...limitedRows.map((row) =>
      `| ${[
        markdownCell(row.list),
        markdownCell(row.number),
        markdownLink(row.title, row.url),
        row.viewCount == null ? "未能讀取" : row.viewCount.toLocaleString("en-US"),
        row.status === "removed-unknown" ? "未確認達標" : `< ${MIN_VIEWS.toLocaleString("en-US")}`,
      ].join(" | ")} |`
    ),
  ];

  if (rows.length > limitedRows.length) {
    lines.push(
      `| ... | ... | 其餘 ${rows.length - limitedRows.length} 首見 CSV | ... | ... |`
    );
  }

  return lines.join("\n");
}

function writeReport(filteredSources, auditRows, popAll, allSonglists) {
  const removedRows = auditRows.filter((row) => row.status !== "kept");
  const unknownRows = auditRows.filter((row) => row.status === "removed-unknown");
  const summaryLines = filteredSources.map((source) => {
    const after = source.kept.length;
    return `| ${source.name} | ${source.before} | ${after} | ${source.removed} |`;
  });

  const report = [
    `# YouTube View Count Filter (${RUN_DATE})`,
    "",
    `門檻：只保留 YouTube 瀏覽量 >= ${MIN_VIEWS.toLocaleString("en-US")} 的歌曲。`,
    "",
    "## Summary",
    "",
    "| 歌單 | 原本 | 保留 | 移除 |",
    "| --- | ---: | ---: | ---: |",
    ...summaryLines,
    `| 所有流行歌合併歌單 | - | ${popAll.length} | - |`,
    `| 全部歌單 | - | ${allSonglists.length} | - |`,
    "",
    "## Removed Songs",
    "",
    `移除總數：${removedRows.length}。其中 ${unknownRows.length} 首未能從 YouTube 頁面確認瀏覽量，所以按門檻要求移除。`,
    "",
    markdownTable(removedRows),
    "",
    `完整逐首紀錄：${CSV_PATH}`,
    "",
  ].join("\n");

  fs.writeFileSync(REPORT_PATH, report, "utf8");
}

function validateOutput(paths) {
  const badRows = [];
  for (const path of paths) {
    for (const song of readJson(path)) {
      if (!Number.isFinite(song.viewCount) || song.viewCount < MIN_VIEWS) {
        badRows.push({ path, number: song.number, title: song.title, viewCount: song.viewCount });
      }
    }
  }

  if (badRows.length) {
    throw new Error(`Validation failed: ${badRows.length} kept songs are below the view threshold.`);
  }
}

async function main() {
  ensureDir("docs");
  ensureDir(".cache");

  const loadedSources = SOURCE_LISTS.map((source) => ({
    ...source,
    songs: readJson(source.path),
  }));
  const videoIds = [
    ...new Set(
      loadedSources
        .flatMap((source) => source.songs)
        .map((song) => song.videoId)
        .filter(Boolean)
    ),
  ];

  console.log(`Checking ${videoIds.length} unique YouTube videos. Minimum views: ${MIN_VIEWS}.`);
  const metadataById = await collectMetadata(videoIds);

  const filteredSources = SOURCE_LISTS.map((source) => filterSource(source, metadataById));
  for (const source of filteredSources) {
    writeJson(source.path, source.kept);
  }

  const popAll = buildPopAll(filteredSources);
  const hymns = filteredSources.find((source) => source.path === "hymns.json").kept;
  const allSonglists = [...hymns, ...popAll];
  writeJson(POP_ALL_PATH, popAll);
  writeJson(ALL_SONGLISTS_PATH, allSonglists);

  const auditRows = filteredSources.flatMap((source) => source.auditRows);
  writeCsv(auditRows);
  writeReport(filteredSources, auditRows, popAll, allSonglists);
  validateOutput([
    "hymns.json",
    "songlists/pop-80s.json",
    "songlists/pop-90s.json",
    "songlists/pop-recent-25.json",
    POP_ALL_PATH,
    ALL_SONGLISTS_PATH,
  ]);

  console.log("Done.");
  for (const source of filteredSources) {
    console.log(`${source.name}: ${source.before} -> ${source.kept.length}`);
  }
  console.log(`Pop all: ${popAll.length}`);
  console.log(`All songlists: ${allSonglists.length}`);
  console.log(`Report: ${REPORT_PATH}`);
  console.log(`CSV: ${CSV_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
