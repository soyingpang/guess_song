const fs = require("fs");
const https = require("https");

const RUN_DATE = process.env.WHITELIST_HYMN_DATE || "2026-05-26";
const MIN_VIEWS = Number(process.env.MIN_YOUTUBE_VIEWS || 3000);
const TARGET_ADDITIONS = Number(process.env.WHITELIST_HYMN_TARGET || 40);
const SEARCH_DELAY_MS = Number(process.env.WHITELIST_SEARCH_DELAY_MS || 2500);
const VIEW_DELAY_MS = Number(process.env.WHITELIST_VIEW_DELAY_MS || 300);
const DRY_RUN = process.env.DRY_RUN === "1";

const HYMNS_PATH = "hymns.json";
const POP_ALL_PATH = "songlists/pop-all.json";
const ALL_SONGLISTS_PATH = "songlists/all-songlists.json";
const VIEW_CACHE_PATH = `.cache/youtube-view-counts-${RUN_DATE}.json`;
const SEARCH_CACHE_PATH = `.cache/whitelist-hymn-searches-${RUN_DATE}.json`;
const REPORT_PATH = `docs/WHITELIST_HYMN_ADDITIONS_${RUN_DATE}.md`;
const CSV_PATH = `docs/WHITELIST_HYMN_ADDITIONS_${RUN_DATE}.csv`;

const APPROVED_SOURCE_KEYWORDS = [
  "小羊詩歌",
  "lamb music",
  "同心圓敬拜福音平台",
  "one circle",
  "角聲使團",
  "the heralders",
  "原始和聲",
  "raw harmony",
  "基恩敬拜",
  "amazing grace worship",
  "播道神學院",
  "evangel seminary",
  "鹹蛋音樂事工",
  "salted egg",
  "玻璃海樂團",
  "worship nations",
  "讚美之泉",
  "stream of praise",
  "建道神學院",
  "新祢呈",
  "alliance bible seminary",
  "泥土音樂",
  "clay music",
  "約書亞樂團",
  "joshua band",
  "團契遊樂園",
  "playground ministry",
  "hkacm",
  "香港基督徒音樂事工協會",
  "cantonhymn",
];

const SEARCH_QUERIES = [
  "讚美之泉 官方歌詞版MV",
  "讚美之泉 官方歌詞版MV 2024",
  "讚美之泉 官方歌詞版MV 2023",
  "讚美之泉 敬拜讚美 29 官方歌詞版MV",
  "讚美之泉 敬拜讚美 28 官方歌詞版MV",
  "讚美之泉 敬拜MV",
  "讚美之泉 兒童敬拜讚美 官方",
  "讚美之泉 官方 現場敬拜MV",
  "HKACM Official Music Video 詩歌",
  "HKACM Official Lyric Video 詩歌",
  "HKACM 齊唱敬拜讚美 Official Lyric Video",
  "HKACM 兒童事工 Official Music Video",
  "基恩敬拜 AGWMM Official MV",
  "基恩敬拜 官方 MV 詩歌",
  "基恩敬拜 祈禱仔 兒童敬拜",
  "小羊詩歌 中英字幕",
  "小羊詩歌 官方 詩歌",
  "小羊詩歌 基音原創",
  "小羊詩歌 盟約 專輯",
  "團契遊樂園 基督教詩歌",
  "同心圓敬拜 官方 詩歌",
  "鹹蛋音樂事工 詩歌",
  "CantonHymn 粵語詩歌",
  "約書亞樂團 官方歌詞MV 詩歌",
  "泥土音樂 Clay Music 盛曉玫 詩歌",
  "建道神學院 新祢呈 詩歌",
  "角聲使團 The Heralders 詩歌",
  "玻璃海樂團 Worship Nations 詩歌",
  "原始和聲 Raw Harmony 詩歌",
];

const BLOCKED_TITLE_KEYWORDS = [
  "karaoke",
  "instrumental",
  "伴奏",
  "無人聲",
  "純樂器",
  "卡拉ok",
  "卡拉 OK",
  "教學",
  "練習",
  "示範",
  "導唱",
  "playlist",
  "全專輯",
  "完整專輯",
  "合集",
  "合輯",
  "串燒",
  "shorts",
  "#shorts",
  "trailer",
  "預告",
  "講道",
  "信息",
  "訪問",
  "見證",
  "behind the scenes",
];

function ensureDir(path) {
  fs.mkdirSync(path, { recursive: true });
}

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeJsonString(value) {
  if (!value) return "";
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return String(value).replace(/\\u0026/g, "&").replace(/\\"/g, '"');
  }
}

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[袮你]/g, "祢")
    .replace(/[臺台]/g, "台")
    .replace(/[^\p{Letter}\p{Number}]/gu, "")
    .toLowerCase();
}

function hasChinese(value) {
  return /\p{Script=Han}/u.test(value);
}

function isApprovedSource(video) {
  const haystack = String(video.channel || "").toLowerCase();
  return APPROVED_SOURCE_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function hasBlockedTitle(video) {
  const text = `${video.title} ${video.channel}`.toLowerCase();
  return BLOCKED_TITLE_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
}

function parseDuration(value) {
  const parts = String(value || "")
    .split(":")
    .map((part) => Number(part));
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
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
          "accept-language": "zh-Hant-HK,zh-Hant;q=0.9,en;q=0.8",
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

function collectVideosFromHtml(html) {
  const videos = [];
  const chunks = html.split('"videoRenderer":{').slice(1, 81);
  for (const chunk of chunks) {
    const videoId = chunk.match(/^"videoId":"([^"]+)"/)?.[1];
    const rawTitle =
      chunk.match(/"title":\{"runs":\[\{"text":"((?:\\.|[^"])*)"/)?.[1] ||
      chunk.match(/"title":\{"simpleText":"((?:\\.|[^"])*)"/)?.[1];
    if (!videoId || !rawTitle) continue;

    const rawChannel =
      chunk.match(/"longBylineText":\{"runs":\[\{"text":"((?:\\.|[^"])*)"/)?.[1] ||
      chunk.match(/"ownerText":\{"runs":\[\{"text":"((?:\\.|[^"])*)"/)?.[1] ||
      "";
    const length = chunk.match(/"lengthText":[\s\S]*?"simpleText":"([^"]+)"/)?.[1] || "";

    videos.push({
      videoId,
      title: decodeJsonString(rawTitle),
      channel: decodeJsonString(rawChannel),
      length: decodeJsonString(length),
    });
  }
  return videos;
}

function loadSearchCache() {
  if (!fs.existsSync(SEARCH_CACHE_PATH)) return {};
  return readJson(SEARCH_CACHE_PATH);
}

function writeSearchCache(cache) {
  ensureDir(".cache");
  fs.writeFileSync(SEARCH_CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

function loadViewCache() {
  if (!fs.existsSync(VIEW_CACHE_PATH)) return { checkedAt: RUN_DATE, videos: {} };
  const parsed = readJson(VIEW_CACHE_PATH);
  return { checkedAt: parsed.checkedAt || RUN_DATE, videos: parsed.videos || {} };
}

function writeViewCache(cache) {
  ensureDir(".cache");
  fs.writeFileSync(VIEW_CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
}

async function searchYouTube(query, cache) {
  if (cache[query]) return cache[query];
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=zh-Hant&gl=HK`;
  const html = await requestText(url);
  const videos = collectVideosFromHtml(html);
  cache[query] = videos;
  writeSearchCache(cache);
  await sleep(SEARCH_DELAY_MS);
  return videos;
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
    status: Number.isFinite(viewCount) ? "ok" : "unknown",
    fetchedAt: new Date().toISOString(),
  };
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getVideoMetadata(video, cache) {
  if (cache.videos[video.videoId]?.viewCount != null) return cache.videos[video.videoId];

  const url = `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}&hl=en&gl=US`;
  try {
    const html = await requestText(url);
    const metadata = parseVideoMetadata(html, video.videoId);
    cache.videos[video.videoId] = metadata;
  } catch (error) {
    cache.videos[video.videoId] = {
      videoId: video.videoId,
      viewCount: null,
      youtubeTitle: video.title,
      channel: video.channel,
      status: "error",
      error: error.message,
      fetchedAt: new Date().toISOString(),
    };
  }

  writeViewCache(cache);
  await sleep(VIEW_DELAY_MS);
  return cache.videos[video.videoId];
}

function extractBracketText(title) {
  const matches = [...String(title || "").matchAll(/[【〖《〈「『]([^】〗》〉」』]{2,80})[】〗》〉」』]/g)];
  for (const match of matches) {
    const value = match[1].trim();
    if (hasChinese(value) && !/官方|歌詞|字幕|中英|詩歌|敬拜|專輯|MV/i.test(value)) return value;
  }
  return matches.find((match) => hasChinese(match[1]))?.[1]?.trim() || "";
}

function stripEnglishTail(value) {
  return String(value || "")
    .replace(/\s+[A-Z][A-Za-z ,.'’:-]+$/g, "")
    .replace(/\s+\([A-Za-z][^)]+\)$/g, "")
    .trim();
}

function cleanTitle(rawTitle) {
  let title = extractBracketText(rawTitle) || rawTitle;
  title = title
    .replace(/^【?中英字幕】?/i, "")
    .replace(/^詩歌敬拜\s*[|｜-]\s*/i, "")
    .replace(/^約書亞樂團\s*[-－]\s*/i, "")
    .replace(/^讚美之泉\s*[-－]\s*/i, "")
    .replace(/^HKACM\s*/i, "")
    .trim();

  const medleyParts = title.split(/[\/／]/).map((part) => part.trim()).filter(Boolean);
  if (medleyParts.length > 1 && medleyParts.slice(1).some(hasChinese)) return "";
  if (medleyParts.length > 1) title = medleyParts[0];

  title = title
    .split(/\s*[|｜]\s*/)[0]
    .split(/\s*[-－]\s*/)[0]
    .replace(/\s*\([^)]*(官方|Official|MV|歌詞|敬拜|專輯)[^)]*\)\s*/gi, "")
    .replace(/官方.*$/i, "")
    .replace(/Official.*$/i, "")
    .replace(/Music Video.*$/i, "")
    .replace(/Lyric.*$/i, "")
    .replace(/MV.*$/i, "")
    .replace(/歌詞.*$/i, "")
    .replace(/敬拜讚美.*$/i, "")
    .replace(/詩歌.*$/i, "")
    .replace(/[「」『』【】〖〗《》〈〉]/g, "")
    .trim();

  title = stripEnglishTail(title);
  return title.replace(/\s{2,}/g, " ").trim();
}

function shouldSkipVideo(video, derivedTitle, existingTitleKeys) {
  const duration = parseDuration(video.length);
  if (!isApprovedSource(video)) return "來源不在白名單";
  if (hasBlockedTitle(video)) return "排除伴奏/合集/非歌曲內容";
  if (!derivedTitle || !hasChinese(derivedTitle)) return "未能整理歌名";
  if (duration && (duration < 120 || duration > 620)) return "片長不適合";
  if (derivedTitle.length > 18) return "歌名過長或可能不是單曲";
  if (existingTitleKeys.has(normalize(derivedTitle))) return "歌名已存在";
  return "";
}

function scoreCandidate(candidate) {
  let score = Math.log10(Math.max(candidate.viewCount, 1)) * 20;
  const text = `${candidate.youtubeTitle} ${candidate.channel}`.toLowerCase();
  if (/official|官方|歌詞版|music video|lyric/i.test(text)) score += 16;
  if (/讚美之泉|stream of praise|hkacm|基恩敬拜|amazing grace worship|小羊詩歌|約書亞樂團|joshua band/i.test(text)) {
    score += 10;
  }
  if (/兒童|children/i.test(text)) score -= 6;
  if (candidate.title.length <= 8) score += 3;
  return score;
}

function buildSong(candidate, number) {
  return {
    title: candidate.title,
    aliases: candidate.aliases,
    videoId: candidate.videoId,
    start: 0,
    duration: 60,
    category: "詩歌",
    source: `${candidate.channel} / YouTube`,
    hint: `白名單熱門詩歌；來源：${candidate.sourceLabel}；YouTube：${candidate.youtubeTitle}`,
    number,
    language: "中文",
    viewCount: candidate.viewCount,
    viewCheckedAt: RUN_DATE,
    _channel: candidate.channel,
    _youtubeTitle: candidate.youtubeTitle,
    _sourceLabel: candidate.sourceLabel,
  };
}

function toPublicSong(song) {
  const { score, _channel, _youtubeTitle, _sourceLabel, ...publicSong } = song;
  return publicSong;
}

function rebuildAllSonglists(hymns) {
  const popAll = readJson(POP_ALL_PATH);
  writeJson(ALL_SONGLISTS_PATH, [...hymns, ...popAll]);
}

function markdownTable(rows) {
  if (!rows.length) return "_沒有新增歌曲。_";
  return [
    "| 編號 | 歌名 | 瀏覽量 | 來源 | YouTube |",
    "| --- | --- | ---: | --- | --- |",
    ...rows.map((row) =>
      `| ${row.number} | ${row.title} | ${row.viewCount.toLocaleString("en-US")} | ${row._channel || row.source} | [影片](https://www.youtube.com/watch?v=${row.videoId}) |`
    ),
  ].join("\n");
}

function writeReport(additions, rejected) {
  ensureDir("docs");
  const csvRows = [
    [
      "status",
      "number",
      "title",
      "videoId",
      "viewCount",
      "channel",
      "youtubeTitle",
      "reason",
      "url",
    ].join(","),
    ...additions.map((row) =>
      [
        "added",
        row.number,
        row.title,
        row.videoId,
        row.viewCount,
        row._channel || row.source,
        row._youtubeTitle || "",
        "",
        `https://www.youtube.com/watch?v=${row.videoId}`,
      ]
        .map(csvEscape)
        .join(",")
    ),
    ...rejected.map((row) =>
      [
        "skipped",
        "",
        row.title || row.derivedTitle || "",
        row.videoId || "",
        row.viewCount ?? "",
        row.channel || "",
        row.youtubeTitle || row.rawTitle || "",
        row.reason || "",
        row.videoId ? `https://www.youtube.com/watch?v=${row.videoId}` : "",
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  fs.writeFileSync(CSV_PATH, `${csvRows.join("\n")}\n`, "utf8");

  const report = [
    `# Whitelist Hymn Additions (${RUN_DATE})`,
    "",
    `只加入白名單來源、YouTube 瀏覽量 >= ${MIN_VIEWS.toLocaleString("en-US")} 的詩歌。`,
    "",
    `新增：${additions.length} 首。`,
    "",
    markdownTable(additions),
    "",
    `完整搜尋及跳過紀錄：${CSV_PATH}`,
    "",
  ].join("\n");
  fs.writeFileSync(REPORT_PATH, report, "utf8");
}

async function main() {
  ensureDir(".cache");
  ensureDir("docs");

  const hymns = readJson(HYMNS_PATH).map((song) => ({
    ...song,
    category: song.category === "教會詩歌" || song.category === "都會詩歌" ? "詩歌" : song.category,
  }));
  const existingVideoIds = new Set(hymns.map((song) => song.videoId).filter(Boolean));
  const existingTitleKeys = new Set(hymns.map((song) => normalize(song.title)));
  const searchCache = loadSearchCache();
  const viewCache = loadViewCache();

  const byVideoId = new Map();
  const rejected = [];

  for (const query of SEARCH_QUERIES) {
    let videos = [];
    try {
      videos = await searchYouTube(query, searchCache);
    } catch (error) {
      console.log(`${query}: search failed (${error.message})`);
      rejected.push({ title: query, reason: `搜尋失敗：${error.message}` });
      await sleep(SEARCH_DELAY_MS);
      continue;
    }
    console.log(`${query}: ${videos.length} results`);
    for (const video of videos) {
      if (existingVideoIds.has(video.videoId) || byVideoId.has(video.videoId)) continue;
      const derivedTitle = cleanTitle(video.title);
      const skipReason = shouldSkipVideo(video, derivedTitle, existingTitleKeys);
      if (skipReason) {
        rejected.push({ ...video, rawTitle: video.title, derivedTitle, reason: skipReason });
        continue;
      }
      byVideoId.set(video.videoId, {
        ...video,
        rawTitle: video.title,
        title: derivedTitle,
        sourceLabel: query,
      });
    }
  }

  const candidates = [];
  for (const video of byVideoId.values()) {
    const metadata = await getVideoMetadata(video, viewCache);
    const viewCount = metadata.viewCount;
    const youtubeTitle = metadata.youtubeTitle || video.rawTitle;
    const channel = metadata.channel || video.channel;
    if (viewCount == null || viewCount < MIN_VIEWS) {
      rejected.push({
        ...video,
        youtubeTitle,
        channel,
        viewCount,
        reason: viewCount == null ? "未能確認瀏覽量" : `瀏覽量低於 ${MIN_VIEWS}`,
      });
      continue;
    }

    const candidate = {
      ...video,
      youtubeTitle,
      channel,
      viewCount,
      aliases: [channel].filter(Boolean),
    };
    candidate.score = scoreCandidate(candidate);
    candidates.push(candidate);
  }

  candidates.sort((a, b) => b.score - a.score || b.viewCount - a.viewCount);
  const selected = [];
  const selectedTitleKeys = new Set(existingTitleKeys);
  for (const candidate of candidates) {
    const titleKey = normalize(candidate.title);
    if (selectedTitleKeys.has(titleKey)) continue;
    selectedTitleKeys.add(titleKey);
    selected.push(candidate);
    if (selected.length >= TARGET_ADDITIONS) break;
  }

  let nextNumber = Math.max(
    0,
    ...hymns.map((song) => Number(String(song.number || "").match(/HYMN-(\d+)/)?.[1] || 0))
  );
  const additions = selected.map((candidate) => {
    nextNumber += 1;
    const number = `HYMN-${String(nextNumber).padStart(3, "0")}`;
    return { ...buildSong(candidate, number), score: candidate.score };
  });

  if (!DRY_RUN) {
    writeJson(HYMNS_PATH, [...hymns, ...additions.map(toPublicSong)]);
    rebuildAllSonglists([...hymns, ...additions.map(toPublicSong)]);
  }
  writeReport(additions, rejected);

  console.log(`Selected ${additions.length} additions from ${candidates.length} eligible candidates.`);
  for (const addition of additions) {
    console.log(`${addition.number} ${addition.title} ${addition.viewCount} ${addition.videoId}`);
  }
  if (DRY_RUN) console.log("Dry run only; JSON files were not updated.");
  console.log(`Report: ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
