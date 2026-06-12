const fs = require("fs");

const RUN_DATE = "2026-06-12";
const MIN_VIEWS = 500000;

const HYMNS_PATH = "hymns.json";
const POP_80S_PATH = "songlists/pop-80s.json";
const POP_90S_PATH = "songlists/pop-90s.json";
const POP_RECENT_25_PATH = "songlists/pop-recent-25.json";
const POP_00S_PATH = "songlists/pop-00s.json";
const POP_RECENT_15_PATH = "songlists/pop-recent-15.json";
const POP_ALL_PATH = "songlists/pop-all.json";
const POP_CANTONESE_PATH = "songlists/pop-cantonese.json";
const POP_MANDARIN_PATH = "songlists/pop-mandarin.json";
const ALL_SONGLISTS_PATH = "songlists/all-songlists.json";
const ALL_CANTONESE_PATH = "songlists/all-cantonese.json";
const ALL_MANDARIN_PATH = "songlists/all-mandarin.json";
const RECENT_MATCHES_CSV = "docs/POP_RECENT_25_YOUTUBE_MATCHES_2026-05-23.csv";
const REPORT_PATH = `docs/SONGLIST_LANGUAGE_ERA_SPLIT_${RUN_DATE}.md`;
const CSV_PATH = `docs/SONGLIST_LANGUAGE_ERA_SPLIT_${RUN_DATE}.csv`;

const CANTO_PATTERNS = [
  "cantonese",
  "jyutping",
  "粵語",
  "粤语",
  "香港",
  "hong kong",
  "hongkong",
  "港仔",
  "英皇",
  "eeg music",
  "universalmusichk",
  "warnermusichk",
  "sony music entertainment hong kong",
  "timeless music hong kong",
  "media asia",
  "寰亞",
  "華星",
  "capital artists",
  "tvb music",
  "amusic official",
  "mirrormusic",
  "mirror",
  "eason chan",
  "陳奕迅",
  "張國榮",
  "leslie cheung",
  "譚詠麟",
  "alan tam",
  "梅艷芳",
  "anita mui",
  "陳百強",
  "danny chan",
  "林子祥",
  "george lam",
  "徐小鳳",
  "甄妮",
  "羅文",
  "許冠傑",
  "sam hui",
  "葉蒨文",
  "sally yeh",
  "陳慧嫻",
  "priscilla chan",
  "beyond",
  "張學友",
  "jacky cheung",
  "劉德華",
  "andy lau",
  "黎明",
  "leon lai",
  "郭富城",
  "aaron kwok",
  "李克勤",
  "hacken lee",
  "鄭秀文",
  "sammi cheng",
  "鄭中基",
  "ronald cheng",
  "古巨基",
  "leo ku",
  "楊千嬅",
  "miriam yeung",
  "容祖兒",
  "joey yung",
  "謝安琪",
  "kay tse",
  "張敬軒",
  "hins cheung",
  "林家謙",
  "terence lam",
  "dear jane",
  "rubberband",
  "supper moment",
  "c allstar",
  "姜濤",
  "keung to",
  "盧瀚霆",
  "anson lo",
  "呂爵安",
  "edan lui",
  "陳卓賢",
  "ian chan",
  "柳應廷",
  "jer lau",
  "張天賦",
  "mc cheung",
  "aga",
  "江海迦",
  "gin lee",
  "李幸倪",
  "衛蘭",
  "janice vidal",
  "jw 王灝兒",
  "陳柏宇",
  "jason chan",
  "周柏豪",
  "pakho",
  "側田",
  "justin lo",
  "薛凱琪",
  "fiona sit",
  "張繼聰",
  "洪嘉豪",
  "陳凱詠",
  "jace",
  "鄭欣宜",
  "joyce cheng",
  "serrini",
  "kolor",
  "tonick",
  "泳兒",
  "陳蕾",
  "panther chan",
  "馮允謙",
  "jay fung",
  "鄧小巧",
  "林奕匡",
  "phil lam",
  "小塵埃",
  "岑寧兒",
  "張蔓姿",
  "張蔓莎",
  "gareth.t",
  "tyson yoshi",
  "collar",
  "my little airport",
  "許廷鏗",
  "連詩雅",
  "方皓玟",
  "鄧麗欣",
  "stephy tang",
  "梁漢文",
  "盧巧音",
  "何韻詩",
  "rubberband",
  "新青年理髮廳",
  "officialkolorvids",
];

const MANDARIN_PATTERNS = [
  "mandarin",
  "國語",
  "国语",
  "普通話",
  "普通话",
  "台灣",
  "台湾",
  "taiwan",
  "華語",
  "华语",
  "華研",
  "福茂",
  "滾石",
  "rock records",
  "相信音樂",
  "binmusic",
  "愛貝克思",
  "avex taiwan",
  "豐華",
  "forwardmusic",
  "添翼",
  "team ear",
  "杰威爾",
  "jvr",
  "周杰倫",
  "jay chou",
  "五月天",
  "mayday",
  "蔡依林",
  "jolin",
  "張惠妹",
  "a-mei",
  "s.h.e",
  "田馥甄",
  "hebe",
  "王心凌",
  "cyndi wang",
  "楊丞琳",
  "rainie yang",
  "梁靜茹",
  "fish leong",
  "劉若英",
  "rene liu",
  "孫燕姿",
  "sun yanzi",
  "王力宏",
  "leehom",
  "陶喆",
  "david tao",
  "林宥嘉",
  "yoga lin",
  "韋禮安",
  "weibird",
  "告五人",
  "accusefive",
  "茄子蛋",
  "eggplantegg",
  "八三夭",
  "831",
  "蕭敬騰",
  "jam hsiao",
  "周深",
  "李榮浩",
  "ronghao li",
  "徐佳瑩",
  "lala",
  "a-lin",
  "蘇打綠",
  "sodagreen",
  "吳青峰",
  "wu qing feng",
  "gem",
  "鄧紫棋",
  "張韶涵",
  "angela chang",
  "林俊傑",
  "jj lin",
  "蔡健雅",
  "tanya chua",
  "周興哲",
  "eric chou",
  "郁可唯",
  "trash band",
  "美秀",
  "理想混蛋",
  "bestards",
  "kimberley",
  "陳綺貞",
  "cheer chen",
  "張懸",
  "deserts xuan",
  "伍佰",
  "蕭亞軒",
  "elva hsiao",
  "潘瑋柏",
  "will pan",
  "羅志祥",
  "show lo",
  "范瑋琪",
  "戴佩妮",
  "penny tai",
  "張靚穎",
  "g.e.m",
  "华语歌曲",
  "抖音",
];

const SIMPLIFIED_HINTS = /[这边为爱无过后会还从个们说让带间发现听见风门叶梦难欢觉泪应样声体龙东乐丽]/;

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((cells) => cells.length > 1 || cells[0]);
}

function readRecentYearMaps() {
  const byTitle = new Map();
  const byVideoId = new Map();
  if (!fs.existsSync(RECENT_MATCHES_CSV)) return { byTitle, byVideoId };
  const rows = parseCsv(fs.readFileSync(RECENT_MATCHES_CSV, "utf8"));
  const headers = rows.shift();
  for (const cells of rows) {
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""]));
    const year = Number(row.year);
    if (!Number.isFinite(year)) continue;
    byTitle.set(normalizeText(row.title), year);
    if (row.video_id) byVideoId.set(row.video_id, year);
  }
  return { byTitle, byVideoId };
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[^\p{Letter}\p{Number}]/gu, "")
    .toLowerCase();
}

function scorePatterns(text, patterns) {
  const normalized = text.toLowerCase();
  return patterns.reduce((score, pattern) => (normalized.includes(pattern.toLowerCase()) ? score + 1 : score), 0);
}

function inferLanguage(song, listId) {
  const current = String(song.language || "").trim();
  if (current === "粵語" || current === "國語") {
    return { language: current, confidence: "existing" };
  }

  const text = `${song.title || ""} ${song.source || ""} ${song.hint || ""}`;
  let cantoScore = scorePatterns(text, CANTO_PATTERNS);
  let mandarinScore = scorePatterns(text, MANDARIN_PATTERNS);

  if (SIMPLIFIED_HINTS.test(text)) mandarinScore += 1;
  if (/粵|粤|cantonese|jyutping/i.test(text)) cantoScore += 3;
  if (/國語|国语|mandarin|普通話|普通话/i.test(text)) mandarinScore += 3;

  if (cantoScore > mandarinScore) return { language: "粵語", confidence: `rule:${cantoScore}-${mandarinScore}` };
  if (mandarinScore > cantoScore) return { language: "國語", confidence: `rule:${cantoScore}-${mandarinScore}` };

  if (listId === "pop80s" || listId === "pop90s") {
    return { language: "粵語", confidence: "fallback-era" };
  }
  return { language: "國語", confidence: "fallback-recent" };
}

function recentNumber(song) {
  return Number(String(song.number || "").match(/-(\d+)/)?.[1]);
}

function inferRecentEra(song, yearMaps) {
  const knownYear = yearMaps.byVideoId.get(song.videoId) || yearMaps.byTitle.get(normalizeText(song.title));
  if (Number.isFinite(knownYear)) {
    const category = knownYear <= 2010 ? "00後流行曲" : "最近15年流行曲";
    return {
      year: knownYear,
      category,
      eraTags: category === "00後流行曲" ? ["00後流行曲"] : ["00後流行曲", "最近15年流行曲"],
      confidence: "matched-year",
    };
  }

  const number = recentNumber(song);
  if (Number.isFinite(number) && number <= 39) {
    return { year: null, category: "00後流行曲", eraTags: ["00後流行曲"], confidence: "original-order-00s" };
  }
  return {
    year: null,
    category: "最近15年流行曲",
    eraTags: ["00後流行曲", "最近15年流行曲"],
    confidence: "default-recent15",
  };
}

function enrichSong(song, listId, yearMaps) {
  const language = inferLanguage(song, listId);
  const era = listId === "recentPop25" ? inferRecentEra(song, yearMaps) : null;
  const category =
    listId === "pop80s"
      ? "80年代流行曲"
      : listId === "pop90s"
        ? "90年代流行曲"
        : era?.category || song.category || "";

  const enriched = {
    ...song,
    category,
    language: language.language,
  };
  if (era?.eraTags?.length) enriched.eraTags = era.eraTags;
  if (era?.year) enriched.year = era.year;
  return {
    song: enriched,
    audit: {
      sourceList: listId,
      number: enriched.number || "",
      title: enriched.title || "",
      videoId: enriched.videoId || "",
      viewCount: enriched.viewCount || "",
      category,
      language: language.language,
      languageConfidence: language.confidence,
      year: era?.year || "",
      eraTags: era?.eraTags?.join("|") || "",
      eraConfidence: era?.confidence || "",
    },
  };
}

function renumberPopAll(popSongs) {
  return popSongs.map((song, index) => ({
    ...song,
    number: `POP-${String(index + 1).padStart(3, "0")}`,
  }));
}

function toCsvValue(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeAudit(audits, summary) {
  const headers = [
    "sourceList",
    "number",
    "title",
    "videoId",
    "viewCount",
    "category",
    "language",
    "languageConfidence",
    "year",
    "eraTags",
    "eraConfidence",
  ];
  fs.writeFileSync(
    CSV_PATH,
    `${headers.join(",")}\n${audits.map((row) => headers.map((header) => toCsvValue(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );

  const lines = [
    "# Songlist Language and Era Split (2026-06-12)",
    "",
    `All generated lists keep the existing ${MIN_VIEWS.toLocaleString("en-US")} view-count floor.`,
    "",
    "## Summary",
    "",
    "| List | Count |",
    "| --- | ---: |",
    ...summary.map(([label, count]) => `| ${label} | ${count} |`),
    "",
    "## Notes",
    "",
    "- Cantonese / Mandarin classification uses existing language metadata first, then artist/channel/source rules.",
    "- `00後流行曲` means the full 2000-and-after recent-pop pool previously shown as recent 25 years.",
    "- `最近15年流行曲` is a narrower recent subset; explicit years are used when available from the original 2026-05-23 match CSV.",
    "- Later bulk-added recent songs without reliable year metadata also carry `最近15年流行曲`; the CSV includes `eraConfidence` for manual review.",
    `- Full per-song audit: \`${CSV_PATH}\`.`,
    "",
  ];
  fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
}

function countBadViews(rows) {
  return rows.filter((song) => !Number.isFinite(Number(song.viewCount)) || Number(song.viewCount) < MIN_VIEWS).length;
}

function main() {
  const yearMaps = readRecentYearMaps();
  const sourceSpecs = [
    ["hymns", HYMNS_PATH],
    ["pop80s", POP_80S_PATH],
    ["pop90s", POP_90S_PATH],
    ["recentPop25", POP_RECENT_25_PATH],
  ];

  const audits = [];
  const enrichedById = new Map();
  for (const [listId, path] of sourceSpecs) {
    const rows = readJson(path).map((song) => enrichSong(song, listId, yearMaps));
    enrichedById.set(
      listId,
      rows.map((row) => row.song)
    );
    audits.push(...rows.map((row) => row.audit));
  }

  const hymns = enrichedById.get("hymns");
  const pop80s = enrichedById.get("pop80s");
  const pop90s = enrichedById.get("pop90s");
  const recentPop25 = enrichedById.get("recentPop25");
  const pop00s = recentPop25.filter((song) => song.eraTags?.includes("00後流行曲"));
  const popRecent15 = recentPop25.filter((song) => song.eraTags?.includes("最近15年流行曲"));
  const popSources = [pop80s, pop90s, recentPop25];
  const popAll = renumberPopAll(popSources.flat());
  const allSonglists = [...hymns, ...popAll];
  const popCantonese = popAll.filter((song) => song.language === "粵語");
  const popMandarin = popAll.filter((song) => song.language === "國語");
  const allCantonese = allSonglists.filter((song) => song.language === "粵語");
  const allMandarin = allSonglists.filter((song) => song.language === "國語");

  const outputs = [
    [HYMNS_PATH, hymns],
    [POP_80S_PATH, pop80s],
    [POP_90S_PATH, pop90s],
    [POP_RECENT_25_PATH, recentPop25],
    [POP_00S_PATH, pop00s],
    [POP_RECENT_15_PATH, popRecent15],
    [POP_ALL_PATH, popAll],
    [POP_CANTONESE_PATH, popCantonese],
    [POP_MANDARIN_PATH, popMandarin],
    [ALL_SONGLISTS_PATH, allSonglists],
    [ALL_CANTONESE_PATH, allCantonese],
    [ALL_MANDARIN_PATH, allMandarin],
  ];

  for (const [path, rows] of outputs) writeJson(path, rows);

  const summary = [
    ["hymns.json", hymns.length],
    ["songlists/pop-80s.json", pop80s.length],
    ["songlists/pop-90s.json", pop90s.length],
    ["songlists/pop-recent-25.json", recentPop25.length],
    ["songlists/pop-00s.json", pop00s.length],
    ["songlists/pop-recent-15.json", popRecent15.length],
    ["songlists/pop-all.json", popAll.length],
    ["songlists/pop-cantonese.json", popCantonese.length],
    ["songlists/pop-mandarin.json", popMandarin.length],
    ["songlists/all-songlists.json", allSonglists.length],
    ["songlists/all-cantonese.json", allCantonese.length],
    ["songlists/all-mandarin.json", allMandarin.length],
  ];

  writeAudit(audits, summary);

  for (const [path, rows] of outputs) {
    const bad = countBadViews(rows);
    console.log(`${path}: count=${rows.length}, badViews=${bad}`);
    if (bad) process.exitCode = 1;
  }
}

main();
