const fs = require("fs");

const RUN_DATE = process.env.BULK_SONGLIST_DATE || "2026-05-26";
const TARGET_PER_LIST = Number(process.env.BULK_TARGET_PER_LIST || 500);
const MIN_VIEWS = Number(process.env.MIN_YOUTUBE_VIEWS || 3000);
const MIN_ADDED_VIEWS = Number(process.env.MIN_ADDED_YOUTUBE_VIEWS || MIN_VIEWS);
const SEARCH_LIMIT_PER_QUERY = Number(process.env.BULK_SEARCH_LIMIT || 24);
const MAX_FETCHES_PER_LIST = Number(process.env.BULK_MAX_FETCHES_PER_LIST || 1800);
const QUERY_DELAY_MS = Number(process.env.BULK_QUERY_DELAY_MS || 120);
const PLAYER_DELAY_MS = Number(process.env.BULK_PLAYER_DELAY_MS || 40);
const GOLDEN_ONLY = process.env.BULK_GOLDEN_ONLY === "1";
const DRY_RUN = process.env.DRY_RUN === "1";

const HYMNS_PATH = "hymns.json";
const POP_ALL_PATH = "songlists/pop-all.json";
const ALL_SONGLISTS_PATH = "songlists/all-songlists.json";
const SEARCH_CACHE_PATH = `.cache/bulk-pop-searches-${RUN_DATE}.json`;
const VIDEO_CACHE_PATH = `.cache/youtubei-video-metadata-${RUN_DATE}.json`;
const REPORT_PATH = `docs/BULK_POP_ADDITIONS_${RUN_DATE}.md`;
const CSV_PATH = `docs/BULK_POP_ADDITIONS_${RUN_DATE}.csv`;

const TAIWAN_80S_GOLDEN_QUERIES = [
  "鄧麗君 我只在乎你 官方",
  "鄧麗君 月亮代表我的心 官方",
  "鄧麗君 甜蜜蜜 官方",
  "鄧麗君 小城故事 官方",
  "鳳飛飛 追夢人 官方",
  "鳳飛飛 掌聲響起 官方",
  "鳳飛飛 流水年華 官方",
  "蔡琴 你的眼神 官方",
  "蔡琴 被遺忘的時光 官方",
  "蔡琴 恰似你的溫柔 官方",
  "蘇芮 酒干倘賣無 官方",
  "蘇芮 一樣的月光 官方",
  "蘇芮 是否 官方",
  "羅大佑 童年 官方",
  "羅大佑 鹿港小鎮 官方",
  "羅大佑 光陰的故事 官方",
  "李宗盛 凡人歌 官方",
  "李宗盛 鬼迷心竅 官方",
  "李宗盛 漂洋過海來看你 官方",
  "齊秦 大約在冬季 官方",
  "齊秦 外面的世界 官方",
  "齊秦 狼 官方",
  "齊豫 橄欖樹 官方",
  "齊豫 歡顏 官方",
  "潘越雲 天天天藍 官方",
  "潘越雲 桂花巷 官方",
  "陳淑樺 夢醒時分 官方",
  "陳淑樺 滾滾紅塵 官方",
  "張清芳 激情過後 官方",
  "姜育恆 驛動的心 官方",
  "王芷蕾 台北的天空 官方",
  "黃鶯鶯 哭砂 官方",
  "童安格 其實你不懂我的心 官方",
  "費玉清 一剪梅 官方",
  "費玉清 夢駝鈴 官方",
  "費翔 冬天里的一把火 官方",
  "高勝美 千年等一回 官方",
  "李建復 龍的傳人 官方",
  "費玉清 晚安曲 官方",
  "林慧萍 走在陽光裡 官方",
  "林慧萍 倩影 官方",
  "林慧萍 往昔 官方",
  "葉璦菱 因為所以 官方",
  "王夢麟 阿美阿美 官方",
  "文章 三百六十五里路 官方",
  "陳淑樺 問 官方",
  "陳淑樺 聰明糊塗心 官方",
  "張清芳 大雨的夜裡 官方",
  "姜育恆 跟往事乾杯 官方",
  "趙傳 我很醜可是我很溫柔 官方",
  "趙傳 我終於失去了你 官方",
];

const TAIWAN_90S_GOLDEN_QUERIES = [
  "張雨生 大海 官方",
  "張雨生 我的未來不是夢 官方",
  "張雨生 口是心非 官方",
  "張惠妹 聽海 官方",
  "張惠妹 剪愛 官方",
  "張惠妹 原來你什麼都不要 官方",
  "伍佰 浪人情歌 官方",
  "伍佰 挪威的森林 官方",
  "伍佰 愛你一萬年 官方",
  "張信哲 愛如潮水 官方",
  "張信哲 過火 官方",
  "張信哲 太想愛你 官方",
  "任賢齊 心太軟 官方",
  "任賢齊 傷心太平洋 官方",
  "任賢齊 對面的女孩看過來 官方",
  "周華健 朋友 官方",
  "周華健 花心 官方",
  "張宇 月亮惹的禍 官方",
  "張宇 用心良苦 官方",
  "張宇 曲終人散 官方",
  "林志炫 單身情歌 官方",
  "優客李林 認錯 官方",
  "動力火車 當 官方",
  "動力火車 無情的情書 官方",
  "李玟 Di Da Di 官方",
  "李玟 月光愛人 官方",
  "辛曉琪 領悟 官方",
  "萬芳 新不了情 官方",
  "蘇慧倫 檸檬樹 官方",
  "孟庭葦 你看你看月亮的臉 官方",
  "趙詠華 最浪漫的事 官方",
  "李翊君 雨蝶 官方",
  "高勝美 千年等一回 官方",
  "張震嶽 愛我別走 官方",
  "張震嶽 思念是一種病 官方",
  "林志炫 蒙娜麗莎的眼淚 官方",
  "林志炫 沒離開過 官方",
  "孟庭葦 冬季到台北來看雨 官方",
  "孟庭葦 風中有朵雨做的雲 官方",
  "趙詠華 求婚 官方",
  "蘇慧倫 鴨子 官方",
  "黃舒駿 戀愛症候群 官方",
  "張洪量 廣島之戀 官方",
  "高明駿 我悄悄蒙上你的眼睛 官方",
  "李翊君 萍聚 官方",
  "李翊君 諾言 官方",
  "范曉萱 眼淚 官方",
  "范曉萱 雪人 官方",
];

const RECENT_TAIWAN_ZHOU_GOLDEN_QUERIES = [
  "周杰倫 晴天 官方 MV",
  "周杰倫 稻香 官方 MV",
  "周杰倫 青花瓷 官方 MV",
  "周杰倫 七里香 官方 MV",
  "周杰倫 愛在西元前 官方 MV",
  "五月天 知足 官方 MV",
  "五月天 倔強 官方 MV",
  "五月天 溫柔 官方 MV",
  "五月天 突然好想你 官方 MV",
  "五月天 乾杯 官方 MV",
  "蔡依林 日不落 官方 MV",
  "蔡依林 倒帶 官方 MV",
  "蔡依林 說愛你 官方 MV",
  "蔡依林 舞孃 官方 MV",
  "張惠妹 如果你也聽說 官方 MV",
  "張惠妹 連名帶姓 官方 MV",
  "S.H.E 戀人未滿 官方 MV",
  "S.H.E Super Star 官方 MV",
  "S.H.E 你曾是少年 官方 MV",
  "田馥甄 小幸運 官方 MV",
  "田馥甄 寂寞寂寞就好 官方 MV",
  "王心凌 愛你 官方 MV",
  "王心凌 第一次愛的人 官方 MV",
  "王心凌 睫毛彎彎 官方 MV",
  "楊丞琳 雨愛 官方 MV",
  "楊丞琳 曖昧 官方 MV",
  "梁靜茹 勇氣 官方 MV",
  "梁靜茹 分手快樂 官方 MV",
  "梁靜茹 可惜不是你 官方 MV",
  "劉若英 後來 官方 MV",
  "劉若英 很愛很愛你 官方 MV",
  "孫燕姿 遇見 官方 MV",
  "孫燕姿 天黑黑 官方 MV",
  "王力宏 唯一 官方 MV",
  "王力宏 大城小愛 官方 MV",
  "陶喆 愛很簡單 官方 MV",
  "陶喆 就是愛你 官方 MV",
  "林宥嘉 兜圈 官方 MV",
  "韋禮安 如果可以 官方 MV",
  "告五人 愛人錯過 官方 MV",
  "告五人 披星戴月的想你 官方 MV",
  "茄子蛋 浪子回頭 官方 MV",
  "八三夭 想見你想見你想見你 官方 MV",
  "蕭敬騰 王妃 官方 MV",
  "周深 大魚 官方 MV",
  "周深 光亮 官方 MV",
  "周深 若夢 官方 MV",
  "周深 起風了 官方 MV",
  "周深 化身孤島的鯨 官方 MV",
  "周深 達拉崩吧 官方 MV",
  "周深 花開忘憂 官方 MV",
  "周深 小美滿 官方 MV",
  "周深 望 官方 MV",
  "周深 花西子 官方 MV",
  "周深 生活總該迎著光亮 官方 MV",
  "周深 繁花依舊 官方 MV",
  "周深 如願 官方 MV",
  "周深 只字不提 官方 MV",
];

const LISTS = [
  {
    id: "pop80s",
    path: "songlists/pop-80s.json",
    category: "80年代流行曲",
    prefix: "POP80",
    eraTerms: ["80年代", "1980年代", "八十年代"],
    genericQueries: [
      "80年代 香港 粵語 流行曲 官方 MV",
      "80年代 粵語 金曲 歌詞",
      "香港 80年代 經典金曲 MV",
      "80年代 台灣 國語 流行曲 官方 MV",
      "80年代 台灣 國語 金曲 歌詞",
      "1980年代 台灣 經典國語歌曲",
      "台灣 校園民歌 80年代 官方",
      "1980s Cantopop official mv",
    ],
    goldenQueries: TAIWAN_80S_GOLDEN_QUERIES,
    artists: [
      "張國榮",
      "譚詠麟",
      "梅艷芳",
      "陳百強",
      "林子祥",
      "徐小鳳",
      "關正傑",
      "甄妮",
      "羅文",
      "許冠傑",
      "葉蒨文",
      "陳慧嫻",
      "蔡國權",
      "呂方",
      "Raidas",
      "達明一派",
      "Beyond",
      "太極樂隊",
      "草蜢",
      "鍾鎮濤",
      "夏韶聲",
      "盧冠廷",
      "林憶蓮",
      "張學友",
      "劉德華",
      "杜德偉",
      "李克勤",
      "溫兆倫",
      "蔣志光",
      "彭健新",
      "區瑞強",
      "鄺美雲",
      "陳美齡",
      "小島樂隊",
      "鄧麗君",
      "鳳飛飛",
      "蔡琴",
      "蘇芮",
      "羅大佑",
      "李宗盛",
      "齊秦",
      "齊豫",
      "黃鶯鶯",
      "童安格",
      "潘越雲",
      "姜育恆",
      "葉歡",
      "張清芳",
      "陳淑樺",
      "王芷蕾",
      "娃娃",
      "趙傳",
      "小虎隊",
      "王傑",
      "費玉清",
      "費翔",
      "高勝美",
    ],
  },
  {
    id: "pop90s",
    path: "songlists/pop-90s.json",
    category: "90年代流行曲",
    prefix: "POP90",
    eraTerms: ["90年代", "1990年代", "九十年代"],
    genericQueries: [
      "90年代 香港 粵語 流行曲 官方 MV",
      "90年代 粵語 金曲 歌詞",
      "香港 90年代 經典金曲 MV",
      "90年代 台灣 國語 流行曲 官方 MV",
      "90年代 台灣 國語 金曲 歌詞",
      "1990年代 台灣 經典國語歌曲",
      "台灣 90年代 華語金曲 官方 MV",
      "1990s Cantopop official mv",
    ],
    goldenQueries: TAIWAN_90S_GOLDEN_QUERIES,
    artists: [
      "張學友",
      "劉德華",
      "黎明",
      "郭富城",
      "王菲",
      "Beyond",
      "李克勤",
      "鄭秀文",
      "陳慧琳",
      "許志安",
      "古巨基",
      "周華健",
      "林憶蓮",
      "彭羚",
      "王傑",
      "關淑怡",
      "湯寶如",
      "蘇永康",
      "草蜢",
      "軟硬天師",
      "黃耀明",
      "達明一派",
      "梁漢文",
      "張信哲",
      "任賢齊",
      "伍佰",
      "莫文蔚",
      "辛曉琪",
      "梁詠琪",
      "楊千嬅",
      "陳奕迅",
      "謝霆鋒",
      "鄭伊健",
      "陳曉東",
      "李蕙敏",
      "趙學而",
      "彭家麗",
      "吳國敬",
      "張雨生",
      "庾澄慶",
      "張宇",
      "趙傳",
      "張清芳",
      "陳淑樺",
      "萬芳",
      "蘇慧倫",
      "鄭智化",
      "黃品源",
      "優客李林",
      "林志穎",
      "李玟",
      "張惠妹",
      "動力火車",
      "張震嶽",
      "五月天",
      "陶晶瑩",
      "游鴻明",
      "林志炫",
      "孟庭葦",
      "趙詠華",
      "李翊君",
      "費玉清",
      "高勝美",
    ],
  },
  {
    id: "recentPop25",
    path: "songlists/pop-recent-25.json",
    category: "近25年熱門新歌",
    prefix: "POP25",
    eraTerms: ["2000年後", "近年", "新歌", "熱門"],
    genericQueries: [
      "近25年 香港 粵語 熱門 新歌 Official MV",
      "2000年代 粵語 流行曲 Official MV",
      "2010年代 粵語 流行曲 Official MV",
      "2020年代 粵語 流行曲 Official MV",
      "華語流行 官方 MV 熱門",
      "近25年 台灣 華語 熱門 新歌 Official MV",
      "2000年代 台灣 華語 流行曲 Official MV",
      "2010年代 台灣 華語 流行曲 Official MV",
      "2020年代 台灣 華語 流行曲 Official MV",
      "台灣 華語 金曲 官方 MV 熱門",
    ],
    goldenQueries: RECENT_TAIWAN_ZHOU_GOLDEN_QUERIES,
    artists: [
      "陳奕迅",
      "容祖兒",
      "楊千嬅",
      "謝安琪",
      "張敬軒",
      "林家謙",
      "Dear Jane",
      "RubberBand",
      "Supper Moment",
      "C AllStar",
      "MIRROR",
      "姜濤",
      "Anson Lo",
      "Ian 陳卓賢",
      "Jer 柳應廷",
      "Edan 呂爵安",
      "MC 張天賦",
      "AGA 江海迦",
      "Gin Lee 李幸倪",
      "衛蘭",
      "JW 王灝兒",
      "陳柏宇",
      "周柏豪",
      "方大同",
      "側田",
      "薛凱琪",
      "張繼聰",
      "洪嘉豪",
      "Jace 陳凱詠",
      "鄭欣宜",
      "Serrini",
      "KOLOR",
      "ToNick",
      "泳兒",
      "吳林峰",
      "陳蕾",
      "馮允謙",
      "鄧小巧",
      "林奕匡",
      "小塵埃",
      "岑寧兒",
      "雲浩影",
      "張蔓姿",
      "張蔓莎",
      "Gareth.T",
      "Tyson Yoshi",
      "炎明熹",
      "姚焯菲",
      "COLLAR",
      "新青年理髮廳",
      "My Little Airport",
      "鄧紫棋",
      "周杰倫",
      "五月天",
      "林俊傑",
      "孫燕姿",
      "蔡依林",
      "S.H.E",
      "F.I.R.",
      "張惠妹",
      "田馥甄",
      "告五人",
      "八三夭",
      "茄子蛋",
      "韋禮安",
      "李榮浩",
      "薛之謙",
      "A-Lin",
      "周興哲",
      "動力火車",
      "盧廣仲",
      "徐佳瑩",
      "吳青峰",
      "蘇打綠",
      "家家",
      "劉若英",
      "梁靜茹",
      "王力宏",
      "陶喆",
      "王心凌",
      "蕭亞軒",
      "羅志祥",
      "潘瑋柏",
      "蕭敬騰",
      "林宥嘉",
      "楊丞琳",
      "范瑋琪",
      "郭靜",
      "陳綺貞",
      "蔡健雅",
      "魚丁糸",
      "滅火器",
      "麋先生",
      "宇宙人",
      "玖壹壹",
      "理想混蛋",
      "持修",
      "ØZI",
      "高爾宣",
      "Karencici",
      "TRASH",
      "周深",
      "周琛",
    ],
  },
];

const BLOCKED_KEYWORDS = [
  "500首",
  "一人一首",
  "大全",
  "合集",
  "合輯",
  "精選",
  "精华",
  "精華",
  "串燒",
  "串烧",
  "playlist",
  "mix",
  "nonstop",
  "演唱會",
  "演唱会",
  "concert",
  "live full",
  "full album",
  "全專輯",
  "完整專輯",
  "專輯",
  "album",
  "karaoke",
  "卡拉",
  "ktv",
  "伴奏",
  "instrumental",
  "無損",
  "无损",
  "flac",
  "動態歌詞",
  "动态歌词",
  "cover",
  "翻唱",
  "reaction",
  "試聽",
  "teaser",
  "trailer",
  "預告",
  "訪問",
  "專訪",
  "新聞",
  "shorts",
  "#shorts",
  "流行經典",
  "經典老歌",
  "怀旧歌曲",
  "懷舊歌曲",
  "一口氣",
  "一首比一首",
  "那些年聽的",
  "唱好歌",
  "年版",
  "版本",
  "高音質",
  "高画质",
  "高畫質",
  "氛圍版",
  "街頭表演",
  "威尼斯人",
  "百利酒廊",
  "金曲獎",
  "跟我去返工",
  "蝦餅TV",
  "沒幾個藝人",
  "被粉紅",
  "翻牆必聽",
  "十大禁歌",
  "墻外音",
  "精彩",
  "殺人事件",
  "更多影片",
  "更多視頻",
  "短劇",
  "動畫",
  "電影解說",
  "電台",
  "廣播劇",
  "metronome",
  "countdown",
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
    .replace(/[梦]/g, "夢")
    .replace(/[时]/g, "時")
    .replace(/[听]/g, "聽")
    .replace(/[见]/g, "見")
    .replace(/[爱]/g, "愛")
    .replace(/[过]/g, "過")
    .replace(/[风]/g, "風")
    .replace(/[龙]/g, "龍")
    .replace(/[传]/g, "傳")
    .replace(/[从]/g, "從")
    .replace(/[还]/g, "還")
    .replace(/[对]/g, "對")
    .replace(/[开]/g, "開")
    .replace(/[里]/g, "裡")
    .replace(/[为]/g, "為")
    .replace(/[伤]/g, "傷")
    .replace(/[泪]/g, "淚")
    .replace(/[欢]/g, "歡")
    .replace(/[翦]/g, "剪")
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
  const parts = String(value || "")
    .split(":")
    .map((part) => Number(part));
  if (!parts.length || parts.some((part) => !Number.isFinite(part))) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function parseViewText(value) {
  const text = String(value || "");
  const match = text.match(/([\d,.]+)\s*萬/);
  if (match) return Math.round(Number(match[1].replace(/,/g, "")) * 10000);
  const digits = text.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function titleHasBlockedKeyword(value) {
  const lower = String(value || "").toLowerCase();
  return BLOCKED_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
}

function allArtistKeys() {
  if (!allArtistKeys.cache) {
    const aliases = [
      "叶倩文",
      "谭咏麟",
      "陈慧娴",
      "张学友",
      "刘德华",
      "周杰伦",
      "五月天",
      "王菲",
      "陈奕迅",
      "張宇",
      "張雨生",
      "张雨生",
      "张宇",
      "邓丽君",
      "凤飞飞",
      "罗大佑",
      "李宗盛",
      "齐秦",
      "齐豫",
      "庾澄庆",
      "任贤齐",
      "张信哲",
      "张惠妹",
      "蔡依林",
      "孙燕姿",
      "梁静茹",
      "王心凌",
      "罗志祥",
      "潘玮柏",
      "萧亚轩",
      "萧敬腾",
      "泰国壮壮",
      "草屯囝仔",
      "星野源",
      "蕭煌奇",
      "萧煌奇",
      "林峯",
      "林峰",
      "美秀集團",
      "美秀集团",
      "派偉俊",
      "派伟俊",
    ];
    allArtistKeys.cache = new Set([...LISTS.flatMap((list) => list.artists), ...aliases].map((artist) => normalize(artist)));
  }
  return allArtistKeys.cache;
}

function isArtistTitle(title) {
  return allArtistKeys().has(normalize(title));
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function markdownCell(value) {
  return String(value ?? "").replace(/\r?\n/g, " ").replace(/\|/g, "\\|");
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
    searchViews: parseViewText(textFrom(renderer.viewCountText)),
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
  fs.writeFileSync(SEARCH_CACHE_PATH, `${JSON.stringify(searchCache, null, 2)}\n`, "utf8");
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
  fs.writeFileSync(VIDEO_CACHE_PATH, `${JSON.stringify(videoCache, null, 2)}\n`, "utf8");
  await sleep(PLAYER_DELAY_MS);
  return metadata;
}

function removeArtistPrefix(title, artists) {
  let next = title.trim();
  for (const artist of artists) {
    const escaped = artist.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`^${escaped}\\s*[-－:：｜|]*\\s*`, "i"), "").trim();
    next = next.replace(new RegExp(`\\s*[-－:：｜|]*\\s*${escaped}$`, "i"), "").trim();
    const pos = next.indexOf(artist);
    if (pos >= 0 && pos <= 16) {
      next = next.slice(pos + artist.length).replace(/^[\s\-–—－:：｜|]+/, "").trim();
    }
  }
  return next;
}

function bracketTitle(rawTitle) {
  const text = String(rawTitle || "");
  const book = text.match(/《([^》]{1,40})》/);
  if (book?.[1]) return book[1].trim();
  const square = text.match(/【([^】]{1,50})】/);
  if (square?.[1] && !titleHasBlockedKeyword(square[1])) {
    const value = square[1].replace(/\s*\/\s*[A-Za-z][^/]+$/, "").trim();
    if (hasChinese(value)) return value;
  }
  const asciiSquare = text.match(/\[([^\]]{1,50})\]/);
  if (asciiSquare?.[1] && !titleHasBlockedKeyword(asciiSquare[1])) {
    const value = asciiSquare[1].replace(/\s*\/\s*[A-Za-z][^/]+$/, "").trim();
    if (hasChinese(value)) return value;
  }
  const quote = text.match(/[「『]([^」』]{1,40})[」』]/);
  if (quote?.[1]) return quote[1].trim();
  const asciiQuote = text.match(/"([^"]{1,40})"/);
  if (asciiQuote?.[1] && hasChinese(asciiQuote[1])) return asciiQuote[1].trim();
  return "";
}

function cleanTitle(rawTitle, artists) {
  let title = bracketTitle(rawTitle) || String(rawTitle || "");
  title = title
    .replace(/\[[^\]]*(official|mv|lyrics?|audio|hd|4k|歌詞|字幕)[^\]]*\]/gi, "")
    .replace(/\([^)]*(official|mv|lyrics?|audio|hd|4k|歌詞|字幕)[^)]*\)/gi, "")
    .replace(/（[^）]*(官方|歌詞|字幕|高清|完整版)[^）]*）/gi, "")
    .replace(/官方.*$/i, "")
    .replace(/official.*$/i, "")
    .replace(/music video.*$/i, "")
    .replace(/lyric.*$/i, "")
    .replace(/lyrics.*$/i, "")
    .replace(/mv.*$/i, "")
    .replace(/m\/v.*$/i, "")
    .replace(/無損音樂\s*flac.*$/i, "")
    .replace(/无损音乐\s*flac.*$/i, "")
    .replace(/動態歌詞.*$/i, "")
    .replace(/动态歌词.*$/i, "")
    .replace(/\s+歌詞.*$/i, "")
    .replace(/\s+歌词.*$/i, "")
    .replace(/\s+live.*$/i, "")
    .replace(/\s*[-–—－]\s*華納.*$/i, "")
    .replace(/\s*[-–—－]\s*华纳.*$/i, "")
    .replace(/^\(?nine one one\)?\s*[-–—－]\s*/i, "")
    .replace(/^lala\s*/i, "")
    .replace(/^(coco\s+lee|jace\s+chan|mayday|jay\s+chou|will\s+pan|anita\s+mui|leslie\s+cheung|ekin\s+cheng|osn)\s*[-–—－]?\s*/i, "")
    .replace(/高清.*$/i, "")
    .replace(/完整版.*$/i, "")
    .replace(/主題曲.*$/i, "")
    .replace(/插曲.*$/i, "")
    .replace(/^#+\s*/g, "")
    .replace(/^\d{4}\s*版\s*/g, "")
    .replace(/^\d{1,2}\s+(?=\p{Script=Han})/u, "")
    .replace(/^[：:]\s*/g, "")
    .replace(/^[\s\-–—－]+/g, "")
    .replace(/[【】《》「」『』〈〉]/g, "")
    .trim();

  title = removeArtistPrefix(title, artists);

  title = title.replace(/^([A-Za-z0-9 .&'()]{2,24})\s*[-–—－]\s*(.+)$/u, (match, prefix, rest) => {
    return hasChinese(rest) ? rest.trim() : match;
  });

  const spaced = title.split(/\s+/).filter(Boolean);
  if (spaced.length >= 2 && hasChinese(spaced[0]) && spaced[0].length <= 6 && hasChinese(spaced[1])) {
    title = spaced.slice(1).join(" ");
  }

  if (/\s[-–—－]\s/.test(title)) {
    const parts = title.split(/\s[-–—－]\s/).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const firstLooksLikeArtist = artists.some((artist) => normalize(parts[0]).includes(normalize(artist)));
      if (firstLooksLikeArtist || (!hasChinese(parts[0]) && hasChinese(parts[1]))) {
        title = parts[1];
      } else {
        title = parts[0];
      }
    }
  }

  title = title
    .split(/\s*[|｜]\s*/)[0]
    .split(/\s*[／/]\s*/)[0]
    .replace(/\s+feat\..*$/i, "")
    .replace(/\s+ft\..*$/i, "")
    .replace(/\s*\([^)]*\)\s*$/g, "")
    .replace(/\s*（[^）]*）\s*$/g, "")
    .replace(/\([^)]*$/g, "")
    .replace(/（[^）]*$/g, "")
    .replace(/[()（）]+$/g, "")
    .replace(/^([\p{Script=Han}\d·．\s]+)\s+[A-Za-z].*$/u, "$1")
    .replace(/^([\p{Script=Han}\d·．\s]+)[A-Za-z].*$/u, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();

  title = removeArtistPrefix(title, artists);
  return title.trim();
}

function rejectReason(video, title, artists) {
  const combined = `${video.rawTitle || ""} ${video.youtubeTitle || ""} ${video.channel || ""}`;
  const duration = parseDuration(video.length) || Number(video.lengthSeconds || 0);
  if (titleHasBlockedKeyword(combined)) return "blocked-keyword";
  if (duration && (duration < 110 || duration > 600)) return "bad-duration";
  if (!title || title.length < 2) return "empty-title";
  if (!hasChinese(title)) return "non-chinese-title";
  if (/歌詞|歌词|無損|无损|flac|動態|动态|official|music video|mv|live/i.test(title)) return "bad-title-token";
  if (title.length > 24) return "title-too-long";
  if (/^[\-–—－(（]|[()（）]/.test(title)) return "bad-title-punctuation";
  if (/[#：:\[\]~&@_]/.test(title)) return "bad-title-punctuation";
  if (/(^|\s)(ep|EP)\.?\d+/.test(title)) return "bad-title-token";
  if (/\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(title)) return "bad-title-token";
  if (/年版|版本|劇場版|精彩|唱好歌|流行經典|那些年聽的|更多影片|更多視頻|殺人事件|街頭表演|高音質|高畫質|高画质|高品質|高品质|氛圍版|金曲獎|跟我去返工|威尼斯人|百利酒廊|特輯|超級好聽|超级好听|百聽不厭|百听不厭|百听不厌|一首.*民歌|純享|纯享|官方版|正式版|版權|版权/.test(title)) return "bad-title-token";
  if (/^(國語|国语|粵語|粤语)?版$/.test(title) || (title.length <= 8 && /版$/.test(title))) return "bad-title-token";
  if (/[+＋、，,]/.test(title)) return "possible-medley";
  if (/^\d+$/.test(title)) return "numeric-title";
  if (artists.some((artist) => normalize(title) === normalize(artist)) || isArtistTitle(title)) return "artist-as-title";
  return "";
}

function existingRejectReason(song) {
  const title = String(song.title || "").trim();
  const combined = `${song.title || ""} ${song.source || ""} ${song.hint || ""}`;
  if (!Number.isFinite(song.viewCount) || song.viewCount < MIN_VIEWS) return "views-below-threshold";
  if (!title || title.length < 2) return "empty-title";
  if (titleHasBlockedKeyword(combined)) return "blocked-keyword";
  if (/歌詞|歌词|無損|无损|flac|動態|动态|official|music video|mv|live/i.test(title)) return "bad-title-token";
  if (/^[\-–—－(（]|[()（）]/.test(title)) return "bad-title-punctuation";
  if (/[#：:\[\]~&@_]/.test(title)) return "bad-title-punctuation";
  if (/(^|\s)(ep|EP)\.?\d+/.test(title)) return "bad-title-token";
  if (/\d{4}[./-]\d{1,2}[./-]\d{1,2}/.test(title)) return "bad-title-token";
  if (/年版|版本|劇場版|精彩|唱好歌|流行經典|那些年聽的|更多影片|更多視頻|殺人事件|特務肥姜|最後的\s*8|街頭表演|高音質|高畫質|高画质|高品質|高品质|氛圍版|金曲獎|跟我去返工|威尼斯人|百利酒廊|特輯|超級好聽|超级好听|百聽不厭|百听不厭|百听不厌|一首.*民歌|純享|纯享|官方版|正式版|版權|版权/.test(title)) return "bad-title-token";
  if (/^(國語|国语|粵語|粤语)?版$/.test(title) || (title.length <= 8 && /版$/.test(title))) return "bad-title-token";
  if (/[+＋、，,]/.test(title)) return "possible-medley";
  if (/^\d+$/.test(title)) return "numeric-title";
  if (isArtistTitle(title)) return "artist-as-title";
  if (title.length > 24) return "title-too-long";
  return "";
}

function renumberRows(rows, prefix) {
  return rows.map((song, index) => ({
    ...song,
    number: `${prefix}-${String(index + 1).padStart(3, "0")}`,
  }));
}

function buildQueries(list) {
  if (GOLDEN_ONLY) return [...new Set(list.goldenQueries || [])];
  const queries = [...list.genericQueries, ...(list.goldenQueries || [])];
  for (const artist of list.artists) {
    queries.push(`${artist} 官方 MV`);
    queries.push(`${artist} Official MV`);
    queries.push(`${artist} 歌詞`);
    queries.push(`${artist} 經典金曲`);
    for (const era of list.eraTerms.slice(0, 2)) {
      queries.push(`${artist} ${era} 金曲`);
    }
  }
  return [...new Set(queries)];
}

function goldenQueryTitle(query, list) {
  let value = String(query || "")
    .replace(/\bOfficial\b/gi, "")
    .replace(/\bMV\b/gi, "")
    .replace(/官方|歌詞|歌词|金曲/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const artists = [...list.artists].sort((a, b) => b.length - a.length);
  let removedArtist = false;
  for (const artist of artists) {
    if (value.startsWith(artist)) {
      value = value.slice(artist.length).trim();
      removedArtist = true;
      break;
    }
  }
  if (!removedArtist) {
    const parts = value.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) value = parts.slice(1).join(" ");
  }
  return value.trim();
}

function matchesGoldenQuery(query, list, title, video) {
  if (!GOLDEN_ONLY) return true;
  const target = goldenQueryTitle(query, list);
  if (!target) return true;
  const targetKey = normalize(target);
  const titleKey = normalize(title);
  const rawKey = normalize(`${video.rawTitle || ""} ${video.youtubeTitle || ""}`);
  if (!targetKey || !titleKey || titleKey.length < 3) return false;
  return titleKey.includes(targetKey) || targetKey.includes(titleKey) || rawKey.includes(targetKey);
}

function candidateScore(candidate) {
  const views = Math.log10(Math.max(candidate.viewCount || candidate.searchViews || 1, 1)) * 25;
  const text = `${candidate.youtubeTitle || candidate.rawTitle} ${candidate.channel}`.toLowerCase();
  let score = views;
  if (/official|官方|mv|music video|lyric|歌詞|topic/i.test(text)) score += 12;
  if (/live|concert|演唱會|cover|karaoke|ktv|伴奏/i.test(text)) score -= 30;
  if (candidate.title.length <= 8) score += 4;
  return score;
}

function buildSong(candidate, number, list) {
  return {
    title: candidate.title,
    aliases: [...new Set([candidate.artist, candidate.channel].filter(Boolean))],
    videoId: candidate.videoId,
    start: 0,
    duration: 60,
    category: list.category,
    source: `${candidate.channel || "YouTube"} / YouTube`,
    hint: `熱門${list.category}；YouTube：${candidate.youtubeTitle || candidate.rawTitle}`,
    number,
    language: "中文",
    viewCount: candidate.viewCount,
    viewCheckedAt: RUN_DATE,
  };
}

function nextNumberFor(rows, prefix) {
  return Math.max(
    0,
    ...rows.map((song) => Number(String(song.number || "").match(new RegExp(`^${prefix}-(\\d+)$`))?.[1] || 0))
  );
}

async function expandList(list, globalVideoIds, reportRows) {
  const rows = readJson(list.path, []);
  const usableRows = [];
  for (const song of rows) {
    const titleArtists = [...list.artists, ...(song.aliases || [])].filter(Boolean);
    const cleanedTitle = cleanTitle(song.title, titleArtists);
    const candidateSong = cleanedTitle && cleanedTitle !== song.title ? { ...song, title: cleanedTitle } : song;
    const reason = existingRejectReason(candidateSong);
    if (reason) {
      reportRows.push({ list: list.category, status: "removed", reason, title: song.title, number: song.number, videoId: song.videoId, views: song.viewCount, channel: song.source, youtubeTitle: song.hint });
      globalVideoIds.delete(song.videoId);
      continue;
    }
    if (candidateSong !== song) {
      reportRows.push({ list: list.category, status: "cleaned", reason: "existing-title", title: candidateSong.title, number: song.number, videoId: song.videoId, views: song.viewCount, channel: song.source, youtubeTitle: song.title });
    }
    usableRows.push(candidateSong);
  }
  if (usableRows.length !== rows.length && !DRY_RUN) writeJson(list.path, usableRows);
  rows.length = 0;
  rows.push(...usableRows);
  const needed = Math.max(0, TARGET_PER_LIST - rows.length);
  if (!needed) {
    const renumbered = renumberRows(rows, list.prefix);
    if (!DRY_RUN) writeJson(list.path, renumbered);
    return renumbered;
  }

  const searchCache = readJson(SEARCH_CACHE_PATH, {});
  const videoCache = readJson(VIDEO_CACHE_PATH, {});
  const existingTitleKeys = new Set(rows.map((song) => normalize(song.title)));
  const candidatesByVideo = new Map();

  const queries = buildQueries(list);
  console.log(`${list.category}: ${rows.length} existing, ${needed} needed, ${queries.length} queries.`);

  for (const query of queries) {
    try {
      const videos = await searchYoutube(query, searchCache);
      for (const video of videos) {
        if (globalVideoIds.has(video.videoId)) continue;
        const artists = list.artists.filter((artist) => query.includes(artist));
        const goldenTitle = GOLDEN_ONLY ? goldenQueryTitle(query, list) : "";
        const title = goldenTitle || cleanTitle(video.rawTitle, artists);
        const reason = rejectReason(video, title, artists);
        const queryMatched = matchesGoldenQuery(query, list, title, video);
        if (reason) {
          reportRows.push({ list: list.category, status: "skipped", reason, title, videoId: video.videoId, views: video.searchViews, channel: video.channel, youtubeTitle: video.rawTitle });
          continue;
        }
        if (!queryMatched) {
          reportRows.push({ list: list.category, status: "skipped", reason: "golden-query-mismatch", title, videoId: video.videoId, views: video.searchViews, channel: video.channel, youtubeTitle: video.rawTitle });
          continue;
        }
        const titleKey = normalize(title);
        if (existingTitleKeys.has(titleKey)) continue;
        const previous = candidatesByVideo.get(video.videoId);
        if (!previous || video.searchViews > previous.searchViews) {
          candidatesByVideo.set(video.videoId, {
            ...video,
            title,
            titleKey,
            artist: artists[0] || "",
            query,
          });
        }
      }
    } catch (error) {
      reportRows.push({ list: list.category, status: "search-error", reason: error.message, title: query });
    }
  }

  const candidates = [...candidatesByVideo.values()].sort((a, b) => (b.searchViews || 0) - (a.searchViews || 0));
  console.log(`${list.category}: ${candidates.length} candidates after search filters.`);

  const additions = [];
  const selectedTitleKeys = new Set(existingTitleKeys);
  let fetched = 0;
  let nextNumber = nextNumberFor(rows, list.prefix);

  for (const candidate of candidates) {
    if (additions.length >= needed || fetched >= MAX_FETCHES_PER_LIST) break;
    fetched += 1;
    let metadata;
    try {
      metadata = await getVideoMetadata(candidate.videoId, videoCache);
    } catch (error) {
      reportRows.push({ list: list.category, status: "metadata-error", reason: error.message, title: candidate.title, videoId: candidate.videoId, views: candidate.searchViews, channel: candidate.channel, youtubeTitle: candidate.rawTitle });
      continue;
    }

    const goldenTitle = GOLDEN_ONLY ? goldenQueryTitle(candidate.query, list) : "";
    const refinedTitle = goldenTitle || cleanTitle(metadata.youtubeTitle || candidate.rawTitle, [candidate.artist].filter(Boolean));
    const reason = rejectReason({ ...candidate, ...metadata, rawTitle: metadata.youtubeTitle || candidate.rawTitle }, refinedTitle, [candidate.artist].filter(Boolean));
    const queryMatched = matchesGoldenQuery(candidate.query, list, refinedTitle, { ...candidate, ...metadata, rawTitle: metadata.youtubeTitle || candidate.rawTitle });
    const viewCount = Number(metadata.viewCount || 0);
    if (reason || !queryMatched || viewCount < MIN_ADDED_VIEWS) {
      reportRows.push({ list: list.category, status: "skipped", reason: reason || (!queryMatched ? "golden-query-mismatch" : `views<${MIN_ADDED_VIEWS}`), title: refinedTitle || candidate.title, videoId: candidate.videoId, views: viewCount, channel: metadata.channel || candidate.channel, youtubeTitle: metadata.youtubeTitle || candidate.rawTitle });
      continue;
    }

    const titleKey = normalize(refinedTitle);
    if (selectedTitleKeys.has(titleKey) || globalVideoIds.has(candidate.videoId)) continue;
    selectedTitleKeys.add(titleKey);
    globalVideoIds.add(candidate.videoId);
    nextNumber += 1;
    const selected = {
      ...candidate,
      title: refinedTitle,
      channel: metadata.channel || candidate.channel,
      youtubeTitle: metadata.youtubeTitle || candidate.rawTitle,
      viewCount,
      score: candidateScore({ ...candidate, title: refinedTitle, ...metadata }),
    };
    const song = buildSong(selected, `${list.prefix}-${String(nextNumber).padStart(3, "0")}`, list);
    additions.push(song);
    reportRows.push({ list: list.category, status: "added", reason: "", title: song.title, number: song.number, videoId: song.videoId, views: song.viewCount, channel: selected.channel, youtubeTitle: selected.youtubeTitle });
  }

  const nextRows = renumberRows([...rows, ...additions], list.prefix);
  if (!DRY_RUN) writeJson(list.path, nextRows);
  console.log(`${list.category}: added ${additions.length}, total ${nextRows.length}.`);
  return nextRows;
}

function rebuildCombinedLists() {
  const hymns = readJson(HYMNS_PATH, []);
  const popRows = LISTS.flatMap((list) => readJson(list.path, []));
  const popAll = popRows.map((song, index) => ({
    ...song,
    number: `POP-${String(index + 1).padStart(3, "0")}`,
  }));
  if (!DRY_RUN) {
    writeJson(POP_ALL_PATH, popAll);
    writeJson(ALL_SONGLISTS_PATH, [...hymns, ...popAll]);
  }
  return { hymns, popAll, allSonglists: [...hymns, ...popAll] };
}

function writeReport(reportRows, summary) {
  ensureDir("docs");
  const csvHeaders = ["status", "list", "number", "title", "videoId", "views", "channel", "youtubeTitle", "reason", "url"];
  const csv = [
    csvHeaders.join(","),
    ...reportRows.map((row) =>
      csvHeaders
        .map((header) => {
          if (header === "url") return csvEscape(row.videoId ? `https://www.youtube.com/watch?v=${row.videoId}` : "");
          return csvEscape(row[header]);
        })
        .join(",")
    ),
  ].join("\n");
  fs.writeFileSync(CSV_PATH, `${csv}\n`, "utf8");

  const added = reportRows.filter((row) => row.status === "added");
  const lines = [
    `# Bulk Pop Additions (${RUN_DATE})`,
    "",
    `目標：每個主要歌單至少 ${TARGET_PER_LIST} 首；新增歌曲需有 YouTube 瀏覽量 >= ${MIN_ADDED_VIEWS.toLocaleString("en-US")}；既有歌曲保留最低門檻 ${MIN_VIEWS.toLocaleString("en-US")}。`,
    "",
    "## Summary",
    "",
    "| 歌單 | 數量 |",
    "| --- | ---: |",
    ...summary.map((row) => `| ${row.label} | ${row.count} |`),
    "",
    "## Added Songs",
    "",
    "| 歌單 | 編號 | 歌名 | 瀏覽量 | 來源 | YouTube |",
    "| --- | --- | --- | ---: | --- | --- |",
    ...added.slice(0, 180).map((row) =>
      `| ${markdownCell(row.list)} | ${markdownCell(row.number)} | ${markdownCell(row.title)} | ${Number(row.views || 0).toLocaleString("en-US")} | ${markdownCell(row.channel)} | [影片](https://www.youtube.com/watch?v=${row.videoId}) |`
    ),
    added.length > 180 ? `| ... | ... | 其餘 ${added.length - 180} 首見 CSV | ... | ... | ... |` : "",
    "",
    `完整紀錄：${CSV_PATH}`,
    "",
  ];
  fs.writeFileSync(REPORT_PATH, lines.filter((line) => line !== "").join("\n"), "utf8");
}

function validate() {
  const files = [HYMNS_PATH, ...LISTS.map((list) => list.path), POP_ALL_PATH, ALL_SONGLISTS_PATH];
  const failures = [];
  for (const file of files) {
    const rows = readJson(file, []);
    const bad = rows.filter((song) => !Number.isFinite(song.viewCount) || song.viewCount < MIN_VIEWS);
    if (bad.length) failures.push(`${file}: ${bad.length} below threshold`);
  }
  if (failures.length) throw new Error(failures.join("\n"));
}

async function main() {
  ensureDir(".cache");
  ensureDir("docs");
  const globalVideoIds = new Set(readJson(ALL_SONGLISTS_PATH, []).map((song) => song.videoId).filter(Boolean));
  const reportRows = [];

  for (const list of LISTS) {
    await expandList(list, globalVideoIds, reportRows);
  }

  const combined = rebuildCombinedLists();
  validate();
  const summary = [
    { label: "詩歌", count: combined.hymns.length },
    ...LISTS.map((list) => ({ label: list.category, count: readJson(list.path, []).length })),
    { label: "全部流行曲", count: combined.popAll.length },
    { label: "全部歌單", count: combined.allSonglists.length },
  ];
  writeReport(reportRows, summary);
  for (const row of summary) console.log(`${row.label}: ${row.count}`);
  console.log(`Report: ${REPORT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
