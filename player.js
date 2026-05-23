const PLAYER_ID_KEY = "cantonese-hymn-quiz-player-id-v1";
const PLAYER_NAME_KEY = "cantonese-hymn-quiz-player-name-v1";
const PLAYER_REMOTE_MODE_KEY = "cantonese-hymn-quiz-player-entry-mode-v1";
const DEFAULT_ROOM_ID = "soyingpang-guess-song-fellowship-room";
const ROOM_ID_CANDIDATES = [
  DEFAULT_ROOM_ID,
  `${DEFAULT_ROOM_ID}-2`,
  `${DEFAULT_ROOM_ID}-3`,
];
const RECONNECT_BASE_DELAY = 1200;
const RECONNECT_MAX_DELAY = 8000;
const CONNECTION_TIMEOUT_MS = 20000;
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
        urls: [
          "turn:eu-0.turn.peerjs.com:3478",
          "turn:eu-0.turn.peerjs.com:3478?transport=tcp",
          "turn:us-0.turn.peerjs.com:3478",
          "turn:us-0.turn.peerjs.com:3478?transport=tcp",
        ],
        username: "peerjs",
        credential: "peerjsp",
      },
    ],
  },
};
const LOCAL_VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|ogv|webm)$/i;
const SILENT_UNLOCK_AUDIO_URI =
  "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==";
const ENTRY_MODES = new Set(["onsite", "remote"]);

const params = new URLSearchParams(window.location.search);
const urlRoomId = (params.get("room") || "").trim();
const roomCandidates = urlRoomId ? [urlRoomId] : ROOM_ID_CANDIDATES;
const roomId = roomCandidates[0] || DEFAULT_ROOM_ID;
let activeRoomId = roomId;
let roomCandidateIndex = 0;
const urlName = params.get("name") || "";
const initialEntryMode = normalizeEntryMode(localStorage.getItem(PLAYER_REMOTE_MODE_KEY));
localStorage.setItem(PLAYER_REMOTE_MODE_KEY, initialEntryMode);

function normalizeEntryMode(mode) {
  return ENTRY_MODES.has(mode) ? mode : "onsite";
}

const state = {
  peer: null,
  connection: null,
  playerId: localStorage.getItem(PLAYER_ID_KEY) || crypto.randomUUID(),
  name: urlName || "",
  displayName: "",
  team: "A",
  entryNameReady: false,
  joined: false,
  connecting: false,
  reconnectAttempts: 0,
  reconnectTimer: null,
  connectionTimeout: null,
  connectionToken: "",
  game: null,
  lastResult: "",
  selectedAnswer: "",
  micStream: null,
  micCall: null,
  micActive: false,
  remoteMode: initialEntryMode === "remote",
  speakerMode: false,
  modeLocked: false,
  remoteMediaKey: "",
  remotePlaybackKey: "",
  remotePlaybackBlocked: false,
  hostAudioCall: null,
  hostAudioStream: null,
  hostAudioElement: null,
  hostAudioBlocked: false,
  hostAudioStatus: "等候玩家開咪或主持音訊",
  remoteAudioPrimed: false,
  remoteAudioPriming: false,
  remoteUnlockAudioElement: null,
  remoteAudioContext: null,
  displayMicBroadcastCalls: new Map(),
  displayMicBroadcastTargets: new Map(),
  displayMicBroadcastRetryTimers: new Map(),
};

const els = {
  joinForm: document.querySelector("#joinForm"),
  playerModeField: document.querySelector("#playerModeField"),
  playerName: document.querySelector("#playerName"),
  playerNameLabel: document.querySelector('label[for="playerName"]'),
  playerNameLine: document.querySelector("#playerName")?.closest(".guess-line"),
  playerNameNote: document.querySelector(".join-form > .join-note"),
  playerStatus: document.querySelector("#playerStatus"),
  playerScore: document.querySelector("#playerScore"),
  playerRound: document.querySelector("#playerRound"),
  phoneStatus: document.querySelector("#phoneStatus"),
  phoneTitle: document.querySelector("#phoneTitle"),
  phoneHints: document.querySelector("#phoneHints"),
  phoneChoices: document.querySelector("#phoneChoices"),
  buzzButton: document.querySelector("#buzzButton"),
  phoneResult: document.querySelector("#phoneResult"),
  micToggleButton: document.querySelector("#micToggleButton"),
  phoneMicStatus: document.querySelector("#phoneMicStatus"),
  phoneLeaderboard: document.querySelector("#phoneLeaderboard"),
  openLeaderboardButton: document.querySelector("#openLeaderboardButton"),
  closeLeaderboardButton: document.querySelector("#closeLeaderboardButton"),
  leaderboardModal: document.querySelector("#leaderboardModal"),
  onsiteModeButton: document.querySelector("#onsiteModeButton"),
  remoteModeButton: document.querySelector("#remoteModeButton"),
  speakerModeButton: document.querySelector("#speakerModeButton"),
  phoneRemotePanel: document.querySelector("#phoneRemotePanel"),
  phoneRemoteTitle: document.querySelector("#phoneRemoteTitle"),
  phoneRemoteStatus: document.querySelector("#phoneRemoteStatus"),
  phoneRemoteCountdown: document.querySelector("#phoneRemoteCountdown"),
  phoneRemoteTeams: document.querySelector("#phoneRemoteTeams"),
  phoneRemoteMic: document.querySelector("#phoneRemoteMic"),
  phoneRemoteListen: document.querySelector("#phoneRemoteListen"),
  phoneRemoteListenStatus: document.querySelector("#phoneRemoteListenStatus"),
  phoneRemoteListenButton: document.querySelector("#phoneRemoteListenButton"),
  phoneRemoteRoster: document.querySelector("#phoneRemoteRoster"),
  phoneRemoteMedia: document.querySelector("#phoneRemoteMedia"),
  phoneRemotePlayerHost: document.querySelector("#phoneRemotePlayerHost"),
  phoneRemotePlayerStatus: document.querySelector("#phoneRemotePlayerStatus"),
  phoneRemotePlayButton: document.querySelector("#phoneRemotePlayButton"),
  phoneRemoteShieldTitle: document.querySelector("#phoneRemoteShieldTitle"),
  phoneRemoteShieldNote: document.querySelector("#phoneRemoteShieldNote"),
};

const ICONS = {
  leaderboard:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4a3 3 0 0 0 3 3"/><path d="M17 6h3a3 3 0 0 1-3 3"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6 6 18"/></svg>',
  mic:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>',
  micOff:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 1 3 3v4"/><path d="M9 9v3a3 3 0 0 0 5.1 2.1"/><path d="M5 11a7 7 0 0 0 11 5.7"/><path d="M19 11a7 7 0 0 1-.7 3"/><path d="M12 18v3"/><path d="M4 4l16 16"/></svg>',
  volume:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M16 9.5a4 4 0 0 1 0 5"/><path d="M18.5 7a7 7 0 0 1 0 10"/></svg>',
  play:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7-11-7Z"/></svg>',
  sync:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M18.5 9A7 7 0 0 0 6.4 6.8L4 9"/><path d="M5.5 15A7 7 0 0 0 17.6 17.2L20 15"/></svg>',
};

localStorage.setItem(PLAYER_ID_KEY, state.playerId);
els.playerName.value = state.name;
showNameStep();
applyPlayerMode();

els.joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  joinGame();
});

els.buzzButton.addEventListener("click", () => {
  send({ type: "buzz", questionId: state.game?.questionId });
  els.buzzButton.disabled = true;
  els.phoneResult.textContent = state.game?.mode === "word" ? "已送出搶唱" : "已送出搶答";
});

els.micToggleButton.addEventListener("click", () => {
  if (state.micActive) {
    stopMic();
    return;
  }

  startMic();
});

els.openLeaderboardButton.addEventListener("click", openLeaderboard);
els.closeLeaderboardButton.addEventListener("click", closeLeaderboard);
els.onsiteModeButton.addEventListener("click", () => {
  primeRemoteListening();
  setPlayerMode("onsite");
});
els.remoteModeButton.addEventListener("click", () => {
  primeRemoteListening();
  setPlayerMode("remote");
});
els.speakerModeButton?.addEventListener("click", () => {
  primeRemoteListening();
  setPlayerMode("onsite");
});
els.phoneRemotePlayButton.addEventListener("click", () => {
  primeRemoteListening();
  retryRemotePlayback();
});
els.phoneRemoteListenButton.addEventListener("click", () => {
  primeRemoteListening();
  playHostAudioBroadcast();
});
setIconButton(els.openLeaderboardButton, "leaderboard", "排行榜");
setIconButton(els.closeLeaderboardButton, "close", "關閉排行榜");
setListenButtonState(false);
updateMicUi();
els.leaderboardModal.addEventListener("click", (event) => {
  if (event.target === els.leaderboardModal) closeLeaderboard();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.leaderboardModal.hidden) closeLeaderboard();
});

window.addEventListener("online", () => {
  const shouldReconnect =
    (state.joined || (state.entryNameReady && state.modeLocked)) && !state.connection?.open;
  if (shouldReconnect) scheduleReconnect("網絡已恢復");
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.joined && !state.connection?.open && !state.connecting) {
    scheduleReconnect("正在恢復連線");
  }
});

window.addEventListener("beforeunload", () => {
  stopMic({ notifyHost: false, message: "咪已關閉" });
  stopHostAudioBroadcast({ closeCall: true, message: defaultListenStatus() });
});

window.setInterval(updateLiveClock, 700);

if (!roomId) {
  setStatus("QR 連結缺少房間碼，請重新掃描");
} else {
  setStatus("請輸入名字加入");
}

function joinGame() {
  const name = els.playerName.value.trim();
  if (!name) {
    setStatus("請先輸入名字");
    return;
  }

  state.name = name.slice(0, 18);
  state.displayName = "";
  state.entryNameReady = true;
  localStorage.setItem(PLAYER_NAME_KEY, state.name);
  showModeStep();
}

function showNameStep() {
  state.entryNameReady = false;
  if (els.playerModeField) els.playerModeField.hidden = true;
  if (els.playerNameLabel) els.playerNameLabel.hidden = false;
  if (els.playerNameLine) els.playerNameLine.hidden = false;
  if (els.playerNameNote) els.playerNameNote.hidden = false;
}

function showModeStep() {
  if (els.playerModeField) els.playerModeField.hidden = false;
  if (els.playerNameLabel) els.playerNameLabel.hidden = true;
  if (els.playerNameLine) els.playerNameLine.hidden = true;
  if (els.playerNameNote) els.playerNameNote.hidden = true;
  setStatus("請選擇你是否在現場");
  applyPlayerMode();
}

function startJoinWithSelectedMode() {
  if (!state.entryNameReady || state.joined || state.connecting) return;
  lockPlayerMode();
  els.joinForm.hidden = true;
  connectToRoom({ resetAttempts: true });
}

function showJoinFormAfterFailure() {
  els.joinForm.hidden = false;
  if (state.entryNameReady) showModeStep();
  else showNameStep();
}

function connectToRoom({ resetAttempts = false } = {}) {
  if (!window.Peer) {
    setStatus("未能載入連線工具，請重新整理");
    unlockPlayerMode();
    showJoinFormAfterFailure();
    return;
  }

  clearTimeout(state.reconnectTimer);
  state.reconnectTimer = null;
  if (resetAttempts) {
    state.reconnectAttempts = 0;
    roomCandidateIndex = 0;
  }
  activeRoomId = roomCandidates[roomCandidateIndex] || roomId;

  const token = crypto.randomUUID();
  state.connectionToken = token;
  state.connecting = true;
  closeCurrentPeer();
  setStatus(state.reconnectAttempts ? "重新連線中..." : "連線中...");
  state.connectionTimeout = window.setTimeout(() => {
    if (state.connectionToken !== token || state.joined) return;
    handleConnectionFailure("連線逾時，請確認後台開住、關閉手機 VPN 後再試");
  }, CONNECTION_TIMEOUT_MS);

  const peer = new Peer(undefined, PEER_OPTIONS);
  state.peer = peer;

  peer.on("open", () => {
    if (state.connectionToken !== token) return;
    const connection = peer.connect(activeRoomId, { reliable: true });
    state.connection = connection;
    bindRoomConnection(connection, token);
  });

  peer.on("call", (call) => {
    if (state.connectionToken !== token) {
      closePeerCall(call);
      return;
    }
    handlePeerCall(call);
  });

  peer.on("disconnected", () => {
    if (state.connectionToken !== token) return;
    handleConnectionFailure("同步服務斷線");
  });

  peer.on("close", () => {
    if (state.connectionToken !== token || state.reconnectTimer) return;
    handleConnectionFailure("同步服務已關閉");
  });

  peer.on("error", (error) => {
    if (state.connectionToken !== token) return;
    handleConnectionFailure(connectionFailureMessage(error));
  });
}

function bindRoomConnection(connection, token) {
  connection.on("open", () => {
    if (state.connectionToken !== token) return;
    clearConnectionTimeout();
    state.joined = true;
    state.connecting = false;
    state.reconnectAttempts = 0;
    lockPlayerMode();
    send({
      type: "join",
      playerId: state.playerId,
      name: state.name,
      remoteMode: state.remoteMode,
      speakerMode: false,
    });
    setStatus("已連線，等候同步");
    updateMicUi();
  });

  connection.on("data", (message) => {
    if (state.connectionToken !== token) return;
    handleMessage(message);
  });

  connection.on("close", () => {
    if (state.connectionToken !== token) return;
    state.connection = null;
    state.connecting = false;
    updateMicUi();
    if (state.joined) scheduleReconnect("連線中斷");
    else handleConnectionFailure("連線失敗，請確認主持人後台仍然開住");
  });

  connection.on("error", (error) => {
    if (state.connectionToken !== token) return;
    handleConnectionFailure(connectionFailureMessage(error));
  });
}

function closeCurrentPeer() {
  clearConnectionTimeout();
  stopMic({ notifyHost: false, message: "重新連線，咪已關閉" });
  stopHostAudioBroadcast({ closeCall: true, message: defaultListenStatus() });

  try {
    state.connection?.close();
  } catch {
    // The connection may already be closed by the browser or network.
  }

  try {
    state.peer?.destroy();
  } catch {
    // PeerJS can throw if the peer has already torn itself down.
  }

  state.connection = null;
  state.peer = null;
  updateMicUi();
}

function handleConnectionFailure(message) {
  clearConnectionTimeout();
  state.connecting = false;
  const canRetryWithoutReset = Boolean(state.entryNameReady && state.modeLocked && roomId && state.name);
  if (!state.joined && canRetryWithoutReset) advanceRoomCandidate();
  if (state.joined || canRetryWithoutReset) {
    scheduleReconnect(message);
    return;
  }

  setStatus(message);
  updateMicUi();
  unlockPlayerMode();
  showJoinFormAfterFailure();
}

function clearConnectionTimeout() {
  clearTimeout(state.connectionTimeout);
  state.connectionTimeout = null;
}

function connectionFailureMessage(error) {
  const type = String(error?.type || "").trim();
  if (type === "peer-unavailable") return "找不到主持房間，請確認後台保持開住，或關閉手機 VPN 再試";
  if (type === "network") return "手機網絡 / VPN 暫時連不到同步服務";
  if (type === "browser-incompatible") return "連線失敗：這個手機瀏覽器不支援同步連線";
  return "連線失敗，請確認主持人後台仍然開住，或關閉 VPN 再試";
}

function scheduleReconnect(message) {
  if (!activeRoomId || !state.name) {
    setStatus(`${message}，請重新掃 QR 加入`);
    unlockPlayerMode();
    showJoinFormAfterFailure();
    return;
  }

  if (navigator.onLine === false) {
    state.connecting = true;
    setStatus(`${message}，等候網絡恢復`);
    return;
  }

  clearTimeout(state.reconnectTimer);
  state.connecting = true;
  state.reconnectAttempts += 1;
  const delay = Math.min(RECONNECT_MAX_DELAY, RECONNECT_BASE_DELAY * state.reconnectAttempts);
  setStatus(`${message}，${Math.ceil(delay / 1000)} 秒後自動重連`);
  state.reconnectTimer = window.setTimeout(() => {
    state.reconnectTimer = null;
    connectToRoom();
  }, delay);
}

function advanceRoomCandidate() {
  if (roomCandidates.length <= 1) return;
  roomCandidateIndex = (roomCandidateIndex + 1) % roomCandidates.length;
  activeRoomId = roomCandidates[roomCandidateIndex] || roomId;
}

function handleMessage(message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "state") {
    const previousQuestionId = state.game?.questionId;
    state.game = message;
    state.displayName = message.playerName || state.name;
    state.team = normalizeTeam(message.team);
    state.joined = true;
    state.connecting = false;
    state.reconnectAttempts = 0;
    lockPlayerMode();
    els.joinForm.hidden = true;
    setStatus(joinedStatus());
    if (previousQuestionId !== message.questionId) {
      state.lastResult = "";
      state.selectedAnswer = "";
    }
    if (message.selectedAnswer) state.selectedAnswer = message.selectedAnswer;
    renderGame();
    updateMicUi();
  }

  if (message.type === "result" && message.questionId === state.game?.questionId) {
    state.lastResult = message.excludedPlayerId === state.playerId
      ? "你今題已答錯，不能再補答"
      : message.message || "";
    renderGame();
  }

  if (message.type === "mic-targets") {
    syncDisplayMicTargets(message.targets);
  }

  if (message.type === "buzz-mic-open" && message.questionId === state.game?.questionId) {
    setMicStatus(message.message || "你搶到，正在開咪");
    startMic({ requestedByHost: true });
  }

  if (message.type === "buzz-mic-close") {
    const status = message.message || "主持已收咪";
    if (state.micActive || state.micCall || state.micStream) {
      stopMic({ notifyHost: false, message: status });
    } else {
      setMicStatus(status);
      updateMicUi();
    }
  }
}

async function startMic(options = {}) {
  const { requestedByHost = false } = options;
  if (state.micActive) {
    setMicStatus(requestedByHost ? "你已開咪，請講答案" : "咪已開啟");
    updateMicUi();
    return;
  }

  if (!state.joined || !state.peer || !state.connection?.open) {
    setMicStatus("連線後才可開咪");
    updateMicUi();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setMicStatus("這部手機瀏覽器不支援開咪");
    return;
  }

  try {
    setMicStatus("請允許使用咪高峰");
    updateMicUi({ busy: true });
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    const call = state.peer.call(activeRoomId, stream, {
      metadata: {
        type: "player-mic",
        playerId: state.playerId,
        name: state.displayName || state.name,
      },
    });

    if (!call) throw new Error("Mic call failed");

    state.micStream = stream;
    state.micCall = call;
    state.micActive = true;
    bindMicCall(call);
    send({ type: "mic-start", playerId: state.playerId });
    setMicStatus("咪已開啟");
    updateMicUi();
  } catch (error) {
    stopMic({ notifyHost: false, message: micErrorMessage(error) });
  }
}

function bindMicCall(call) {
  call.on("close", () => {
    if (state.micCall === call) stopMic({ notifyHost: false, message: "主持已收咪" });
  });

  call.on("error", () => {
    if (state.micCall === call) stopMic({ notifyHost: true, message: "咪高峰連線中斷" });
  });
}

function stopMic(options = {}) {
  const { notifyHost = true, message = "咪已關閉" } = options;
  const call = state.micCall;
  const stream = state.micStream;
  state.micCall = null;
  state.micStream = null;
  state.micActive = false;

  if (call) {
    try {
      call.close();
    } catch {
      // PeerJS may already have closed the media call.
    }
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  clearDisplayMicBroadcasts();

  if (notifyHost) send({ type: "mic-stop", playerId: state.playerId });
  setMicStatus(message);
  updateMicUi();
}

function syncDisplayMicTargets(targets = []) {
  const normalizedTargets = Array.isArray(targets) ? targets : [];
  const ownPeerId = state.peer?.id || "";
  const targetsByPeerId = new Map();

  normalizedTargets.forEach((target) => {
    const peerId = String(target?.peerId || "");
    if (!peerId || peerId === ownPeerId) return;
    targetsByPeerId.set(peerId, target);
  });
  state.displayMicBroadcastTargets = targetsByPeerId;

  Array.from(state.displayMicBroadcastCalls.entries()).forEach(([peerId, call]) => {
    if (targetsByPeerId.has(peerId)) return;
    state.displayMicBroadcastCalls.delete(peerId);
    closePeerCall(call);
  });

  Array.from(state.displayMicBroadcastRetryTimers.keys()).forEach((peerId) => {
    if (targetsByPeerId.has(peerId)) return;
    clearDisplayMicRetry(peerId);
  });

  if (!state.micActive || !state.micStream || !state.peer) {
    clearDisplayMicBroadcasts();
    return;
  }

  targetsByPeerId.forEach((target) => {
    ensureDisplayMicBroadcast(target);
  });
}

function ensureDisplayMicBroadcast(target) {
  const peerId = String(target?.peerId || "");
  if (!peerId || state.displayMicBroadcastCalls.has(peerId)) return;
  if (!state.micActive || !state.micStream || !state.peer) return;

  try {
    const call = state.peer.call(peerId, state.micStream, {
      metadata: {
        type: "display-player-mic",
        roomId: activeRoomId,
        playerId: state.playerId,
        playerName: state.displayName || state.name || "Open mic",
        targetType: "display",
      },
    });

    if (!call) {
      scheduleDisplayMicRetry(peerId);
      return;
    }

    clearDisplayMicRetry(peerId);
    state.displayMicBroadcastCalls.set(peerId, call);
    call.on("close", () => removeDisplayMicBroadcast(peerId, call, { retry: true }));
    call.on("error", () => removeDisplayMicBroadcast(peerId, call, { retry: true }));
  } catch {
    state.displayMicBroadcastCalls.delete(peerId);
    scheduleDisplayMicRetry(peerId);
  }
}

function removeDisplayMicBroadcast(peerId, call, options = {}) {
  const { retry = false } = options;
  if (state.displayMicBroadcastCalls.get(peerId) === call) {
    state.displayMicBroadcastCalls.delete(peerId);
    if (retry) scheduleDisplayMicRetry(peerId);
  }
}

function scheduleDisplayMicRetry(peerId) {
  if (!peerId || state.displayMicBroadcastRetryTimers.has(peerId)) return;
  if (!state.micActive || !state.micStream || !state.peer) return;
  if (!state.displayMicBroadcastTargets.has(peerId)) return;

  const timer = window.setTimeout(() => {
    state.displayMicBroadcastRetryTimers.delete(peerId);
    ensureDisplayMicBroadcast(state.displayMicBroadcastTargets.get(peerId));
  }, 1200);
  state.displayMicBroadcastRetryTimers.set(peerId, timer);
}

function clearDisplayMicRetry(peerId) {
  const timer = state.displayMicBroadcastRetryTimers.get(peerId);
  if (!timer) return;
  window.clearTimeout(timer);
  state.displayMicBroadcastRetryTimers.delete(peerId);
}

function clearDisplayMicBroadcasts() {
  Array.from(state.displayMicBroadcastRetryTimers.values()).forEach((timer) => window.clearTimeout(timer));
  state.displayMicBroadcastRetryTimers.clear();
  state.displayMicBroadcastTargets.clear();
  Array.from(state.displayMicBroadcastCalls.values()).forEach(closePeerCall);
  state.displayMicBroadcastCalls.clear();
}

function micErrorMessage(error) {
  if (error?.name === "NotAllowedError") return "未允許使用咪高峰";
  if (error?.name === "NotFoundError") return "找不到手機咪高峰";
  return "開咪失敗，請再試";
}

function setIconButton(button, iconName, label) {
  if (!button) return;
  const icon = ICONS[iconName] || "";
  button.innerHTML = `${icon}<span class="visually-hidden">${label}</span>`;
  button.classList.add("icon-action-button");
  button.setAttribute("aria-label", label);
  button.title = label;
}

function setListenButtonState(needsUnlock) {
  const button = els.phoneRemoteListenButton;
  if (!button) return;

  const icon = ICONS.volume || "";
  const visibleLabel = needsUnlock ? "開聲" : "收聽";
  const label = needsUnlock ? "啟用手機收聽" : "手機收聽已準備";
  button.innerHTML = `${icon}<span class="phone-listen-label">${visibleLabel}</span><span class="visually-hidden">${label}</span>`;
  button.classList.add("icon-action-button");
  button.classList.toggle("is-needed", needsUnlock);
  button.setAttribute("aria-label", label);
  button.title = label;
}

function setMicButton(button, iconName, label, visibleLabel, live) {
  if (!button) return;
  const icon = ICONS[iconName] || "";
  const liveBadge = live ? '<span class="mic-live-dot">LIVE</span>' : "";
  button.innerHTML = `${icon}<span class="mic-label">${visibleLabel}</span>${liveBadge}<span class="visually-hidden">${label}</span>`;
  button.classList.add("icon-action-button");
  button.setAttribute("aria-label", label);
  button.title = label;
}

function updateMicUi(options = {}) {
  const { busy = false } = options;
  const canUseMic = Boolean(state.joined && state.connection?.open && state.peer);
  els.micToggleButton.disabled = busy || !canUseMic;
  setMicButton(
    els.micToggleButton,
    state.micActive ? "micOff" : "mic",
    state.micActive ? "關咪" : "開咪對話",
    state.micActive ? "收咪" : "開咪",
    state.micActive,
  );
  els.micToggleButton.classList.toggle("is-live", state.micActive);
  if (!canUseMic && !state.micActive) setMicStatus("連線後可開咪");
}

function setMicStatus(message) {
  els.phoneMicStatus.textContent = message;
}

function configureHiddenAudioElement(audio) {
  audio.autoplay = true;
  audio.controls = false;
  audio.hidden = true;
  audio.playsInline = true;
  return audio;
}

function ensureRemoteUnlockAudioElement() {
  let audio = state.remoteUnlockAudioElement;
  if (!audio) {
    audio = configureHiddenAudioElement(document.createElement("audio"));
    audio.preload = "auto";
    audio.src = SILENT_UNLOCK_AUDIO_URI;
    state.remoteUnlockAudioElement = audio;
  }

  if (!audio.isConnected) document.body.append(audio);
  return audio;
}

function primeRemoteListening() {
  if (state.hostAudioStream) {
    state.remoteAudioPrimed = true;
    playHostAudioBroadcast();
    return Promise.resolve(true);
  }

  if (state.remoteAudioPrimed || state.remoteAudioPriming) return Promise.resolve(state.remoteAudioPrimed);

  state.remoteAudioPriming = true;
  const tasks = [];
  let synchronousUnlock = false;
  const audio = ensureRemoteUnlockAudioElement();

  try {
    audio.pause();
    audio.srcObject = null;
    audio.src = SILENT_UNLOCK_AUDIO_URI;
    audio.muted = false;
    audio.volume = 1;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise?.then) tasks.push(playPromise);
    else synchronousUnlock = true;
  } catch {
    // Some browsers only unlock via Web Audio; try that path below.
  }

  try {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    if (AudioContextConstructor) {
      if (!state.remoteAudioContext) state.remoteAudioContext = new AudioContextConstructor();
      const context = state.remoteAudioContext;
      if (context.state === "suspended") tasks.push(context.resume());
      else synchronousUnlock = true;
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = context.createBuffer(1, 1, context.sampleRate || 44100);
      gain.gain.value = 0;
      source.connect(gain).connect(context.destination);
      source.start(0);
    }
  } catch {
    // If the browser refuses this unlock path, the visible button remains as fallback.
  }

  if (!tasks.length) return finishRemoteAudioPriming(synchronousUnlock);

  return Promise.allSettled(tasks).then((results) => {
    const unlocked = results.some((result) => result.status === "fulfilled");
    return finishRemoteAudioPriming(unlocked);
  });
}

function finishRemoteAudioPriming(unlocked) {
  state.remoteAudioPriming = false;
  state.remoteAudioPrimed = state.remoteAudioPrimed || Boolean(unlocked);

  const audio = state.remoteUnlockAudioElement;
  if (audio && !state.hostAudioStream) {
    audio.pause();
    audio.currentTime = 0;
  }

  if (isPhoneAudioListener() && state.joined && !state.hostAudioStream) {
    setHostAudioStatus(state.remoteAudioPrimed ? primedListenStatus() : defaultListenStatus());
  } else {
    renderHostAudioBroadcastUi();
  }

  return Promise.resolve(state.remoteAudioPrimed);
}

function handlePeerCall(call) {
  if (call?.metadata?.type === "remote-player-mic-broadcast") {
    closePeerCall(call);
    return;
  }

  if (call?.metadata?.type !== "host-audio-broadcast") {
    closePeerCall(call);
    return;
  }

  if (!state.remoteMode || !state.joined || call.metadata?.roomId !== activeRoomId) {
    closePeerCall(call);
    return;
  }

  stopHostAudioBroadcast({ closeCall: true, message: "正在接駁主持音訊" });
  state.hostAudioCall = call;
  state.hostAudioBlocked = false;
  setHostAudioStatus("正在接駁主持音訊");

  call.on("stream", (stream) => {
    if (state.hostAudioCall !== call) return;
    attachHostAudioBroadcastStream(stream);
  });

  call.on("close", () => {
    if (state.hostAudioCall === call) {
      stopHostAudioBroadcast({ closeCall: false, message: "主持音訊廣播已停止" });
    }
  });

  call.on("error", () => {
    if (state.hostAudioCall === call) {
      stopHostAudioBroadcast({ closeCall: false, message: "主持音訊連線中斷" });
    }
  });

  try {
    call.answer();
  } catch {
    stopHostAudioBroadcast({ closeCall: true, message: "無法接駁主持音訊" });
  }
}

function attachHostAudioBroadcastStream(stream) {
  if (!stream?.getAudioTracks?.().length) {
    stopHostAudioBroadcast({ closeCall: true, message: "主持音訊沒有音軌" });
    return;
  }

  const audio = configureHiddenAudioElement(state.remoteUnlockAudioElement || document.createElement("audio"));
  state.remoteUnlockAudioElement = audio;

  const previousAudio = state.hostAudioElement;
  if (previousAudio && previousAudio !== audio) {
    previousAudio.pause();
    previousAudio.srcObject = null;
    previousAudio.remove();
  }

  state.hostAudioStream = stream;
  state.hostAudioBlocked = false;

  audio.pause();
  audio.srcObject = null;
  audio.removeAttribute("src");
  audio.load();
  audio.srcObject = stream;
  audio.onplaying = () => {
    if (state.hostAudioElement !== audio) return;
    state.hostAudioBlocked = false;
    setHostAudioStatus("正在收聽現場聲音");
  };
  audio.onpause = () => {
    if (state.hostAudioElement !== audio || !state.hostAudioStream) return;
    state.hostAudioBlocked = true;
    setHostAudioStatus("請按「啟用收聽」");
  };
  audio.onerror = () => {
    if (state.hostAudioElement !== audio) return;
    state.hostAudioBlocked = true;
    setHostAudioStatus("收聽失敗，請再按一次");
  };

  state.hostAudioElement = audio;
  els.phoneRemoteListen?.append(audio);
  stream.getTracks().forEach((track) => {
    track.addEventListener("ended", () => {
      if (state.hostAudioStream === stream) {
        stopHostAudioBroadcast({ closeCall: false, message: "主持音訊廣播已停止" });
      }
    });
  });

  playHostAudioBroadcast();
}

function handleVoiceBroadcastCall(call) {
  closePeerCall(call);
  return;

  if (!state.joined || call.metadata?.roomId !== activeRoomId) {
    closePeerCall(call);
    return;
  }

  const sourcePlayerId = String(call.metadata?.sourcePlayerId || call.peer || crypto.randomUUID());
  if (sourcePlayerId === state.playerId) {
    closePeerCall(call);
    return;
  }

  call.on("stream", (stream) => {
    const previousCall = state.voiceBroadcastCalls.get(sourcePlayerId);
    if (previousCall && previousCall !== call) closePeerCall(previousCall);
    state.voiceBroadcastCalls.set(sourcePlayerId, call);
    attachVoiceBroadcastStream(sourcePlayerId, stream, call.metadata?.sourcePlayerName || "開咪玩家");
  });

  call.on("close", () => {
    if (state.voiceBroadcastCalls.get(sourcePlayerId) === call) {
      stopVoiceBroadcast(sourcePlayerId, { closeCall: false });
    }
  });

  call.on("error", () => {
    if (state.voiceBroadcastCalls.get(sourcePlayerId) === call) {
      stopVoiceBroadcast(sourcePlayerId, { closeCall: false });
    }
  });

  try {
    call.answer();
  } catch {
    closePeerCall(call);
  }
}

function attachVoiceBroadcastStream(sourcePlayerId, stream, sourceName) {
  if (!stream?.getAudioTracks?.().length) {
    stopVoiceBroadcast(sourcePlayerId, { closeCall: true });
    return;
  }

  const previousAudio = state.voiceBroadcastElements.get(sourcePlayerId);
  if (previousAudio) {
    previousAudio.pause();
    previousAudio.srcObject = null;
    previousAudio.remove();
  }
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.controls = false;
  audio.playsInline = true;
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "");
  audio.style.position = "absolute";
  audio.style.left = "-9999px";
  audio.style.width = "1px";
  audio.style.height = "1px";
  audio.style.opacity = "0";
  audio.style.pointerEvents = "none";
  audio.srcObject = stream;
  audio.dataset.sourceName = sourceName;
  state.voiceBroadcastStreams.set(sourcePlayerId, stream);
  audio.defaultMuted = false;
  audio.muted = false;
  audio.volume = 1;
  audio.addEventListener("playing", () => {
    state.voiceBroadcastBlocked = false;
    renderHostAudioBroadcastUi();
  });
  audio.addEventListener("pause", () => {
    if (state.voiceBroadcastElements.get(sourcePlayerId) !== audio) return;
    state.voiceBroadcastBlocked = true;
    setHostAudioStatus("請按「啟用收聽」");
  });
  audio.addEventListener("error", () => {
    if (state.voiceBroadcastElements.get(sourcePlayerId) !== audio) return;
    state.voiceBroadcastBlocked = true;
    setHostAudioStatus("請按「啟用收聽」");
  });

  audio.addEventListener("loadedmetadata", playVoiceBroadcasts, { once: true });
  audio.addEventListener("canplay", playVoiceBroadcasts, { once: true });

  state.voiceBroadcastElements.set(sourcePlayerId, audio);
  els.phoneRemoteListen?.append(audio);
  setHostAudioStatus(`${sourceName} 開咪中`);
  stream.getTracks().forEach((track) => {
    track.addEventListener("ended", () => stopVoiceBroadcast(sourcePlayerId, { closeCall: false }));
  });

  playVoiceBroadcasts();
}

function playHostAudioBroadcast() {
  const audio = state.hostAudioElement;
  if (!audio || !state.hostAudioStream) {
    state.hostAudioBlocked = false;
    setHostAudioStatus(defaultListenStatus());
    return;
  }

  audio.muted = false;
  audio.volume = 1;
  setHostAudioStatus("正在啟用現場聲音");

  const playPromise = audio.play();
  if (!playPromise?.then) {
    state.hostAudioBlocked = false;
    setHostAudioStatus("正在收聽現場聲音");
    return;
  }

  playPromise
    .then(() => {
      state.hostAudioBlocked = false;
      setHostAudioStatus("正在收聽現場聲音");
    })
    .catch(() => {
      state.hostAudioBlocked = true;
      setHostAudioStatus("請按「啟用收聽」");
    });
}

function playVoiceBroadcasts() {
  if (!state.voiceBroadcastElements.size) {
    state.voiceBroadcastBlocked = false;
    renderHostAudioBroadcastUi();
    return;
  }

  state.voiceBroadcastBlocked = false;
  Array.from(state.voiceBroadcastElements.values()).forEach((audio) => {
    audio.muted = false;
    audio.volume = 1;
    const playPromise = audio.play();
    if (playPromise?.then) {
      playPromise
        .then(() => {
          state.remoteAudioPrimed = true;
          state.voiceBroadcastBlocked = false;
          renderHostAudioBroadcastUi();
        })
        .catch(() => {
          state.voiceBroadcastBlocked = true;
          setHostAudioStatus("請按開聲收聽玩家說話");
        });
    } else {
      state.remoteAudioPrimed = true;
    }
  });
  renderHostAudioBroadcastUi();
}

function stopHostAudioBroadcast(options = {}) {
  const { closeCall = true, message = defaultListenStatus() } = options;
  const call = state.hostAudioCall;
  const stream = state.hostAudioStream;
  const audio = state.hostAudioElement;

  state.hostAudioCall = null;
  state.hostAudioStream = null;
  state.hostAudioElement = null;
  state.hostAudioBlocked = false;

  if (closeCall) closePeerCall(call);

  if (audio) {
    audio.pause();
    audio.srcObject = null;
    audio.onplaying = null;
    audio.onpause = null;
    audio.onerror = null;
    if (audio === state.remoteUnlockAudioElement) {
      audio.src = SILENT_UNLOCK_AUDIO_URI;
      if (!audio.isConnected) document.body.append(audio);
    } else {
      audio.remove();
    }
  }

  stream?.getTracks?.().forEach((track) => track.stop());
  setHostAudioStatus(message);
}

function stopVoiceBroadcast(sourcePlayerId, options = {}) {
  const { closeCall = true } = options;
  const call = state.voiceBroadcastCalls.get(sourcePlayerId);
  const audio = state.voiceBroadcastElements.get(sourcePlayerId);

  state.voiceBroadcastCalls.delete(sourcePlayerId);
  state.voiceBroadcastElements.delete(sourcePlayerId);
  state.voiceBroadcastStreams.delete(sourcePlayerId);

  if (closeCall) closePeerCall(call);

  if (audio) {
    const stream = audio.srcObject;
    audio.pause();
    audio.srcObject = null;
    audio.remove();
    stream?.getTracks?.().forEach((track) => track.stop());
  }

  state.voiceBroadcastBlocked = false;
  renderHostAudioBroadcastUi();
}

function stopAllVoiceBroadcasts() {
  Array.from(state.voiceBroadcastCalls.keys()).forEach((sourcePlayerId) => {
    stopVoiceBroadcast(sourcePlayerId, { closeCall: true });
  });
}

function closePeerCall(call) {
  if (!call) return;
  try {
    call.close();
  } catch {
    // PeerJS may already have closed the media call.
  }
}

function setHostAudioStatus(message) {
  state.hostAudioStatus = message;
  renderHostAudioBroadcastUi();
}

function isPhoneAudioListener() {
  // Host routing excludes the speaking phone, so every other joined phone can listen.
  return true;
}

function defaultListenStatus() {
  if (state.remoteMode) return "等候玩家開咪或主持音訊";
  return "等候其他手機開咪";
}

function primedListenStatus() {
  if (state.remoteMode) return "已啟用自動收聽，等候玩家開咪或主持音訊";
  return "已啟用手機收聽，等候其他手機開咪";
}

function renderHostAudioBroadcastUi() {
  if (!els.phoneRemoteListenStatus || !els.phoneRemoteListenButton) return;

  if (!isPhoneAudioListener() || !state.joined) {
    els.phoneRemoteListenStatus.textContent = "入房後可收聽其他手機開咪";
    els.phoneRemoteListenButton.hidden = true;
    els.phoneRemoteListen?.classList.remove("needs-unlock");
    setListenButtonState(false);
    return;
  }

  const hasHostAudio = Boolean(state.hostAudioStream);
  const hasPlayableAudio = hasHostAudio;
  const needsUnlock = Boolean(hasHostAudio && (state.hostAudioBlocked || !state.remoteAudioPrimed));
  const waitingForAudio = !hasPlayableAudio;
  const hasDefaultWaitingStatus =
    !state.hostAudioStatus ||
    ["等候主持音訊廣播", "等候玩家開咪或主持音訊", "等候玩家開咪", "等候其他手機開咪"].includes(state.hostAudioStatus);
  els.phoneRemoteListenStatus.textContent =
    waitingForAudio && state.remoteAudioPriming
      ? "正在啟用手機出聲"
      : waitingForAudio && state.remoteAudioPrimed && hasDefaultWaitingStatus
      ? primedListenStatus()
      : state.hostAudioStatus || defaultListenStatus();
  els.phoneRemoteListen?.classList.toggle("needs-unlock", needsUnlock);
  setListenButtonState(needsUnlock);
  els.phoneRemoteListenButton.hidden = !needsUnlock;
  els.phoneRemoteListenButton.disabled = !needsUnlock;
}

function setPlayerMode(mode) {
  if (state.modeLocked || state.joined || state.connecting) return;
  const nextMode = normalizeEntryMode(mode);
  state.remoteMode = nextMode === "remote";
  state.speakerMode = false;
  localStorage.setItem(PLAYER_REMOTE_MODE_KEY, nextMode);
  applyPlayerMode();
  startJoinWithSelectedMode();
}

function lockPlayerMode() {
  state.modeLocked = true;
  document.body.classList.add("is-mode-locked");
  els.onsiteModeButton.disabled = true;
  els.remoteModeButton.disabled = true;
  if (els.speakerModeButton) els.speakerModeButton.disabled = true;
  applyPlayerMode();
}

function unlockPlayerMode() {
  if (state.joined) return;
  state.modeLocked = false;
  document.body.classList.remove("is-mode-locked");
  els.onsiteModeButton.disabled = false;
  els.remoteModeButton.disabled = false;
  if (els.speakerModeButton) els.speakerModeButton.disabled = false;
  applyPlayerMode();
}

function applyPlayerMode() {
  const hasChosenMode = state.modeLocked || state.joined || state.connecting;
  const audioListener = isPhoneAudioListener();
  state.speakerMode = false;
  document.body.classList.toggle("is-remote-player", state.remoteMode);
  document.body.classList.remove("is-speaker-phone");
  document.body.classList.toggle("is-mode-locked", state.modeLocked);
  if (els.speakerModeButton) els.speakerModeButton.hidden = true;
  els.onsiteModeButton.classList.toggle("is-active", hasChosenMode && !state.remoteMode);
  els.remoteModeButton.classList.toggle("is-active", hasChosenMode && state.remoteMode);
  if (els.speakerModeButton) els.speakerModeButton.classList.remove("is-active");
  els.onsiteModeButton.setAttribute("aria-pressed", String(hasChosenMode && !state.remoteMode));
  els.remoteModeButton.setAttribute("aria-pressed", String(hasChosenMode && state.remoteMode));
  if (els.speakerModeButton) els.speakerModeButton.setAttribute("aria-pressed", "false");
  updatePhoneAudioPanelLabels();

  if (!audioListener || !state.joined) {
    els.phoneRemotePanel.hidden = true;
    teardownRemoteMedia();
    stopHostAudioBroadcast({ closeCall: true, message: defaultListenStatus() });
    return;
  }

  els.phoneRemotePanel.hidden = false;
  renderRemotePanel(state.game);
}

function updatePhoneAudioPanelLabels() {
  const title = state.remoteMode ? "同步收聽" : "語音收聽";
  if (els.phoneRemoteTitle) els.phoneRemoteTitle.textContent = title;
  if (els.phoneRemotePanel) els.phoneRemotePanel.setAttribute("aria-label", `${title}狀態`);
}

function updateLiveClock() {
  if (!state.game) return;
  if (state.game.isPlaying) els.phoneStatus.textContent = phoneStatusText(state.game);
  if (isPhoneAudioListener() && state.joined && !els.phoneRemotePanel.hidden) {
    els.phoneRemoteStatus.textContent = phoneStatusText(state.game);
    els.phoneRemoteCountdown.textContent = remoteCountdownText(state.game);
    updateRemotePlaybackUi(state.game);
  }
}

function phoneStatusText(game) {
  if (!game) return "等候主持";
  const songlistLabel = game.songlistLabel || "歌單";
  if (game.isPlaying) return `${songlistLabel} · 播放中 · ${remainingSeconds(game)} 秒`;
  if (game.revealed) return "已開估";
  if (game.frontReady) return "前台預備中";
  return game.status || "等候主持";
}

function renderRemotePanel(game) {
  if (!isPhoneAudioListener() || !state.joined) {
    els.phoneRemotePanel.hidden = true;
    return;
  }

  els.phoneRemotePanel.hidden = false;
  els.phoneRemoteStatus.textContent = phoneStatusText(game);
  els.phoneRemoteCountdown.textContent = remoteCountdownText(game);
  renderHostAudioBroadcastUi();

  const teamScores = game?.teamScores || {};
  els.phoneRemoteTeams.textContent = `A ${Number(teamScores.A || 0)} · B ${Number(teamScores.B || 0)}`;

  const players = (game?.leaderboard || []).filter(Boolean);
  const livePlayers = players.filter((player) => player.micActive);
  els.phoneRemoteMic.textContent = liveMicSummary(livePlayers);

  renderRemoteMedia(game);
  renderRemoteRoster(players);
}

function liveMicSummary(players) {
  if (!players.length) return "沒有";
  const names = players.map((player) => player.name || "玩家").slice(0, 2);
  return players.length > 2 ? `${names.join("、")} 等 ${players.length} 人` : names.join("、");
}

function remoteCountdownText(game) {
  if (!game) return "--";
  if (game.isPlaying) return `${remainingSeconds(game)} 秒`;
  if (game.revealed) return "開估";
  if (game.hasQuestion) return "待開始";
  return "--";
}

function renderRemoteMedia(game) {
  if (!els.phoneRemoteMedia || !els.phoneRemotePlayerHost) return;

  if (!state.remoteMode || !state.joined || !hasRemoteMedia(game) || !shouldShowRemoteSyncPlayer(game)) {
    teardownRemoteMedia();
    return;
  }

  els.phoneRemoteMedia.hidden = false;
  const mediaKey = remoteMediaKey(game);
  if (mediaKey !== state.remoteMediaKey) {
    state.remoteMediaKey = mediaKey;
    state.remotePlaybackKey = "";
    state.remotePlaybackBlocked = false;
    buildRemoteMediaFrame(game);
  }

  const playbackKey = [
    remoteShouldPlay(game) ? "play" : "pause",
    Number(game.playEndsAt || 0),
    Number(game.playbackRevision || 0),
    game.fullPlayback ? "full" : "clip",
    game.revealed ? "revealed" : "blind",
  ].join(":");

  if (playbackKey !== state.remotePlaybackKey) {
    state.remotePlaybackKey = playbackKey;
    syncRemoteMedia(game);
  }

  updateRemotePlaybackUi(game);
}

function hasRemoteMedia(game) {
  return Boolean(game && (game.audioUrl || game.videoId));
}

function shouldShowRemoteSyncPlayer(game) {
  return Boolean(game?.audioUrl);
}

function remoteMediaKey(game) {
  return [
    game.questionId || "",
    game.audioUrl || game.videoId || "",
    Number(game.start || 0),
    Number(game.end || 0),
    game.fullPlayback ? "full" : "clip",
  ].join(":");
}

function buildRemoteMediaFrame(game) {
  els.phoneRemotePlayerHost.replaceChildren();

  if (game.audioUrl) {
    buildRemoteLocalMedia(game);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = buildRemoteEmbedUrl(game, remoteShouldPlay(game));
  iframe.title = "YouTube 同步播放器";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = false;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  els.phoneRemotePlayerHost.replaceChildren(iframe);
  if (remoteShouldPlay(game)) state.remotePlaybackBlocked = true;
}

function buildRemoteLocalMedia(game) {
  const media = document.createElement(isVideoMediaUrl(game.audioUrl) ? "video" : "audio");
  media.src = game.audioUrl;
  media.controls = false;
  media.preload = "auto";
  media.autoplay = remoteShouldPlay(game);
  if (media.tagName === "VIDEO") media.playsInline = true;
  media.addEventListener(
    "loadedmetadata",
    () => {
      media.currentTime = desiredRemoteSecond(game);
      if (remoteShouldPlay(state.game)) playRemoteMedia(state.game);
    },
    { once: true }
  );
  media.addEventListener("playing", () => {
    state.remotePlaybackBlocked = false;
    setRemotePlayerStatus("同步播放中");
  });
  media.addEventListener("pause", () => updateRemotePlaybackUi(state.game));
  media.addEventListener("error", () => {
    state.remotePlaybackBlocked = true;
    setRemotePlayerStatus("播放失敗，請重新同步");
  });
  els.phoneRemotePlayerHost.replaceChildren(media);
}

function syncRemoteMedia(game) {
  if (!hasRemoteMedia(game)) return;
  if (remoteShouldPlay(game)) {
    playRemoteMedia(game, { forceSeek: true });
    return;
  }

  pauseRemoteMedia(game);
}

function playRemoteMedia(game, options = {}) {
  if (!game || !hasRemoteMedia(game)) return;
  const { forceSeek = false } = options;
  const seconds = desiredRemoteSecond(game);
  const media = els.phoneRemotePlayerHost.firstElementChild;
  if (!media) return;

  if (game.audioUrl) {
    if (forceSeek || Math.abs(Number(media.currentTime || 0) - seconds) > 1.5) {
      media.currentTime = seconds;
    }

    media
      .play()
      .then(() => {
        state.remotePlaybackBlocked = false;
        updateRemotePlaybackUi(game);
      })
      .catch(() => {
        state.remotePlaybackBlocked = true;
        updateRemotePlaybackUi(game);
      });
    return;
  }

  state.remotePlaybackBlocked = true;
  postRemoteYouTubeCommand("seekTo", [seconds, true]);
  postRemoteYouTubeCommand("playVideo");
  window.setTimeout(() => {
    if (state.remoteMediaKey !== remoteMediaKey(game) || !remoteShouldPlay(state.game)) return;
    postRemoteYouTubeCommand("seekTo", [desiredRemoteSecond(state.game), true]);
    postRemoteYouTubeCommand("playVideo");
  }, 900);
  updateRemotePlaybackUi(game);
}

function pauseRemoteMedia(game) {
  const media = els.phoneRemotePlayerHost.firstElementChild;
  if (!media) return;

  if (game?.audioUrl) {
    media.pause();
    return;
  }

  postRemoteYouTubeCommand("pauseVideo");
}

function retryRemotePlayback() {
  if (!state.game || !hasRemoteMedia(state.game)) return;

  if (isRemoteYouTube(state.game)) {
    state.remotePlaybackBlocked = true;
    state.remoteMediaKey = remoteMediaKey(state.game);
    state.remotePlaybackKey = "";
    buildRemoteMediaFrame(state.game);
    window.setTimeout(() => {
      if (!isRemoteYouTube(state.game) || !remoteShouldPlay(state.game)) return;
      postRemoteYouTubeCommand("seekTo", [desiredRemoteSecond(state.game), true]);
      postRemoteYouTubeCommand("playVideo");
      updateRemotePlaybackUi(state.game);
    }, 900);
    updateRemotePlaybackUi(state.game);
    return;
  }

  state.remotePlaybackBlocked = false;
  state.remotePlaybackKey = "";
  playRemoteMedia(state.game, { forceSeek: true });
  updateRemotePlaybackUi(state.game);
}

function updateRemotePlaybackUi(game) {
  if (!els.phoneRemoteMedia || els.phoneRemoteMedia.hidden) return;
  const hasMedia = hasRemoteMedia(game);
  const shouldPlay = remoteShouldPlay(game);

  if (!hasMedia) {
    setRemotePlayerStatus("等候歌曲");
    els.phoneRemotePlayButton.hidden = true;
    els.phoneRemoteMedia.classList.remove("is-youtube-manual-unlock");
    return;
  }

  if (shouldPlay) {
    if (isRemoteYouTube(game)) {
      els.phoneRemoteMedia.classList.remove("is-youtube-manual-unlock");
      setRemotePlayerStatus("YouTube 手機不能自動開聲");
      setRemoteShieldText("答案已遮住", "要自動有聲請用本地授權音訊");
      els.phoneRemotePlayButton.hidden = true;
      return;
    }

    els.phoneRemoteMedia.classList.remove("is-youtube-manual-unlock");
    setRemotePlayerStatus(state.remotePlaybackBlocked ? "請按一下啟用播放" : "同步播放中");
    setRemoteShieldText(state.remotePlaybackBlocked ? "點一下開聲" : "手機播放中", "畫面已遮住答案");
    els.phoneRemotePlayButton.hidden = false;
    setIconButton(
      els.phoneRemotePlayButton,
      state.remotePlaybackBlocked ? "play" : "sync",
      state.remotePlaybackBlocked ? "啟用手機播放" : "重新同步播放"
    );
    return;
  }

  setRemotePlayerStatus(game?.frontReady ? "已預備" : game?.revealed ? "已開估" : "等候播放");
  setRemoteShieldText("手機同步播放器", "畫面已遮住答案");
  els.phoneRemoteMedia.classList.remove("is-youtube-manual-unlock");
  els.phoneRemotePlayButton.hidden = true;
}

function setRemotePlayerStatus(message) {
  if (els.phoneRemotePlayerStatus) els.phoneRemotePlayerStatus.textContent = message;
}

function setRemoteShieldText(title, note) {
  if (els.phoneRemoteShieldTitle) els.phoneRemoteShieldTitle.textContent = title;
  if (els.phoneRemoteShieldNote) els.phoneRemoteShieldNote.textContent = note;
}

function teardownRemoteMedia() {
  state.remoteMediaKey = "";
  state.remotePlaybackKey = "";
  state.remotePlaybackBlocked = false;
  if (els.phoneRemoteMedia) els.phoneRemoteMedia.hidden = true;
  if (els.phoneRemoteMedia) els.phoneRemoteMedia.classList.remove("is-youtube-manual-unlock");
  if (els.phoneRemotePlayerHost) els.phoneRemotePlayerHost.replaceChildren();
  if (els.phoneRemotePlayButton) els.phoneRemotePlayButton.hidden = true;
}

function isRemoteYouTube(game) {
  return Boolean(game?.videoId && !game?.audioUrl);
}

function remoteShouldPlay(game) {
  return Boolean(game && (game.mediaPlaying ?? game.isPlaying));
}

function desiredRemoteSecond(game) {
  const start = Number(game?.start || 0);
  if (!remoteShouldPlay(game) || game.fullPlayback || !game.playEndsAt) return start;

  const duration = Number(game.clipDuration || game.playDuration || 0);
  if (!duration) return start;

  const remaining = Math.max(0, (Number(game.playEndsAt) - Date.now()) / 1000);
  const elapsed = Math.max(0, duration - remaining);
  const end = Number(game.end || 0);
  const target = start + elapsed;
  return end ? Math.min(Math.max(start, target), Math.max(start, end - 0.5)) : Math.max(start, target);
}

function postRemoteYouTubeCommand(command, args = []) {
  const iframe = els.phoneRemotePlayerHost.querySelector("iframe");
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: command, args }), "*");
}

function buildRemoteEmbedUrl(game, autoplay) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${game.videoId}`);
  url.searchParams.set("start", String(Math.max(0, Math.floor(desiredRemoteSecond(game)))));
  if (game.end && !game.fullPlayback) url.searchParams.set("end", String(Math.floor(Number(game.end))));
  url.searchParams.set("autoplay", autoplay ? "1" : "0");
  url.searchParams.set("controls", "0");
  url.searchParams.set("disablekb", "1");
  url.searchParams.set("enablejsapi", "1");
  url.searchParams.set("fs", "0");
  url.searchParams.set("origin", window.location.origin);
  url.searchParams.set("rel", "0");
  url.searchParams.set("modestbranding", "1");
  url.searchParams.set("playsinline", "1");
  return url.toString();
}

function renderRemoteRoster(players) {
  els.phoneRemoteRoster.replaceChildren();

  if (!players.length) {
    const empty = document.createElement("div");
    empty.className = "phone-remote-empty";
    empty.textContent = "等候玩家加入";
    els.phoneRemoteRoster.append(empty);
    return;
  }

  players.slice(0, 8).forEach((player) => {
    const item = document.createElement("div");
    item.className = "phone-remote-player";
    item.classList.toggle("is-live", Boolean(player.micActive));
    item.classList.toggle("is-offline", !player.connected);

    const name = document.createElement("span");
    name.textContent = player.name || "玩家";

    const meta = document.createElement("small");
    meta.textContent = `${player.team || "A"} 組 · ${Number(player.score || 0)} 分`;

    item.append(name, meta);

    if (player.micActive || !player.connected) {
      const badge = document.createElement("strong");
      badge.textContent = player.micActive ? "開咪" : "離線";
      item.append(badge);
    }

    els.phoneRemoteRoster.append(item);
  });
}

function renderGame() {
  const game = state.game;
  if (!game) return;

  syncBodyState();
  applyPlayerMode();
  els.playerScore.textContent = `${game.score || 0} 分`;
  els.playerRound.textContent = game.hasQuestion
    ? `第 ${game.round} 題 · ${teamLabel(game.team)}`
    : `未開始 · ${teamLabel(state.team)}`;
  els.phoneStatus.textContent = phoneStatusText(game);
  els.phoneTitle.textContent = game.revealed ? game.title : game.hasQuestion ? game.title || game.songlistLabel || "估呢首歌" : "準備中";
  if (game.hasWord) els.phoneTitle.textContent = game.title;
  els.phoneResult.textContent = state.lastResult || (game.buzzWinner ? `第一個${game.mode === "word" ? "搶唱" : "搶答"}：${game.buzzWinner.name}` : "");

  renderHints(game.hints || []);
  renderChoices(game);
  renderLeaderboard(game.leaderboard || [], game.teamScores || {});
  renderRemotePanel(game);
}

function openLeaderboard() {
  els.leaderboardModal.hidden = false;
  els.closeLeaderboardButton.focus();
}

function closeLeaderboard() {
  els.leaderboardModal.hidden = true;
  els.openLeaderboardButton.focus();
}

function renderHints(hints) {
  els.phoneHints.replaceChildren();
  hints.forEach((hint) => {
    const item = document.createElement("div");
    item.className = "hint-item";
    item.textContent = hint;
    els.phoneHints.append(item);
  });
}

function renderChoices(game) {
  els.phoneChoices.replaceChildren();
  els.buzzButton.hidden = true;

  if (!game.hasQuestion || game.revealed) return;

  if (game.mode === "choice") {
    if (!game.choices?.length) {
      const empty = document.createElement("div");
      empty.className = "phone-empty";
      empty.textContent = game.frontReady ? "等主持播放 / 重播片段" : "選項同步中，請等主持重新整理後台或按下一題";
      els.phoneChoices.append(empty);
      return;
    }

    (game.choices || []).forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button phone-choice";
      const number = document.createElement("span");
      number.className = "phone-choice-index";
      number.textContent = String(index + 1);
      const title = document.createElement("strong");
      title.className = "phone-choice-title";
      title.textContent = choice;
      button.append(number, title);
      const selected = sameChoice(state.selectedAnswer, choice);
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = Boolean(game.answered);
      button.addEventListener("click", () => {
        state.selectedAnswer = choice;
        send({ type: "answer", questionId: game.questionId, answer: choice });
        [...els.phoneChoices.querySelectorAll("button")].forEach((item) => {
          item.disabled = true;
          item.classList.toggle("is-selected", item === button);
          item.setAttribute("aria-pressed", String(item === button));
        });
        els.phoneResult.textContent = `已提交答案：${choice}`;
      });
      els.phoneChoices.append(button);
    });
  }

  if (game.mode === "buzz" || game.mode === "word") {
    const actionLabel = game.mode === "word" ? "搶唱" : "搶答";
    const alreadyTried = Boolean(game.answered);
    els.buzzButton.hidden = false;
    els.buzzButton.disabled = Boolean(alreadyTried || game.buzzWinner || !game.buzzOpen);
    els.buzzButton.textContent = actionLabel;

    if (game.buzzWinner) {
      els.phoneResult.textContent = `第一個${actionLabel}：${game.buzzWinner.name}`;
    } else if (alreadyTried && !game.revealed) {
      els.phoneResult.textContent = `你今題已${actionLabel}過，等其他人補答`;
    } else if (game.buzzOpen) {
      els.phoneResult.textContent = state.lastResult?.includes("未中")
        ? state.lastResult
        : `${actionLabel}開放，鬥快按`;
    } else if (!game.answered) {
      els.phoneResult.textContent = game.mode === "word" ? "等主持開放搶唱" : "等主持開放搶答";
    }
  }
}

function renderLeaderboard(players, teamScores = {}) {
  els.phoneLeaderboard.replaceChildren();
  els.phoneLeaderboard.append(renderPhoneTeamSummary(teamScores));

  if (!players.length) {
    const empty = document.createElement("div");
    empty.className = "phone-empty";
    empty.textContent = "等候排行榜";
    els.phoneLeaderboard.append(empty);
    return;
  }

  players.slice(0, 10).forEach((player, index) => {
    const item = document.createElement("div");
    item.className = "phone-rank";
    item.innerHTML = `<span>${index + 1}. ${escapeHtml(player.name)} · ${escapeHtml(player.team || "A")} 組</span><strong>${player.score} 分</strong>`;
    els.phoneLeaderboard.append(item);
  });
}

function renderPhoneTeamSummary(teamScores) {
  const aScore = Number(teamScores.A || 0);
  const bScore = Number(teamScores.B || 0);
  const summary = document.createElement("div");
  summary.className = "phone-team-summary";
  summary.innerHTML = `<span>A 組 <strong>${aScore}</strong></span><span>B 組 <strong>${bScore}</strong></span>`;
  return summary;
}

function sameChoice(left, right) {
  return String(left || "").trim() === String(right || "").trim();
}

function send(message) {
  if (state.connection?.open) state.connection.send(message);
}

function setStatus(message) {
  els.playerStatus.textContent = message;
  syncBodyState();
}

function syncBodyState() {
  document.body.classList.toggle("is-joined", Boolean(state.joined));
  document.body.classList.toggle("is-connecting", Boolean(state.connecting && !state.joined));
}

function joinedStatus() {
  if (state.displayName && normalizePlayerName(state.displayName) !== normalizePlayerName(state.name)) {
    return `已加入：${state.displayName}`;
  }

  return "已加入，等候題目";
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

function remainingSeconds(game) {
  if (!game.playEndsAt) return game.playDuration || 0;
  return Math.max(0, Math.ceil((game.playEndsAt - Date.now()) / 1000));
}

function isVideoMediaUrl(url) {
  return LOCAL_VIDEO_EXTENSIONS.test(String(url || "").split(/[?#]/)[0]);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
