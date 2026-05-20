const STORAGE_KEY = "chinese-hymn-quiz-library-v4";
const SCORE_KEY = "cantonese-hymn-quiz-score-v2";
const CLOUD_LIBRARY_URL = "./hymns.json";
const DISPLAY_STATE_KEY = "cantonese-hymn-quiz-display-state-v1";
const ROOM_ID_KEY = "cantonese-hymn-quiz-room-id-v1";
const DEFAULT_ROOM_ID = "soyingpang-guess-song-fellowship-room";
const CLIP_START_SECONDS = 0;
const CLIP_DURATION_SECONDS = 60;
const DEFAULT_PLAY_DURATION_SECONDS = 30;
const PLAY_DURATIONS = [60, 30, 15];
const PLAY_START_MODES = ["beginning", "random"];
const RANDOM_START_MIN_SECONDS = 45;
const RANDOM_START_MAX_END_SECONDS = 180;
const LOCAL_VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|ogv|webm)$/i;
const WORD_BANK = [
  "平安", "恩典", "愛", "信", "盼望", "喜樂", "感謝", "讚美",
  "敬拜", "禱告", "耶穌", "天父", "聖靈", "十架", "救恩", "生命",
  "光明", "道路", "真理", "倚靠", "同行", "保守", "安慰", "醫治",
  "得勝", "祝福", "赦免", "榮耀", "永恆", "應許", "回家", "呼召",
];

const APPROVED_SOURCE_RULES = [
  "小羊詩歌",
  "lamb music",
  "同心圓敬拜福音平台",
  "one circle",
  "角聲使團",
  "the heralders",
  "原始和聲",
  "raw harmony",
  "基恩敬拜",
  "amazing grace worship",
  "播道神學院",
  "evangel seminary",
  "鹹蛋音樂事工",
  "salted egg",
  "玻璃海樂團",
  "worship nations",
  "讚美之泉",
  "stream of praise",
  "建道神學院",
  "新祢呈",
  "alliance bible seminary",
  "泥土音樂",
  "clay music",
  "約書亞樂團",
  "joshua band",
  "團契遊樂園",
  "playground ministry",
  "hkacm",
  "香港基督徒音樂事工協會",
];

const difficultyDurations = {
  easy: CLIP_DURATION_SECONDS,
  normal: CLIP_DURATION_SECONDS,
  hard: CLIP_DURATION_SECONDS,
};

const state = {
  songs: loadSongs(),
  score: loadScore(),
  currentSong: null,
  currentChoices: [],
  mode: "choice",
  difficulty: "easy",
  category: "all",
  round: 0,
  revealed: false,
  answered: false,
  hintLevel: 0,
  isPlaying: false,
  fullPlayback: false,
  frontReady: false,
  playDuration: DEFAULT_PLAY_DURATION_SECONDS,
  playStartMode: "beginning",
  currentClipStart: CLIP_START_SECONDS,
  playEndsAt: 0,
  currentWord: "",
  currentQuestionId: "",
  buzzWinnerId: "",
  buzzOpen: false,
  showLeaderboard: false,
  showWinner: false,
  clipTimer: null,
  editingId: null,
  questionBag: [],
  teamScores: { A: 0, B: 0 },
  roomReady: false,
  roomError: "",
  roomId: "",
  playerUrl: "",
  displayUrl: "",
  peer: null,
  displayConnections: new Set(),
  players: {},
};

const els = {
  playerHost: document.querySelector("#playerHost"),
  playerMask: document.querySelector("#playerMask"),
  maskLabel: document.querySelector("#maskLabel"),
  quizTitle: document.querySelector("#quizTitle"),
  roundLabel: document.querySelector("#roundLabel"),
  playButton: document.querySelector("#playButton"),
  replayButton: document.querySelector("#replayButton"),
  stopButton: document.querySelector("#stopButton"),
  hintButton: document.querySelector("#hintButton"),
  skipButton: document.querySelector("#skipButton"),
  nextButton: document.querySelector("#nextButton"),
  toggleVideoButton: document.querySelector("#toggleVideoButton"),
  duration60Button: document.querySelector("#duration60Button"),
  duration30Button: document.querySelector("#duration30Button"),
  duration15Button: document.querySelector("#duration15Button"),
  startBeginningButton: document.querySelector("#startBeginningButton"),
  startRandomButton: document.querySelector("#startRandomButton"),
  choiceModeButton: document.querySelector("#choiceModeButton"),
  buzzModeButton: document.querySelector("#buzzModeButton"),
  wordModeButton: document.querySelector("#wordModeButton"),
  judgeControls: document.querySelector("#judgeControls"),
  markCorrectButton: document.querySelector("#markCorrectButton"),
  markWrongButton: document.querySelector("#markWrongButton"),
  reopenBuzzButton: document.querySelector("#reopenBuzzButton"),
  wordControls: document.querySelector("#wordControls"),
  wordInput: document.querySelector("#wordInput"),
  randomWordButton: document.querySelector("#randomWordButton"),
  startWordButton: document.querySelector("#startWordButton"),
  teamAScore: document.querySelector("#teamAScore"),
  teamBScore: document.querySelector("#teamBScore"),
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
  songAudioUrl: document.querySelector("#songAudioUrl"),
  songStart: document.querySelector("#songStart"),
  songDuration: document.querySelector("#songDuration"),
  songCategory: document.querySelector("#songCategory"),
  songNumber: document.querySelector("#songNumber"),
  songSource: document.querySelector("#songSource"),
  songHint: document.querySelector("#songHint"),
  songAliases: document.querySelector("#songAliases"),
  songSubmitButton: document.querySelector("#songSubmitButton"),
  songList: document.querySelector("#songList"),
  openDisplayButton: document.querySelector("#openDisplayButton"),
  showLeaderboardButton: document.querySelector("#showLeaderboardButton"),
  showWinnerButton: document.querySelector("#showWinnerButton"),
  resetGameButton: document.querySelector("#resetGameButton"),
  cloudButton: document.querySelector("#cloudButton"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  resetButton: document.querySelector("#resetButton"),
  playerCount: document.querySelector("#playerCount"),
  roomStatus: document.querySelector("#roomStatus"),
  copyPlayerLinkButton: document.querySelector("#copyPlayerLinkButton"),
  copyDisplayLinkButton: document.querySelector("#copyDisplayLinkButton"),
  playerList: document.querySelector("#playerList"),
};

bindEvents();
initMultiplayer();
render();
if (!state.songs.length) {
  loadCloudLibrary({ silent: true });
} else {
  setResult("準備開始", `${approvedSongs().length}/${state.songs.length} 首可出題，按下一題播放開始`, "");
  render();
}

function bindEvents() {
  els.playButton.addEventListener("click", () => playCurrentClip());
  els.replayButton.addEventListener("click", () => playCurrentClip());
  els.stopButton.addEventListener("click", () => stopPlayback());
  els.hintButton.addEventListener("click", () => showNextHint());
  els.skipButton.addEventListener("click", () => finishRound(false, "開估"));
  els.nextButton.addEventListener("click", () => startNextQuestion());
  els.toggleVideoButton.addEventListener("click", () => toggleVideo());

  els.duration60Button.addEventListener("click", () => setPlayDuration(60));
  els.duration30Button.addEventListener("click", () => setPlayDuration(30));
  els.duration15Button.addEventListener("click", () => setPlayDuration(15));
  els.startBeginningButton.addEventListener("click", () => setPlayStartMode("beginning"));
  els.startRandomButton.addEventListener("click", () => setPlayStartMode("random"));

  els.choiceModeButton.addEventListener("click", () => setMode("choice"));
  els.buzzModeButton.addEventListener("click", () => setMode("buzz"));
  els.wordModeButton.addEventListener("click", () => setMode("word"));
  els.markCorrectButton.addEventListener("click", () => judgeBuzzWinner(true));
  els.markWrongButton.addEventListener("click", () => judgeBuzzWinner(false));
  els.reopenBuzzButton.addEventListener("click", () => reopenBuzz());
  els.randomWordButton.addEventListener("click", () => {
    els.wordInput.value = randomWord();
    els.wordInput.focus();
  });
  els.startWordButton.addEventListener("click", () => startWordRound(els.wordInput.value));

  els.categoryFilter.addEventListener("change", () => {
    state.category = els.categoryFilter.value;
    state.questionBag = [];
    startRound();
  });

  els.songForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSongFromForm();
  });

  els.songUrl.addEventListener("change", () => {
    els.songStart.value = CLIP_START_SECONDS;
    els.songDuration.value = CLIP_DURATION_SECONDS;
  });

  els.exportButton.addEventListener("click", exportSongs);
  els.openDisplayButton.addEventListener("click", openDisplayWindow);
  els.showLeaderboardButton.addEventListener("click", showLeaderboard);
  els.showWinnerButton.addEventListener("click", showWinner);
  els.resetGameButton.addEventListener("click", resetGameSession);
  els.copyPlayerLinkButton.addEventListener("click", copyPlayerLink);
  els.copyDisplayLinkButton.addEventListener("click", copyDisplayLink);
  els.cloudButton.addEventListener("click", () => loadCloudLibrary({ silent: false }));
  els.importInput.addEventListener("change", importSongs);
  els.resetButton.addEventListener("click", clearLibrary);
}

function initMultiplayer() {
  if (!window.Peer) {
    state.roomReady = false;
    state.roomId = "";
    state.playerUrl = "";
    state.displayUrl = "";
    renderPlayers();
    return;
  }

  const roomId = resolveRoomId();
  createRoomPeer(roomId);
}

function resolveRoomId() {
  localStorage.setItem(ROOM_ID_KEY, DEFAULT_ROOM_ID);
  return DEFAULT_ROOM_ID;
}

function createRoomPeer(roomId) {
  state.peer = new Peer(roomId, { debug: 0 });

  state.peer.on("open", (id) => {
    state.roomReady = true;
    state.roomError = "";
    state.roomId = id;
    state.playerUrl = buildPlayerUrl(id);
    state.displayUrl = buildDisplayUrl(id);
    localStorage.setItem(ROOM_ID_KEY, id);
    renderPlayers();
    publishDisplayState();
    broadcastToPlayers();
  });

  state.peer.on("connection", (connection) => {
    setupPlayerConnection(connection);
  });

  state.peer.on("call", (call) => {
    setupPlayerMicCall(call);
  });

  state.peer.on("error", (error) => {
    if (error.type === "unavailable-id") {
      state.roomReady = false;
      state.roomError = "固定房間已經有另一個後台開住，請關閉其他後台再重新整理";
      state.roomId = roomId;
      state.playerUrl = "";
      state.displayUrl = "";
      setResult("房間已被另一個後台使用", "請關閉其他後台，再重新整理這頁", "wrong");
      render();
      return;
    }

    state.roomReady = false;
    state.roomError = "房間連線暫時失敗，請保持此頁開住或重新整理";
    setResult("房間連線失敗", "請檢查網絡或重新整理", "wrong");
    render();
  });
}

function setupPlayerConnection(connection) {
  connection.on("data", (message) => handlePlayerMessage(connection, message));
  connection.on("close", () => {
    if (connection.isDisplay) {
      state.displayConnections.delete(connection);
      renderPlayers();
      return;
    }

    const player = findPlayerByConnection(connection);
    if (player) {
      player.connected = false;
      player.connection = null;
      endPlayerMic(player.id, { closeCall: true, render: false });
      renderPlayers();
      syncSurfaces();
    }
  });
}

function handlePlayerMessage(connection, message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "display-join") {
    connection.isDisplay = true;
    state.displayConnections.add(connection);
    sendDisplayState(connection, buildDisplayState());
    renderPlayers();
    return;
  }

  if (message.type === "join") {
    const playerId = String(message.playerId || connection.peer || crypto.randomUUID());
    const name = cleanPlayerName(message.name);
    const player = resolveJoiningPlayer(playerId, name);
    const previousConnection = player.connection;

    player.name = uniquePlayerName(name, player.id);
    player.team = normalizeTeam(player.team);
    player.connected = true;
    player.connection = connection;
    player.micActive = false;
    state.players[player.id] = player;
    connection.playerId = player.id;

    if (previousConnection && previousConnection !== connection) {
      endPlayerMic(player.id, { closeCall: true, render: false });
      try {
        previousConnection.close();
      } catch {
        // If the previous phone tab is already gone, PeerJS may throw. The new connection is still valid.
      }
    }

    sendPlayerState(player);
    renderPlayers();
    publishDisplayState();
    broadcastToPlayers();
    return;
  }

  const player = state.players[connection.playerId];
  if (!player) return;

  if (message.type === "mic-start") {
    player.micActive = true;
    renderPlayers();
    return;
  }

  if (message.type === "mic-stop") {
    endPlayerMic(player.id, { closeCall: false });
    return;
  }

  if (!hasActiveQuestion() || message.questionId !== state.currentQuestionId) return;

  if (message.type === "answer") {
    handleChoiceAnswer(player, message.answer);
  }

  if (message.type === "buzz") {
    handleBuzz(player);
  }
}

function setupPlayerMicCall(call) {
  const playerId = String(call.metadata?.playerId || "");
  const player =
    state.players[playerId] ||
    Object.values(state.players).find((item) => item.connection?.peer === call.peer);

  if (!player) {
    try {
      call.answer();
      call.close();
    } catch {
      // Ignore stale calls from phones that are no longer in the room.
    }
    return;
  }

  endPlayerMic(player.id, { closeCall: true, render: false });
  player.micCall = call;
  player.micActive = true;
  call.playerId = player.id;

  try {
    call.answer();
  } catch {
    player.micActive = false;
    renderPlayers();
    return;
  }

  call.on("stream", (stream) => {
    player.micStream = stream;
    player.micActive = true;
    setResult("玩家開咪", `${player.name} 正在說話`, "");
    renderPlayers();
  });

  call.on("close", () => {
    endPlayerMic(player.id, { closeCall: false });
  });

  call.on("error", () => {
    endPlayerMic(player.id, { closeCall: false });
  });

  renderPlayers();
}

function endPlayerMic(playerId, options = {}) {
  const { closeCall = true, render = true } = options;
  const player = state.players[playerId];
  if (!player) return;

  const call = player.micCall;
  player.micCall = null;
  player.micStream = null;
  player.micActive = false;

  if (closeCall && call) {
    try {
      call.close();
    } catch {
      // PeerJS may already have closed the media call.
    }
  }

  if (render) renderPlayers();
}

function handleChoiceAnswer(player, answer) {
  if (state.mode !== "choice" || player.answers[state.currentQuestionId]) return;
  if (!state.currentSong || !state.isPlaying || state.fullPlayback) return;

  const correct = normalize(answer) === normalize(state.currentSong.title);
  const points = correct ? 1 : 0;
  player.score += points;
  player.answers[state.currentQuestionId] = { answer, correct, points };
  sendToPlayer(player, {
    type: "result",
    questionId: state.currentQuestionId,
    correct,
    points,
    message: correct ? "答中 +1" : "未中",
  });
  renderPlayers();
  publishDisplayState();
  broadcastToPlayers();
}

function handleBuzz(player) {
  if (!["buzz", "word"].includes(state.mode) || !state.buzzOpen || state.buzzWinnerId || player.answers[state.currentQuestionId]) return;

  const actionLabel = state.mode === "word" ? "搶唱" : "搶答";
  state.buzzWinnerId = player.id;
  state.buzzOpen = false;
  broadcastToPlayers({
    type: "result",
    questionId: state.currentQuestionId,
    winnerId: player.id,
    message: `${player.name} ${actionLabel}成功，等主持判定`,
  });
  setResult(`${actionLabel}成功`, `${player.name}（${teamLabel(player.team)}）`, "");
  render();
}

function judgeBuzzWinner(isCorrect) {
  const player = state.players[state.buzzWinnerId];
  if (!player || !hasActiveQuestion()) {
    setResult("未有人搶答", "", "");
    return;
  }

  if (isCorrect) {
    const points = state.mode === "word" ? 2 : 2;
    if (state.mode === "word") {
      const team = normalizeTeam(player.team);
      state.teamScores[team] += points;
      player.answers[state.currentQuestionId] = { answer: "word", correct: true, points: 0, teamPoints: points };
      setResult("答中，組別加分", `${teamLabel(team)} +${points}`, "correct");
      sendToPlayer(player, {
        type: "result",
        questionId: state.currentQuestionId,
        correct: true,
        points: 0,
        message: `答中！${teamLabel(team)} +${points}`,
      });
    } else {
      player.score += points;
      player.answers[state.currentQuestionId] = { answer: "buzz", correct: true, points };
      setResult("答中", `${player.name} +${points}`, "correct");
      sendToPlayer(player, {
        type: "result",
        questionId: state.currentQuestionId,
        correct: true,
        points,
        message: `答中 +${points}`,
      });
    }

    state.answered = true;
    state.revealed = true;
    state.buzzOpen = false;
    state.isPlaying = false;
    state.fullPlayback = false;
    state.playEndsAt = 0;
    clearClipTimer();
    saveScore();
    render();
    return;
  }

  const actionLabel = state.mode === "word" ? "搶唱" : "搶答";
  player.answers[state.currentQuestionId] = { answer: "buzz", correct: false, points: 0 };
  state.buzzWinnerId = "";
  state.buzzOpen = false;
  setResult("未中", `${player.name} 暫停今題再搶；如要繼續請按開放${actionLabel}`, "wrong");
  sendToPlayer(player, {
    type: "result",
    questionId: state.currentQuestionId,
    correct: false,
    points: 0,
    message: "未中，等其他人再搶",
  });
  render();
}

function reopenBuzz() {
  if (!hasActiveQuestion()) {
    setResult("未有題目可以搶答", "", "");
    return;
  }

  state.buzzWinnerId = "";
  state.buzzOpen = true;
  state.showLeaderboard = false;
  state.showWinner = false;
  setResult(state.mode === "word" ? "已開放搶唱" : "已開放搶答", state.mode === "word" ? `今題主題：${state.currentWord}` : "", "");
  render();
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
  const audioUrl = String(song.audioUrl || song.audio || song.mediaUrl || song.videoUrl || "").trim();
  const title = String(song.title || "").trim();
  if ((!videoId && !audioUrl) || !title) return null;

  return {
    id: song.id || crypto.randomUUID(),
    title,
    aliases: toList(song.aliases),
    videoId,
    audioUrl,
    start: CLIP_START_SECONDS,
    duration: CLIP_DURATION_SECONDS,
    category: String(song.category || "").trim(),
    source: String(song.source || "").trim(),
    hint: String(song.hint || "").trim(),
    number: String(song.number || "").trim(),
    language: String(song.language || "粵語").trim(),
  };
}

function saveSongs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.songs));
}

function saveScore() {
  localStorage.setItem(SCORE_KEY, JSON.stringify(state.score));
}

function startNextQuestion() {
  if (state.mode === "word") {
    startWordRound(els.wordInput.value);
    return;
  }

  startRound(null, { autoplay: true });
}

function startRound(preferredSongId, options = {}) {
  const { autoplay = false, frontReady = false } = options;
  const pool = playableSongs();

  if (!pool.length) {
    clearClipTimer();
    state.currentSong = null;
    state.currentChoices = [];
    state.round = 0;
    state.revealed = false;
    state.answered = false;
    state.hintLevel = 0;
    state.isPlaying = false;
    state.fullPlayback = false;
    state.frontReady = false;
    state.playEndsAt = 0;
    state.currentWord = "";
    state.currentQuestionId = "";
    state.buzzWinnerId = "";
    state.buzzOpen = false;
    state.showLeaderboard = false;
    state.showWinner = false;
    els.guessInput.value = "";
    els.playerHost.replaceChildren();
    setResult(emptyPoolMessage(), "", "");
    render();
    return;
  }

  const song =
    pool.find((item) => item.id === preferredSongId) ||
    takeNextSong(pool) ||
    pool[0];

  clearClipTimer();
  state.currentSong = song;
  state.currentWord = "";
  state.currentChoices = makeChoices(song, pool);
  state.round += 1;
  state.revealed = false;
  state.answered = false;
  state.hintLevel = 0;
  state.isPlaying = Boolean(autoplay);
  state.fullPlayback = false;
  const prepared = Boolean(frontReady || autoplay);
  state.frontReady = prepared;
  state.currentClipStart = chooseClipStart(song);
  state.playEndsAt = autoplay ? Date.now() + clipDuration(song) * 1000 : 0;
  state.currentQuestionId = `${song.id}:${Date.now()}`;
  state.buzzWinnerId = "";
  state.buzzOpen = false;
  state.showLeaderboard = false;
  state.showWinner = false;
  els.guessInput.value = "";
  setResult(
    autoplay ? playbackStatus(song) : prepared ? "前台已預備" : "題目已載入",
    autoplay ? "" : prepared ? "可按重播片段，或直接下一題播放" : "按下一題播放把影片送到 MON2",
    ""
  );
  render();
  renderYouTubeFrame({ autoplay });
  if (autoplay) scheduleClipStop();
}

function startWordRound(preferredWord = "") {
  clearClipTimer();
  const word = cleanWord(preferredWord) || randomWord();
  state.currentSong = null;
  state.currentChoices = [];
  state.currentWord = word;
  state.round += 1;
  state.revealed = false;
  state.answered = false;
  state.hintLevel = 0;
  state.isPlaying = false;
  state.fullPlayback = false;
  state.frontReady = false;
  state.currentClipStart = CLIP_START_SECONDS;
  state.playEndsAt = 0;
  state.currentQuestionId = `word:${word}:${Date.now()}`;
  state.buzzWinnerId = "";
  state.buzzOpen = false;
  state.showLeaderboard = false;
  state.showWinner = false;
  els.wordInput.value = word;
  els.playerHost.replaceChildren();
  setResult("主題搶唱：已準備", `今題主題：${word}，按開放搶唱開始`, "");
  render();
}

function playableSongs() {
  const approved = approvedSongs();
  if (state.category === "all") return approved;
  return approved.filter((song) => song.category === state.category);
}

function approvedSongs() {
  return state.songs.filter((song) => isApprovedSource(song.source));
}

function isApprovedSource(source) {
  const normalizedSource = normalizeSource(source);
  return APPROVED_SOURCE_RULES.some((rule) => normalizedSource.includes(normalizeSource(rule)));
}

function normalizeSource(source) {
  return String(source || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function emptyPoolMessage() {
  if (!state.songs.length) return "先加入詩歌";
  if (!approvedSongs().length) return "未有已批准來源詩歌";
  return "呢個分類未有已批准詩歌";
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
  state.frontReady = true;
  renderYouTubeFrame({ autoplay: false });
  render();
}

function playCurrentClip() {
  if (state.mode === "word") {
    setResult("主題搶唱不需要播放", state.currentWord ? `今題主題：${state.currentWord}` : "", "");
    return;
  }

  if (!state.currentSong) {
    setResult("先加入一首詩歌", "", "");
    return;
  }

  clearClipTimer();
  state.isPlaying = true;
  state.fullPlayback = false;
  state.frontReady = true;
  state.playEndsAt = Date.now() + clipDuration(state.currentSong) * 1000;
  state.showLeaderboard = false;
  state.showWinner = false;
  renderYouTubeFrame({ autoplay: true });

  setResult(playbackStatus(state.currentSong), "", "");
  render();
  scheduleClipStop();
}

function stopPlayback(message = "已停止播放") {
  clearClipTimer();
  state.isPlaying = false;
  state.fullPlayback = false;
  state.playEndsAt = 0;
  if (state.currentSong) renderYouTubeFrame({ autoplay: false });
  setResult(message, state.currentSong ? "可開估、重播或下一題播放" : "", "");
  render();
}

function checkGuess(value) {
  return;
  if (!state.currentSong || state.answered) return;
  const guess = normalize(value);
  if (!guess) {
    setResult("輸入答案先", "", "");
    return;
  }

  finishRound(isCorrectGuess(guess), null);
}

function chooseAnswer(title) {
  return;
  if (!state.currentSong || state.answered) return;
  finishRound(normalize(title) === normalize(state.currentSong.title), null);
}

function finishRound(isCorrect, label = null) {
  if (!state.currentSong || state.answered) return;

  const shouldAutoplayReveal = label === "開估";
  state.answered = true;
  state.revealed = true;
  state.isPlaying = shouldAutoplayReveal;
  state.fullPlayback = shouldAutoplayReveal;
  state.frontReady = false;
  state.playEndsAt = 0;
  if (label !== "開估") {
    state.score.total += 1;
    if (isCorrect) {
      state.score.correct += 1;
      state.score.streak += 1;
    } else {
      state.score.streak = 0;
    }
  }

  clearClipTimer();
  saveScore();
  setResult(
    shouldAutoplayReveal ? "開估，全首播放中" : label || (isCorrect ? "答中" : "未中"),
    answerLabel(state.currentSong),
    isCorrect ? "correct" : "wrong"
  );
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
  syncSurfaces();
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
  if (state.currentSong.audioUrl) {
    renderHostLocalMedia({ autoplay });
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = buildEmbedUrl(state.currentSong, autoplay);
  iframe.title = "YouTube 詩歌片段";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  els.playerHost.replaceChildren(iframe);
}

function renderHostLocalMedia({ autoplay }) {
  const media = document.createElement(isVideoMediaUrl(state.currentSong.audioUrl) ? "video" : "audio");
  media.src = state.currentSong.audioUrl;
  media.controls = true;
  media.muted = true;
  media.volume = 0;
  media.preload = "metadata";
  if (media.tagName === "VIDEO") media.playsInline = true;
  media.addEventListener(
    "loadedmetadata",
    () => {
      media.currentTime = clipStart(state.currentSong);
      if (autoplay) media.play().catch(() => {});
    },
    { once: true }
  );
  els.playerHost.replaceChildren(media);
}

function isVideoMediaUrl(url) {
  return LOCAL_VIDEO_EXTENSIONS.test(String(url || "").split(/[?#]/)[0]);
}

function buildEmbedUrl(song, autoplay) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${song.videoId}`);
  url.searchParams.set("start", String(clipStart(song)));
  url.searchParams.set("end", String(clipStart(song) + clipDuration(song)));
  url.searchParams.set("autoplay", autoplay ? "1" : "0");
  url.searchParams.set("controls", "1");
  url.searchParams.set("rel", "0");
  url.searchParams.set("modestbranding", "1");
  url.searchParams.set("playsinline", "1");
  url.searchParams.set("mute", "1");
  url.searchParams.set("volume", "0");
  return url.toString();
}

function clipDuration(song) {
  return Math.min(CLIP_DURATION_SECONDS, state.playDuration, song?.duration || CLIP_DURATION_SECONDS);
}

function clipStart() {
  return state.currentClipStart || CLIP_START_SECONDS;
}

function playbackStatus(song) {
  return `前台播放中：${clipDuration(song)} 秒 · ${playStartLabel()}`;
}

function playStartLabel() {
  return state.playStartMode === "random" ? "隨機中段" : "由頭播";
}

function chooseClipStart(song) {
  if (state.playStartMode !== "random") return CLIP_START_SECONDS;

  const maxStart = Math.max(RANDOM_START_MIN_SECONDS, RANDOM_START_MAX_END_SECONDS - clipDuration(song));
  return randomInteger(RANDOM_START_MIN_SECONDS, maxStart);
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
  if (mode === "word") {
    clearClipTimer();
    state.currentSong = null;
    state.currentChoices = [];
    state.isPlaying = false;
    state.fullPlayback = false;
    state.frontReady = false;
    state.playEndsAt = 0;
    state.currentQuestionId = "";
    els.playerHost.replaceChildren();
    setResult("主題搶唱模式", "抽主題或輸入大路關鍵詞開始", "");
  } else {
    state.currentWord = "";
    state.currentChoices = state.currentSong ? makeChoices(state.currentSong, playableSongs()) : [];
    setResult(mode === "choice" ? "四選一模式" : "搶答估歌模式", "按下一題播放", "");
  }
  state.buzzWinnerId = "";
  state.buzzOpen = false;
  state.showLeaderboard = false;
  state.showWinner = false;
  render();
}

function setPlayDuration(seconds) {
  state.playDuration = PLAY_DURATIONS.includes(seconds) ? seconds : DEFAULT_PLAY_DURATION_SECONDS;
  if (state.currentSong && !state.isPlaying) state.currentClipStart = chooseClipStart(state.currentSong);
  if (state.currentSong) loadCurrentVideo();
  render();
}

function setPlayStartMode(mode) {
  state.playStartMode = PLAY_START_MODES.includes(mode) ? mode : "beginning";
  if (state.currentSong && !state.isPlaying) {
    state.currentClipStart = chooseClipStart(state.currentSong);
    loadCurrentVideo();
  }
  render();
}

function scheduleClipStop() {
  clearClipTimer();
  state.clipTimer = window.setTimeout(() => {
    state.isPlaying = false;
    state.fullPlayback = false;
    state.frontReady = false;
    state.playEndsAt = 0;
    setResult("時間到", state.currentSong ? "可以開估、重播或下一題播放" : "", "");
    renderYouTubeFrame({ autoplay: false });
    render();
  }, clipDuration(state.currentSong) * 1000);
}

function showLeaderboard() {
  state.showLeaderboard = true;
  state.showWinner = false;
  render();
}

function showWinner() {
  state.showWinner = true;
  state.showLeaderboard = false;
  render();
}

function resetGameSession() {
  if (!confirm("重置分數同題目？房間、QR、玩家同題庫會保留。")) return;

  clearClipTimer();
  state.score = { correct: 0, total: 0, streak: 0 };
  state.teamScores = { A: 0, B: 0 };
  state.currentSong = null;
  state.currentChoices = [];
  state.currentWord = "";
  state.round = 0;
  state.revealed = false;
  state.answered = false;
  state.hintLevel = 0;
  state.isPlaying = false;
  state.fullPlayback = false;
  state.frontReady = false;
  state.currentClipStart = CLIP_START_SECONDS;
  state.playEndsAt = 0;
  state.currentQuestionId = "";
  state.buzzWinnerId = "";
  state.buzzOpen = false;
  state.showLeaderboard = false;
  state.showWinner = false;
  state.questionBag = [];
  els.guessInput.value = "";
  els.playerHost.replaceChildren();

  Object.values(state.players).forEach((player) => {
    player.score = 0;
    player.answers = {};
  });

  saveScore();
  setResult("分數已重置", "同一間房保留，玩家不用重新掃碼", "correct");
  render();
}

function saveSongFromForm() {
  const videoId = parseYouTubeId(els.songUrl.value);
  const audioUrl = els.songAudioUrl.value.trim();
  if (!videoId && !audioUrl) {
    setResult("請填 YouTube URL / ID 或已授權媒體 URL", "", "wrong");
    els.songUrl.focus();
    return;
  }

  const song = cleanSong({
    id: state.editingId || crypto.randomUUID(),
    title: els.songTitle.value,
    videoId,
    audioUrl,
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
  startRound(song.id, { autoplay: true });
}

function editSong(songId) {
  const song = state.songs.find((item) => item.id === songId);
  if (!song) return;

  state.editingId = song.id;
  els.songTitle.value = song.title;
  els.songUrl.value = song.videoId;
  els.songAudioUrl.value = song.audioUrl || "";
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
  if (state.currentSong?.id === songId) startRound(null, { autoplay: true });
  render();
}

function resetForm() {
  els.songForm.reset();
  els.songAudioUrl.value = "";
  els.songStart.value = CLIP_START_SECONDS;
  els.songDuration.value = CLIP_DURATION_SECONDS;
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
    setResult("已匯入題庫", `${approvedSongs().length}/${state.songs.length} 首可出題`, "");
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

    state.songs = dedupeSongs(songs);
    saveSongs();
    setResult("已載入經典詩歌線上題庫", `${approvedSongs().length}/${state.songs.length} 首可出題，按下一題播放開始`, "");
    render();
  } catch {
    if (!silent) setResult("載入線上題庫失敗", "請稍後再試", "wrong");
  }
}

function mergeSongs(songs) {
  state.songs = dedupeSongs([...state.songs, ...songs]);
}

function dedupeSongs(songs) {
  const existing = new Map();
  songs.forEach((song) => existing.set(`${song.videoId}:${song.title}`, song));
  return Array.from(existing.values());
}

function clearLibrary() {
  if (!confirm("清空詩歌題庫同分數？")) return;
  state.songs = [];
  state.score = { correct: 0, total: 0, streak: 0 };
  state.teamScores = { A: 0, B: 0 };
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

function ensureChoiceOptions(song) {
  if (!song) return [];
  if (state.currentChoices.length) return state.currentChoices;

  const pool = playableSongs();
  state.currentChoices = makeChoices(song, pool.length ? pool : [song]);
  return state.currentChoices;
}

function render() {
  renderScore();
  renderCategoryFilter();
  renderQuiz();
  renderHints();
  renderLibrary();
  renderPlayers();
  publishDisplayState();
  broadcastToPlayers();
}

function renderScore() {
  els.scoreCorrect.textContent = state.score.correct;
  els.scoreTotal.textContent = state.score.total;
  els.scoreStreak.textContent = state.score.streak;
  els.teamAScore.textContent = state.teamScores.A;
  els.teamBScore.textContent = state.teamScores.B;
}

function renderCategoryFilter() {
  const categories = Array.from(new Set(approvedSongs().map((song) => song.category).filter(Boolean))).sort();
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

function isRoomBlocked() {
  return Boolean(state.roomError) && !state.roomReady;
}

function renderQuiz() {
  const hasSong = Boolean(state.currentSong);
  const hasWord = state.mode === "word" && Boolean(state.currentWord);
  const roomBlocked = isRoomBlocked();
  els.roundLabel.textContent = hasActiveQuestion() ? `第 ${state.round} 題` : "未有題目";
  els.quizTitle.textContent = hasWord
    ? `今題主題：${state.currentWord}`
    : hasSong
      ? state.answered
        ? state.currentSong.title
        : "估呢首詩歌"
      : state.mode === "word"
        ? "主題搶唱"
        : state.songs.length
          ? emptyPoolMessage()
          : "先加入詩歌";

  els.maskLabel.textContent = hasSong ? "後台影片已靜音，只作預備和跳廣告" : "前台先會出聲";
  els.playerMask.classList.toggle("is-hidden", hasSong);
  els.playerHost.classList.remove("is-masked");
  els.toggleVideoButton.textContent = state.revealed ? "前台隱藏" : "前台開估";

  els.duration60Button.classList.toggle("is-active", state.playDuration === 60);
  els.duration30Button.classList.toggle("is-active", state.playDuration === 30);
  els.duration15Button.classList.toggle("is-active", state.playDuration === 15);
  els.startBeginningButton.classList.toggle("is-active", state.playStartMode === "beginning");
  els.startRandomButton.classList.toggle("is-active", state.playStartMode === "random");
  els.choiceModeButton.classList.toggle("is-active", state.mode === "choice");
  els.buzzModeButton.classList.toggle("is-active", state.mode === "buzz");
  els.wordModeButton.classList.toggle("is-active", state.mode === "word");
  els.showLeaderboardButton.classList.toggle("is-active", state.showLeaderboard);
  els.showWinnerButton.classList.toggle("is-active", state.showWinner);
  els.openDisplayButton.disabled = roomBlocked || !state.displayUrl;
  els.showLeaderboardButton.disabled = roomBlocked;
  els.showWinnerButton.disabled = roomBlocked;
  els.resetGameButton.disabled = roomBlocked;
  els.toggleVideoButton.disabled = roomBlocked || !hasActiveQuestion();
  els.playButton.textContent = state.isPlaying ? "播放中" : "重播片段";
  els.replayButton.textContent = "重播片段";
  els.nextButton.textContent = state.mode === "word" ? "下一主題" : "下一題播放";
  els.playButton.disabled = roomBlocked || state.mode === "word" || !hasSong || state.isPlaying;
  els.replayButton.disabled = roomBlocked || state.mode === "word" || !hasSong;
  els.stopButton.disabled = roomBlocked || !state.isPlaying;
  els.hintButton.disabled = roomBlocked || state.mode === "word" || !hasSong;
  els.skipButton.disabled = roomBlocked || !hasActiveQuestion() || state.answered;
  els.nextButton.disabled = roomBlocked;
  els.duration60Button.disabled = roomBlocked;
  els.duration30Button.disabled = roomBlocked;
  els.duration15Button.disabled = roomBlocked;
  els.startBeginningButton.disabled = roomBlocked;
  els.startRandomButton.disabled = roomBlocked;
  els.choiceModeButton.disabled = roomBlocked;
  els.buzzModeButton.disabled = roomBlocked;
  els.wordModeButton.disabled = roomBlocked;
  els.judgeControls.hidden = !["buzz", "word"].includes(state.mode);
  els.wordControls.hidden = state.mode !== "word";
  els.reopenBuzzButton.textContent = state.mode === "word"
    ? state.buzzOpen
      ? "搶唱已開放"
      : state.buzzWinnerId
        ? "重新開放搶唱"
        : "開放搶唱"
    : state.buzzOpen
      ? "搶答已開放"
      : state.buzzWinnerId
        ? "重新開放搶答"
        : "開放搶答";
  els.markCorrectButton.disabled = roomBlocked || !state.buzzWinnerId || state.answered;
  els.markWrongButton.disabled = roomBlocked || !state.buzzWinnerId || state.answered;
  els.reopenBuzzButton.disabled = roomBlocked || !hasActiveQuestion() || state.answered || state.buzzOpen;
  els.wordInput.disabled = roomBlocked;
  els.randomWordButton.disabled = roomBlocked;
  els.startWordButton.disabled = roomBlocked;

  els.guessForm.hidden = true;
  els.choices.hidden = true;
  els.choices.innerHTML = "";
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
  const approvedCount = approvedSongs().length;
  els.songCount.textContent = `${approvedCount}/${state.songs.length} 可出題`;
  els.songList.innerHTML = "";

  if (!state.songs.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "未有題目。貼一條詩歌 YouTube 連結，就可以開始建立題庫。";
    els.songList.append(empty);
    return;
  }

  const blindRound = Boolean(state.currentSong && !state.answered);

  state.songs.forEach((song, index) => {
    const approved = isApprovedSource(song.source);
    const item = document.createElement("article");
    item.className = "song-item";
    item.classList.toggle("is-locked", blindRound);
    item.classList.toggle("is-pending-source", !approved);

    const info = document.createElement("div");
    const title = document.createElement("strong");
    const meta = document.createElement("span");
    title.textContent = blindRound ? `盲抽中 · 詩歌 ${index + 1}` : song.title;
    meta.textContent = blindRound
      ? "答案已隱藏，開估後先顯示"
      : [
          approved ? "已批准來源" : "待審來源",
          song.audioUrl ? mediaKindLabel(song.audioUrl) : "YouTube",
          song.category || "未分類",
          song.source,
          song.number ? `#${song.number}` : "",
          "由開頭播放 / 全首",
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
      const status = document.createElement("span");
      status.className = approved ? "locked-note approved-note" : "locked-note pending-note";
      status.textContent = approved ? "已批" : "待審";
      const edit = miniButton("改", "編輯", () => editSong(song.id));
      const remove = miniButton("刪", "刪除", () => deleteSong(song.id));
      remove.classList.add("delete");
      if (approved) {
        const play = miniButton("播", "用呢首出題並播放", () => startRound(song.id, { autoplay: true }));
        actions.append(play, status, edit, remove);
      } else {
        actions.append(status, edit, remove);
      }
    }

    item.append(info, actions);
    els.songList.append(item);
  });
}

function renderPlayers() {
  const players = leaderboardPlayers();
  els.playerCount.textContent = `${players.length} 位`;
  els.roomStatus.textContent = state.roomError
    ? state.roomError
    : state.roomReady
      ? `固定房間：${state.roomId} · 前台 ${state.displayConnections.size} 個`
      : `固定房間建立中：${state.roomId || DEFAULT_ROOM_ID}`;
  els.copyPlayerLinkButton.disabled = !state.playerUrl;
  els.copyDisplayLinkButton.disabled = !state.displayUrl;
  els.playerList.innerHTML = "";

  if (!players.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = state.roomReady ? "等待玩家掃 QR 加入" : "多人連線準備中";
    els.playerList.append(empty);
    return;
  }

  players.forEach((player, index) => {
    const item = document.createElement("article");
    item.className = "player-item";

    const info = document.createElement("div");
    const name = document.createElement("strong");
    const meta = document.createElement("span");
    name.textContent = `${index + 1}. ${player.name}`;
    meta.textContent = `${teamLabel(player.team)} · ${player.connected ? "已連線" : "離線"}${player.micActive ? " · 開咪中" : ""}`;
    info.append(name, meta);

    const score = document.createElement("strong");
    score.className = "player-score";
    score.textContent = `${player.score} 分`;

    const actions = document.createElement("div");
    actions.className = "player-actions";

    const teamSelect = document.createElement("select");
    teamSelect.className = "mini-select";
    teamSelect.setAttribute("aria-label", `${player.name} 組別`);
    ["A", "B"].forEach((team) => {
      const option = document.createElement("option");
      option.value = team;
      option.textContent = `${team} 組`;
      teamSelect.append(option);
    });
    teamSelect.value = normalizeTeam(player.team);
    teamSelect.addEventListener("change", () => setPlayerTeam(player.id, teamSelect.value));

    const remove = miniButton("移", "移除離線玩家", () => removeOfflinePlayer(player.id));
    remove.classList.add("delete");
    remove.disabled = Boolean(player.connected);
    remove.title = player.connected ? "玩家仍在線，不能移除" : "移除離線玩家";

    const stopMic = miniButton("收咪", "中斷玩家咪高峰", () => endPlayerMic(player.id));
    stopMic.disabled = !player.micActive;

    actions.append(teamSelect, stopMic, remove);

    item.append(info, score, actions);

    if (player.micActive) {
      const micPanel = document.createElement("div");
      micPanel.className = "player-mic-panel";
      const micStatus = document.createElement("span");
      micStatus.textContent = player.micStream ? "正在接收手機咪" : "等候手機咪連線";
      const audio = document.createElement("audio");
      audio.controls = true;
      audio.autoplay = true;
      audio.playsInline = true;
      if (player.micStream) {
        audio.srcObject = player.micStream;
        audio.play().catch(() => {});
      }
      micPanel.append(micStatus, audio);
      item.append(micPanel);
    }

    els.playerList.append(item);
  });
}

function setPlayerTeam(playerId, team) {
  const player = state.players[playerId];
  if (!player) return;

  const nextTeam = normalizeTeam(team);
  if (normalizeTeam(player.team) === nextTeam) return;

  player.team = nextTeam;
  setResult("已更新玩家組別", `${player.name} → ${teamLabel(nextTeam)}`, "correct");
  renderPlayers();
  syncSurfaces();
}

function removeOfflinePlayer(playerId) {
  const player = state.players[playerId];
  if (!player) return;

  if (player.connected) {
    setResult("玩家仍在線", "只能移除離線玩家", "wrong");
    renderPlayers();
    return;
  }

  if (!confirm(`移除離線玩家「${player.name}」？`)) {
    renderPlayers();
    return;
  }

  endPlayerMic(playerId, { closeCall: true, render: false });
  delete state.players[playerId];
  if (state.buzzWinnerId === playerId) state.buzzWinnerId = "";
  setResult("已移除離線玩家", player.name, "");
  render();
}

function setResult(message, answer, tone = "") {
  els.resultText.textContent = message;
  els.answerText.textContent = answer;
  els.resultBar.classList.toggle("is-correct", tone === "correct");
  els.resultBar.classList.toggle("is-wrong", tone === "wrong");
}

function openDisplayWindow() {
  publishDisplayState();
  window.open(state.displayUrl || "./display.html", "hymnQuizDisplay");
}

async function copyPlayerLink() {
  if (!state.playerUrl) {
    setResult("玩家連結未準備好", "請等房間建立完成", "wrong");
    return;
  }

  const originalLabel = els.copyPlayerLinkButton.textContent;
  try {
    await writeClipboardText(state.playerUrl);
    els.copyPlayerLinkButton.textContent = "已複製";
    setResult("已複製玩家連結", "掃不到 QR 時可直接傳給團友", "correct");
  } catch {
    showManualCopyLink(state.playerUrl);
    setResult("請手動複製玩家連結", "瀏覽器未允許自動複製", "wrong");
  } finally {
    window.setTimeout(() => {
      els.copyPlayerLinkButton.textContent = originalLabel;
    }, 1600);
  }
}

async function copyDisplayLink() {
  if (!state.displayUrl) {
    setResult("前台連結未準備好", "請等房間建立完成", "wrong");
    return;
  }

  const originalLabel = els.copyDisplayLinkButton.textContent;
  try {
    await writeClipboardText(state.displayUrl);
    els.copyDisplayLinkButton.textContent = "已複製";
    setResult("已複製前台連結", "可傳給外地朋友開大螢幕前台", "correct");
  } catch {
    showManualCopyLink(state.displayUrl);
    setResult("請手動複製前台連結", "瀏覽器未允許自動複製", "wrong");
  } finally {
    window.setTimeout(() => {
      els.copyDisplayLinkButton.textContent = originalLabel;
    }, 1600);
  }
}

async function writeClipboardText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy failed");
}

function showManualCopyLink(link) {
  window.prompt("複製以下玩家連結", link);
}

function publishDisplayState() {
  const payload = buildDisplayState();
  localStorage.setItem(DISPLAY_STATE_KEY, JSON.stringify(payload));
  broadcastToDisplays(payload);
}

function syncSurfaces(extraMessage = null) {
  publishDisplayState();
  broadcastToPlayers(extraMessage);
}

function buildDisplayState() {
  const song = state.currentSong;
  const hasSong = Boolean(song);
  const hasWord = state.mode === "word" && Boolean(state.currentWord);
  const revealed = Boolean((song || hasWord) && state.answered);
  const hints = song ? getHints(song).slice(0, state.hintLevel) : [];

  return {
    updatedAt: Date.now(),
    round: state.round,
    correct: state.score.correct,
    total: state.score.total,
    streak: state.score.streak,
    category: state.category,
    difficulty: state.difficulty,
    mode: state.mode,
    hasSong,
    hasQuestion: hasSong || hasWord,
    hasWord,
    revealed,
    isPlaying: state.isPlaying,
    fullPlayback: state.fullPlayback,
    frontReady: state.frontReady,
    playDuration: state.playDuration,
    playEndsAt: state.playEndsAt,
    clipDuration: state.playDuration,
    currentWord: state.currentWord,
    teamScores: { ...state.teamScores },
    buzzOpen: state.buzzOpen,
    roomReady: state.roomReady,
    roomId: state.roomId,
    playerUrl: state.playerUrl,
    showLeaderboard: state.showLeaderboard,
    showWinner: state.showWinner,
    leaderboard: leaderboardPlayers().map(stripPlayer),
    buzzWinner: state.buzzWinnerId ? stripPlayer(state.players[state.buzzWinnerId]) : null,
    prompt: hasWord ? "主題搶唱" : hasSong ? "聽前奏，估詩歌" : "等候主持開始",
    status: els.resultText.textContent || "",
    answer: revealed && song ? answerLabel(song) : hasWord ? `今題主題：${state.currentWord}` : "",
    title: hasWord ? state.currentWord : revealed && song ? song.title : "估呢首詩歌",
    videoId: song?.videoId || "",
    audioUrl: song?.audioUrl || "",
    start: song && !state.fullPlayback ? clipStart(song) : CLIP_START_SECONDS,
    end: song && !state.fullPlayback ? clipStart(song) + clipDuration(song) : 0,
    hints,
    choices: [],
    meta: revealed && song
      ? [song.category, song.source, song.number ? `#${song.number}` : ""].filter(Boolean)
      : [],
  };
}

function buildPlayerState(player) {
  const song = state.currentSong;
  const hasWord = state.mode === "word" && Boolean(state.currentWord);
  const revealed = Boolean((song || hasWord) && state.answered);
  const choiceOptions = state.mode === "choice" && song && !revealed && state.isPlaying ? ensureChoiceOptions(song) : [];

  return {
    type: "state",
    questionId: state.currentQuestionId,
    round: state.round,
    mode: state.mode,
    hasSong: Boolean(song),
    hasQuestion: Boolean(song || hasWord),
    hasWord,
    revealed,
    isPlaying: state.isPlaying && !state.fullPlayback,
    fullPlayback: state.fullPlayback,
    frontReady: state.frontReady,
    playDuration: state.playDuration,
    playEndsAt: state.playEndsAt,
    clipDuration: state.playDuration,
    currentWord: state.currentWord,
    playerName: player.name,
    team: normalizeTeam(player.team),
    teamScores: { ...state.teamScores },
    buzzOpen: state.buzzOpen,
    title: hasWord ? `今題主題：${state.currentWord}` : revealed && song ? song.title : "估呢首詩歌",
    status: els.resultText.textContent || "",
    score: player.score,
    choices: choiceOptions,
    hints: song ? getHints(song).slice(0, state.hintLevel) : [],
    leaderboard: leaderboardPlayers().map(stripPlayer),
    buzzWinner: state.buzzWinnerId ? stripPlayer(state.players[state.buzzWinnerId]) : null,
    answered: Boolean(player.answers[state.currentQuestionId]),
  };
}

function broadcastToPlayers(extraMessage = null) {
  Object.values(state.players).forEach((player) => {
    if (extraMessage) sendToPlayer(player, extraMessage);
    sendPlayerState(player);
  });
}

function broadcastToDisplays(payload = buildDisplayState()) {
  state.displayConnections.forEach((connection) => {
    if (!connection?.open) {
      state.displayConnections.delete(connection);
      return;
    }

    sendDisplayState(connection, payload);
  });
}

function sendDisplayState(connection, payload) {
  try {
    connection.send({ type: "display-state", state: payload });
  } catch {
    state.displayConnections.delete(connection);
  }
}

function sendPlayerState(player) {
  sendToPlayer(player, buildPlayerState(player));
}

function sendToPlayer(player, message) {
  if (player?.connection?.open) {
    player.connection.send(message);
  }
}

function leaderboardPlayers() {
  return Object.values(state.players).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function stripPlayer(player) {
  if (!player) return null;
  return {
    id: player.id,
    name: player.name,
    team: normalizeTeam(player.team),
    score: player.score,
    connected: Boolean(player.connected),
  };
}

function findPlayerByConnection(connection) {
  return Object.values(state.players).find((player) => player.connection === connection) || null;
}

function resolveJoiningPlayer(playerId, name) {
  const existingById = state.players[playerId];
  if (existingById) return existingById;

  const offlineSameName = Object.values(state.players).find(
    (player) => !player.connected && normalizePlayerName(player.name) === normalizePlayerName(name)
  );
  if (offlineSameName) return offlineSameName;

  return {
    id: playerId,
    name,
    team: balancedJoiningTeam(),
    score: 0,
    answers: {},
    micActive: false,
    micCall: null,
    micStream: null,
  };
}

function balancedJoiningTeam() {
  const counts = { A: 0, B: 0 };
  Object.values(state.players).forEach((player) => {
    counts[normalizeTeam(player.team)] += 1;
  });

  if (counts.A < counts.B) return "A";
  if (counts.B < counts.A) return "B";
  return Math.random() < 0.5 ? "A" : "B";
}

function uniquePlayerName(name, playerId) {
  const usedNames = new Set(
    Object.values(state.players)
      .filter((player) => player.id !== playerId)
      .map((player) => normalizePlayerName(player.name))
  );

  if (!usedNames.has(normalizePlayerName(name))) return name;

  for (let index = 2; index < 100; index += 1) {
    const candidate = `${name}（${index}）`;
    if (!usedNames.has(normalizePlayerName(candidate))) return candidate;
  }

  return `${name}（新）`;
}

function buildPlayerUrl(roomId) {
  const url = new URL("./player.html", window.location.href);
  url.searchParams.set("room", roomId);
  return url.toString();
}

function buildDisplayUrl(roomId) {
  const url = new URL("./display.html", window.location.href);
  url.searchParams.set("room", roomId);
  return url.toString();
}

function cleanPlayerName(name) {
  const cleaned = String(name || "").trim().replace(/\s+/g, " ").slice(0, 18);
  return cleaned || "無名玩家";
}

function normalizePlayerName(name) {
  return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeTeam(team) {
  return String(team || "A").trim().toUpperCase() === "B" ? "B" : "A";
}

function teamLabel(team) {
  return `${normalizeTeam(team)} 組`;
}

function hasActiveQuestion() {
  return Boolean(state.currentSong || (state.mode === "word" && state.currentWord));
}

function cleanWord(value) {
  return String(value || "").trim().replace(/\s+/g, "").slice(0, 8);
}

function randomWord() {
  return pickRandom(WORD_BANK) || "恩典";
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

function mediaKindLabel(url) {
  return isVideoMediaUrl(url) ? "授權影片" : "授權音訊";
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
