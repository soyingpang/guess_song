const fs = require("fs");
const https = require("https");

const HYMNS_PATH = "hymns.json";
const ALL_SONGLISTS_PATH = "songlists/all-songlists.json";
const POP_ALL_PATH = "songlists/pop-all.json";
const MATCHES_PATH = "docs/POPULAR_HYMN_YOUTUBE_MATCHES_2026-05-23.csv";
const REPORT_PATH = "docs/POPULAR_HYMN_ADDITIONS_2026-05-23.md";
const TARGET_COUNT = Number(process.env.POPULAR_HYMN_TARGET || 0);
const SEARCH_DELAY_MS = Number(process.env.POPULAR_HYMN_SEARCH_DELAY_MS || 1200);

const CANDIDATES = [
  { title: "全因為祢", artist: "ACM HKACM" },
  { title: "愛是不保留", artist: "基恩敬拜 Amazing Grace Worship" },
  { title: "讓讚美飛揚", artist: "讚美之泉 Stream of Praise" },
  { title: "讚美之泉", artist: "讚美之泉 Stream of Praise" },
  { title: "耶和華祝福滿滿", artist: "讚美之泉 Stream of Praise" },
  { title: "彩虹下的約定", artist: "讚美之泉 Stream of Praise" },
  { title: "生命的凱歌", artist: "讚美之泉 Stream of Praise" },
  { title: "祢是我生命的亮光", artist: "讚美之泉 Stream of Praise" },
  { title: "全能的創造主", artist: "讚美之泉 Stream of Praise" },
  { title: "祢是信實的上帝", artist: "讚美之泉 Stream of Praise", aliases: ["祢是信實的神"] },
  { title: "我們愛讓世界不一樣", artist: "讚美之泉 Stream of Praise" },
  { title: "你愛永不變", artist: "讚美之泉 Stream of Praise" },
  { title: "主祢是我力量", artist: "讚美之泉 Stream of Praise" },
  { title: "每一天我需要祢", artist: "讚美之泉 Stream of Praise" },
  { title: "展開清晨的翅膀", artist: "讚美之泉 Stream of Praise" },
  { title: "祢的愛不離不棄", artist: "讚美之泉 Stream of Praise" },
  { title: "祢使我生命美麗", artist: "讚美之泉 Stream of Praise" },
  { title: "這裡有榮耀", artist: "讚美之泉 Stream of Praise" },
  { title: "我要看見", artist: "讚美之泉 Stream of Praise" },
  { title: "我要全心讚美", artist: "讚美之泉 Stream of Praise" },
  { title: "我要一心稱謝祢", artist: "讚美之泉 Stream of Praise" },
  { title: "更深之處", artist: "讚美之泉 Stream of Praise" },
  { title: "一生愛你", artist: "小羊詩歌 Lamb Music" },
  { title: "我以禱告來到祢跟前", artist: "小羊詩歌 Lamb Music" },
  { title: "親愛主", artist: "小羊詩歌 Lamb Music" },
  { title: "求主給我一顆心", artist: "小羊詩歌 Lamb Music" },
  { title: "主我跟祢走", artist: "小羊詩歌 Lamb Music" },
  { title: "盟約", artist: "小羊詩歌 Lamb Music" },
  { title: "有一位神", artist: "生命河靈糧堂 River of Life" },
  { title: "如鷹展翅上騰", artist: "生命河靈糧堂 River of Life" },
  { title: "從早晨到夜晚", artist: "生命河靈糧堂 River of Life" },
  { title: "神羔羊配得", artist: "生命河靈糧堂 River of Life" },
  { title: "聖靈請祢來", artist: "生命河靈糧堂 River of Life" },
  { title: "主我敬拜祢", artist: "生命河靈糧堂 River of Life" },
  { title: "將天敞開", artist: "約書亞樂團 Joshua Band" },
  { title: "坐在寶座上聖潔羔羊", artist: "約書亞樂團 Joshua Band" },
  { title: "榮美的救主", artist: "約書亞樂團 Joshua Band" },
  { title: "我相信", artist: "約書亞樂團 Joshua Band" },
  { title: "深深愛祢", artist: "約書亞樂團 Joshua Band" },
  { title: "我願意", artist: "約書亞樂團 Joshua Band" },
  { title: "耶穌恩友", artist: "傳統聖詩" },
  { title: "因祂活著", artist: "傳統聖詩" },
  { title: "奇異恩典", artist: "傳統聖詩" },
  { title: "如鹿切慕溪水", artist: "傳統聖詩" },
  { title: "有福的確據", artist: "傳統聖詩" },
  { title: "我要向高山舉目", artist: "讚美詩歌" },
  { title: "最知心的朋友", artist: "讚美詩歌" },
  { title: "主啊我到祢面前", artist: "讚美詩歌" },
  { title: "牽我手", artist: "盛曉玫 Amy Sand", aliases: ["牽我的手"] },
  { title: "腳步", artist: "盛曉玫 Amy Sand" },
  { title: "這一生最美的祝福", artist: "讚美詩歌" },
  { title: "祢的恩典夠我用", artist: "讚美之泉 Stream of Praise" },
  { title: "寶貴十架", artist: "讚美之泉 Stream of Praise" },
  { title: "天父的花園", artist: "讚美之泉 Stream of Praise" },
  { title: "主的喜樂是我力量", artist: "讚美之泉 Stream of Praise" },
  { title: "祢是配得", artist: "讚美之泉 Stream of Praise" },
  { title: "尊貴全能神", artist: "讚美之泉 Stream of Praise" },
  { title: "我心屬於祢", artist: "讚美之泉 Stream of Praise" },
  { title: "永遠尊貴", artist: "讚美之泉 Stream of Praise" },
  { title: "我要唱耶和華的大慈愛", artist: "讚美之泉 Stream of Praise" },
  { title: "祢是我的一切", artist: "讚美詩歌" },
  { title: "主如明亮晨星", artist: "讚美詩歌" },
  { title: "耶和華靠近傷心的人", artist: "讚美詩歌" },
  { title: "祢愛的大能", artist: "讚美詩歌" },
  { title: "我需要有祢在我生命中", artist: "讚美詩歌" },
  { title: "讓我", artist: "讚美詩歌" },
  { title: "我在這裡", artist: "讚美詩歌" },
  { title: "耶穌我愛祢", artist: "讚美詩歌" },
  { title: "我的神我要敬拜祢", artist: "讚美詩歌" },
];

const MANUAL_MATCHES = {
  全因為祢: {
    videoId: "B9428ybwFCY",
    youtubeTitle: "全因為祢（官方歌詞版MV） - 鄧婉玲",
    channel: "永恆音樂事工 Eternity Music Ministry",
    length: "2:45",
  },
  求主給我一顆心: {
    videoId: "ZzL8VSHq2q0",
    youtubeTitle: "296 求主给我一颗心 Sydney 2014",
    channel: "小敏迦南詩歌 Xiaomin Canaan Hymns",
    length: "2:41",
  },
  聖靈請祢來: {
    videoId: "IjufasfZ9hE",
    youtubeTitle: "聖靈請你來",
    channel: "777Worship 完全的敬拜 | 敬拜中裡合一 | Unity in Worship",
    length: "8:00",
  },
  牽我手: {
    videoId: "LfEs9KzOji4",
    youtubeTitle: "牽我手 Hold My Hand 盛曉玫 Amy Sand 泥土音樂專輯 2：有一天",
    channel: "泥土音樂Clay Music",
    length: "3:06",
  },
  祢愛的大能: {
    videoId: "w2JRIQt8jNg",
    youtubeTitle: "有情天音樂事工 - 你愛的大能",
    channel: "GOOD TV DAILY",
    length: "4:48",
  },
};

const WORSHIP_KEYWORDS = [
  "詩歌",
  "敬拜",
  "讚美",
  "基督",
  "耶穌",
  "上帝",
  "神",
  "聖詩",
  "讚美之泉",
  "stream of praise",
  "小羊詩歌",
  "lamb music",
  "約書亞",
  "joshua",
  "生命河",
  "river of life",
  "基恩",
  "hkacm",
  "hymn",
  "worship",
];

const BLOCKED_KEYWORDS = [
  "karaoke",
  "伴奏",
  "cover",
  "翻唱",
  "教學",
  "reaction",
  "piano only",
  "純音樂",
  "電影",
  "劇集",
  "愛情",
  "流行歌曲",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "accept-language": "zh-Hant-HK,zh-Hant;q=0.9,en;q=0.7",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
        },
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => resolve(body));
      }
    );
    request.on("error", reject);
    request.setTimeout(9000, () => {
      request.destroy(new Error(`Timed out: ${url}`));
    });
  });
}

function decodeJsonString(value) {
  try {
    return JSON.parse(`"${value}"`);
  } catch {
    return String(value || "").replace(/\\u0026/g, "&").replace(/\\"/g, '"');
  }
}

function collectVideosFromHtml(html) {
  const videos = [];
  const chunks = html.split('"videoRenderer":{').slice(1, 41);
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

function normalize(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[祢袮你妳]/g, "你")
    .replace(/[臺台]/g, "台")
    .replace(/[&＋+]/g, "")
    .replace(/[^\p{Letter}\p{Number}]/gu, "")
    .toLowerCase();
}

function artistTokens(artist) {
  return String(artist || "")
    .split(/[\s、,，/|]+/)
    .map(normalize)
    .filter((token) => token.length >= 3 && !["傳統聖詩", "讚美詩歌"].includes(token));
}

function titleKey(value) {
  return normalize(value);
}

function hasWorshipContext(video) {
  const text = `${video.youtubeTitle} ${video.channel}`.toLowerCase();
  return WORSHIP_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
}

function isBlocked(video) {
  const text = `${video.youtubeTitle} ${video.channel}`.toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => text.includes(keyword.toLowerCase()));
}

function scoreVideo(candidate, video) {
  const rawText = `${video.youtubeTitle} ${video.channel}`;
  const videoText = normalize(rawText);
  const title = normalize(candidate.title);
  const artists = artistTokens(candidate.artist);
  let score = 0;

  if (videoText.includes(title)) score += 80;
  else {
    let shared = 0;
    for (const char of new Set([...title])) {
      if (videoText.includes(char)) shared += 1;
    }
    score += Math.round((shared / Math.max(title.length, 1)) * 42);
  }

  const matchedArtists = artists.filter((artist) => videoText.includes(artist)).length;
  score += Math.min(24, matchedArtists * 12);

  if (/official|官方|mv|musicvideo|音樂錄像|lyric|歌詞|敬拜|詩歌|讚美|hymn|worship/i.test(rawText)) score += 8;
  if (hasWorshipContext(video)) score += 12;
  if (isBlocked(video)) score -= 30;
  if (/live|現場|演唱會|concert/i.test(rawText)) score -= 2;
  if (!video.length) score -= 4;
  if (title.length <= 3 && !matchedArtists && !hasWorshipContext(video)) score -= 25;
  return score;
}

async function searchYouTube(candidate, usedVideoIds) {
  const manualMatch = MANUAL_MATCHES[candidate.title];
  if (manualMatch && !usedVideoIds.has(manualMatch.videoId)) {
    return {
      ...manualMatch,
      query: "manual",
      score: 120,
    };
  }

  const queries = [
    `${candidate.title} ${candidate.artist} 官方 詩歌`,
    `${candidate.title} ${candidate.artist} 敬拜`,
    `${candidate.title} 基督教 詩歌`,
    `${candidate.title} 詩歌 歌詞`,
    `"${candidate.title}" "${candidate.artist}"`,
  ];

  for (const query of queries) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=zh-Hant&gl=HK`;
    let videos = [];
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        videos = collectVideosFromHtml(await requestText(url));
      } catch {
        videos = [];
      }
      if (videos.length) break;
      await sleep(SEARCH_DELAY_MS * 2);
    }
    const ranked = videos
      .filter((video) => !usedVideoIds.has(video.videoId))
      .filter((video) => !isBlocked(video))
      .map((video) => ({ ...video, query, score: scoreVideo(candidate, video) }))
      .filter((video) => video.score >= 76)
      .sort((a, b) => b.score - a.score);
    if (ranked.length) return ranked[0];
    await sleep(SEARCH_DELAY_MS);
  }
  return null;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function nextHymnNumber(hymns) {
  return (
    Math.max(
      0,
      ...hymns.map((song) => Number(String(song.number || "").match(/HYMN-(\d+)/)?.[1] || 0))
    ) + 1
  );
}

function buildSong(candidate, match, index) {
  return {
    title: candidate.title,
    aliases: Array.from(new Set([candidate.artist, ...(candidate.aliases || [])])).filter(Boolean),
    videoId: match.videoId,
    start: 0,
    duration: 60,
    category: "教會詩歌",
    source: `${match.channel || "YouTube"} / YouTube`,
    hint: `熱門華人教會詩歌；參考來源：${candidate.artist}；YouTube：${match.youtubeTitle}`,
    number: `HYMN-${String(index).padStart(3, "0")}`,
    language: "中文",
  };
}

async function main() {
  const hymns = JSON.parse(fs.readFileSync(HYMNS_PATH, "utf8"));
  const popAll = JSON.parse(fs.readFileSync(POP_ALL_PATH, "utf8"));
  const existingTitleKeys = new Set(hymns.map((song) => titleKey(song.title)));
  const usedVideoIds = new Set([
    ...hymns.map((song) => song.videoId).filter(Boolean),
    ...popAll.map((song) => song.videoId).filter(Boolean),
  ]);
  const startNumber = nextHymnNumber(hymns);
  const additions = [];
  const matches = [];
  const misses = [];
  const skipped = [];

  for (const candidate of CANDIDATES) {
    if (TARGET_COUNT > 0 && additions.length >= TARGET_COUNT) break;
    const key = titleKey(candidate.title);
    if (existingTitleKeys.has(key)) {
      skipped.push(candidate);
      continue;
    }
    const match = await searchYouTube(candidate, usedVideoIds);
    if (!match) {
      misses.push(candidate);
      console.log(`MISS ${candidate.title} - ${candidate.artist}`);
      continue;
    }
    usedVideoIds.add(match.videoId);
    existingTitleKeys.add(key);
    additions.push(buildSong(candidate, match, startNumber + additions.length));
    matches.push({ ...candidate, ...match, status: "matched" });
    console.log(`OK ${candidate.title} - ${candidate.artist} -> ${match.videoId} ${match.youtubeTitle}`);
    await sleep(SEARCH_DELAY_MS);
  }

  if (TARGET_COUNT > 0 && additions.length < TARGET_COUNT) {
    throw new Error(`Only matched ${additions.length} songs; target is ${TARGET_COUNT}`);
  }

  const nextHymns = [...hymns, ...additions];
  fs.writeFileSync(HYMNS_PATH, `${JSON.stringify(nextHymns, null, 2)}\n`);
  fs.writeFileSync(ALL_SONGLISTS_PATH, `${JSON.stringify([...nextHymns, ...popAll], null, 2)}\n`);

  const csvRows = [
    ["status", "title", "artist", "video_id", "youtube_title", "channel", "length", "score", "query", "url"],
    ...matches.map((match) => [
      match.status,
      match.title,
      match.artist,
      match.videoId,
      match.youtubeTitle,
      match.channel,
      match.length,
      match.score,
      match.query,
      `https://www.youtube.com/watch?v=${match.videoId}`,
    ]),
    ...misses.map((miss) => ["missed", miss.title, miss.artist, "", "", "", "", "", "", ""]),
    ...skipped.map((skip) => ["skipped_existing", skip.title, skip.artist, "", "", "", "", "", "", ""]),
  ];
  fs.writeFileSync(MATCHES_PATH, `${csvRows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`);

  const report = [
    "# 熱門教會詩歌補充 - 2026-05-23",
    "",
    "## 摘要",
    "",
    `- 新增熱門教會詩歌：${additions.length} 首`,
    `- 教會詩歌總數：${nextHymns.length} 首`,
    `- 全部歌單總數：${nextHymns.length + popAll.length} 首`,
    `- 候選中已存在而略過：${skipped.length} 首`,
    `- 未能自動配對：${misses.length} 首`,
    "",
    "## 產出檔案",
    "",
    "- `hymns.json`",
    "- `songlists/all-songlists.json`",
    "- `docs/POPULAR_HYMN_YOUTUBE_MATCHES_2026-05-23.csv`",
    "",
    "## 新增歌單",
    "",
    ...additions.map((song) => `- ${song.number} ${song.title} - ${song.aliases[0]} (${song.videoId})`),
    "",
    "## 選歌準則",
    "",
    "- 優先補入華人教會常唱、旋律辨識度高、團契聚會容易估中的詩歌。",
    "- 優先選擇讚美之泉、小羊詩歌、生命河、約書亞、基恩、HKACM、傳統聖詩等高辨識度來源。",
    "- 優先配對官方 MV、官方音源、歌詞版或穩定可播放的公開 YouTube 版本。",
    "",
    "## 注意",
    "",
    "- 配對是自動搜尋及規則篩選結果，正式活動前建議人工抽查版本、音量、開頭長度及使用權限。",
    "- 歌單只保存公開 YouTube 影片 ID，不下載或儲存音樂檔。",
  ].join("\n");
  fs.writeFileSync(REPORT_PATH, `${report}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
