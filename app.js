const STORAGE_KEY = "guess-song-library-v8";
const SCORE_KEY = "cantonese-hymn-quiz-score-v2";
const DEFAULT_CLOUD_LIBRARY_ID = "allSonglists";
const CLOUD_LIBRARY_OPTIONS = [
  {
    id: "allSonglists",
    label: "全部歌單",
    url: "./songlists/all-songlists.json",
    loadedMessage: "已載入全部歌單",
  },
  {
    id: "hymns",
    label: "教會詩歌",
    url: "./hymns.json",
    loadedMessage: "已載入教會詩歌",
  },
  {
    id: "recentPop25",
    label: "近25年熱門新歌",
    url: "./songlists/pop-recent-25.json",
    loadedMessage: "已載入近25年熱門新歌",
  },
  {
    id: "allPop",
    label: "全部流行曲",
    url: "./songlists/pop-all.json",
    loadedMessage: "已載入全部流行曲",
  },
  {
    id: "pop80s",
    label: "80年代流行曲",
    url: "./songlists/pop-80s.json",
    loadedMessage: "已載入80年代流行曲",
  },
  {
    id: "pop90s",
    label: "90年代流行曲",
    url: "./songlists/pop-90s.json",
    loadedMessage: "已載入90年代流行曲",
  },
];
const DISPLAY_STATE_KEY = "cantonese-hymn-quiz-display-state-v1";
const ROOM_ID_KEY = "cantonese-hymn-quiz-room-id-v1";
const DEFAULT_ROOM_ID = "soyingpang-guess-song-fellowship-room";
const PEER_OPTIONS = {
  debug: 1,
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  secure: true,
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      {
        urls: ["turn:eu-0.turn.peerjs.com:3478", "turn:us-0.turn.peerjs.com:3478"],
        username: "peerjs",
        credential: "peerjsp",
      },
    ],
  },
};
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
  "youtube",
  "流行曲題庫",
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
  cloudLibraryId: DEFAULT_CLOUD_LIBRARY_ID,
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
  playbackRevision: 0,
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
  displayMicBroadcastCalls: new Map(),
  audioBroadcastSourceStream: null,
  audioBroadcastStream: null,
  audioBroadcastCalls: new Map(),
  audioBroadcastRetryTimers: new Map(),
  audioBroadcastActive: false,
  audioBroadcastStarting: false,
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
  cloudLibrarySelect: document.querySelector("#cloudLibrarySelect"),
  cloudButton: document.querySelector("#cloudButton"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  resetButton: document.querySelector("#resetButton"),
  playerCount: document.querySelector("#playerCount"),
  roomStatus: document.querySelector("#roomStatus"),
  copyPlayerLinkButton: document.querySelector("#copyPlayerLinkButton"),
  copyDisplayLinkButton: document.querySelector("#copyDisplayLinkButton"),
  audioBroadcastButton: document.querySelector("#audioBroadcastButton"),
  audioBroadcastStatus: document.querySelector("#audioBroadcastStatus"),
  playerList: document.querySelector("#playerList"),
};

populateCloudLibrarySelect();
bindEvents();
initMultiplayer();
render();
if (!state.songs.length) {
  loadCloudLibrary({ silent: true, libraryId: DEFAULT_CLOUD_LIBRARY_ID });
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
  els.audioBroadcastButton.addEventListener("click", toggleAudioBroadcast);
  els.cloudLibrarySelect?.addEventListener("change", () => {
    state.cloudLibraryId = els.cloudLibrarySelect.value || DEFAULT_CLOUD_LIBRARY_ID;
    render();
  });
  els.cloudButton?.addEventListener("click", () => loadCloudLibrary({ silent: false }));
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
  state.peer = new Peer(roomId, PEER_OPTIONS);

  state.peer.on("open", (id) => {
    state.roomReady = true;
    state.roomError = "";
    state.roomId = id;
    state.playerUrl = buildPlayerUrl(id);
    state.displayUrl = buildDisplayUrl(id);
    localStorage.setItem(ROOM_ID_KEY, id);
    render();
  });

  state.peer.on("connection", (connection) => {
    setupPlayerConnection(connection);
  });

  state.peer.on("call", (call) => {
    setupPlayerMicCall(call);
  });

  state.peer.on("disconnected", () => {
    state.roomReady = false;
    state.roomError = "房間同步服務暫時斷線，正在重連";
    render();
    try {
      state.peer.reconnect();
    } catch {
      setResult("房間同步服務斷線", "請重新整理後台再開前台", "wrong");
    }
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
    state.roomError = roomFailureMessage(error);
    setResult("房間連線失敗", "請檢查網絡、關閉重複後台，或重新整理", "wrong");
    render();
  });
}

function roomFailureMessage(error) {
  const type = String(error?.type || "").trim();
  if (type === "network") return "房間同步服務暫時連不到，請保持此頁開住或重新整理";
  if (type === "server-error" || type === "socket-error") return "PeerJS 同步服務暫時失敗，請稍後重新整理";
  if (type === "browser-incompatible") return "此瀏覽器不支援多人同步，請改用 Chrome / Safari";
  return "房間連線暫時失敗，請保持此頁開住或重新整理";
}

function setupPlayerConnection(connection) {
  connection.on("data", (message) => handlePlayerMessage(connection, message));
  connection.on("close", () => {
    if (connection.isDisplay) {
      state.displayConnections.delete(connection);
      endDisplayMicForConnection(connection.peer);
      renderPlayers();
      return;
    }

    const player = findPlayerByConnection(connection);
    if (player) {
      player.connected = false;
      player.connection = null;
      endPlayerMic(player.id, { closeCall: true, render: false });
      endAudioBroadcastForPlayer(player.id);
      syncAllMicBroadcastTargets();
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
    syncAllDisplayMicsToConnection(connection);
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
    player.remoteMode = Boolean(message.remoteMode);
    player.speakerMode = false;
    player.micActive = false;
    state.players[player.id] = player;
    connection.playerId = player.id;

    if (previousConnection && previousConnection !== connection) {
      endPlayerMic(player.id, { closeCall: true, render: false });
      endAudioBroadcastForPlayer(player.id);
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
    syncAudioBroadcastToPlayer(player);
    syncAllMicBroadcastTargets();
    return;
  }

  const player = state.players[connection.playerId];
  if (!player) return;

  if (message.type === "mic-start") {
    player.micActive = true;
    syncPlayerMicTargets(player);
    renderPlayers();
    publishDisplayState();
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
    publishDisplayState();
    return;
  }

  call.on("stream", (stream) => {
    player.micStream = stream;
    player.micActive = true;
    setResult("玩家開咪", `${player.name} 正在說話，聲音由手機端播放`, "");
    syncPlayerMicTargets(player);
    forwardPlayerMicToDisplays(player);
    renderPlayers();
    publishDisplayState();
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
  if (player.connection?.open) {
    sendToPlayer(player, { type: "mic-targets", targets: [] });
  }
  player.micCall = null;
  player.micStream = null;
  player.micActive = false;
  endDisplayMicForPlayer(playerId);

  if (closeCall && call) {
    try {
      call.close();
    } catch {
      // PeerJS may already have closed the media call.
    }
  }

  if (render) {
    renderPlayers();
    publishDisplayState();
  }
}

function syncAllMicBroadcastTargets() {
  Object.values(state.players).forEach((player) => {
    if (player.micActive) syncPlayerMicTargets(player);
  });
}

function syncPlayerMicTargets(sourcePlayer) {
  if (!sourcePlayer?.connection?.open || !sourcePlayer.micActive) return;

  sendToPlayer(sourcePlayer, {
    type: "mic-targets",
    roomId: state.roomId,
    targets: [],
  });
}

function forwardPlayerMicToDisplays(sourcePlayer) {
  state.displayConnections.forEach((connection) => {
    forwardPlayerMicToDisplay(sourcePlayer, connection);
  });
}

function syncAllDisplayMicsToConnection(connection) {
  Object.values(state.players).forEach((player) => {
    if (player.micActive && player.micStream) forwardPlayerMicToDisplay(player, connection);
  });
}

function forwardPlayerMicToDisplay(sourcePlayer, connection) {
  if (!shouldForwardPlayerMicToDisplay(sourcePlayer, connection)) return;

  const key = displayMicBroadcastKey(connection.peer, sourcePlayer.id);
  if (state.displayMicBroadcastCalls.has(key)) return;

  try {
    const call = state.peer.call(connection.peer, sourcePlayer.micStream, {
      metadata: {
        type: "display-player-mic",
        roomId: state.roomId,
        playerId: sourcePlayer.id,
        playerName: sourcePlayer.name,
      },
    });
    if (!call) return;

    call.displayPeer = connection.peer;
    call.sourcePlayerId = sourcePlayer.id;
    state.displayMicBroadcastCalls.set(key, call);
    call.on("close", () => {
      if (state.displayMicBroadcastCalls.get(key) === call) state.displayMicBroadcastCalls.delete(key);
    });
    call.on("error", () => {
      if (state.displayMicBroadcastCalls.get(key) === call) state.displayMicBroadcastCalls.delete(key);
    });
  } catch {
    state.displayMicBroadcastCalls.delete(key);
  }
}

function shouldForwardPlayerMicToDisplay(sourcePlayer, connection) {
  return Boolean(
    state.peer &&
      sourcePlayer?.id &&
      sourcePlayer.micStream &&
      sourcePlayer.micActive &&
      connection?.isDisplay &&
      connection.open &&
      connection.peer
  );
}

function endDisplayMicForPlayer(sourcePlayerId) {
  Array.from(state.displayMicBroadcastCalls.entries()).forEach(([key, call]) => {
    if (call.sourcePlayerId !== sourcePlayerId) return;
    state.displayMicBroadcastCalls.delete(key);
    closePeerMediaCall(call);
  });
}

function endDisplayMicForConnection(displayPeer) {
  Array.from(state.displayMicBroadcastCalls.entries()).forEach(([key, call]) => {
    if (call.displayPeer !== displayPeer) return;
    state.displayMicBroadcastCalls.delete(key);
    closePeerMediaCall(call);
  });
}

function displayMicBroadcastKey(displayPeer, sourcePlayerId) {
  return `${displayPeer}:${sourcePlayerId}`;
}

function closePeerMediaCall(call) {
  if (!call) return;
  try {
    call.close();
  } catch {
    // PeerJS may already have closed the media call.
  }
}

async function toggleAudioBroadcast() {
  if (state.audioBroadcastActive || state.audioBroadcastStarting) {
    stopAudioBroadcast("不在現場音訊廣播已停止");
    return;
  }

  if (!state.roomReady || isRoomBlocked()) {
    setResult("房間未準備", "請先確定固定房間已建立", "wrong");
    return;
  }

  if (!navigator.mediaDevices?.getDisplayMedia) {
    setResult("瀏覽器不支援音訊廣播", "請用桌面版 Chrome / Edge 開主持後台", "wrong");
    return;
  }

  try {
    state.audioBroadcastStarting = true;
    renderAudioBroadcastUi();
    setResult("選擇音訊來源", "請選播放 YouTube 的 Chrome 分頁，並勾選分享音訊", "");

    const sourceStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    const audioTracks = sourceStream.getAudioTracks();

    if (!audioTracks.length) {
      sourceStream.getTracks().forEach((track) => track.stop());
      state.audioBroadcastStarting = false;
      renderAudioBroadcastUi();
      setResult("沒有取得音訊", "請重新開始，選 Chrome 分頁並勾選分享音訊", "wrong");
      return;
    }

    stopAudioBroadcast("", { silent: true });
    state.audioBroadcastSourceStream = sourceStream;
    state.audioBroadcastStream = new MediaStream(audioTracks);
    state.audioBroadcastActive = true;
    state.audioBroadcastStarting = false;

    sourceStream.getTracks().forEach((track) => {
      track.addEventListener("ended", () => {
        if (state.audioBroadcastSourceStream === sourceStream) {
          stopAudioBroadcast("主持音訊分享已停止");
        }
      });
    });

    broadcastAudioToRemotePlayers();
    renderPlayers();
    renderAudioBroadcastUi();
    setResult("不在現場音訊廣播中", "只會送到選了「不在現場」的玩家手機", "correct");
  } catch (error) {
    state.audioBroadcastStarting = false;
    renderAudioBroadcastUi();
    setResult(
      error?.name === "NotAllowedError" ? "已取消音訊廣播" : "音訊廣播失敗",
      "請用桌面 Chrome / Edge，選 Chrome 分頁並勾選分享音訊",
      "wrong"
    );
  }
}

function stopAudioBroadcast(message = "不在現場音訊廣播已停止", options = {}) {
  const { silent = false } = options;
  state.audioBroadcastStarting = false;
  state.audioBroadcastActive = false;
  clearAllAudioBroadcastRetries();

  Array.from(state.audioBroadcastCalls.values()).forEach((call) => {
    try {
      call.close();
    } catch {
      // PeerJS may already have closed the call.
    }
  });
  state.audioBroadcastCalls.clear();

  state.audioBroadcastSourceStream?.getTracks().forEach((track) => track.stop());
  state.audioBroadcastStream?.getTracks().forEach((track) => track.stop());
  state.audioBroadcastSourceStream = null;
  state.audioBroadcastStream = null;

  renderAudioBroadcastUi();
  renderPlayers();
  if (!silent && message) setResult(message, "不在現場玩家將聽不到主持電腦音訊", "");
}

function broadcastAudioToRemotePlayers() {
  Object.values(state.players).forEach(syncAudioBroadcastToPlayer);
  renderAudioBroadcastUi();
}

function syncAudioBroadcastToPlayer(player) {
  if (!shouldAudioBroadcastToPlayer(player)) {
    endAudioBroadcastForPlayer(player?.id);
    return;
  }

  if (state.audioBroadcastCalls.has(player.id)) return;

  try {
    const call = state.peer.call(player.connection.peer, state.audioBroadcastStream, {
      metadata: {
        type: "host-audio-broadcast",
        roomId: state.roomId,
        playerId: player.id,
      },
    });
    if (!call) return;

    call.playerId = player.id;
    state.audioBroadcastCalls.set(player.id, call);
    call.on("close", () => {
      handleAudioBroadcastCallEnd(player.id, call, { retry: true });
    });
    call.on("error", () => {
      handleAudioBroadcastCallEnd(player.id, call, { retry: true });
    });
  } catch {
    state.audioBroadcastCalls.delete(player.id);
    queueAudioBroadcastRetry(player.id);
  }
}

function shouldAudioBroadcastToPlayer(player) {
  return Boolean(
    state.audioBroadcastActive &&
      state.audioBroadcastStream &&
      state.peer &&
      player?.remoteMode &&
      player.connected &&
      player.connection?.open &&
      player.connection?.peer
  );
}

function endAudioBroadcastForPlayer(playerId) {
  if (!playerId) return;
  clearAudioBroadcastRetry(playerId);
  const call = state.audioBroadcastCalls.get(playerId);
  state.audioBroadcastCalls.delete(playerId);
  if (!call) return;

  try {
    call.close();
  } catch {
    // PeerJS may already have closed the call.
  }
  renderAudioBroadcastUi();
}

function handleAudioBroadcastCallEnd(playerId, call, options = {}) {
  const { retry = false } = options;
  if (state.audioBroadcastCalls.get(playerId) !== call) return;

  state.audioBroadcastCalls.delete(playerId);
  renderAudioBroadcastUi();
  if (retry) queueAudioBroadcastRetry(playerId);
}

function queueAudioBroadcastRetry(playerId) {
  if (!playerId || state.audioBroadcastRetryTimers.has(playerId)) return;
  if (!shouldAudioBroadcastToPlayer(state.players[playerId])) return;

  const timer = window.setTimeout(() => {
    state.audioBroadcastRetryTimers.delete(playerId);
    syncAudioBroadcastToPlayer(state.players[playerId]);
  }, 1200);
  state.audioBroadcastRetryTimers.set(playerId, timer);
}

function clearAudioBroadcastRetry(playerId) {
  const timer = state.audioBroadcastRetryTimers.get(playerId);
  if (!timer) return;
  window.clearTimeout(timer);
  state.audioBroadcastRetryTimers.delete(playerId);
}

function clearAllAudioBroadcastRetries() {
  Array.from(state.audioBroadcastRetryTimers.values()).forEach((timer) => window.clearTimeout(timer));
  state.audioBroadcastRetryTimers.clear();
}

function renderAudioBroadcastUi() {
  if (!els.audioBroadcastButton || !els.audioBroadcastStatus) return;

  const remoteConnected = Object.values(state.players).filter((player) => player.connected && player.remoteMode).length;
  const connectedCalls = state.audioBroadcastCalls.size;
  els.audioBroadcastButton.disabled = state.audioBroadcastStarting || !state.roomReady || isRoomBlocked();
  els.audioBroadcastButton.textContent = state.audioBroadcastActive ? "停止音訊廣播" : state.audioBroadcastStarting ? "準備廣播..." : "開始音訊廣播";
  els.audioBroadcastStatus.textContent = state.audioBroadcastActive
    ? remoteConnected
      ? `不在現場聲音：廣播中 · 已送出 ${connectedCalls}/${remoteConnected} 部手機`
      : "不在現場聲音：廣播中 · 等候不在現場玩家"
    : state.audioBroadcastStarting
      ? "不在現場聲音：等待主持選擇分頁音訊"
      : "不在現場聲音：未廣播";
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
    message: `第一個${actionLabel}：${player.name}，等主持判定`,
  });
  setResult(`第一個${actionLabel}`, `${player.name}（${teamLabel(player.team)}）`, "");
  render();
  openBuzzWinnerMic(player, actionLabel);
}

function judgeBuzzWinner(isCorrect) {
  const player = state.players[state.buzzWinnerId];
  if (!player || !hasActiveQuestion()) {
    setResult("未有人搶答", "", "");
    return;
  }

  closeBuzzWinnerMic(player);

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
  state.buzzOpen = hasAvailableBuzzPlayers();
  const resultTitle = state.buzzOpen ? "未中，補答開放" : "未中";
  const resultDetail = state.buzzOpen
    ? `${player.name} 今題不能再搶；其他人可以補答`
    : `${player.name} 未中，今題已沒有其他人可補答`;
  setResult(resultTitle, resultDetail, "wrong");
  broadcastToPlayers({
    type: "result",
    questionId: state.currentQuestionId,
    correct: false,
    points: 0,
    excludedPlayerId: player.id,
    message: state.buzzOpen
      ? `${player.name} 未中，其他人可以補${actionLabel}`
      : `${player.name} 未中，今題沒有其他人可補${actionLabel}`,
  });
  render();
}

function openBuzzWinnerMic(player, actionLabel) {
  sendToPlayer(player, {
    type: "buzz-mic-open",
    questionId: state.currentQuestionId,
    message: `你搶到${actionLabel}，咪會自動開啟，請講答案`,
  });
}

function closeBuzzWinnerMic(player) {
  sendToPlayer(player, {
    type: "buzz-mic-close",
    questionId: state.currentQuestionId,
    message: "主持已判定，咪已關閉",
  });
  endPlayerMic(player.id, { closeCall: true, render: false });
}

function reopenBuzz() {
  if (!hasActiveQuestion()) {
    setResult("未有題目可以搶答", "", "");
    return;
  }

  if (hasConnectedPlayers() && !hasAvailableBuzzPlayers()) {
    setResult("沒有可補答玩家", "今題答錯過的人不能再搶，請下一題或開估", "wrong");
    render();
    return;
  }

  state.buzzWinnerId = "";
  state.buzzOpen = true;
  state.showLeaderboard = false;
  state.showWinner = false;
  setResult(state.mode === "word" ? "已開放搶唱" : "已開放搶答", state.mode === "word" ? `今題主題：${state.currentWord}` : "", "");
  render();
}

function hasAvailableBuzzPlayers() {
  if (!state.currentQuestionId) return false;
  return participantPlayers().some(
    (player) => player.connected && !player.answers?.[state.currentQuestionId]
  );
}

function hasConnectedPlayers() {
  return participantPlayers().some((player) => player.connected);
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
  state.buzzOpen = autoplay && canAutoOpenBuzz();
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
  if (!state.songs.length) return "先加入歌曲";
  if (!approvedSongs().length) return "未有已批准來源歌曲";
  return "呢個分類未有已批准歌曲";
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
    setResult("先加入一首歌", "", "");
    return;
  }

  clearClipTimer();
  state.isPlaying = true;
  state.fullPlayback = false;
  state.frontReady = true;
  state.playEndsAt = Date.now() + clipDuration(state.currentSong) * 1000;
  state.buzzOpen = canAutoOpenBuzz();
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
  if (state.mode === "buzz") state.buzzOpen = false;
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
    song.source ? `來源：${song.source}` : "",
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
  iframe.title = "YouTube 歌曲片段";
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
  url.searchParams.set("enablejsapi", "1");
  url.searchParams.set("origin", window.location.origin);
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
    if (state.mode === "buzz") state.buzzOpen = false;
    setResult("時間到", state.currentSong ? "可以開估、重播或下一題播放" : "", "");
    renderYouTubeFrame({ autoplay: false });
    render();
  }, clipDuration(state.currentSong) * 1000);
}

function canAutoOpenBuzz() {
  if (state.mode !== "buzz" || !state.currentSong || state.answered || state.buzzWinnerId) return false;
  return !hasConnectedPlayers() || hasAvailableBuzzPlayers();
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
    setResult("請檢查歌名同 YouTube 連結", "", "wrong");
    return;
  }

  if (state.editingId) {
    state.songs = state.songs.map((item) => (item.id === state.editingId ? song : item));
    setResult("已更新歌曲", song.title, "");
  } else {
    state.songs.unshift(song);
    setResult("已加入歌曲", song.title, "");
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
  els.songSubmitButton.textContent = "更新歌曲";
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
  els.songSubmitButton.textContent = "加入歌曲";
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

function populateCloudLibrarySelect() {
  if (!els.cloudLibrarySelect) return;
  els.cloudLibrarySelect.replaceChildren();
  CLOUD_LIBRARY_OPTIONS.forEach((library) => {
    const option = document.createElement("option");
    option.value = library.id;
    option.textContent = library.label;
    els.cloudLibrarySelect.append(option);
  });
  els.cloudLibrarySelect.value = cloudLibraryById(state.cloudLibraryId).id;
}

function cloudLibraryById(libraryId) {
  return CLOUD_LIBRARY_OPTIONS.find((library) => library.id === libraryId) || CLOUD_LIBRARY_OPTIONS[0];
}

function selectedCloudLibrary() {
  const selectedId = els.cloudLibrarySelect?.value || state.cloudLibraryId || DEFAULT_CLOUD_LIBRARY_ID;
  return cloudLibraryById(selectedId);
}

function activeSonglistLabel() {
  if (state.category && state.category !== "all") return state.category;
  return cloudLibraryById(state.cloudLibraryId).label || "估歌仔";
}

async function loadCloudLibrary({ silent, libraryId } = {}) {
  const library = libraryId ? cloudLibraryById(libraryId) : selectedCloudLibrary();
  state.cloudLibraryId = library.id;
  if (els.cloudLibrarySelect) els.cloudLibrarySelect.value = library.id;

  try {
    const response = await fetch(library.url, { cache: "no-store" });
    if (!response.ok) throw new Error("No cloud library");

    const incoming = await response.json();
    const songs = Array.isArray(incoming) ? incoming.map(cleanSong).filter(Boolean) : [];
    if (!songs.length) {
      if (!silent) setResult("線上歌單暫時未有歌曲", "可以先用右邊表格加入", "");
      return;
    }

    state.songs = dedupeSongs(songs);
    state.category = "all";
    state.questionBag = [];
    saveSongs();
    setResult(library.loadedMessage, `${approvedSongs().length}/${state.songs.length} 首可出題，按下一題播放開始`, "");
    render();
  } catch {
    if (!silent) setResult("載入線上歌單失敗", "請稍後再試", "wrong");
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
  if (!confirm("清空歌單同分數？")) return;
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
  all.textContent = "全部歌單";
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
  const songlistLabel = activeSonglistLabel();
  els.roundLabel.textContent = hasActiveQuestion() ? `第 ${state.round} 題` : "未有題目";
  els.quizTitle.textContent = hasWord
    ? `今題主題：${state.currentWord}`
    : hasSong
      ? state.answered
        ? state.currentSong.title
        : songlistLabel
      : state.mode === "word"
        ? "主題搶唱"
        : state.songs.length
          ? playableSongs().length
            ? `${songlistLabel} 已準備`
            : emptyPoolMessage()
          : "先加入歌曲";

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
    empty.textContent = "未有題目。貼一條 YouTube 連結，就可以開始建立歌單。";
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
    title.textContent = blindRound ? `盲抽中 · 歌曲 ${index + 1}` : song.title;
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
  const players = rosterPlayers();
  els.playerCount.textContent = `${players.length} 位`;
  els.roomStatus.textContent = state.roomError
    ? state.roomError
    : state.roomReady
      ? `固定房間：${state.roomId} · 前台 ${state.displayConnections.size} 個 · 可連線`
      : `固定房間建立中：${state.roomId || DEFAULT_ROOM_ID}`;
  els.copyPlayerLinkButton.disabled = !state.playerUrl;
  els.copyDisplayLinkButton.disabled = !state.displayUrl;
  renderAudioBroadcastUi();
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
    meta.textContent = `${teamLabel(player.team)} · ${player.connected ? "已連線" : "離線"}${
      player.micActive ? " · 開咪中" : ""
    }`;
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

    actions.append(teamSelect, stopMic);
    actions.append(remove);

    item.append(info, score, actions);

    if (player.micActive) {
      const micPanel = document.createElement("div");
      micPanel.className = "player-mic-panel";
      const micStatus = document.createElement("span");
      micStatus.textContent = player.micStream ? "手機端出聲中" : "等候手機咪連線";
      micPanel.append(micStatus);
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
  const songlistLabel = activeSonglistLabel();

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
    playbackRevision: state.playbackRevision,
    clipDuration: state.playDuration,
    currentWord: state.currentWord,
    songlistLabel,
    teamScores: { ...state.teamScores },
    buzzOpen: state.buzzOpen,
    roomReady: state.roomReady,
    roomError: state.roomError,
    roomId: state.roomId,
    playerUrl: state.playerUrl,
    showLeaderboard: state.showLeaderboard,
    showWinner: state.showWinner,
    players: leaderboardPlayers().map(stripPlayer),
    leaderboard: leaderboardPlayers().map(stripPlayer),
    buzzWinner: state.buzzWinnerId ? stripPlayer(state.players[state.buzzWinnerId]) : null,
    prompt: hasWord ? "主題搶唱" : hasSong ? `${songlistLabel} · 估歌名` : "等候主持開始",
    status: els.resultText.textContent || "",
    answer: revealed && song ? answerLabel(song) : hasWord ? `今題主題：${state.currentWord}` : "",
    title: hasWord ? state.currentWord : revealed && song ? song.title : songlistLabel,
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
  const songlistLabel = activeSonglistLabel();

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
    mediaPlaying: state.isPlaying,
    fullPlayback: state.fullPlayback,
    frontReady: state.frontReady,
    playDuration: state.playDuration,
    playEndsAt: state.playEndsAt,
    playbackRevision: state.playbackRevision,
    clipDuration: state.playDuration,
    currentWord: state.currentWord,
    songlistLabel,
    playerName: player.name,
    team: normalizeTeam(player.team),
    teamScores: { ...state.teamScores },
    buzzOpen: state.buzzOpen,
    title: hasWord ? `今題主題：${state.currentWord}` : revealed && song ? song.title : songlistLabel,
    status: els.resultText.textContent || "",
    score: player.score,
    choices: choiceOptions,
    hints: song ? getHints(song).slice(0, state.hintLevel) : [],
    videoId: song?.videoId || "",
    audioUrl: song?.audioUrl || "",
    start: song && !state.fullPlayback ? clipStart(song) : CLIP_START_SECONDS,
    end: song && !state.fullPlayback ? clipStart(song) + clipDuration(song) : 0,
    leaderboard: leaderboardPlayers().map(stripPlayer),
    buzzWinner: state.buzzWinnerId ? stripPlayer(state.players[state.buzzWinnerId]) : null,
    answered: Boolean(player.answers[state.currentQuestionId]),
    selectedAnswer: player.answers[state.currentQuestionId]?.answer || "",
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
  return participantPlayers().sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function rosterPlayers() {
  return Object.values(state.players).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function participantPlayers() {
  return Object.values(state.players);
}

function stripPlayer(player) {
  if (!player) return null;
  return {
    id: player.id,
    name: player.name,
    team: normalizeTeam(player.team),
    score: player.score,
    connected: Boolean(player.connected),
    micActive: Boolean(player.micActive),
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
    remoteMode: false,
    speakerMode: false,
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
