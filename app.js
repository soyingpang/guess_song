const STORAGE_KEY = "cantonese-hymn-quiz-library-v2";
const SCORE_KEY = "cantonese-hymn-quiz-score-v2";
const CLOUD_LIBRARY_URL = "./hymns.json";

const difficultyDurations = {
  easy: 12,
  normal: 8,
  hard: 5,
};

const state = {
  songs: loadSongs(),
  score: loadScore(),
  currentSong: null,
  currentChoices: [],
  mode: "typed",
  difficulty: "easy",
  category: "all",
  round: 0,
  revealed: false,
  answered: false,
  hintLevel: 0,
  clipTimer: null,
  editingId: null,
  questionBag: [],
};

const els = {
  playerHost: document.querySelector("#playerHost"),
  playerMask: document.querySelector("#playerMask"),
  maskLabel: document.querySelector("#maskLabel"),
  quizTitle: document.querySelector("#quizTitle"),
  roundLabel: document.querySelector("#roundLabel"),
  playButton: document.querySelector("#playButton"),
  replayButton: document.querySelector("#replayButton"),
  hintButton: document.querySelector("#hintButton"),
  skipButton: document.querySelector("#skipButton"),
  nextButton: document.querySelector("#nextButton"),
  toggleVideoButton: document.querySelector("#toggleVideoButton"),
  easyModeButton: document.querySelector("#easyModeButton"),
  normalModeButton: document.querySelector("#normalModeButton"),
  hardModeButton: document.querySelector("#hardModeButton"),
  typedModeButton: document.querySelector("#typedModeButton"),
  choiceModeButton: document.querySelector("#choiceModeButton"),
  categoryFilter: document.querySelector("#categoryFilter"),
  guessForm: document.querySelector("#guessForm"),
  guessInput: document.querySelector("#guessInput"),
  choices: document.querySelector("#choices"),
  hintStack: document.querySelector("#hintStack"),
  resultBar: document.querySelector("#resultBar"),
  resultText: document.querySelector("#resultText"),
  answerText: document.querySelector("#answerText"),
  scoreCorrect: document.querySelector("#scoreCorrect"),
  scoreTotal: document.querySelector("#scoreTotal"),
  scoreStreak: document.querySelector("#scoreStreak"),
  songCount: document.querySelector("#songCount"),
  songForm: document.querySelector("#songForm"),
  songTitle: document.querySelector("#songTitle"),
  songUrl: document.querySelector("#songUrl"),
  songStart: document.querySelector("#songStart"),
  songDuration: document.querySelector("#songDuration"),
  songCategory: document.querySelector("#songCategory"),
  songNumber: document.querySelector("#songNumber"),
  songSource: document.querySelector("#songSource"),
  songHint: document.querySelector("#songHint"),
  songAliases: document.querySelector("#songAliases"),
  songSubmitButton: document.querySelector("#songSubmitButton"),
  songList: document.querySelector("#songList"),
  cloudButton: document.querySelector("#cloudButton"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  resetButton: document.querySelector("#resetButton"),
};

bindEvents();
render();
startRound();
if (!state.songs.length) loadCloudLibrary({ silent: true });

function bindEvents() {
  els.playButton.addEventListener("click", () => playCurrentClip());
  els.replayButton.addEventListener("click", () => playCurrentClip());
  els.hintButton.addEventListener("click", () => showNextHint());
  els.skipButton.addEventListener("click", () => finishRound(false, "開估"));
  els.nextButton.addEventListener("click", () => startRound());
  els.toggleVideoButton.addEventListener("click", () => toggleVideo());

  els.easyModeButton.addEventListener("click", () => setDifficulty("easy"));
  els.normalModeButton.addEventListener("click", () => setDifficulty("normal"));
  els.hardModeButton.addEventListener("click", () => setDifficulty("hard"));

  els.typedModeButton.addEventListener("click", () => setMode("typed"));
  els.choiceModeButton.addEventListener("click", () => setMode("choice"));

  els.categoryFilter.addEventListener("change", () => {
    state.category = els.categoryFilter.value;
    state.questionBag = [];
    startRound();
  });

  els.guessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    checkGuess(els.guessInput.value);
  });

  els.songForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSongFromForm();
  });

  els.songUrl.addEventListener("change", () => {
    const seconds = parseYouTubeStart(els.songUrl.value);
    if (seconds !== null) els.songStart.value = seconds;
  });

  els.exportButton.addEventListener("click", exportSongs);
  els.cloudButton.addEventListener("click", () => loadCloudLibrary({ silent: false }));
  els.importInput.addEventListener("change", importSongs);
  els.resetButton.addEventListener("click", clearLibrary);
}

function loadSongs() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const songs = JSON.parse(raw);
    return Array.isArray(songs) ? songs.map(cleanSong).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function loadScore() {
  const raw = localStorage.getItem(SCORE_KEY);
  if (!raw) return { correct: 0, total: 0, streak: 0 };

  try {
    return { correct: 0, total: 0, streak: 0, ...JSON.parse(raw) };
  } catch {
    return { correct: 0, total: 0, streak: 0 };
  }
}

function cleanSong(song) {
  const videoId = parseYouTubeId(song.videoId || song.url || song.youtube || "");
  const title = String(song.title || "").trim();
  if (!videoId || !title) return null;

  return {
    id: song.id || crypto.randomUUID(),
    title,
    aliases: toList(song.aliases),
    videoId,
    start: clampNumber(song.start, 0, 24 * 60 * 60, 0),
    duration: clampNumber(song.duration, 3, 60, 12),
    category: String(song.category || "").trim(),
    source: String(song.source || "").trim(),
    hint: String(song.hint || "").trim(),
    number: String(song.number || "").trim(),
  };
}

function saveSongs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.songs));
}

function saveScore() {
  localStorage.setItem(SCORE_KEY, JSON.stringify(state.score));
}

function startRound(preferredSongId) {
  const pool = playableSongs();

  if (!pool.length) {
    clearClipTimer();
    state.currentSong = null;
    state.currentChoices = [];
    state.round = 0;
    state.revealed = false;
    state.answered = false;
    state.hintLevel = 0;
    els.guessInput.value = "";
    els.playerHost.replaceChildren();
    setResult(state.songs.length ? "呢個分類未有詩歌" : "先加入粵語詩歌", "", "");
    render();
    return;
  }

  const song =
    pool.find((item) => item.id === preferredSongId) ||
    takeNextSong(pool) ||
    pool[0];

  clearClipTimer();
  state.currentSong = song;
  state.currentChoices = makeChoices(song, pool);
  state.round += 1;
  state.revealed = false;
  state.answered = false;
  state.hintLevel = 0;
  els.guessInput.value = "";
  setResult("聽前奏，估詩歌名", "", "");
  render();
  loadCurrentVideo();
}

function playableSongs() {
  if (state.category === "all") return state.songs;
  return state.songs.filter((song) => song.category === state.category);
}

function takeNextSong(pool) {
  const availableIds = new Set(pool.map((song) => song.id));
  state.questionBag = state.questionBag.filter((id) => availableIds.has(id));

  if (!state.questionBag.length) {
    state.questionBag = shuffle(pool.map((song) => song.id));
  }

  const previousId = state.currentSong?.id;
  const nextId = state.questionBag.find((id) => id !== previousId) || state.questionBag[0];
  state.questionBag = state.questionBag.filter((id) => id !== nextId);
  return pool.find((song) => song.id === nextId) || null;
}

function loadCurrentVideo() {
  if (!state.currentSong) return;
  renderYouTubeFrame({ autoplay: false });
}

function playCurrentClip() {
  if (!state.currentSong) {
    setResult("先加入一首粵語詩歌", "", "");
    return;
  }

  clearClipTimer();
  renderYouTubeFrame({ autoplay: true });

  state.clipTimer = window.setTimeout(() => {
    renderYouTubeFrame({ autoplay: false });
  }, clipDuration(state.currentSong) * 1000);

  setResult(`播放中：${clipDuration(state.currentSong)} 秒`, "", "");
}

function checkGuess(value) {
  if (!state.currentSong || state.answered) return;
  const guess = normalize(value);
  if (!guess) {
    setResult("輸入答案先", "", "");
    return;
  }

  finishRound(isCorrectGuess(guess), null);
}

function chooseAnswer(title) {
  if (!state.currentSong || state.answered) return;
  finishRound(normalize(title) === normalize(state.currentSong.title), null);
}

function finishRound(isCorrect, label = null) {
  if (!state.currentSong || state.answered) return;

  state.answered = true;
  state.revealed = true;
  state.score.total += 1;
  if (isCorrect) {
    state.score.correct += 1;
    state.score.streak += 1;
  } else {
    state.score.streak = 0;
  }

  clearClipTimer();
  saveScore();
  setResult(label || (isCorrect ? "答中" : "未中"), answerLabel(state.currentSong), isCorrect ? "correct" : "wrong");
  render();
}

function isCorrectGuess(normalizedGuess) {
  const validAnswers = [
    state.currentSong.title,
    state.currentSong.number,
    ...state.currentSong.aliases,
  ].map(normalize);

  return validAnswers.some((answer) => {
    if (!answer) return false;
    if (answer === normalizedGuess) return true;
    const longEnough = normalizedGuess.length >= Math.min(4, answer.length);
    return longEnough && (answer.includes(normalizedGuess) || normalizedGuess.includes(answer));
  });
}

function showNextHint() {
  if (!state.currentSong) {
    setResult("未有題目可以提示", "", "");
    return;
  }

  const hints = getHints(state.currentSong);
  if (state.hintLevel >= hints.length) {
    setResult("提示已經出晒", "", "");
    return;
  }

  state.hintLevel += 1;
  setResult(`提示 ${state.hintLevel}/${hints.length}`, "", "");
  renderHints();
}

function getHints(song) {
  return [
    song.category ? `分類：${song.category}` : "",
    song.source ? `詩歌集 / 來源：${song.source}` : "",
    song.number ? `編號：${song.number}` : "",
    song.hint ? `提示：${song.hint}` : "",
    `字數：${countTitleChars(song.title)}，首字提示：${maskTitle(song.title)}`,
  ].filter(Boolean);
}

function answerLabel(song) {
  const parts = [song.title];
  if (song.number) parts.push(`#${song.number}`);
  if (song.source) parts.push(song.source);
  return parts.join(" · ");
}

function renderYouTubeFrame({ autoplay }) {
  const iframe = document.createElement("iframe");
  iframe.src = buildEmbedUrl(state.currentSong, autoplay);
  iframe.title = "YouTube 詩歌片段";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  els.playerHost.replaceChildren(iframe);
}

function buildEmbedUrl(song, autoplay) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${song.videoId}`);
  url.searchParams.set("start", String(song.start));
  url.searchParams.set("end", String(song.start + clipDuration(song)));
  url.searchParams.set("autoplay", autoplay ? "1" : "0");
  url.searchParams.set("controls", "1");
  url.searchParams.set("rel", "0");
  url.searchParams.set("modestbranding", "1");
  url.searchParams.set("playsinline", "1");
  return url.toString();
}

function clipDuration(song) {
  return Math.min(song.duration, difficultyDurations[state.difficulty]);
}

function toggleVideo() {
  state.revealed = !state.revealed;
  render();
}

function setDifficulty(difficulty) {
  state.difficulty = difficulty;
  if (state.currentSong) loadCurrentVideo();
  render();
}

function setMode(mode) {
  state.mode = mode;
  state.currentChoices = state.currentSong ? makeChoices(state.currentSong, playableSongs()) : [];
  render();
}

function saveSongFromForm() {
  const videoId = parseYouTubeId(els.songUrl.value);
  if (!videoId) {
    setResult("YouTube URL / ID 唔正確", "", "wrong");
    els.songUrl.focus();
    return;
  }

  const song = cleanSong({
    id: state.editingId || crypto.randomUUID(),
    title: els.songTitle.value,
    videoId,
    start: Number(els.songStart.value),
    duration: Number(els.songDuration.value),
    category: els.songCategory.value,
    number: els.songNumber.value,
    source: els.songSource.value,
    hint: els.songHint.value,
    aliases: els.songAliases.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  });

  if (!song) {
    setResult("請檢查詩歌名同 YouTube 連結", "", "wrong");
    return;
  }

  if (state.editingId) {
    state.songs = state.songs.map((item) => (item.id === state.editingId ? song : item));
    setResult("已更新詩歌", song.title, "");
  } else {
    state.songs.unshift(song);
    setResult("已加入詩歌", song.title, "");
  }

  state.editingId = null;
  state.category = song.category || "all";
  saveSongs();
  resetForm();
  render();
  startRound(song.id);
}

function editSong(songId) {
  const song = state.songs.find((item) => item.id === songId);
  if (!song) return;

  state.editingId = song.id;
  els.songTitle.value = song.title;
  els.songUrl.value = song.videoId;
  els.songStart.value = song.start;
  els.songDuration.value = song.duration;
  els.songCategory.value = song.category;
  els.songNumber.value = song.number;
  els.songSource.value = song.source;
  els.songHint.value = song.hint;
  els.songAliases.value = song.aliases.join(", ");
  els.songSubmitButton.textContent = "更新詩歌";
  els.songTitle.focus();
}

function deleteSong(songId) {
  state.songs = state.songs.filter((item) => item.id !== songId);
  if (state.editingId === songId) resetForm();
  saveSongs();
  if (state.currentSong?.id === songId) startRound();
  render();
}

function resetForm() {
  els.songForm.reset();
  els.songStart.value = 30;
  els.songDuration.value = 12;
  els.songSubmitButton.textContent = "加入詩歌";
}

function exportSongs() {
  const blob = new Blob([JSON.stringify(state.songs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "cantonese-hymn-library.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function importSongs(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const incoming = JSON.parse(await file.text());
    const songs = Array.isArray(incoming) ? incoming.map(cleanSong).filter(Boolean) : [];
    if (!songs.length) throw new Error("No songs");

    mergeSongs(songs);
    saveSongs();
    setResult("已匯入題庫", `${songs.length} 首`, "");
    render();
    startRound();
  } catch {
    setResult("匯入失敗", "JSON 格式唔啱", "wrong");
  } finally {
    event.target.value = "";
  }
}

async function loadCloudLibrary({ silent }) {
  try {
    const response = await fetch(CLOUD_LIBRARY_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("No cloud library");

    const incoming = await response.json();
    const songs = Array.isArray(incoming) ? incoming.map(cleanSong).filter(Boolean) : [];
    if (!songs.length) {
      if (!silent) setResult("線上題庫暫時未有詩歌", "可以先用右邊表格加入", "");
      return;
    }

    mergeSongs(songs);
    saveSongs();
    setResult("已載入線上題庫", `${songs.length} 首`, "");
    render();
    startRound();
  } catch {
    if (!silent) setResult("載入線上題庫失敗", "請稍後再試", "wrong");
  }
}

function mergeSongs(songs) {
  const existing = new Map(state.songs.map((song) => [`${song.videoId}:${song.title}`, song]));
  songs.forEach((song) => existing.set(`${song.videoId}:${song.title}`, song));
  state.songs = Array.from(existing.values());
}

function clearLibrary() {
  if (!confirm("清空詩歌題庫同分數？")) return;
  state.songs = [];
  state.score = { correct: 0, total: 0, streak: 0 };
  state.editingId = null;
  saveSongs();
  saveScore();
  resetForm();
  startRound();
}

function makeChoices(correctSong, pool) {
  const otherSongs = shuffle(pool.filter((song) => song.id !== correctSong.id)).slice(0, 3);
  return shuffle([correctSong, ...otherSongs]).map((song) => song.title);
}

function render() {
  renderScore();
  renderCategoryFilter();
  renderQuiz();
  renderHints();
  renderLibrary();
}

function renderScore() {
  els.scoreCorrect.textContent = state.score.correct;
  els.scoreTotal.textContent = state.score.total;
  els.scoreStreak.textContent = state.score.streak;
}

function renderCategoryFilter() {
  const categories = Array.from(new Set(state.songs.map((song) => song.category).filter(Boolean))).sort();
  const previous = els.categoryFilter.value || state.category;
  els.categoryFilter.innerHTML = "";

  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "全部分類";
  els.categoryFilter.append(all);

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.categoryFilter.append(option);
  });

  state.category = categories.includes(previous) ? previous : "all";
  els.categoryFilter.value = state.category;
}

function renderQuiz() {
  const hasSong = Boolean(state.currentSong);
  els.roundLabel.textContent = hasSong ? `第 ${state.round} 題` : "未有題目";
  els.quizTitle.textContent = hasSong
    ? state.answered
      ? state.currentSong.title
      : "估呢首粵語詩歌"
    : state.songs.length
      ? "呢個分類未有詩歌"
      : "先加入粵語詩歌";

  els.maskLabel.textContent = state.revealed ? "影片已顯示" : "聽前奏，估詩歌";
  els.playerMask.classList.toggle("is-hidden", state.revealed);
  els.toggleVideoButton.textContent = state.revealed ? "隱藏影片" : "顯示影片";

  els.easyModeButton.classList.toggle("is-active", state.difficulty === "easy");
  els.normalModeButton.classList.toggle("is-active", state.difficulty === "normal");
  els.hardModeButton.classList.toggle("is-active", state.difficulty === "hard");
  els.typedModeButton.classList.toggle("is-active", state.mode === "typed");
  els.choiceModeButton.classList.toggle("is-active", state.mode === "choice");

  els.guessForm.hidden = state.mode !== "typed";
  els.choices.hidden = state.mode !== "choice";
  els.choices.innerHTML = "";

  state.currentChoices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice;
    button.disabled = state.answered;
    button.addEventListener("click", () => chooseAnswer(choice));
    els.choices.append(button);
  });
}

function renderHints() {
  els.hintStack.innerHTML = "";
  if (!state.currentSong || !state.hintLevel) return;

  getHints(state.currentSong)
    .slice(0, state.hintLevel)
    .forEach((hint) => {
      const item = document.createElement("div");
      item.className = "hint-item";
      item.textContent = hint;
      els.hintStack.append(item);
    });
}

function renderLibrary() {
  els.songCount.textContent = `${state.songs.length} 首`;
  els.songList.innerHTML = "";

  if (!state.songs.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "未有題目。貼一條粵語詩歌 YouTube 連結，就可以開始建立題庫。";
    els.songList.append(empty);
    return;
  }

  const blindRound = Boolean(state.currentSong && !state.answered);

  state.songs.forEach((song, index) => {
    const item = document.createElement("article");
    item.className = "song-item";
    item.classList.toggle("is-locked", blindRound);

    const info = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    title.textContent = blindRound ? `盲抽中 · 詩歌 ${index + 1}` : song.title;
    meta.textContent = blindRound
      ? "答案已隱藏，開估後先顯示"
      : [
          song.category || "未分類",
          song.source,
          song.number ? `#${song.number}` : "",
          `${song.start}s / ${song.duration}s`,
        ]
          .filter(Boolean)
          .join(" · ");
    info.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "song-actions";

    if (blindRound) {
      const locked = document.createElement("span");
      locked.className = "locked-note";
      locked.textContent = "鎖定";
      actions.append(locked);
    } else {
      const play = miniButton("播", "用呢首出題", () => startRound(song.id));
      const edit = miniButton("改", "編輯", () => editSong(song.id));
      const remove = miniButton("刪", "刪除", () => deleteSong(song.id));
      remove.classList.add("delete");
      actions.append(play, edit, remove);
    }

    item.append(info, actions);
    els.songList.append(item);
  });
}

function setResult(message, answer, tone = "") {
  els.resultText.textContent = message;
  els.answerText.textContent = answer;
  els.resultBar.classList.toggle("is-correct", tone === "correct");
  els.resultBar.classList.toggle("is-wrong", tone === "wrong");
}

function miniButton(text, title, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mini-button";
  button.textContent = text;
  button.title = title;
  button.addEventListener("click", onClick);
  return button;
}

function parseYouTubeId(input) {
  const value = String(input || "").trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(value)) return value;

  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
    if (host.endsWith("youtube.com")) {
      if (url.searchParams.get("v")) return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      const marker = parts.findIndex((part) => ["embed", "shorts", "live"].includes(part));
      if (marker >= 0) return parts[marker + 1] || "";
    }
  } catch {
    const match = value.match(/[a-zA-Z0-9_-]{11}/);
    return match ? match[0] : "";
  }

  return "";
}

function parseYouTubeStart(input) {
  try {
    const url = new URL(String(input || "").trim());
    const raw = url.searchParams.get("t") || url.searchParams.get("start");
    if (!raw) return null;
    return parseTime(raw);
  } catch {
    return null;
  }
}

function parseTime(value) {
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return Number(text);

  const hours = Number(text.match(/(\d+)h/)?.[1] || 0);
  const minutes = Number(text.match(/(\d+)m/)?.[1] || 0);
  const seconds = Number(text.match(/(\d+)s/)?.[1] || 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total || null;
}

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function toList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function countTitleChars(title) {
  return Array.from(title.replace(/\s+/g, "")).length;
}

function maskTitle(title) {
  const words = title.trim().split(/\s+/);
  if (words.length > 1) {
    return words.map((word) => `${Array.from(word)[0] || ""}${"＿".repeat(Math.max(0, Array.from(word).length - 1))}`).join(" ");
  }

  const chars = Array.from(title.replace(/\s+/g, ""));
  return chars.map((char, index) => (index === 0 ? char : "＿")).join("");
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

function clearClipTimer() {
  if (state.clipTimer) window.clearTimeout(state.clipTimer);
  state.clipTimer = null;
}

function pickRandom(items) {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}
