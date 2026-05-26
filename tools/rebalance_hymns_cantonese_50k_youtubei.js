const fs = require("fs");

const RUN_DATE = process.env.HYMN_REBALANCE_DATE || "2026-05-26";
const MIN_VIEWS = Number(process.env.MIN_YOUTUBE_VIEWS || 50000);
const TOTAL_TARGET = Number(process.env.HYMN_TOTAL_TARGET || 500);
const CANTONESE_TARGET = Number(process.env.HYMN_CANTONESE_TARGET || Math.ceil(TOTAL_TARGET * 0.7));
const SEARCH_LIMIT_PER_QUERY = Number(process.env.HYMN_CANTONESE_SEARCH_LIMIT || 80);
const QUERY_DELAY_MS = Number(process.env.HYMN_CANTONESE_QUERY_DELAY_MS || 80);
const PLAYER_DELAY_MS = Number(process.env.HYMN_CANTONESE_PLAYER_DELAY_MS || 25);
const DRY_RUN = process.env.DRY_RUN === "1";

const HYMNS_PATH = "hymns.json";
const POP_ALL_PATH = "songlists/pop-all.json";
const ALL_SONGLISTS_PATH = "songlists/all-songlists.json";
const SEARCH_CACHE_PATH = `.cache/hymn-cantonese-searches-${RUN_DATE}.json`;
const VIDEO_CACHE_PATH = `.cache/hymn-refill-video-metadata-${RUN_DATE}.json`;

const CANTONESE_KEYWORDS = ["粵語", "廣東話", "Cantonese", "CantonHymn", "廣東"];
const MANDARIN_KEYWORDS = ["國語", "普通話", "Mandarin", "台語", "閩南語"];

const CANTONESE_SOURCE_KEYWORDS = [
  "HKACM",
  "香港基督徒音樂事工",
  "CantonHymn",
  "基恩敬拜",
  "Amazing Grace Worship",
  "AGWMM",
  "角聲使團",
  "The Heralders",
  "同心圓",
  "One Circle",
  "TWS",
  "敬拜者使團",
  "777Worship",
  "完全的敬拜",
  "玻璃海",
  "Worship Nations",
  "鹹蛋音樂",
  "Salted Egg",
  "建道",
  "新祢呈",
  "WAM Worship",
  "沙田浸信會",
  "Saddleback Church Hong Kong",
  "YWAM Gateway Worship",
  "Gateway Worship Hong Kong",
  "cantonworship",
  "讚美的時刻",
  "Kennex in Jesus",
  "flow church",
  "流堂",
  "KUA GLOBAL",
  "跨越",
  "More of Jesus Worship",
  "m2kmusic",
  "團契遊樂園",
  "Son Music",
  "新音樂敬拜",
  "MIC 好耶音樂",
  "好耶音樂",
  "Jennifer Poon",
  "陳贊一",
  "Peco Chui",
  "徐偉賢",
  "1Gmusic",
  "盧永亨",
  "Andrew Vlogs",
  "Zonder's Music",
  "基督徒青草原",
  "iGreenpastures",
  "耶穌是主Jesus is Lord",
  "Milk&Honey Worship",
  "Take Up Your Cross",
  "背起十架",
  "香港聖詩會",
  "Hong Kong Hymn Society",
  "美河熱力",
  "Love Fellowship",
  "約書亞教會",
  "HTBBChurch",
  "C Jenny",
  "Tony Lui",
  "Matthew Lee",
  "Kwan Natalie",
  "frankie choi",
  "蔡賜輝",
  "Wilson Li",
  "Kenneth Ng",
  "MrKoKei",
  "WAM",
];

const MANDARIN_SOURCE_KEYWORDS = [
  "讚美之泉",
  "Stream Of Praise",
  "Stream of Praise",
  "Joshua Band",
  "約書亞",
  "GOOD TV",
  "天韻",
  "Heavenly Melody",
  "生命河",
  "River of Life",
  "小羊詩歌",
  "Lamb Music",
  "旌旗音樂",
  "Banner Music",
  "我心旋律",
  "Melody of My Heart",
  "新心音樂",
  "New Heart",
  "晨光恩典",
  "橄欖枝",
  "慕主音樂",
  "FRCC",
  "DWG Worship",
  "與神同行",
  "Gateway Worship Chinese",
  "台北靈糧堂",
  "豐收聖樂",
  "小敏",
  "Xiaomin",
  "Canaan Hymns",
  "迦南",
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
  "全能神",
  "全能神教會",
  "全能神教会",
  "東方閃電",
  "东方闪电",
  "Church of Almighty God",
  "The Church of Almighty God",
  "國度降臨福音",
  "国度降临福音",
  "神国赞美诗",
  "神國讚美詩",
  "神国赞美诗God's love",
  "香江望神州",
  "習近平",
  "梁振英",
  "訪港",
  "政治",
  "新聞",
  "公主",
  "城堡",
  "(國)",
  "（國）",
  "國版",
  "國語版",
  "国语版",
  "讓我們仍然相信",
  "愛主要肩負",
  "劇集",
  "主題曲",
  "HANA",
  "菊梓喬",
  "英皇",
  "JOEY YUNG",
  "容祖兒",
  "小敏",
  "Xiaomin",
  "Canaan Hymns",
  "兒童版",
  "英文詩歌",
  "中英文字幕",
  "中年好聲音",
  "娛記",
  "娛樂",
  "經文禱告",
  "含經文",
  "旁白",
  "安可曲",
  "兒歌",
  "齊唱兒歌",
  "一閃一閃亮晶晶",
  "小星星",
  "twinkle",
  "印尼",
  "歌词",
  "拼音",
  "behind the scenes",
];

const BAD_EXACT_TITLES = new Set([
  "粵語",
  "國語",
  "台語",
  "原創粵語",
  "兒童",
  "精選單歌",
  "經典敬拜",
  "小時光樂團",
  "印尼",
  "逃召",
  "基恩音樂",
  "原創",
  "榮耀之聲",
  "新年心祝福",
  "願A",
  "周年呈獻",
  "單曲",
]);

const SEARCH_QUERIES = [
  "粵語詩歌 官方 MV",
  "粵語敬拜 官方 歌詞 MV",
  "廣東話敬拜 歌詞 MV",
  "香港基督教詩歌 粵語",
  "香港敬拜詩歌 官方",
  "Cantonese worship song official lyric",
  "Cantonese hymn official",
  "HKACM Official Music Video 詩歌",
  "HKACM Official Lyric Video 詩歌",
  "HKACM Official 詩歌",
  "HKACM 基督徒音樂事工協會",
  "香港基督徒音樂事工協會 詩歌",
  "ACM 詩歌 官方",
  "ACM 香港 詩歌",
  "HKACM 粵語 詩歌",
  "HKACM 敬拜 詩歌",
  "基恩敬拜 Official MV",
  "基恩敬拜 Official Lyric",
  "基恩敬拜 官方歌詞",
  "基恩敬拜 粵語",
  "基恩敬拜 詩歌",
  "基恩音樂事工 詩歌",
  "AGWMM official worship",
  "AGWMM lyric video",
  "角聲使團 詩歌",
  "角聲使團 官方 MV",
  "角聲使團 歌詞",
  "角聲使團 粵語",
  "The Heralders Cantonese hymn",
  "The Heralders worship song",
  "CantonHymn 粵語詩歌",
  "CantonHymn Cantonese Cover",
  "CantonHymn Demo Cover",
  "CantonHymn worship",
  "同心圓敬拜 粵語",
  "同心圓敬拜 詩歌",
  "同心圓敬拜 歌詞 MV",
  "同心圓敬拜福音平台",
  "One Circle worship lyric",
  "TWS 敬拜者使團 粵語",
  "TWS 敬拜者使團 詩歌",
  "TWS 敬拜者使團 歌詞",
  "777Worship 粵語 詩歌",
  "777Worship 敬拜",
  "777Worship official lyric",
  "完全的敬拜 粵語",
  "玻璃海樂團 粵語詩歌",
  "Worship Nations 粵語",
  "WN X 玻璃海樂團 詩歌",
  "PHOTIC 玻璃海 詩歌",
  "鹹蛋音樂事工 粵語詩歌",
  "Salted Egg Music Ministry worship",
  "鹹蛋音樂事工 官方",
  "建道 新祢呈 敬拜",
  "建道神學院 新祢呈 詩歌",
  "建道神學院新祢呈 官方歌詞版MV",
  "建道神學院新祢呈 現場混音版",
  "WAM Worship 沙田浸信會",
  "WAM Worship 粵語詩歌",
  "沙田浸信會 詩歌",
  "Saddleback Church Hong Kong worship",
  "Saddleback Worship Hong Kong 粵語",
  "YWAM Gateway Worship 粵語",
  "Gateway Worship Hong Kong 粵語",
  "cantonworship 粵語詩歌",
  "cantonworship worship",
  "讚美的時刻 粵語詩歌",
  "Kennex in Jesus 粵語詩歌",
  "flow church 流堂 詩歌",
  "KUA GLOBAL 跨越 詩歌",
  "More of Jesus Worship 詩歌",
  "m2kmusic 團契遊樂園 詩歌",
  "團契遊樂園 基督教詩歌",
  "團契遊樂園 歌詞",
  "SON Music 新音樂敬拜創作",
  "SON Music Brenda Li 詩歌",
  "MIC 好耶音樂 詩歌",
  "Jennifer Poon 讚之歌",
  "陳贊一 詩歌",
  "Peco Chui 詩歌",
  "徐偉賢 詩歌",
  "盧永亨 詩歌",
  "HTBB worship Hong Kong",
  "Take Up Your Cross 背起十架 詩歌",
  "香港聖詩會 詩歌",
  "香港詩歌 敬拜 粵語",
  "主愛如繁星 粵語詩歌",
  "我願為祢去 粵語詩歌",
  "全能父上帝 粵語詩歌",
  "恩典太美麗 粵語詩歌",
  "主深恩厚愛 粵語",
  "深恩厚愛 粵語詩歌",
  "盡心盡性讚美祂 粵語詩歌",
  "得力在乎祢 粵語詩歌",
  "得力在乎你 粵語詩歌",
  "萬主之主 萬王之王 粵語詩歌",
  "今生所盼 Living Hope 粵語",
  "重拾 粵語詩歌",
  "祂 He 粵語版",
  "香氣 HKACM",
  "傳承使命 HKACM",
  "親眼看見祢 基恩敬拜",
  "陪我渡過 基恩敬拜",
  "祢真好 基恩敬拜",
  "上帝總不撇下我 基恩敬拜",
  "祢是我的拯救 基恩敬拜",
  "愛是不保留 HKACM",
  "讓我高飛 HKACM",
  "誰曾應許 角聲",
  "前行 角聲使團",
  "天父必看顧你 粵語詩歌",
  "耶穌恩友 粵語詩歌",
  "奇異恩典 粵語",
  "主禱文 粵語詩歌",
  "平安 粵語詩歌",
  "耶和華祝福滿滿 粵語",
  "祢是信實的上帝 粵語",
  "祝福 粵語詩歌",
  "差遣我 粵語詩歌",
  "高舉雙手敬拜 粵語",
  "神是我這生供應者 HKACM",
  "牧我一生 HKACM",
  "飛得更高 HKACM",
  "立志擺上 建道",
  "走出曠野 建道",
  "同證主美意 建道",
  "有神同往 建道",
  "創始成終 建道",
  "十架下的我 建道",
  "以感恩為祭 團契遊樂園",
  "薪火永傳 團契遊樂園",
  "誰曾應許 團契遊樂園",
  "不變的應許 SON Music",
  "我向祢禱告 SON Music",
  "靠著祢寶血 SON Music",
  "向著前方 SON Music",
  "愛伴我高飛 MIC",
  "伴我成長 粵語",
  "默默回望 粵語",
  "十架的冠冕 徐偉賢",
  "神啊祢在哪兒 盧永亨",
  "上帝的兒女何等有福 陳贊一",
  "感謝一生有祢 基恩",
  "求主給這世代看見異象",
  "榮耀神羔羊 KUA Worship",
  "無以回報 粵語詩歌",
];

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

function hasAny(value, words) {
  const lower = String(value || "").toLowerCase();
  return words.some((word) => lower.includes(word.toLowerCase()));
}

function hintVideoTitle(hint) {
  return String(hint || "").match(/YouTube[:：]\s*(.+)$/)?.[1] || "";
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
  return hasAny(value, BLOCKED_KEYWORDS);
}

function isBadExactTitle(value) {
  return BAD_EXACT_TITLES.has(String(value || "").trim());
}

function stripEnglishTail(value) {
  let title = String(value || "").trim();
  const englishHead = title.match(/^[A-Za-z][A-Za-z0-9 ,.'’:-]+\s+([\p{Script=Han}].*)$/u);
  if (englishHead && !/^Shekinah/i.test(title)) title = englishHead[1].trim();
  return title
    .replace(/\s+[A-Z][A-Z0-9 ]{3,}$/g, "")
    .replace(/\s+[A-Z][A-Za-z0-9 ,.'’:-]+[\s(（]*$/g, "")
    .replace(/\s+[A-Za-z][A-Za-z0-9 ,.'’:-]+$/g, "")
    .replace(/\s+\([A-Za-z][^)]+\)$/g, "")
    .replace(/[A-Za-z][A-Za-z’'`]+$/g, "")
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
    .replace(/^【[^】]*(粵語|詩歌|官方|MV)[^】]*】\s*/i, "")
    .replace(/^【?中英字幕】?/i, "")
    .replace(/^詩歌敬拜\s*[|｜-]\s*/i, "")
    .replace(/^HKACM\s*/i, "")
    .replace(/^GOOD TV\s*/i, "")
    .replace(/^同心圓敬拜者使團\s*/i, "")
    .replace(/^\d+\s*[.、-]?\s*/i, "")
    .trim();

  const medleyParts = title.split(/[\/／]/).map((part) => part.trim()).filter(Boolean);
  if (medleyParts.length > 1 && medleyParts.slice(1).some(hasChinese)) return "";
  if (medleyParts.length > 1) title = medleyParts[0];

  title = title
    .split(/\s*[|｜]\s*/)[0]
    .split(/\s*[-－—]\s*/)[0]
    .replace(/\s*\([^)]*(官方|Official|MV|歌詞|敬拜|專輯|字幕)[^)]*\)\s*/gi, "")
    .replace(/官方.*$/i, "")
    .replace(/Official.*$/i, "")
    .replace(/Music Video.*$/i, "")
    .replace(/Lyric.*$/i, "")
    .replace(/Hymn:.*$/i, "")
    .replace(/MV.*$/i, "")
    .replace(/歌詞.*$/i, "")
    .replace(/live ver\.?$/i, "")
    .replace(/敬拜讚美.*$/i, "")
    .replace(/詩歌.*$/i, "")
    .replace(/\s*[\[【（(](粵語|粵|台語|閩南語|國語)[\]】）)]?\s*/gi, "")
    .replace(/\s*[\[【（(]國[\]】）)]?\s*/gi, "")
    .replace(/\s*\[[^\]]*$/i, "")
    .replace(/\s*[\(（][^)]*(團契遊樂園|信心之火|官方譯本|粵語版|國語版)[^)]*[\)）]\s*/gi, "")
    .replace(/\s*[\(（][^)]*$/i, "")
    .replace(/\s*聖詩\s*\d+$/i, "")
    .replace(/\s+\d{4}$/i, "")
    .replace(/版$/i, "")
    .replace(/\s*[，,].*$/i, "")
    .replace(/\s+(基恩音樂|官方歌詞版)$/i, "")
    .replace(/\s+(很優美|基督教經典)$/i, "")
    .replace(/[「」『』【】〖〗《》〈〉[\]]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return stripEnglishTail(title);
}

function classifyLanguage(songOrVideo, query = "") {
  const text = `${songOrVideo.title || ""} ${songOrVideo.rawTitle || ""} ${songOrVideo.youtubeTitle || ""} ${
    songOrVideo.aliases?.join(" ") || ""
  } ${songOrVideo.channel || ""} ${songOrVideo.source || ""} ${hintVideoTitle(songOrVideo.hint)} ${query}`;
  if (hasAny(text, CANTONESE_KEYWORDS)) return "粵語";
  if (hasAny(text, MANDARIN_KEYWORDS)) return "國語";
  if (hasAny(text, CANTONESE_SOURCE_KEYWORDS)) return "粵語";
  if (hasAny(text, MANDARIN_SOURCE_KEYWORDS)) return "國語";
  return "中文";
}

function classifyCandidateLanguage(video, title, query) {
  const direct = classifyLanguage({ ...video, title });
  if (direct !== "中文") return direct;
  const videoText = `${title || ""} ${video.rawTitle || ""} ${video.youtubeTitle || ""} ${video.channel || ""}`;
  const queryIsCantonese = hasAny(query, CANTONESE_KEYWORDS) || hasAny(query, CANTONESE_SOURCE_KEYWORDS);
  if (queryIsCantonese && !hasAny(videoText, MANDARIN_SOURCE_KEYWORDS) && !hasAny(videoText, MANDARIN_KEYWORDS)) {
    return "粵語";
  }
  return "中文";
}

function looksLikeHymn(value) {
  return /詩歌|敬拜|worship|hymn|讚美|耶穌|Jesus|基督|恩典|十架|十字架|祢|神|主|耶和華|聖靈|天父|哈利路亞|福音/i.test(
    value
  );
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
  const previous = searchCache[query] || [];
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
  const latest = walk(json)
    .map((renderer) => videoInfo(renderer, query))
    .filter((video) => video.videoId && video.rawTitle)
    .slice(0, SEARCH_LIMIT_PER_QUERY);
  const byId = new Map();
  for (const video of [...previous, ...latest]) byId.set(video.videoId, video);
  searchCache[query] = [...byId.values()];
  writeJson(SEARCH_CACHE_PATH, searchCache);
  await sleep(QUERY_DELAY_MS);
  return searchCache[query];
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

function rejectReason(video, title) {
  const duration = parseDuration(video.length) || Number(video.lengthSeconds || 0);
  const combined = `${video.rawTitle || ""} ${video.youtubeTitle || ""} ${video.channel || ""}`;
  if (titleHasBlockedKeyword(combined) || titleHasBlockedKeyword(title)) return "blocked-keyword";
  if (duration && (duration < 110 || duration > 620)) return "bad-duration";
  if (/[&+＋/／]/.test(title) || /_|Hymn:/.test(title)) return "bad-title";
  if (title.trim().split(/\s+/).length > 3) return "bad-title";
  if (isBadExactTitle(title) || !title || !hasChinese(title)) return "bad-title";
  if (/粵語|廣東話|Cantonese/i.test(title)) return "bad-title";
  if (/的$/.test(title)) return "bad-title";
  if (title.length > 24) return "title-too-long";
  if (!looksLikeHymn(combined)) return "not-hymn";
  return "";
}

function rejectExistingSong(song) {
  const title = cleanTitle(song.title) || song.title;
  const combined = `${title} ${song.source || ""} ${song.hint || ""}`;
  if (titleHasBlockedKeyword(combined)) return true;
  if (/[&+＋/／]/.test(title) || /_|Hymn:/.test(title)) return true;
  if (title.trim().split(/\s+/).length > 3) return true;
  if (isBadExactTitle(title) || !title || !hasChinese(title)) return true;
  if (/粵語|廣東話|Cantonese/i.test(title)) return true;
  if (/的$/.test(title)) return true;
  return title.length > 24;
}

function scoreSong(song, index = 0) {
  let score = Math.log10(Math.max(song.viewCount || 1, 1)) * 25;
  const text = `${song.title || ""} ${song.source || ""} ${song.hint || ""} ${song.channel || ""}`;
  if (hasAny(text, CANTONESE_KEYWORDS)) score += 30;
  if (hasAny(text, CANTONESE_SOURCE_KEYWORDS)) score += 18;
  if (/official|官方|歌詞|lyric|music video|mv/i.test(text)) score += 8;
  score -= index * 0.01;
  return score;
}

function toSong(candidate, number) {
  return {
    title: candidate.title,
    aliases: [...new Set([candidate.channel].filter(Boolean))],
    videoId: candidate.videoId,
    start: 0,
    duration: 60,
    category: "詩歌",
    source: `${candidate.channel || "YouTube"} / YouTube`,
    hint: `50,000+ 粵語詩歌；來源：${candidate.query}；YouTube：${candidate.youtubeTitle || candidate.rawTitle}`,
    number,
    language: "粵語",
    viewCount: candidate.viewCount,
    viewCheckedAt: RUN_DATE,
  };
}

function renumber(rows) {
  return rows.map((song, index) => ({
    ...song,
    number: `HYMN-${String(index + 1).padStart(3, "0")}`,
  }));
}

function addUnique(pool, item, seenVideoIds, seenTitleKeys) {
  if (!item.videoId || seenVideoIds.has(item.videoId)) return false;
  const titleKey = normalize(item.title);
  if (!titleKey || seenTitleKeys.has(titleKey)) return false;
  seenVideoIds.add(item.videoId);
  seenTitleKeys.add(titleKey);
  pool.push(item);
  return true;
}

function rebuildAllSonglists(hymns) {
  const popAll = readJson(POP_ALL_PATH, []);
  writeJson(ALL_SONGLISTS_PATH, [...hymns, ...popAll]);
}

async function main() {
  ensureDir(".cache");
  const original = readJson(HYMNS_PATH, [])
    .filter((song) => Number.isFinite(song.viewCount) && song.viewCount >= MIN_VIEWS)
    .map((song, index) => ({
      ...song,
      title: cleanTitle(song.title) || song.title,
      category: "詩歌",
      originalIndex: index,
    }))
    .filter((song) => !rejectExistingSong(song));

  const currentCantonese = [];
  const currentOther = [];
  for (const song of original) {
    const language = song.language === "粵語" ? "粵語" : classifyLanguage(song);
    if (language === "粵語") currentCantonese.push({ ...song, language: "粵語" });
    else currentOther.push({ ...song, language: "國語" });
  }

  const searchCache = readJson(SEARCH_CACHE_PATH, {});
  const videoCache = readJson(VIDEO_CACHE_PATH, {});
  const candidateMap = new Map();
  const existingVideoIds = new Set(original.map((song) => song.videoId).filter(Boolean));

  for (const query of SEARCH_QUERIES) {
    try {
      const videos = await searchYoutube(query, searchCache);
      console.log(`${query}: ${videos.length} results`);
      for (const video of videos) {
        if (existingVideoIds.has(video.videoId) || candidateMap.has(video.videoId)) continue;
        const title = cleanTitle(video.rawTitle);
        if (rejectReason(video, title)) continue;
        const language = classifyCandidateLanguage(video, title, query);
        if (language !== "粵語") continue;
        candidateMap.set(video.videoId, { ...video, title });
      }
    } catch (error) {
      console.warn(`${query}: ${error.message}`);
    }
  }

  const candidates = [];
  for (const candidate of candidateMap.values()) {
    try {
      const metadata = await getVideoMetadata(candidate.videoId, videoCache);
      const title = cleanTitle(metadata.youtubeTitle || candidate.rawTitle);
      const video = { ...candidate, ...metadata, rawTitle: metadata.youtubeTitle || candidate.rawTitle };
      const viewCount = Number(metadata.viewCount || 0);
      if (viewCount < MIN_VIEWS || rejectReason(video, title)) continue;
      const language = classifyCandidateLanguage(video, title, candidate.query);
      if (language !== "粵語") continue;
      candidates.push({
        ...candidate,
        title,
        channel: metadata.channel || candidate.channel,
        youtubeTitle: metadata.youtubeTitle || candidate.rawTitle,
        lengthSeconds: metadata.lengthSeconds,
        viewCount,
        language: "粵語",
      });
    } catch (error) {
      console.warn(`${candidate.videoId}: ${error.message}`);
    }
  }

  currentCantonese.sort((a, b) => a.originalIndex - b.originalIndex);
  currentOther.sort((a, b) => a.originalIndex - b.originalIndex);
  candidates.sort((a, b) => scoreSong(b) - scoreSong(a) || b.viewCount - a.viewCount);

  const finalCantonese = [];
  const seenVideoIds = new Set();
  const seenTitleKeys = new Set();
  for (const song of currentCantonese) {
    if (finalCantonese.length >= CANTONESE_TARGET) break;
    addUnique(finalCantonese, song, seenVideoIds, seenTitleKeys);
  }
  for (const candidate of candidates) {
    if (finalCantonese.length >= CANTONESE_TARGET) break;
    addUnique(finalCantonese, toSong(candidate, ""), seenVideoIds, seenTitleKeys);
  }

  const finalRows = [...finalCantonese];
  for (const song of currentOther) {
    if (finalRows.length >= TOTAL_TARGET) break;
    addUnique(finalRows, song, seenVideoIds, seenTitleKeys);
  }
  for (const song of currentCantonese.slice(finalCantonese.length)) {
    if (finalRows.length >= TOTAL_TARGET) break;
    addUnique(finalRows, song, seenVideoIds, seenTitleKeys);
  }
  for (const candidate of candidates) {
    if (finalRows.length >= TOTAL_TARGET) break;
    addUnique(finalRows, toSong(candidate, ""), seenVideoIds, seenTitleKeys);
  }

  const finalHymns = renumber(finalRows.map(({ originalIndex, ...song }) => song));
  if (!DRY_RUN) {
    writeJson(HYMNS_PATH, finalHymns);
    rebuildAllSonglists(finalHymns);
  }

  const counts = finalHymns.reduce((acc, song) => {
    acc[song.language] = (acc[song.language] || 0) + 1;
    return acc;
  }, {});
  console.log(
    `Current cantonese=${currentCantonese.length}, current other=${currentOther.length}, new candidates=${candidates.length}`
  );
  console.log(`Final count=${finalHymns.length}, Cantonese=${counts["粵語"] || 0}, Mandarin=${counts["國語"] || 0}`);
  console.log(`Cantonese ratio=${(((counts["粵語"] || 0) / finalHymns.length) * 100).toFixed(1)}%`);
  if (DRY_RUN) console.log("Dry run only.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
