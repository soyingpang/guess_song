const fs = require("fs");
const https = require("https");

const SUMMARY_PATH = "docs/TPMAC_HYMNS_2021-05-22_to_2026-05-22_SUMMARY.csv";
const ALL_SONGLISTS_PATH = "songlists/all-songlists.json";
const HYMNS_PATH = "hymns.json";
const MATCHES_PATH = "docs/TPMAC_YOUTUBE_MATCHES_2026-05-22_EXTENDED.csv";
const REPORT_PATH = "docs/TPMAC_YOUTUBE_HYMN_LIST_2026-05-22_EXTENDED.md";
const TARGET_ADDITIONS = Number(process.env.TPMAC_TARGET_ADDITIONS || 50);
const SCAN_LIMIT = Number(process.env.TPMAC_SCAN_LIMIT || 180);
const CONCURRENCY = Number(process.env.TPMAC_CONCURRENCY || 6);
const MIN_COUNT = Number(process.env.TPMAC_MIN_COUNT || 2);
const MATCH_SCORE_THRESHOLD = Number(process.env.TPMAC_MATCH_SCORE_THRESHOLD || 92);

const HARD_SKIP_TITLES = new Set([
  "三一頌",
  "阿們頌",
  "禱文",
  "耶穌",
  "上主",
  "苦難",
  "敬拜創造主",
  "虛心的人有福",
  "Amen!",
  "Gloria",
  "Hallelujah",
  "Mighty Wind",
  "基督精兵奮進",
  "O COME",
  "快樂的家",
  "生命之河",
  "耶和華基督是主",
]);

const BLOCKED_VIDEO_IDS = new Set([
  "VVr0MJX5Ovk", // Secular movie song with the same Chinese title as a TPMAC entry.
  "WBJuLhsRk5Q", // Secular pop song with the same Chinese title as a TPMAC entry.
  "5aCm-uUL7Co", // Worship-themed video, but not the TPMAC song title.
  "WG_-7MLHoko", // Bible story video, not a singable hymn clip.
  "rPYhpDT2ViI", // Devotional video, not a singable hymn clip.
]);

const BLOCKED_VIDEO_KEYWORDS = [
  "電影《奪冠》",
  "王菲",
  "那英",
  "劉明峰",
  "超級星光大道",
  "Bring Me The Horizon",
  "鄧紫棋",
  "Lucy Thomas",
  "Fate/Stay Night",
  "OST",
  "聖經故事",
  "每日單獨會主",
  "Ying Na",
  "講故事",
];

function parseSummaryCsv(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [title, count, firstDate, lastDate] = line.split(",");
      return { title, count: Number(count), firstDate, lastDate };
    })
    .filter((row) => row.title && Number.isFinite(row.count));
}

function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[袮你]/g, "祢")
    .replace(/[臺台]/g, "台")
    .replace(/主耶穌/g, "耶穌")
    .replace(/[^\p{Letter}\p{Number}]/gu, "")
    .toLowerCase();
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestText(url) {
  return new Promise((resolve, reject) => {
    const request = https
      .get(
        url,
        {
          headers: {
            "Accept-Language": "zh-Hant,zh-HK;q=0.9,en;q=0.7",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
          },
        },
        (res) => {
          let data = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => resolve(data));
        }
      )
      .on("error", reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error("Request timed out"));
    });
  });
}

function extractInitialData(html) {
  const marker = "var ytInitialData = ";
  let start = html.indexOf(marker);
  if (start < 0) return null;
  start += marker.length;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < html.length; index += 1) {
    const char = html[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(html.slice(start, index + 1));
    }
  }
  return null;
}

function collectVideos(node, output = []) {
  if (!node || typeof node !== "object") return output;
  if (node.videoRenderer) {
    const video = node.videoRenderer;
    const title =
      video.title?.runs?.map((run) => run.text).join("") ||
      video.title?.simpleText ||
      "";
    const channel =
      video.ownerText?.runs?.map((run) => run.text).join("") ||
      video.shortBylineText?.runs?.map((run) => run.text).join("") ||
      "";
    if (video.videoId && title) {
      output.push({
        videoId: video.videoId,
        youtubeTitle: title,
        channel,
        length: video.lengthText?.simpleText || "",
      });
    }
  }

  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((item) => collectVideos(item, output));
    else collectVideos(value, output);
  }
  return output;
}

function decodeJsonString(value) {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return value.replace(/\\u0026/g, "&").replace(/\\"/g, '"');
  }
}

function collectVideosFromHtml(html) {
  const videos = [];
  const chunks = html.split('"videoRenderer":{').slice(1, 31);
  for (const chunk of chunks) {
    const videoId = chunk.match(/^"videoId":"([^"]+)"/)?.[1];
    const title = chunk.match(/"title":\{"runs":\[\{"text":"((?:\\.|[^"])*)"/)?.[1];
    if (!videoId || !title) continue;
    const channel =
      chunk.match(/"longBylineText":\{"runs":\[\{"text":"((?:\\.|[^"])*)"/)?.[1] ||
      chunk.match(/"ownerText":\{"runs":\[\{"text":"((?:\\.|[^"])*)"/)?.[1] ||
      "";
    const length = chunk.match(/"lengthText":[\s\S]*?"simpleText":"([^"]+)"/)?.[1] || "";
    videos.push({
      videoId,
      youtubeTitle: decodeJsonString(title),
      channel: decodeJsonString(channel),
      length: decodeJsonString(length),
    });
  }
  return videos;
}

function scoreMatch(candidateTitle, videoTitle) {
  const candidate = normalizeTitle(candidateTitle);
  const video = normalizeTitle(videoTitle);
  if (!candidate || !video) return 0;
  if (video.includes(candidate)) return 100;
  if (candidate.includes(video) && video.length >= 4) return 85;

  let shared = 0;
  for (const char of new Set([...candidate])) {
    if (video.includes(char)) shared += 1;
  }
  return Math.round((shared / Math.max(candidate.length, 1)) * 70);
}

function isBlockedVideo(video) {
  if (BLOCKED_VIDEO_IDS.has(video.videoId)) return true;
  const text = `${video.youtubeTitle || ""} ${video.channel || ""}`;
  return BLOCKED_VIDEO_KEYWORDS.some((keyword) => text.includes(keyword));
}

async function searchYouTube(row, usedVideoIds) {
  const queries = [
    `"${row.title}"`,
    `${row.title} 詩歌`,
    `${row.title} 基督教詩歌`,
    `${row.title} 歌詞`,
    `${row.title} 敬拜`,
    `${row.title} 聖詩`,
    `${row.title} 粵語`,
    `${row.title} hymn`,
    `${row.title} YouTube`,
  ];

  for (const query of queries) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      query
    )}&hl=zh-Hant&gl=HK`;
    let html = "";
    try {
      html = await requestText(url);
    } catch {
      await sleep(180);
      continue;
    }
    let videos = collectVideosFromHtml(html);
    if (!videos.length) {
      const data = extractInitialData(html);
      videos = data ? collectVideos(data) : [];
    }
    const ranked = videos
      .filter((video) => !usedVideoIds.has(video.videoId) && !isBlockedVideo(video))
      .map((video) => ({ ...video, score: scoreMatch(row.title, video.youtubeTitle), query }))
      .filter((video) => video.score >= MATCH_SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score);
    if (ranked.length) return ranked[0];
    await sleep(180);
  }
  return null;
}

function buildSong(row, match, index) {
  return {
    title: row.title,
    aliases: [],
    videoId: match.videoId,
    start: 0,
    duration: 60,
    category: "教會詩歌",
    source: `${match.channel || "YouTube"} / YouTube`,
    hint: `TPMAC 近5年程序表出現 ${row.count} 次；YouTube：${match.youtubeTitle}`,
    number: `HYMN-${String(index).padStart(3, "0")}`,
    language: "中文",
  };
}

function shouldTry(row, existingTitleKeys) {
  const key = normalizeTitle(row.title);
  if (!key || existingTitleKeys.has(key)) return false;
  if (HARD_SKIP_TITLES.has(row.title)) return false;
  if (key.length < 4) return false;
  if (row.count < MIN_COUNT) return false;
  return true;
}

async function main() {
  const summary = parseSummaryCsv(fs.readFileSync(SUMMARY_PATH, "utf8"));
  const allSongs = JSON.parse(fs.readFileSync(ALL_SONGLISTS_PATH, "utf8"));
  const currentHymns = allSongs.filter((song) => song.category === "教會詩歌");
  const otherSongs = allSongs.filter((song) => song.category !== "教會詩歌");
  const existingTitleKeys = new Set(currentHymns.map((song) => normalizeTitle(song.title)));
  const usedVideoIds = new Set(allSongs.map((song) => song.videoId).filter(Boolean));

  const additions = [];
  const misses = [];
  const candidates = summary
    .map((row, order) => ({ ...row, order }))
    .filter((row) => shouldTry(row, existingTitleKeys))
    .slice(0, SCAN_LIMIT);

  console.log(`Scanning ${candidates.length} TPMAC candidates for up to ${TARGET_ADDITIONS} additions...`);
  const found = [];
  let cursor = 0;
  async function worker() {
    while (cursor < candidates.length) {
      const row = candidates[cursor];
      cursor += 1;
      const match = await searchYouTube(row, usedVideoIds);
      if (match) found.push({ row, match });
      else misses.push(row);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  found.sort((a, b) => a.row.order - b.row.order);

  for (const { row, match } of found) {
    if (additions.length >= TARGET_ADDITIONS) break;
    const titleKey = normalizeTitle(row.title);
    if (existingTitleKeys.has(titleKey) || usedVideoIds.has(match.videoId)) continue;
    additions.push({ row, match });
    existingTitleKeys.add(titleKey);
    usedVideoIds.add(match.videoId);
  }

  for (const { row, match } of additions) {
    console.log(`${row.title} (${row.count}) -> ${match.videoId} ${match.youtubeTitle}`);
  }

  const enrichedHymns = [...currentHymns, ...additions.map(({ row, match }, offset) => buildSong(row, match, currentHymns.length + offset + 1))].map((song, index) => ({
    ...song,
    number: `HYMN-${String(index + 1).padStart(3, "0")}`,
  }));
  const enrichedAllSongs = [...enrichedHymns, ...otherSongs];

  fs.writeFileSync(HYMNS_PATH, `${JSON.stringify(enrichedHymns, null, 2)}\n`);
  fs.writeFileSync(ALL_SONGLISTS_PATH, `${JSON.stringify(enrichedAllSongs, null, 2)}\n`);

  const csvRows = [
    ["title", "count", "first_date", "last_date", "video_id", "youtube_title", "channel", "query", "score"],
    ...additions.map(({ row, match }) => [
      row.title,
      row.count,
      row.firstDate,
      row.lastDate,
      match.videoId,
      match.youtubeTitle,
      match.channel,
      match.query,
      match.score,
    ]),
  ];
  fs.writeFileSync(
    MATCHES_PATH,
    `${csvRows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`
  );

  const reportLines = [
    "# TPMAC YouTube Hymn List Extension - 2026-05-22",
    "",
    "Generated from the TPMAC 2021-05-22 to 2026-05-22 hymn summary and YouTube search results.",
    "",
    "## Scope",
    "",
    `- Existing church hymns before this run: ${currentHymns.length}`,
    `- New YouTube-backed TPMAC hymn additions: ${additions.length}`,
    `- Church hymn total after this run: ${enrichedHymns.length}`,
    `- Candidates tried before target/stop: ${additions.length + misses.length}`,
    `- Misses during this run: ${misses.length}`,
    "",
    "## Match Rule",
    "",
    "- A YouTube result was accepted only when the normalized YouTube title clearly contained the normalized TPMAC hymn title.",
    "- Fixed liturgy or overly generic titles such as 三一頌、阿們頌、禱文、耶穌、上主 were skipped for playability.",
    "- All added songs keep the TPMAC occurrence count in the in-game hint.",
    "",
    "## Added Songs",
    "",
    "| # | Song | Count | YouTube title | Channel |",
    "|---:|---|---:|---|---|",
    ...additions.map(({ row, match }, index) =>
      `| ${currentHymns.length + index + 1} | ${row.title} | ${row.count} | ${match.youtubeTitle.replace(/\|/g, "/")} | ${(match.channel || "YouTube").replace(/\|/g, "/")} |`
    ),
    "",
    "## Output Files",
    "",
    `- ${MATCHES_PATH}`,
    `- ${HYMNS_PATH}`,
    `- ${ALL_SONGLISTS_PATH}`,
    "",
  ];
  fs.writeFileSync(REPORT_PATH, reportLines.join("\n"));

  console.log(
    JSON.stringify(
      {
        additions: additions.length,
        misses: misses.length,
        hymnsBefore: currentHymns.length,
        hymnsAfter: enrichedHymns.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
