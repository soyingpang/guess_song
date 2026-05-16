const STORAGE_KEY = "guess-song-youtube-library-v1";
const SCORE_KEY = "guess-song-youtube-score-v1";

const demoSongs = [
  {
    id: crypto.randomUUID(),
    title: "Never Gonna Give You Up",
    aliases: ["Rick Astley", "Never Gonna Give You Up Rick Astley"],
    videoId: "dQw4w9WgXcQ",
    start: 43,
    duration: 12,
  },
  {
    id: crypto.randomUUID(),
    title: "Gangnam Style",
    aliases: ["PSY", "江南Style"],
    videoId: "9bZkp7q19f0",
    start: 39,
    duration: 12,
  },
  {
    id: crypto.randomUUID(),
    title: "Despacito",
    aliases: ["Luis Fonsi", "Daddy Yankee"],
    videoId: "kJQP7kiw5Fk",
    start: 47,
    duration: 12,
  },
  {
    id: crypto.randomUUID(),
    title: "Bad Apple",
    aliases: ["Touhou", "Bad Apple!!"],
    videoId: "FtutLA63Cp8",
    start: 21,
    duration: 12,
  },
];

const state = {
  songs: loadSongs(),
  score: loadScore(),
  currentSong: null,
  currentChoices: [],
  mode: "typed",
  round: 0,
  revealed: false,
  answered: false,
  clipTimer: null,
};

const els = {
  playerHost: document.querySelector("#playerHost"),
  playerMask: document.querySelector("#playerMask"),
  maskLabel: document.querySelector("#maskLabel"),
  quizTitle: document.querySelector("#quizTitle"),
  roundLabel: document.querySelector("#roundLabel"),
  playButton: document.querySelector("#playButton"),
  replayButton: document.querySelector("#replayButton"),
  skipButton: document.querySelector("#skipButton"),
  nextButton: document.querySelector("#nextButton"),
  toggleVideoButton: document.querySelector("#toggleVideoButton"),
  typedModeButton: document.querySelector("#typedModeButton"),
  choiceModeButton: document.querySelector("#choiceModeButton"),
  guessForm: document.querySelector("#guessForm"),
  guessInput: document.querySelector("#guessInput"),
  choices: document.querySelector("#choices"),
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
  songAliases: document.querySelector("#songAliases"),
  songList: document.querySelector("#songList"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  resetButton: document.querySelector("#resetButton"),
};

bindEvents();
render();
startRound();

function bindEvents() {
  els.playButton.addEventListener("click", () => playCurrentClip());
  els.replayButton.addEventListener("click", () => playCurrentClip());
  els.skipButton.addEventListener("click", () => finishRound(false, "已跳過"));
  els.nextButton.addEventListener("click", () => startRound());
  els.toggleVideoButton.addEventListener("click", () => toggleVideo());

  els.typedModeButton.addEventListener("click", () => setMode("typed"));
  els.choiceModeButton.addEventListener("click", () => setMode("choice"));

  els.guessForm.addEventListener("submit", (event) => {
    event.preventDefault();
    checkGuess(els.guessInput.value);
  });

  els.songForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addSongFromForm();
  });

  els.exportButton.addEventListener("click", exportSongs);
  els.importInput.addEventListener("change", importSongs);
  els.resetButton.addEventListener("click", resetSongs);
}

function loadSongs() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return demoSongs;

  try {
    const songs = JSON.parse(raw);
    return Array.isArray(songs) && songs.length ? songs.map(cleanSong).filter(Boolean) : demoSongs;
  } catch {
    return demoSongs;
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
    aliases: Array.isArray(song.aliases) ? song.aliases.map(String).filter(Boolean) : [],
    videoId,
    start: clampNumber(song.start, 0, 24 * 60 * 60, 0),
    duration: clampNumber(song.duration, 3, 60, 12),
  };
}

function saveSongs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.songs));
}

function saveScore() {
  localStorage.setItem(SCORE_KEY, JSON.stringify(state.score));
}

function startRound(preferredSongId) {
  if (!state.songs.length) {
    state.currentSong = null;
    state.currentChoices = [];
    state.round = 0;
    setResult("歌庫未有歌", "");
    render();
    return;
  }

  const previousId = state.currentSong?.id;
  const song =
    state.songs.find((item) => item.id === preferredSongId) ||
    pickRandom(state.songs.filter((item) => item.id !== previousId)) ||
    state.songs[0];

  clearClipTimer();
  state.currentSong = song;
  state.currentChoices = makeChoices(song);
  state.round += 1;
  state.revealed = false;
  state.answered = false;
  els.guessInput.value = "";
  setResult("聽片段，估歌名", "");
  render();
  loadCurrentVideo();
}

function loadCurrentVideo() {
  if (!state.currentSong) return;
  renderYouTubeFrame({ autoplay: false });
}

function playCurrentClip() {
  if (!state.currentSong) {
    setResult("先加入一首歌", "");
    return;
  }

  clearClipTimer();
  renderYouTubeFrame({ autoplay: true });

  state.clipTimer = window.setTimeout(() => {
    renderYouTubeFrame({ autoplay: false });
  }, state.currentSong.duration * 1000);

  setResult("播放中", "");
}

function checkGuess(value) {
  if (!state.currentSong || state.answered) return;
  const guess = normalize(value);
  if (!guess) {
    setResult("輸入答案先", "");
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
  setResult(label || (isCorrect ? "答中" : "未中"), activeAnswer(), isCorrect ? "correct" : "wrong");
  render();
}

function isCorrectGuess(normalizedGuess) {
  const validAnswers = [state.currentSong.title, ...state.currentSong.aliases].map(normalize);
  return validAnswers.some((answer) => {
    if (answer === normalizedGuess) return true;
    const longEnough = normalizedGuess.length >= Math.min(5, answer.length);
    return longEnough && (answer.includes(normalizedGuess) || normalizedGuess.includes(answer));
  });
}

function activeAnswer() {
  return state.currentSong ? state.currentSong.title : "";
}

function renderYouTubeFrame({ autoplay }) {
  const iframe = document.createElement("iframe");
  iframe.src = buildEmbedUrl(state.currentSong, autoplay);
  iframe.title = "YouTube song clip";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  els.playerHost.replaceChildren(iframe);
}

function buildEmbedUrl(song, autoplay) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${song.videoId}`);
  url.searchParams.set("start", String(song.start));
  url.searchParams.set("end", String(song.start + song.duration));
  url.searchParams.set("autoplay", autoplay ? "1" : "0");
  url.searchParams.set("controls", "1");
  url.searchParams.set("rel", "0");
  url.searchParams.set("modestbranding", "1");
  url.searchParams.set("playsinline", "1");
  return url.toString();
}

function toggleVideo() {
  state.revealed = !state.revealed;
  render();
}

function setMode(mode) {
  state.mode = mode;
  state.currentChoices = state.currentSong ? makeChoices(state.currentSong) : [];
  render();
}

function addSongFromForm() {
  const videoId = parseYouTubeId(els.songUrl.value);
  if (!videoId) {
    setResult("YouTube URL / ID 唔正確", "");
    els.songUrl.focus();
    return;
  }

  const song = cleanSong({
    title: els.songTitle.value,
    videoId,
    start: Number(els.songStart.value),
    duration: Number(els.songDuration.value),
    aliases: els.songAliases.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  });

  if (!song) {
    setResult("請檢查歌名同連結", "");
    return;
  }

  state.songs.unshift(song);
  saveSongs();
  els.songForm.reset();
  els.songStart.value = 30;
  els.songDuration.value = 12;
  setResult("已加入歌庫", song.title);
  render();
  startRound(song.id);
}

function editSong(songId) {
  const song = state.songs.find((item) => item.id === songId);
  if (!song) return;

  els.songTitle.value = song.title;
  els.songUrl.value = song.videoId;
  els.songStart.value = song.start;
  els.songDuration.value = song.duration;
  els.songAliases.value = song.aliases.join(", ");
  deleteSong(songId, false);
  els.songTitle.focus();
}

function deleteSong(songId, shouldRender = true) {
  state.songs = state.songs.filter((item) => item.id !== songId);
  saveSongs();
  if (state.currentSong?.id === songId) startRound();
  if (shouldRender) render();
}

function exportSongs() {
  const blob = new Blob([JSON.stringify(state.songs, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "guess-song-library.json";
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

    const existing = new Map(state.songs.map((song) => [song.videoId + song.title, song]));
    songs.forEach((song) => existing.set(song.videoId + song.title, song));
    state.songs = Array.from(existing.values());
    saveSongs();
    setResult("已匯入歌庫", `${songs.length} 首`);
    render();
    startRound();
  } catch {
    setResult("匯入失敗", "JSON 格式唔啱", "wrong");
  } finally {
    event.target.value = "";
  }
}

function resetSongs() {
  if (!confirm("重設歌庫同分數？")) return;
  state.songs = demoSongs.map((song) => ({ ...song, id: crypto.randomUUID() }));
  state.score = { correct: 0, total: 0, streak: 0 };
  saveSongs();
  saveScore();
  startRound();
}

function makeChoices(correctSong) {
  const otherSongs = shuffle(state.songs.filter((song) => song.id !== correctSong.id)).slice(0, 3);
  return shuffle([correctSong, ...otherSongs]).map((song) => song.title);
}

function render() {
  renderScore();
  renderQuiz();
  renderLibrary();
}

function renderScore() {
  els.scoreCorrect.textContent = state.score.correct;
  els.scoreTotal.textContent = state.score.total;
  els.scoreStreak.textContent = state.score.streak;
}

function renderQuiz() {
  els.roundLabel.textContent = state.currentSong ? `第 ${state.round} 題` : "第 0 題";
  els.quizTitle.textContent = state.currentSong
    ? state.answered
      ? state.currentSong.title
      : "估呢首係咩歌"
    : "揀一首歌開始";

  els.maskLabel.textContent = state.revealed ? "影片已顯示" : "聽聲估歌";
  els.playerMask.classList.toggle("is-hidden", state.revealed);
  els.toggleVideoButton.textContent = state.revealed ? "隱藏影片" : "顯示影片";

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

function renderLibrary() {
  els.songCount.textContent = `${state.songs.length} 首`;
  els.songList.innerHTML = "";

  state.songs.forEach((song) => {
    const item = document.createElement("article");
    item.className = "song-item";

    const info = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    title.textContent = song.title;
    meta.textContent = `${song.videoId} · ${song.start}s / ${song.duration}s`;
    info.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "song-actions";

    const play = miniButton("播", "用呢首出題", () => startRound(song.id));
    const edit = miniButton("改", "編輯", () => editSong(song.id));
    const remove = miniButton("刪", "刪除", () => deleteSong(song.id));
    remove.classList.add("delete");

    actions.append(play, edit, remove);
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

function normalize(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "");
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
