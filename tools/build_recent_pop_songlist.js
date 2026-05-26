const fs = require("fs");
const https = require("https");

const RECENT_PATH = "songlists/pop-recent-25.json";
const POP_ALL_PATH = "songlists/pop-all.json";
const ALL_SONGLISTS_PATH = "songlists/all-songlists.json";
const HYMNS_PATH = "hymns.json";
const POP_80S_PATH = "songlists/pop-80s.json";
const POP_90S_PATH = "songlists/pop-90s.json";
const MATCHES_PATH = "docs/POP_RECENT_25_YOUTUBE_MATCHES_2026-05-23.csv";
const REPORT_PATH = "docs/POP_RECENT_25_SONGLIST_2026-05-23.md";
const TARGET_COUNT = Number(process.env.RECENT_POP_TARGET || 0);
const SEARCH_DELAY_MS = Number(process.env.RECENT_POP_SEARCH_DELAY_MS || 1400);

const CANDIDATES = [
  { title: "Shall We Talk", artist: "陳奕迅", year: 2001 },
  { title: "野孩子", artist: "楊千嬅", year: 2001 },
  { title: "終身美麗", artist: "鄭秀文", year: 2001 },
  { title: "痛愛", artist: "容祖兒", year: 2001 },
  { title: "玉蝴蝶", artist: "謝霆鋒", year: 2001 },
  { title: "好心分手", artist: "盧巧音", year: 2002 },
  { title: "明年今日", artist: "陳奕迅", year: 2002 },
  { title: "爭氣", artist: "容祖兒", year: 2002 },
  { title: "愛不釋手", artist: "李克勤", year: 2002 },
  { title: "可惜我是水瓶座", artist: "楊千嬅", year: 2003 },
  { title: "我的驕傲", artist: "容祖兒", year: 2003 },
  { title: "七友", artist: "梁漢文", year: 2003 },
  { title: "十面埋伏", artist: "陳奕迅", year: 2003 },
  { title: "愛與誠", artist: "古巨基", year: 2004 },
  { title: "小城大事", artist: "楊千嬅", year: 2004 },
  { title: "奇洛李維斯回信", artist: "薛凱琪", year: 2004 },
  { title: "夕陽無限好", artist: "陳奕迅", year: 2005 },
  { title: "無賴", artist: "鄭中基", year: 2005 },
  { title: "好人", artist: "側田", year: 2005 },
  { title: "他約我去迪士尼", artist: "KellyJackie 陳慧琳", year: 2005 },
  { title: "愛得太遲", artist: "古巨基", year: 2006 },
  { title: "最佳損友", artist: "陳奕迅", year: 2006 },
  { title: "紅綠燈", artist: "鄭融", year: 2006 },
  { title: "感應", artist: "泳兒", year: 2006 },
  { title: "富士山下", artist: "陳奕迅", year: 2007 },
  { title: "酷愛", artist: "張敬軒", year: 2007 },
  { title: "男人KTV", artist: "側田", year: 2007 },
  { title: "電燈膽", artist: "鄧麗欣", year: 2007 },
  { title: "囍帖街", artist: "謝安琪", year: 2008 },
  { title: "櫻花樹下", artist: "張敬軒", year: 2008 },
  { title: "愛不疚", artist: "林峯", year: 2008 },
  { title: "一事無成", artist: "周柏豪 鄭融", year: 2008 },
  { title: "你瞞我瞞", artist: "陳柏宇", year: 2009 },
  { title: "七百年後", artist: "陳奕迅", year: 2009 },
  { title: "年度之歌", artist: "謝安琪", year: 2009 },
  { title: "就算世界無童話", artist: "衛蘭", year: 2009 },
  { title: "陀飛輪", artist: "陳奕迅", year: 2010 },
  { title: "天梯", artist: "C AllStar", year: 2010 },
  { title: "破相", artist: "容祖兒", year: 2010 },
  { title: "那些年", artist: "胡夏", year: 2011 },
  { title: "那誰", artist: "蘇永康", year: 2011 },
  { title: "花千樹", artist: "容祖兒", year: 2011 },
  { title: "重口味", artist: "陳奕迅", year: 2012 },
  { title: "到此為止", artist: "連詩雅", year: 2012 },
  { title: "年少無知", artist: "林保怡 陳豪 黃德斌", year: 2012 },
  { title: "任我行", artist: "陳奕迅", year: 2013 },
  { title: "青春頌", artist: "許廷鏗", year: 2013 },
  { title: "無盡", artist: "Supper Moment", year: 2013 },
  { title: "青春常駐", artist: "張敬軒", year: 2014 },
  { title: "獨家村", artist: "謝安琪", year: 2014 },
  { title: "越難越愛", artist: "吳若希", year: 2014 },
  { title: "一", artist: "AGA", year: 2014 },
  { title: "羅生門", artist: "麥浚龍 謝安琪", year: 2015 },
  { title: "原來她不夠愛我", artist: "吳業坤", year: 2015 },
  { title: "最好的債", artist: "楊千嬅", year: 2015 },
  { title: "女神", artist: "鄭欣宜", year: 2016 },
  { title: "你是你本身的傳奇", artist: "方皓玟", year: 2016 },
  { title: "四季", artist: "陳奕迅", year: 2016 },
  { title: "有人共鳴", artist: "林奕匡", year: 2016 },
  { title: "長相廝守", artist: "ToNick", year: 2017 },
  { title: "天敵", artist: "衛蘭", year: 2017 },
  { title: "難得一遇", artist: "林奕匡", year: 2017 },
  { title: "缺", artist: "張敬軒", year: 2018 },
  { title: "漸漸", artist: "陳奕迅", year: 2018 },
  { title: "未來見", artist: "RubberBand", year: 2018 },
  { title: "一個女人和浴室", artist: "謝安琪", year: 2018 },
  { title: "我們都是這樣長大的", artist: "鄭秀文", year: 2019 },
  { title: "人話", artist: "方皓玟", year: 2019 },
  { title: "百年樹木", artist: "張敬軒", year: 2019 },
  { title: "2084", artist: "Dear Jane", year: 2019 },
  { title: "銀河修理員", artist: "Dear Jane", year: 2020 },
  { title: "一人之境", artist: "林家謙", year: 2020 },
  { title: "呼吸有害", artist: "莫文蔚", year: 2020 },
  { title: "蒙著嘴說愛你", artist: "姜濤", year: 2020 },
  { title: "記憶棉", artist: "MC 張天賦", year: 2021 },
  { title: "E先生連環不幸事件", artist: "呂爵安", year: 2021 },
  { title: "俏郎君", artist: "張敬軒", year: 2021 },
  { title: "Dear My Friend,", artist: "姜濤", year: 2021 },
  { title: "Megahit", artist: "盧瀚霆", year: 2021 },
  { title: "老派約會之必要", artist: "MC 張天賦", year: 2022 },
  { title: "人啊人", artist: "陳奕迅", year: 2022 },
  { title: "葉落冰川", artist: "泳兒", year: 2022 },
  { title: "作品的說話", artist: "姜濤", year: 2022 },
  { title: "世一", artist: "MC 張天賦", year: 2023 },
  { title: "隱形遊樂場", artist: "張敬軒", year: 2023 },
  { title: "為何嚴重到這樣", artist: "Dear Jane", year: 2023 },
  { title: "企好", artist: "Gin Lee 李幸倪", year: 2023 },
  { title: "黑玻璃", artist: "洪嘉豪", year: 2024 },
  { title: "好得太過份", artist: "姜濤", year: 2024 },
  { title: "普渡眾生", artist: "林家謙", year: 2024 },
  { title: "說謊者", artist: "MC 張天賦", year: 2025 },
  { title: "四月物語", artist: "林家謙", year: 2025 },
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
    request.setTimeout(8000, () => {
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
    .replace(/[臺台]/g, "台")
    .replace(/[妳你]/g, "你")
    .replace(/[&＋+]/g, "")
    .replace(/[^\p{Letter}\p{Number}]/gu, "")
    .toLowerCase();
}

function artistTokens(artist) {
  return String(artist || "")
    .replace(/MC\s*/i, "MC ")
    .split(/[\s、,，/]+/)
    .map(normalize)
    .filter((token) => token.length >= 2);
}

function scoreVideo(candidate, video) {
  const videoText = normalize(`${video.youtubeTitle} ${video.channel}`);
  const title = normalize(candidate.title);
  const artists = artistTokens(candidate.artist);
  let score = 0;

  if (videoText.includes(title)) score += 80;
  else {
    let shared = 0;
    for (const char of new Set([...title])) {
      if (videoText.includes(char)) shared += 1;
    }
    score += Math.round((shared / Math.max(title.length, 1)) * 45);
  }

  const matchedArtists = artists.filter((artist) => videoText.includes(artist)).length;
  score += Math.min(25, matchedArtists * 12);

  if (/official|官方|mv|musicvideo|音樂錄像|lyric|歌詞/i.test(`${video.youtubeTitle} ${video.channel}`)) score += 8;
  if (/cover|翻唱|karaoke|伴奏|reaction|教學|純音樂|鋼琴|結他/i.test(video.youtubeTitle)) score -= 18;
  if (/live|演唱會|concert/i.test(video.youtubeTitle)) score -= 4;
  if (!video.length) score -= 4;
  return score;
}

async function searchYouTube(candidate, usedVideoIds) {
  const queries = [
    `${candidate.title} ${candidate.artist} official mv`,
    `${candidate.title} ${candidate.artist} 官方 MV`,
    `${candidate.title} ${candidate.artist} Official Audio`,
    `${candidate.title} ${candidate.artist} 歌詞`,
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
      .map((video) => ({ ...video, query, score: scoreVideo(candidate, video) }))
      .filter((video) => video.score >= 72)
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

function renumberPopAll(songs) {
  return songs.map((song, index) => ({
    ...song,
    number: `POP-${String(index + 1).padStart(3, "0")}`,
  }));
}

function buildSong(candidate, match, index) {
  return {
    title: candidate.title,
    aliases: [candidate.artist],
    videoId: match.videoId,
    start: 0,
    duration: 60,
    category: "近25年熱門新歌",
    source: `${match.channel || "YouTube"} / YouTube / 流行曲題庫`,
    hint: `歌手：${candidate.artist}；年代：${candidate.year}；YouTube：${match.youtubeTitle}`,
    number: `POP25-${String(index + 1).padStart(3, "0")}`,
    language: "中文",
  };
}

async function main() {
  const usedVideoIds = new Set([
    ...JSON.parse(fs.readFileSync(POP_80S_PATH, "utf8")).map((song) => song.videoId),
    ...JSON.parse(fs.readFileSync(POP_90S_PATH, "utf8")).map((song) => song.videoId),
    ...JSON.parse(fs.readFileSync(HYMNS_PATH, "utf8")).map((song) => song.videoId),
  ]);
  const songs = [];
  const matches = [];
  const misses = [];

  for (const candidate of CANDIDATES) {
    if (TARGET_COUNT > 0 && songs.length >= TARGET_COUNT) break;
    const match = await searchYouTube(candidate, usedVideoIds);
    if (!match) {
      misses.push(candidate);
      console.log(`MISS ${candidate.title} - ${candidate.artist}`);
      continue;
    }
    usedVideoIds.add(match.videoId);
    songs.push(buildSong(candidate, match, songs.length));
    matches.push({ ...candidate, ...match, status: "matched" });
    console.log(`OK ${candidate.title} - ${candidate.artist} -> ${match.videoId} ${match.youtubeTitle}`);
    await sleep(SEARCH_DELAY_MS);
  }

  if (TARGET_COUNT > 0 && songs.length < TARGET_COUNT) {
    throw new Error(`Only matched ${songs.length} songs; target is ${TARGET_COUNT}`);
  }

  fs.writeFileSync(RECENT_PATH, `${JSON.stringify(songs, null, 2)}\n`);

  const pop80s = JSON.parse(fs.readFileSync(POP_80S_PATH, "utf8"));
  const pop90s = JSON.parse(fs.readFileSync(POP_90S_PATH, "utf8"));
  const popAll = renumberPopAll([...pop80s, ...pop90s, ...songs]);
  fs.writeFileSync(POP_ALL_PATH, `${JSON.stringify(popAll, null, 2)}\n`);

  const hymns = JSON.parse(fs.readFileSync(HYMNS_PATH, "utf8"));
  const allSonglists = [...hymns, ...popAll];
  fs.writeFileSync(ALL_SONGLISTS_PATH, `${JSON.stringify(allSonglists, null, 2)}\n`);

  const csvRows = [
    ["status", "title", "artist", "year", "video_id", "youtube_title", "channel", "length", "score", "query", "url"],
    ...matches.map((match) => [
      match.status,
      match.title,
      match.artist,
      match.year,
      match.videoId,
      match.youtubeTitle,
      match.channel,
      match.length,
      match.score,
      match.query,
      `https://www.youtube.com/watch?v=${match.videoId}`,
    ]),
    ...misses.map((miss) => ["missed", miss.title, miss.artist, miss.year, "", "", "", "", "", "", ""]),
  ];
  fs.writeFileSync(MATCHES_PATH, `${csvRows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`);

  const report = [
    "# 近25年熱門新歌 YouTube 歌單 - 2026-05-23",
    "",
    "## 摘要",
    "",
    `- 近25年熱門新歌：${songs.length} 首`,
    `- 全部流行曲：${popAll.length} 首（80年代 50 首 + 90年代 50 首 + 近25年 ${songs.length} 首）`,
    `- 全部歌單：${allSonglists.length} 首（詩歌 ${hymns.length} 首 + 流行曲 ${popAll.length} 首）`,
    `- YouTube 自動配對成功：${matches.length} 首`,
    `- 未能配對：${misses.length} 首`,
    "",
    "## 產出檔案",
    "",
    "- `songlists/pop-recent-25.json`",
    "- `songlists/pop-all.json`",
    "- `songlists/all-songlists.json`",
    "- `docs/POP_RECENT_25_YOUTUBE_MATCHES_2026-05-23.csv`",
    "",
    "## 歌單",
    "",
    ...songs.map((song) => {
      const artist = song.aliases[0] || "";
      return `- ${song.number} ${song.title} - ${artist} (${song.videoId})`;
    }),
    "",
    "## 選歌準則",
    "",
    "- 以 2001 至 2025 年香港樂壇高傳唱度廣東歌為主。",
    "- 優先選入曾在主要香港樂壇頒獎禮得獎、入圍或近年仍常被點唱 / 翻唱 / 討論的作品。",
    "- 優先配對官方 MV、官方音源、官方歌詞版或唱片公司 / 歌手頻道上載版本。",
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
