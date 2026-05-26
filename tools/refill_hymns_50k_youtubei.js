const fs = require("fs");

const RUN_DATE = process.env.HYMN_REFILL_DATE || "2026-05-26";
const MIN_VIEWS = Number(process.env.MIN_YOUTUBE_VIEWS || 50000);
const TARGET_TOTAL = Number(process.env.HYMN_REFILL_TARGET || 500);
const SEARCH_LIMIT_PER_QUERY = Number(process.env.HYMN_REFILL_SEARCH_LIMIT || 36);
const QUERY_DELAY_MS = Number(process.env.HYMN_REFILL_QUERY_DELAY_MS || 80);
const PLAYER_DELAY_MS = Number(process.env.HYMN_REFILL_PLAYER_DELAY_MS || 25);
const DRY_RUN = process.env.DRY_RUN === "1";

const HYMNS_PATH = "hymns.json";
const POP_ALL_PATH = "songlists/pop-all.json";
const ALL_SONGLISTS_PATH = "songlists/all-songlists.json";
const SEARCH_CACHE_PATH = `.cache/hymn-refill-searches-${RUN_DATE}.json`;
const VIDEO_CACHE_PATH = `.cache/hymn-refill-video-metadata-${RUN_DATE}.json`;
const REPORT_PATH = `docs/HYMN_50K_REFILL_${RUN_DATE}.md`;
const CSV_PATH = `docs/HYMN_50K_REFILL_${RUN_DATE}.csv`;

const APPROVED_SOURCE_KEYWORDS = [
  "讚美之泉",
  "stream of praise",
  "hkacm",
  "香港基督徒音樂事工協會",
  "基恩敬拜",
  "amazing grace worship",
  "小羊詩歌",
  "lamb music",
  "同心圓",
  "one circle",
  "敬拜者使團",
  "tws",
  "角聲使團",
  "the heralders",
  "約書亞",
  "joshua band",
  "泥土音樂",
  "clay music",
  "盛曉玫",
  "good tv",
  "天韻",
  "heavenly melody",
  "生命河",
  "river of life",
  "新心音樂",
  "new heart",
  "cantonhymn",
  "more of jesus worship",
  "777worship",
  "完全的敬拜",
  "玻璃海",
  "worship nations",
  "原始和聲",
  "raw harmony",
  "鹹蛋音樂",
  "salted egg",
  "我心旋律",
  "melody of my heart",
  "橄欖枝",
  "晨光恩典",
  "dwg worship",
  "與神同行",
  "慕主音樂",
  "美河熱力",
  "約書亞教會",
  "kua global",
  "跨越",
  "jesus fashion worship",
  "團契遊樂園",
  "playground ministry",
  "香港聖詩會",
];

const SEARCH_QUERIES = [
  "讚美之泉 官方歌詞版MV",
  "讚美之泉 敬拜讚美 官方 歌詞版",
  "讚美之泉 熱門詩歌 官方",
  "讚美之泉 最高觀看 官方歌詞版MV",
  "讚美之泉 Stream of Praise worship official",
  "HKACM Official Lyric Video 詩歌",
  "HKACM Official Music Video 詩歌",
  "HKACM 熱門 詩歌 Official",
  "基恩敬拜 Official MV 詩歌",
  "基恩敬拜 熱門 詩歌",
  "小羊詩歌 官方 詩歌",
  "小羊詩歌 中英字幕",
  "同心圓敬拜 官方 詩歌",
  "TWS 敬拜者使團 官方 詩歌",
  "CantonHymn 粵語詩歌",
  "約書亞樂團 官方歌詞MV 詩歌",
  "泥土音樂 Clay Music 詩歌",
  "盛曉玫 官方 詩歌",
  "角聲使團 The Heralders 詩歌",
  "GOOD TV 天堂敬拜 詩歌",
  "GOOD TV 詩歌 敬拜",
  "天韻合唱團 官方 詩歌",
  "Heavenly Melody 詩歌",
  "生命河靈糧堂 詩歌 官方",
  "River of Life Christian Church worship",
  "新心音樂事工 詩歌",
  "More of Jesus Worship 詩歌",
  "777Worship 詩歌",
  "玻璃海樂團 Worship Nations 詩歌",
  "原始和聲 Raw Harmony 詩歌",
  "鹹蛋音樂事工 詩歌",
  "粵語詩歌 官方 MV",
  "國語詩歌 官方 MV",
  "基督教詩歌 官方 歌詞",
  "中文敬拜詩歌 官方 MV",
  "教會詩歌 官方 歌詞",
  "恩典之路 官方 詩歌",
  "何等恩典 官方 詩歌",
  "愛中相遇 官方 詩歌",
  "阿爸天父 官方 詩歌",
  "祢的愛 官方 詩歌",
  "我相信 官方 詩歌",
  "這裡有榮耀 官方 詩歌",
  "一生愛祢 官方 詩歌",
  "寶貴十架 官方 詩歌",
  "耶穌愛你 官方 詩歌",
  "奇異恩典 中文 詩歌",
  "我知誰掌管明天 詩歌",
  "主祢是我力量 官方 詩歌",
  "求祢充滿我 官方 詩歌",
  "我要愛慕祢 官方 詩歌",
  "我要看見 官方 詩歌",
  "滿有能力 官方 詩歌",
  "讓讚美飛揚 官方 詩歌",
  "我的救贖者活著 官方 詩歌",
  "最珍貴的角落 官方 詩歌",
  "有一位神 官方 詩歌",
  "耶穌同在就是天堂 官方 詩歌",
  "野地的花 官方 詩歌",
  "每一天 官方 詩歌",
  "深深愛祢 官方 詩歌",
  "獻上今天 官方 詩歌",
  "誰曾應許 官方 詩歌",
  "腳步 官方 詩歌",
  "祢讓我生命改變 官方 詩歌",
  "耶和華祝福滿滿 官方 詩歌",
  "主愛何等長闊高深 官方 詩歌",
  "神羔羊配得 官方 詩歌",
  "願祢國度降臨 官方 詩歌",
  "永恆唯一的盼望 官方 詩歌",
  "在祢沒有難成的事 官方 詩歌",
  "聖潔公義主 官方 詩歌",
  "因祢與我同行 官方 詩歌",
  "我要向高山舉目 官方 詩歌",
  "我以禱告來到祢跟前 官方 詩歌",
  "我心旋律 官方 詩歌",
  "橄欖枝 詩歌 官方",
  "晨光恩典 詩歌 官方",
  "DWG Worship 詩歌 官方",
  "慕主音樂 詩歌 官方",
  "美河熱力 詩歌 官方",
  "KUA GLOBAL 跨越 詩歌",
  "Jesus Fashion Worship 詩歌",
  "城市豐收教會 中文敬拜 詩歌",
  "Gateway Worship Chinese 詩歌",
];

const BLOCKED_KEYWORDS = [
  "karaoke",
  "instrumental",
  "伴奏",
  "無人聲",
  "純樂器",
  "卡拉",
  "教學",
  "練習",
  "示範",
  "導唱",
  "playlist",
  "專輯",
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
  "經文禱告",
  "含經文",
  "旁白",
  "安可曲",
  "敬拜 101",
  "經典敬拜",
  "精選單歌",
  "全能神",
  "dvd",
  "齊唱兒歌",
  "一閃一閃亮晶晶",
  "小星星",
  "twinkle",
  "歌词",
  "拼音",
  "behind the scenes",
];

const BAD_EXACT_TITLES = new Set([
  "台語",
  "粵語",
  "國語",
  "原創粵語",
  "兒童",
  "精選單歌",
  "經典敬拜",
  "小時光樂團",
  "王芷蕾",
  "盛曉玫",
  "角聲使團",
  "撒拉弗敬拜團",
  "2014 讚美之泉",
]);

let youtubeiConfig = null;

function ensureDir(path) {
  fs.mkdirSync(path, { recursive: true });
}

function readJson(path, fallback) {
  if (!fs.existsSync(path)) return fallback;
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function textFrom(value) {
  return value?.runs?.map((run) => run.text).join("") || value?.simpleText || "";
}

function parseDuration(value) {
  const parts = String(value || "").split(":").map((part) => Number(part));
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function titleHasBlockedKeyword(value) {
  const lower = String(value || "").toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
}

function isBadExactTitle(value) {
  return BAD_EXACT_TITLES.has(String(value || "").trim());
}

function hasMedleySeparator(value) {
  return /[&+＋/／]/.test(String(value || ""));
}

function hasUnusableTitleFragment(value) {
  return /_|Hymn:|詩班|诗班|兒童敬拜/i.test(String(value || ""));
}

function isApprovedSource(value) {
  const lower = String(value || "").toLowerCase();
  return APPROVED_SOURCE_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
}

function looksLikeHymn(value) {
  return /詩歌|敬拜|worship|hymn|讚美|耶穌|Jesus|基督|恩典|十架|十字架|祢|神|主|耶和華|聖靈|天父|哈利路亞|福音/i.test(
    value
  );
}

function stripEnglishTail(value) {
  return String(value || "")
    .replace(/\s+[A-Z][A-Z0-9 ]{3,}$/g, "")
    .replace(/\s+[A-Z][A-Za-z0-9 ,.'’:-]+[\s(（]*$/g, "")
    .replace(/\s+\([A-Za-z][^)]+\)$/g, "")
    .trim();
}

function extractBracketTitle(rawTitle) {
  const matches = [...String(rawTitle || "").matchAll(/[【〖《〈「『[]([^】〗》〉」』\]]{2,80})[】〗》〉」』\]]/g)];
  for (const match of matches) {
    const value = match[1].trim();
    if (hasChinese(value) && !/官方|歌詞|字幕|中英|詩歌|敬拜|專輯|MV|DVD/i.test(value)) return value;
  }
  return "";
}

function cleanTitle(rawTitle) {
  let title = extractBracketTitle(rawTitle) || String(rawTitle || "");
  const unmatchedSquare = title.match(/^[A-Za-z][^\[]*\[([^\]]*[\p{Script=Han}][^\]]*)$/u);
  if (unmatchedSquare) title = unmatchedSquare[1].trim();

  title = title
    .replace(/^【?中英字幕】?/i, "")
    .replace(/^詩歌敬拜\s*[|｜-]\s*/i, "")
    .replace(/^約書亞樂團\s*[-－]\s*/i, "")
    .replace(/^讚美之泉\s*[-－]\s*/i, "")
    .replace(/^HKACM\s*/i, "")
    .replace(/^GOOD TV\s*/i, "")
    .replace(/^天韻合唱團\s*[-－]?\s*/i, "")
    .replace(/^天堂敬拜[~～]\s*/i, "")
    .replace(/^\d+\s*[.、-]?\s*/i, "")
    .trim();

  const medleyParts = title.split(/[\/／]/).map((part) => part.trim()).filter(Boolean);
  if (medleyParts.length > 1 && medleyParts.slice(1).some(hasChinese)) return "";
  if (medleyParts.length > 1) title = medleyParts[0];

  title = title
    .split(/\s*[|｜]\s*/)[0]
    .split(/\s*[-－]\s*/)[0]
    .replace(/\s*\([^)]*(官方|Official|MV|歌詞|敬拜|專輯|字幕)[^)]*\)\s*/gi, "")
    .replace(/官方.*$/i, "")
    .replace(/Official.*$/i, "")
    .replace(/Music Video.*$/i, "")
    .replace(/Lyric.*$/i, "")
    .replace(/Hymn:.*$/i, "")
    .replace(/MV.*$/i, "")
    .replace(/歌詞.*$/i, "")
    .replace(/敬拜讚美.*$/i, "")
    .replace(/詩歌.*$/i, "")
    .replace(/\s*[\[【（(](粵語|台語|閩南語|國語)[\]】）)]?\s*/gi, "")
    .replace(/\s*\[[^\]]*$/i, "")
    .replace(/\s*[\(（][^)]*$/i, "")
    .replace(/\s*[，,].*$/i, "")
    .replace(/\s+(讚美之泉|約書亞|天韻|角聲使團|盛曉玫)$/i, "")
    .replace(/\s+(很優美|基督教經典)$/i, "")
    .replace(/[「」『』【】〖〗《》〈〉[\]]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  title = stripEnglishTail(title);

  const parts = title.split(/\s+/).filter(Boolean);
  if (parts.length === 2 && normalize(parts[0]) === normalize(parts[1])) title = parts[1];

  return title;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function getYoutubeiConfig() {
  if (youtubeiConfig) return youtubeiConfig;
  const html = await fetch("https://www.youtube.com", {
    headers: { "user-agent": "Mozilla/5.0" },
  }).then((response) => response.text());
  youtubeiConfig = {
    key: html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1],
    version: html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/)?.[1] || "2.20260521.00.00",
  };
  if (!youtubeiConfig.key) throw new Error("Missing YouTube internal API key.");
  return youtubeiConfig;
}

function walk(value, out = []) {
  if (!value || typeof value !== "object") return out;
  if (value.videoRenderer?.videoId) out.push(value.videoRenderer);
  for (const child of Array.isArray(value) ? value : Object.values(value)) walk(child, out);
  return out;
}

function videoInfo(renderer, query) {
  return {
    videoId: renderer.videoId,
    rawTitle: textFrom(renderer.title),
    channel: textFrom(renderer.ownerText) || textFrom(renderer.shortBylineText),
    length: textFrom(renderer.lengthText),
    query,
  };
}

async function searchYoutube(query, searchCache) {
  if (searchCache[query]?.length >= SEARCH_LIMIT_PER_QUERY) return searchCache[query];
  const { key, version } = await getYoutubeiConfig();
  const response = await fetch(`https://www.youtube.com/youtubei/v1/search?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" },
    body: JSON.stringify({
      context: { client: { clientName: "WEB", clientVersion: version, hl: "zh-Hant", gl: "HK" } },
      query,
    }),
  });
  if (!response.ok) throw new Error(`YouTube search HTTP ${response.status}`);
  const json = await response.json();
  const videos = walk(json)
    .map((renderer) => videoInfo(renderer, query))
    .filter((video) => video.videoId && video.rawTitle)
    .slice(0, SEARCH_LIMIT_PER_QUERY);
  searchCache[query] = videos;
  writeJson(SEARCH_CACHE_PATH, searchCache);
  await sleep(QUERY_DELAY_MS);
  return videos;
}

async function getVideoMetadata(videoId, videoCache) {
  if (videoCache[videoId]?.viewCount != null) return videoCache[videoId];
  const { key, version } = await getYoutubeiConfig();
  const response = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${key}`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0" },
    body: JSON.stringify({
      context: { client: { clientName: "WEB", clientVersion: version, hl: "zh-Hant", gl: "HK" } },
      videoId,
    }),
  });
  if (!response.ok) throw new Error(`YouTube player HTTP ${response.status}`);
  const json = await response.json();
  const details = json.videoDetails || {};
  const metadata = {
    videoId,
    youtubeTitle: details.title || "",
    channel: details.author || "",
    lengthSeconds: Number(details.lengthSeconds || 0),
    viewCount: details.viewCount ? Number(details.viewCount) : null,
    fetchedAt: new Date().toISOString(),
  };
  videoCache[videoId] = metadata;
  writeJson(VIDEO_CACHE_PATH, videoCache);
  await sleep(PLAYER_DELAY_MS);
  return metadata;
}

function existingRejectReason(song) {
  if (!Number.isFinite(song.viewCount) || song.viewCount < MIN_VIEWS) return "views-below-threshold";
  if (titleHasBlockedKeyword(`${song.title} ${song.source || ""} ${song.hint || ""}`)) return "blocked-keyword";
  const cleanedTitle = cleanTitle(song.title);
  if (hasMedleySeparator(cleanedTitle) || hasUnusableTitleFragment(cleanedTitle)) return "bad-title";
  if (isBadExactTitle(cleanedTitle) || !cleanedTitle || !hasChinese(cleanedTitle)) return "bad-title";
  return "";
}

function rejectReason(video, title) {
  const duration = parseDuration(video.length) || Number(video.lengthSeconds || 0);
  const combined = `${video.rawTitle || ""} ${video.youtubeTitle || ""} ${video.channel || ""}`;
  if (titleHasBlockedKeyword(combined) || titleHasBlockedKeyword(title)) return "blocked-keyword";
  if (duration && (duration < 110 || duration > 620)) return "bad-duration";
  if (hasMedleySeparator(title) || hasUnusableTitleFragment(title)) return "bad-title";
  if (isBadExactTitle(title)) return "bad-title";
  if (!title || !hasChinese(title)) return "bad-title";
  if (title.length > 22) return "title-too-long";
  if (!isApprovedSource(video.channel) && !looksLikeHymn(combined)) return "not-hymn-source";
  return "";
}

function candidateScore(candidate) {
  let score = Math.log10(Math.max(candidate.viewCount || 1, 1)) * 25;
  const text = `${candidate.youtubeTitle || candidate.rawTitle} ${candidate.channel}`.toLowerCase();
  if (isApprovedSource(text)) score += 18;
  if (/official|官方|歌詞版|music video|lyric|topic/i.test(text)) score += 10;
  if (/兒童|children|kids/i.test(text)) score -= 5;
  if (candidate.title.length <= 8) score += 4;
  return score;
}

function buildSong(candidate, number) {
  return {
    title: candidate.title,
    aliases: [...new Set([candidate.channel].filter(Boolean))],
    videoId: candidate.videoId,
    start: 0,
    duration: 60,
    category: "詩歌",
    source: `${candidate.channel || "YouTube"} / YouTube`,
    hint: `50,000+ 熱門詩歌；來源：${candidate.query}；YouTube：${candidate.youtubeTitle || candidate.rawTitle}`,
    number,
    language: "中文",
    viewCount: candidate.viewCount,
    viewCheckedAt: RUN_DATE,
  };
}

function renumberHymns(hymns) {
  return hymns.map((song, index) => ({
    ...song,
    number: `HYMN-${String(index + 1).padStart(3, "0")}`,
  }));
}

function writeReport(additions, removed, rejected, finalCount) {
  ensureDir("docs");
  const headers = ["status", "number", "title", "videoId", "viewCount", "channel", "youtubeTitle", "reason", "url"];
  const csv = [
    headers.join(","),
    ...additions.map((row) =>
      headers
        .map((header) => {
          if (header === "status") return "added";
          if (header === "channel") return csvEscape(row.source);
          if (header === "youtubeTitle") return csvEscape(row.hint);
          if (header === "url") return csvEscape(`https://www.youtube.com/watch?v=${row.videoId}`);
          return csvEscape(row[header]);
        })
        .join(",")
    ),
    ...removed.map((row) =>
      headers
        .map((header) => {
          if (header === "status") return "removed-under-threshold";
          if (header === "reason") return csvEscape(row.reason || "below threshold");
          if (header === "channel") return csvEscape(row.source);
          if (header === "youtubeTitle") return csvEscape(row.hint);
          if (header === "url") return csvEscape(row.videoId ? `https://www.youtube.com/watch?v=${row.videoId}` : "");
          return csvEscape(row[header]);
        })
        .join(",")
    ),
    ...rejected.map((row) =>
      headers
        .map((header) => {
          if (header === "status") return "skipped";
          if (header === "title") return csvEscape(row.title || row.rawTitle);
          if (header === "channel") return csvEscape(row.channel);
          if (header === "youtubeTitle") return csvEscape(row.youtubeTitle || row.rawTitle);
          if (header === "url") return csvEscape(row.videoId ? `https://www.youtube.com/watch?v=${row.videoId}` : "");
          return csvEscape(row[header]);
        })
        .join(",")
    ),
  ].join("\n");
  fs.writeFileSync(CSV_PATH, `${csv}\n`, "utf8");

  const lines = [
    `# Hymn 50K Refill (${RUN_DATE})`,
    "",
    `目標：只保留 YouTube 瀏覽量 >= ${MIN_VIEWS.toLocaleString("en-US")} 的詩歌，盡量補至 ${TARGET_TOTAL} 首。`,
    "",
    `移除：${removed.length} 首`,
    `新增：${additions.length} 首`,
    `更新後：${finalCount} 首`,
    "",
    "| 編號 | 歌名 | 瀏覽量 | 來源 | YouTube |",
    "| --- | --- | ---: | --- | --- |",
    ...additions.slice(0, 120).map((row) =>
      `| ${row.number} | ${row.title} | ${Number(row.viewCount || 0).toLocaleString("en-US")} | ${row.source} | [影片](https://www.youtube.com/watch?v=${row.videoId}) |`
    ),
    "",
    `完整紀錄：${CSV_PATH}`,
    "",
  ];
  fs.writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

function rebuildAllSonglists(hymns) {
  const popAll = readJson(POP_ALL_PATH, []);
  writeJson(ALL_SONGLISTS_PATH, [...hymns, ...popAll]);
}

async function main() {
  ensureDir(".cache");
  ensureDir("docs");
  const original = readJson(HYMNS_PATH, []).map((song) => ({
    ...song,
    title: cleanTitle(song.title) || song.title,
    category: "詩歌",
  }));
  const removed = [];
  const kept = [];
  const keptByTitle = new Map();
  for (const song of original) {
    const reason = existingRejectReason(song);
    if (reason) {
      removed.push({ ...song, reason });
      continue;
    }
    const titleKey = normalize(song.title);
    const previousIndex = keptByTitle.get(titleKey);
    if (previousIndex == null) {
      keptByTitle.set(titleKey, kept.length);
      kept.push(song);
      continue;
    }
    const previous = kept[previousIndex];
    if ((song.viewCount || 0) > (previous.viewCount || 0)) {
      removed.push({ ...previous, reason: "duplicate-title" });
      kept[previousIndex] = song;
    } else {
      removed.push({ ...song, reason: "duplicate-title" });
    }
  }

  const existingVideoIds = new Set(kept.map((song) => song.videoId).filter(Boolean));
  const existingTitleKeys = new Set(kept.map((song) => normalize(song.title)));
  const searchCache = readJson(SEARCH_CACHE_PATH, {});
  const videoCache = readJson(VIDEO_CACHE_PATH, {});
  const candidatesByVideo = new Map();
  const rejected = [];

  for (const query of SEARCH_QUERIES) {
    try {
      const videos = await searchYoutube(query, searchCache);
      console.log(`${query}: ${videos.length} results`);
      for (const video of videos) {
        if (existingVideoIds.has(video.videoId) || candidatesByVideo.has(video.videoId)) continue;
        const title = cleanTitle(video.rawTitle);
        const reason = rejectReason(video, title);
        if (reason) {
          rejected.push({ ...video, title, reason });
          continue;
        }
        const titleKey = normalize(title);
        if (existingTitleKeys.has(titleKey)) continue;
        candidatesByVideo.set(video.videoId, { ...video, title, titleKey });
      }
    } catch (error) {
      rejected.push({ title: query, reason: error.message });
    }
  }

  const candidates = [];
  for (const candidate of candidatesByVideo.values()) {
    let metadata;
    try {
      metadata = await getVideoMetadata(candidate.videoId, videoCache);
    } catch (error) {
      rejected.push({ ...candidate, reason: error.message });
      continue;
    }
    const title = cleanTitle(metadata.youtubeTitle || candidate.rawTitle);
    const video = { ...candidate, ...metadata, rawTitle: metadata.youtubeTitle || candidate.rawTitle };
    const reason = rejectReason(video, title);
    const viewCount = Number(metadata.viewCount || 0);
    if (reason || viewCount < MIN_VIEWS) {
      rejected.push({ ...video, title, viewCount, reason: reason || `views<${MIN_VIEWS}` });
      continue;
    }
    const titleKey = normalize(title);
    if (existingTitleKeys.has(titleKey)) continue;
    candidates.push({
      ...candidate,
      title,
      titleKey,
      channel: metadata.channel || candidate.channel,
      youtubeTitle: metadata.youtubeTitle || candidate.rawTitle,
      lengthSeconds: metadata.lengthSeconds,
      viewCount,
    });
  }

  candidates.sort((a, b) => candidateScore(b) - candidateScore(a) || b.viewCount - a.viewCount);
  const selected = [];
  const selectedTitleKeys = new Set(existingTitleKeys);
  for (const candidate of candidates) {
    if (kept.length + selected.length >= TARGET_TOTAL) break;
    if (selectedTitleKeys.has(candidate.titleKey)) continue;
    selectedTitleKeys.add(candidate.titleKey);
    selected.push(candidate);
  }

  const additions = selected.map((candidate, index) =>
    buildSong(candidate, `HYMN-${String(kept.length + index + 1).padStart(3, "0")}`)
  );
  const finalHymns = renumberHymns([...kept, ...additions]);
  if (!DRY_RUN) {
    writeJson(HYMNS_PATH, finalHymns);
    rebuildAllSonglists(finalHymns);
  }
  writeReport(additions, removed, rejected, finalHymns.length);

  console.log(`Removed ${removed.length}, added ${additions.length}, final ${finalHymns.length}/${TARGET_TOTAL}.`);
  for (const row of additions) console.log(`${row.number} ${row.title} ${row.viewCount} ${row.videoId}`);
  if (DRY_RUN) console.log("Dry run only.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
