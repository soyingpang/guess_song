const fs = require("fs");

const RUN_DATE = "2026-06-18";
const MIN_VIEWS = 500000;
const CURRENT_YEAR = 2026;

const HYMNS_PATH = "hymns.json";
const POP_80S_PATH = "songlists/pop-80s.json";
const POP_90S_PATH = "songlists/pop-90s.json";
const POP_RECENT_25_PATH = "songlists/pop-recent-25.json";
const POP_00S_PATH = "songlists/pop-00s.json";
const POP_RECENT_15_PATH = "songlists/pop-recent-15.json";
const POP_ALL_PATH = "songlists/pop-all.json";
const POP_CANTONESE_PATH = "songlists/pop-cantonese.json";
const POP_MANDARIN_PATH = "songlists/pop-mandarin.json";
const POP_UNVERIFIED_PATH = "songlists/pop-era-unverified.json";
const ALL_SONGLISTS_PATH = "songlists/all-songlists.json";
const ALL_CANTONESE_PATH = "songlists/all-cantonese.json";
const ALL_MANDARIN_PATH = "songlists/all-mandarin.json";

const POP_MATCHES_CSV = "docs/POP_YOUTUBE_MATCHES_2026-05-22.csv";
const RECENT_MATCHES_CSV = "docs/POP_RECENT_25_YOUTUBE_MATCHES_2026-05-23.csv";
const TITLE_CORRECTIONS_PATH = "tools/song_answer_title_corrections.json";
const REPORT_PATH = `docs/SONGLIST_ERA_AUDIT_${RUN_DATE}.md`;
const CSV_PATH = `docs/SONGLIST_ERA_AUDIT_${RUN_DATE}.csv`;
const TITLE_REPORT_PATH = `docs/SONGLIST_TITLE_AUDIT_${RUN_DATE}.md`;
const TITLE_CSV_PATH = `docs/SONGLIST_TITLE_AUDIT_${RUN_DATE}.csv`;

const LABEL_HYMN = "詩歌";
const LABEL_CANTONESE = "粵語";
const LABEL_MANDARIN = "國語";
const LABEL_80S = "80年代流行曲";
const LABEL_90S = "90年代流行曲";
const LABEL_00S = "00後流行曲";
const LABEL_RECENT_15 = "最近15年流行曲";
const LABEL_UNVERIFIED = "年代未核實";

const ERA_ORDER = [LABEL_80S, LABEL_90S, LABEL_00S, LABEL_RECENT_15];

const TITLE_VARIANT_PAIRS = [
  ["妳", "你"],
  ["台", "臺"],
  ["为", "為"],
  ["爱", "愛"],
  ["风", "風"],
  ["继", "繼"],
  ["续", "續"],
  ["钟", "鍾"],
  ["听", "聽"],
  ["说", "說"],
  ["开", "開"],
  ["阔", "闊"],
  ["轨", "軌"],
  ["迹", "跡"],
  ["岁", "歲"],
  ["后", "後"],
  ["们", "們"],
  ["会", "會"],
  ["这", "這"],
  ["还", "還"],
  ["绿", "綠"],
  ["岛", "島"],
  ["丽", "麗"],
  ["国", "國"],
  ["语", "語"],
  ["时", "時"],
  ["间", "間"],
  ["样", "樣"],
  ["过", "過"],
  ["欢", "歡"],
  ["来", "來"],
  ["张", "張"],
  ["杰", "傑"],
  ["陈", "陳"],
  ["刘", "劉"],
  ["黄", "黃"],
  ["叶", "葉"],
  ["龙", "龍"],
  ["飞", "飛"],
  ["马", "馬"],
  ["桥", "橋"],
  ["湾", "灣"],
  ["万", "萬"],
  ["发", "發"],
  ["复", "復"],
  ["梦", "夢"],
  ["别", "別"],
  ["无", "無"],
  ["与", "與"],
  ["实", "實"],
  ["浅", "淺"],
  ["关", "關"],
  ["怀", "懷"],
  ["离", "離"],
  ["伤", "傷"],
  ["单", "單"],
  ["尽", "盡"],
  ["声", "聲"],
  ["众", "眾"],
  ["点", "點"],
  ["画", "畫"],
  ["岛", "島"],
  ["质", "質"],
  ["从", "從"],
];

const MANUAL_TITLE_YEARS = new Map(
  [
    ["夜曲", 2005],
    ["七里香", 2004],
    ["青花瓷", 2007],
    ["慢慢喜歡你", 2018],
    ["我們", 2018],
    ["後來的我們", 2016],
    ["灰色軌跡", 1990],
    ["只想一生跟你走", 1993],
    ["海闊天空", 1993],
    ["光輝歲月", 1990],
    ["人質", 2006],
    ["十面埋伏", 2003],
  ].map(([title, year]) => [normalizeTitle(title), year])
);

const CANTONESE_HINTS = [
  "粵語",
  "廣東",
  "cantonese",
  "hong kong",
  "hongkong",
  "tvb",
  "eason chan",
  "leslie cheung",
  "alan tam",
  "anita mui",
  "danny chan",
  "beyond",
  "jacky cheung",
  "andy lau",
  "leon lai",
  "aaron kwok",
  "hacken lee",
  "sammi cheng",
  "joey yung",
  "miriam yeung",
  "dear jane",
  "rubberband",
  "supper moment",
  "c allstar",
  "mirror",
  "mc cheung",
  "hins cheung",
  "janice vidal",
  "gin lee",
  "kay tse",
];

const MANDARIN_HINTS = [
  "國語",
  "普通話",
  "mandarin",
  "taiwan",
  "rock records",
  "滾石",
  "jay chou",
  "jvr",
  "mayday",
  "jj lin",
  "jolin",
  "a-mei",
  "s.h.e",
  "hebe",
  "cyndi wang",
  "rainie yang",
  "fish leong",
  "rene liu",
  "sun yanzi",
  "leehom",
  "david tao",
  "yoga lin",
  "eric chou",
  "sodagreen",
  "a-lin",
  "g.e.m",
];

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function readTitleCorrections() {
  if (!fs.existsSync(TITLE_CORRECTIONS_PATH)) return [];
  return readJson(TITLE_CORRECTIONS_PATH).filter((correction) => correction.videoId && correction.title);
}

const SONG_TITLE_CORRECTIONS = readTitleCorrections();
const SONG_TITLE_CORRECTIONS_BY_VIDEO_ID = new Map(
  SONG_TITLE_CORRECTIONS.map((correction) => [correction.videoId, correction])
);

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

function readCsvObjects(path) {
  if (!fs.existsSync(path)) return [];
  const rows = parseCsv(fs.readFileSync(path, "utf8"));
  const headers = rows.shift();
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])));
}

function normalizeTitle(value) {
  let text = String(value || "").normalize("NFKC").toLowerCase();
  for (const [from, to] of TITLE_VARIANT_PAIRS) {
    text = text.split(from).join(to);
  }
  return text.replace(/\s+/g, "").replace(/[^\p{Letter}\p{Number}]/gu, "");
}

function titleKey(song) {
  return normalizeTitle(song.title);
}

function correctionLanguageLabel(value) {
  if (value === LABEL_CANTONESE || value === "cantonese") return LABEL_CANTONESE;
  if (value === LABEL_MANDARIN || value === "mandarin") return LABEL_MANDARIN;
  return null;
}

function applySongTitleCorrection(song) {
  const correction = SONG_TITLE_CORRECTIONS_BY_VIDEO_ID.get(song.videoId);
  if (!correction) return song;

  const next = { ...song, title: correction.title };
  const language = correctionLanguageLabel(correction.language);
  if (language) next.language = language;

  const year = Number(correction.year);
  if (Number.isFinite(year)) next.year = year;

  return next;
}

function addTitleYear(yearsByTitle, title, year) {
  const key = normalizeTitle(title);
  if (!key || !Number.isFinite(year)) return;
  if (!yearsByTitle.has(key)) yearsByTitle.set(key, new Set());
  yearsByTitle.get(key).add(year);
}

function extractHintYear(song) {
  const match = String(song.hint || "").match(/年代：(19\d{2}|20\d{2})/u);
  return match ? Number(match[1]) : null;
}

function readYearEvidence(popSource) {
  const byVideoId = new Map();
  const yearsByTitle = new Map();

  for (const path of [POP_MATCHES_CSV, RECENT_MATCHES_CSV]) {
    for (const row of readCsvObjects(path)) {
      const year = Number(row.year);
      if (!Number.isFinite(year)) continue;
      if (row.video_id) byVideoId.set(row.video_id, year);
      addTitleYear(yearsByTitle, row.title, year);
    }
  }

  for (const song of popSource) {
    const explicitYear = Number(song.year) || extractHintYear(song);
    if (Number.isFinite(explicitYear)) {
      if (song.videoId) byVideoId.set(song.videoId, explicitYear);
      addTitleYear(yearsByTitle, song.title, explicitYear);
    }
  }

  return { byVideoId, yearsByTitle };
}

function inferYear(song, evidence) {
  const fieldYear = Number(song.year);
  if (Number.isFinite(fieldYear)) return { year: fieldYear, confidence: "field-year" };

  const hintYear = extractHintYear(song);
  if (Number.isFinite(hintYear)) return { year: hintYear, confidence: "hint-year" };

  const videoYear = evidence.byVideoId.get(song.videoId);
  if (Number.isFinite(videoYear)) return { year: videoYear, confidence: "video-id-match" };

  const manualYear = MANUAL_TITLE_YEARS.get(titleKey(song));
  if (Number.isFinite(manualYear)) return { year: manualYear, confidence: "manual-title" };

  const normalizedTitle = titleKey(song);
  const titleYears = evidence.yearsByTitle.get(normalizedTitle);
  if (titleYears && titleYears.size === 1 && normalizedTitle.length >= 3) {
    return { year: [...titleYears][0], confidence: "title-match" };
  }

  if (titleYears && titleYears.size > 1) return { year: null, confidence: "ambiguous-title" };
  return { year: null, confidence: "unknown" };
}

function eraLabelForYear(year) {
  if (year >= 1980 && year <= 1989) return LABEL_80S;
  if (year >= 1990 && year <= 1999) return LABEL_90S;
  if (year >= 2000 && year <= 2010) return LABEL_00S;
  if (year >= 2011 && year <= CURRENT_YEAR) return LABEL_RECENT_15;
  return null;
}

function scorePatterns(text, patterns) {
  const normalized = text.toLowerCase();
  return patterns.reduce((score, pattern) => (normalized.includes(pattern.toLowerCase()) ? score + 1 : score), 0);
}

function inferLanguage(song) {
  const current = String(song.language || "").trim();
  if (current === LABEL_CANTONESE || current === LABEL_MANDARIN) return current;

  const text = `${song.title || ""} ${song.category || ""} ${song.source || ""} ${song.hint || ""}`;
  const cantoScore = scorePatterns(text, CANTONESE_HINTS);
  const mandarinScore = scorePatterns(text, MANDARIN_HINTS);
  if (cantoScore > mandarinScore) return LABEL_CANTONESE;
  if (mandarinScore > cantoScore) return LABEL_MANDARIN;

  if (String(song.category || "").includes("80年代") || String(song.category || "").includes("90年代")) {
    return LABEL_CANTONESE;
  }
  return LABEL_MANDARIN;
}

function viewCount(song) {
  return Number(song.viewCount) || 0;
}

function hasGoodViews(song) {
  return Number.isFinite(viewCount(song)) && viewCount(song) >= MIN_VIEWS;
}

function sourceOrder(song, fallback) {
  const match = String(song.number || "").match(/-(\d+)/);
  return match ? Number(match[1]) : fallback;
}

function evidenceRank(confidence) {
  return {
    "field-year": 5,
    "hint-year": 5,
    "video-id-match": 4,
    "manual-title": 3,
    "title-match": 2,
    "ambiguous-title": 0,
    unknown: 0,
  }[confidence] || 0;
}

function candidateScore(row) {
  return evidenceRank(row.yearConfidence) * 1_000_000_000 + viewCount(row.song);
}

function chooseBetter(current, candidate) {
  if (!current) return candidate;
  if (candidateScore(candidate) > candidateScore(current)) return candidate;
  return current;
}

function normalizeSong(song, options) {
  const next = { ...song };
  next.number = options.number;
  next.category = options.category;
  next.language = options.language;

  if (options.year) next.year = options.year;
  else delete next.year;

  if (options.eraTags?.length) next.eraTags = options.eraTags;
  else delete next.eraTags;

  delete next.eraConfidence;
  delete next.yearConfidence;
  return next;
}

function renumber(rows, prefix) {
  return rows.map((row, index) =>
    normalizeSong(row.song, {
      number: `${prefix}-${String(index + 1).padStart(3, "0")}`,
      category: row.category,
      language: row.language,
      year: row.year,
      eraTags: row.eraTags,
    })
  );
}

function compareRows(left, right) {
  return (
    (left.year || 9999) - (right.year || 9999) ||
    ERA_ORDER.indexOf(left.category) - ERA_ORDER.indexOf(right.category) ||
    sourceOrder(left.song, 9999) - sourceOrder(right.song, 9999) ||
    viewCount(right.song) - viewCount(left.song) ||
    String(left.song.title || "").localeCompare(String(right.song.title || ""), "zh-Hant")
  );
}

function readPopSource() {
  let source;
  if (fs.existsSync(POP_ALL_PATH)) {
    const popAll = readJson(POP_ALL_PATH);
    if (Array.isArray(popAll) && popAll.length > 1000) source = popAll;
  }
  if (!source) source = [POP_80S_PATH, POP_90S_PATH, POP_RECENT_25_PATH].flatMap((path) => readJson(path));
  return source.map(applySongTitleCorrection);
}

function buildSongRows(popSource, evidence) {
  const auditRows = [];
  const strictByEra = new Map(ERA_ORDER.map((label) => [label, new Map()]));
  const unverifiedByKey = new Map();

  popSource.forEach((song, index) => {
    if (!hasGoodViews(song)) return;

    const language = inferLanguage(song);
    const inferred = inferYear(song, evidence);
    const category = inferred.year ? eraLabelForYear(inferred.year) : null;
    const status = category ? "verified-era" : "era-unverified";
    const row = {
      song,
      sourceIndex: index,
      oldNumber: song.number || "",
      oldCategory: song.category || "",
      language,
      year: inferred.year,
      yearConfidence: inferred.confidence,
      category: category || LABEL_UNVERIFIED,
      eraTags: category ? [category] : [],
      status,
    };

    auditRows.push(row);

    if (category) {
      const key = `${titleKey(song)}|${language}|${category}`;
      strictByEra.set(category, strictByEra.get(category).set(key, chooseBetter(strictByEra.get(category).get(key), row)));
      return;
    }

    const key = song.videoId || `${titleKey(song)}|${language}`;
    unverifiedByKey.set(key, chooseBetter(unverifiedByKey.get(key), row));
  });

  const strictRows = Object.fromEntries(
    ERA_ORDER.map((label) => [label, [...strictByEra.get(label).values()].sort(compareRows)])
  );
  const verifiedTitleKeys = new Set(
    ERA_ORDER.flatMap((label) => strictRows[label].map((row) => `${titleKey(row.song)}|${row.language}`))
  );
  const unverifiedRows = [...unverifiedByKey.values()]
    .filter((row) => !verifiedTitleKeys.has(`${titleKey(row.song)}|${row.language}`))
    .sort((left, right) => left.sourceIndex - right.sourceIndex || viewCount(right.song) - viewCount(left.song));

  return { strictRows, unverifiedRows, auditRows };
}

function toCsvValue(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeAudit(rows, summary) {
  const headers = [
    "status",
    "oldNumber",
    "newBucket",
    "title",
    "videoId",
    "viewCount",
    "oldCategory",
    "newCategory",
    "language",
    "year",
    "yearConfidence",
  ];

  const csvRows = rows.map((row) => ({
    status: row.status,
    oldNumber: row.oldNumber,
    newBucket: row.category,
    title: row.song.title || "",
    videoId: row.song.videoId || "",
    viewCount: row.song.viewCount || "",
    oldCategory: row.oldCategory,
    newCategory: row.category,
    language: row.language,
    year: row.year || "",
    yearConfidence: row.yearConfidence,
  }));

  fs.writeFileSync(
    CSV_PATH,
    `${headers.join(",")}\n${csvRows.map((row) => headers.map((header) => toCsvValue(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );

  const lines = [
    "# Songlist Era Audit (2026-06-18)",
    "",
    `All generated lists keep the existing ${MIN_VIEWS.toLocaleString("en-US")} view-count floor.`,
    "",
    "## Summary",
    "",
    "| List | Count |",
    "| --- | ---: |",
    ...summary.map(([label, count]) => `| ${label} | ${count} |`),
    "",
    "## Rules",
    "",
    "- Era lists are strict and non-overlapping.",
    "- 80年代 = 1980-1989, 90年代 = 1990-1999, 00後 = 2000-2010, 最近15年 = 2011-2026.",
    "- Songs without a reliable year are kept in the all-pop pool but moved to 年代未核實 instead of being forced into an era.",
    "- Year evidence comes from the original matched CSVs, explicit song metadata, `年代：YYYY` hints, and a small manual correction map for obvious high-view songs found in the audit.",
    `- Full per-song audit: \`${CSV_PATH}\`.`,
    "",
  ];
  fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
}

function writeTitleCorrectionAudit(corrections) {
  const headers = ["videoId", "oldTitle", "title", "language", "year", "note", "url"];
  const rows = corrections.map((correction) => ({
    videoId: correction.videoId,
    oldTitle: correction.oldTitle || "",
    title: correction.title || "",
    language: correction.language || "",
    year: correction.year || "",
    note: correction.note || "",
    url: `https://www.youtube.com/watch?v=${correction.videoId}`,
  }));

  fs.writeFileSync(
    TITLE_CSV_PATH,
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => toCsvValue(row[header])).join(",")).join("\n")}\n`,
    "utf8"
  );

  const lines = [
    "# Songlist Answer Title Audit (2026-06-18)",
    "",
    `Applied ${corrections.length} high-confidence corrections before regenerating the songlists.`,
    "",
    "These corrections target answers that were singer names, movie/show/context names, partial titles, version labels, or a different song title than the linked YouTube video.",
    "",
    "## Corrected Answers",
    "",
    "| Old answer | Correct answer | Language | Year | YouTube | Note |",
    "| --- | --- | --- | ---: | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${row.oldTitle || ""} | ${row.title} | ${row.language || ""} | ${row.year || ""} | ${row.url} | ${row.note || ""} |`
    ),
    "",
    `Full CSV: \`${TITLE_CSV_PATH}\`.`,
    "",
  ];

  fs.writeFileSync(TITLE_REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
}

function countBadViews(rows) {
  return rows.filter((song) => !Number.isFinite(Number(song.viewCount)) || Number(song.viewCount) < MIN_VIEWS).length;
}

function main() {
  const hymns = readJson(HYMNS_PATH).filter(hasGoodViews);
  const popSource = readPopSource();
  const evidence = readYearEvidence(popSource);
  const { strictRows, unverifiedRows, auditRows } = buildSongRows(popSource, evidence);

  const pop80s = renumber(strictRows[LABEL_80S], "POP80");
  const pop90s = renumber(strictRows[LABEL_90S], "POP90");
  const pop00s = renumber(strictRows[LABEL_00S], "POP00");
  const popRecent15 = renumber(strictRows[LABEL_RECENT_15], "POP15");
  const popRecent25 = renumber([...strictRows[LABEL_00S], ...strictRows[LABEL_RECENT_15]].sort(compareRows), "POP25");
  const popUnverified = renumber(unverifiedRows, "POPU");

  const popAllRows = [
    ...strictRows[LABEL_80S],
    ...strictRows[LABEL_90S],
    ...strictRows[LABEL_00S],
    ...strictRows[LABEL_RECENT_15],
    ...unverifiedRows,
  ];
  const popAll = renumber(popAllRows, "POP");
  const allSonglists = [...hymns, ...popAll];
  const popCantonese = popAll.filter((song) => song.language === LABEL_CANTONESE);
  const popMandarin = popAll.filter((song) => song.language === LABEL_MANDARIN);
  const allCantonese = allSonglists.filter((song) => song.language === LABEL_CANTONESE);
  const allMandarin = allSonglists.filter((song) => song.language === LABEL_MANDARIN);

  const outputs = [
    [HYMNS_PATH, hymns],
    [POP_80S_PATH, pop80s],
    [POP_90S_PATH, pop90s],
    [POP_RECENT_25_PATH, popRecent25],
    [POP_00S_PATH, pop00s],
    [POP_RECENT_15_PATH, popRecent15],
    [POP_UNVERIFIED_PATH, popUnverified],
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
    ["songlists/pop-00s.json", pop00s.length],
    ["songlists/pop-recent-15.json", popRecent15.length],
    ["songlists/pop-recent-25.json", popRecent25.length],
    ["songlists/pop-era-unverified.json", popUnverified.length],
    ["songlists/pop-all.json", popAll.length],
    ["songlists/pop-cantonese.json", popCantonese.length],
    ["songlists/pop-mandarin.json", popMandarin.length],
    ["songlists/all-songlists.json", allSonglists.length],
    ["songlists/all-cantonese.json", allCantonese.length],
    ["songlists/all-mandarin.json", allMandarin.length],
  ];

  writeAudit(auditRows, summary);
  writeTitleCorrectionAudit(SONG_TITLE_CORRECTIONS);

  for (const [path, rows] of outputs) {
    const bad = countBadViews(rows);
    console.log(`${path}: count=${rows.length}, badViews=${bad}`);
    if (bad) process.exitCode = 1;
  }
  console.log(`${REPORT_PATH}: written`);
  console.log(`${CSV_PATH}: written`);
  console.log(`${TITLE_REPORT_PATH}: written`);
  console.log(`${TITLE_CSV_PATH}: written`);
}

main();
