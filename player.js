const PLAYER_ID_KEY = "cantonese-hymn-quiz-player-id-v1";
const PLAYER_NAME_KEY = "cantonese-hymn-quiz-player-name-v1";
const PLAYER_REMOTE_MODE_KEY = "cantonese-hymn-quiz-player-entry-mode-v1";
const PHONE_SETTINGS_KEY = "guess-song-phone-ui-settings-v1";
const ROOM_ID_KEY = "cantonese-hymn-quiz-room-id-v1";
const ONSITE_ONLY = false;
const DEFAULT_ROOM_ID = "soyingpang-guess-song-fellowship-room";
const ROOM_ID_CANDIDATES = [
  DEFAULT_ROOM_ID,
  `${DEFAULT_ROOM_ID}-2`,
  `${DEFAULT_ROOM_ID}-3`,
];
const ROOM_ID_MAX_LENGTH = 80;
const RECONNECT_BASE_DELAY = 1200;
const RECONNECT_MAX_DELAY = 8000;
const CONNECTION_TIMEOUT_MS = 12000;
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
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
];
const PEER_OPTIONS = {
  debug: 1,
  host: "0.peerjs.com",
  port: 443,
  path: "/",
  secure: true,
  config: {
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 6,
  },
};
const VPN_PEER_OPTIONS = {
  ...PEER_OPTIONS,
  config: {
    ...PEER_OPTIONS.config,
    iceTransportPolicy: "relay",
  },
};
const CONNECTION_PROFILES = [
  { id: "standard", label: "標準線路", options: PEER_OPTIONS },
  { id: "vpn", label: "VPN 兼容線路", options: VPN_PEER_OPTIONS },
];
const LOCAL_VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|ogv|webm)$/i;
const DEFAULT_REMOTE_AUDIO_COUNTDOWN_DELAY_MS = 7000;
const QUICK_PICK_COOLDOWN_MS = 5000;
const AUDIO_UNLOCK_TIMEOUT_MS = 1200;
const HOST_AUDIO_HEALTH_CHECK_MS = 2500;
const HOST_AUDIO_RETRY_GAP_MS = 3200;
const HOST_AUDIO_RECONNECT_REQUEST_GAP_MS = 8000;
const HOST_AUDIO_DISCONNECT_GRACE_MS = 6500;
const HOST_AUDIO_STATS_WARMUP_MS = 6000;
const HOST_AUDIO_STALE_STATS_LIMIT = 3;
const SILENT_UNLOCK_AUDIO_URI =
  "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==";
const ENTRY_MODES = new Set(["remote"]);
const DEFAULT_PHONE_SETTINGS = {
  motionEffects: true,
  haptics: true,
  compactMode: false,
};

const params = new URLSearchParams(window.location.search);
const urlRoomId = normalizeRoomId(params.get("room"));
const storedRoomId = normalizeRoomId(localStorage.getItem(ROOM_ID_KEY));
const roomCandidates = buildRoomCandidates(urlRoomId || storedRoomId);
const roomId = roomCandidates[0] || DEFAULT_ROOM_ID;
let activeRoomId = roomId;
let roomCandidateIndex = 0;
let connectionProfileIndex = 0;
const urlName = params.get("name") || "";
const initialEntryMode = "remote";
localStorage.setItem(PLAYER_REMOTE_MODE_KEY, initialEntryMode);

function buildRoomCandidates(preferredRoomId) {
  const candidates = [];
  const preferred = normalizeRoomId(preferredRoomId);
  if (preferred) candidates.push(preferred);
  if (preferred && preferred !== DEFAULT_ROOM_ID) return candidates;
  ROOM_ID_CANDIDATES.forEach((candidate) => {
    if (!candidates.includes(candidate)) candidates.push(candidate);
  });
  return candidates;
}

function normalizeRoomId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, ROOM_ID_MAX_LENGTH);
}

function normalizeEntryMode(mode) {
  return ENTRY_MODES.has(mode) ? mode : "remote";
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
  audioReady: false,
  joinAudioUnlocking: false,
  reconnectAttempts: 0,
  reconnectTimer: null,
  connectionTimeout: null,
  joinHandshakeTimer: null,
  connectionToken: "",
  game: null,
  lastResult: "",
  selectedAnswer: "",
  momentTimer: null,
  scoreBurstTimer: null,
  lastRenderedScore: null,
  leaderboardSnapshotReady: false,
  leaderboardRankSnapshot: new Map(),
  leaderboardScoreSnapshot: new Map(),
  leaderboardMovementCache: new Map(),
  lastMomentKey: "",
  lastLatencyCalibrationKey: "",
  latencyCalibrationStatus: "",
  answerStartTimer: null,
  answerGateMotionTimer: null,
  answerGateMotionKey: "",
  quickPickCooldownTimer: null,
  cooldownMotionTimer: null,
  cooldownMotionKey: "",
  answerCountdownTimer: null,
  answerRevealTimer: null,
  lastAnswerRevealKey: "",
  micStream: null,
  micCall: null,
  micActive: false,
  remoteMode: true,
  speakerMode: false,
  modeLocked: true,
  settings: loadPhoneSettings(),
  stageCueTimer: null,
  lastStageCueKey: "",
  remoteMediaKey: "",
  remotePlaybackKey: "",
  remotePlaybackBlocked: false,
  hostAudioCall: null,
  hostAudioStream: null,
  hostAudioElement: null,
  hostAudioBlocked: false,
  hostAudioStatus: "等候主持音訊",
  hostAudioLastRetryAt: 0,
  hostAudioReconnectRequestedAt: 0,
  hostAudioDisconnectedAt: 0,
  hostAudioLastBytesReceived: 0,
  hostAudioLastPacketsReceived: 0,
  hostAudioLastStatsAt: 0,
  hostAudioStaleStatsCount: 0,
  hostAudioAttachedAt: 0,
  firebase: null,
  firebaseReady: false,
  firebaseConnectedAt: 0,
  firebaseMessageKeys: new Set(),
  firebaseRtcPeer: null,
  firebaseRtcCleanup: [],
  firebaseRtcSessionId: "",
  remoteAudioPrimed: false,
  remoteAudioPriming: false,
  remoteCountdownWindow: null,
  remoteUnlockAudioElement: null,
  remoteAudioContext: null,
};

const els = {
  joinForm: document.querySelector("#joinForm"),
  playerModeField: document.querySelector("#playerModeField"),
  playerName: document.querySelector("#playerName"),
  joinSubmitButton: document.querySelector("#joinSubmitButton"),
  playerNameLabel: document.querySelector('label[for="playerName"]'),
  playerNameLine: document.querySelector("#playerName")?.closest(".guess-line"),
  playerNameNote: document.querySelector(".join-form > .join-note"),
  phoneJoinRoomPill: document.querySelector("#phoneJoinRoomPill"),
  phoneJoinAvatar: document.querySelector("#phoneJoinAvatar"),
  phoneJoinPreviewName: document.querySelector("#phoneJoinPreviewName"),
  playerStatus: document.querySelector("#playerStatus"),
  playerScore: document.querySelector("#playerScore"),
  playerScoreValue: document.querySelector("#playerScoreValue"),
  phoneScoreBurst: document.querySelector("#phoneScoreBurst"),
  playerRound: document.querySelector("#playerRound"),
  phoneStatus: document.querySelector("#phoneStatus"),
  phoneTitle: document.querySelector("#phoneTitle"),
  phoneQuestion: document.querySelector("#phoneQuestion"),
  phoneStageCue: document.querySelector("#phoneStageCue"),
  phoneStageCueIcon: document.querySelector("#phoneStageCueIcon"),
  phoneStageCueTitle: document.querySelector("#phoneStageCueTitle"),
  phoneStageCueDetail: document.querySelector("#phoneStageCueDetail"),
  phoneRevealBridge: document.querySelector("#phoneRevealBridge"),
  phoneRevealBridgeKicker: document.querySelector("#phoneRevealBridgeKicker"),
  phoneRevealBridgeTitle: document.querySelector("#phoneRevealBridgeTitle"),
  phoneRevealBridgeCount: document.querySelector("#phoneRevealBridgeCount"),
  phoneRevealBridgeDetail: document.querySelector("#phoneRevealBridgeDetail"),
  phoneRevealBridgeBar: document.querySelector("#phoneRevealBridgeBar"),
  phoneAnswerCard: document.querySelector("#phoneAnswerCard"),
  phoneAnswerTitle: document.querySelector("#phoneAnswerTitle"),
  phoneAnswerMeta: document.querySelector("#phoneAnswerMeta"),
  phoneAnswerCountdown: document.querySelector("#phoneAnswerCountdown"),
  phoneAnswerCountdownRing: document.querySelector("#phoneAnswerCountdownRing"),
  phoneAnswerCountdownText: document.querySelector("#phoneAnswerCountdownText"),
  phoneHints: document.querySelector("#phoneHints"),
  phoneChoices: document.querySelector("#phoneChoices"),
  phoneAnswerGate: document.querySelector("#phoneAnswerGate"),
  phoneAnswerGateTitle: document.querySelector("#phoneAnswerGateTitle"),
  phoneAnswerGateText: document.querySelector("#phoneAnswerGateText"),
  phoneAnswerGateCount: document.querySelector("#phoneAnswerGateCount"),
  phoneAnswerGateBar: document.querySelector("#phoneAnswerGateBar"),
  buzzButton: document.querySelector("#buzzButton"),
  phoneCooldown: document.querySelector("#phoneCooldown"),
  phoneCooldownTitle: document.querySelector("#phoneCooldownTitle"),
  phoneCooldownText: document.querySelector("#phoneCooldownText"),
  phoneCooldownBar: document.querySelector("#phoneCooldownBar"),
  phoneResult: document.querySelector("#phoneResult"),
  phoneMoment: document.querySelector("#phoneMoment"),
  phoneMomentIcon: document.querySelector("#phoneMomentIcon"),
  phoneMomentTitle: document.querySelector("#phoneMomentTitle"),
  phoneMomentDetail: document.querySelector("#phoneMomentDetail"),
  micToggleButton: document.querySelector("#micToggleButton"),
  phoneMicStatus: document.querySelector("#phoneMicStatus"),
  phoneLeaderboard: document.querySelector("#phoneLeaderboard"),
  openLeaderboardButton: document.querySelector("#openLeaderboardButton"),
  closeLeaderboardButton: document.querySelector("#closeLeaderboardButton"),
  leaderboardModal: document.querySelector("#leaderboardModal"),
  phoneLivePill: document.querySelector("#phoneLivePill"),
  phoneSettingsButton: document.querySelector("#phoneSettingsButton"),
  settingsModal: document.querySelector("#settingsModal"),
  closeSettingsButton: document.querySelector("#closeSettingsButton"),
  motionEffectsToggle: document.querySelector("#motionEffectsToggle"),
  hapticsToggle: document.querySelector("#hapticsToggle"),
  compactModeToggle: document.querySelector("#compactModeToggle"),
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
  phoneLatencyCalibration: document.querySelector("#phoneLatencyCalibration"),
  phoneLatencyCalibrationButton: document.querySelector("#phoneLatencyCalibrationButton"),
  phoneLatencyCalibrationStatus: document.querySelector("#phoneLatencyCalibrationStatus"),
  phoneRemoteRoster: document.querySelector("#phoneRemoteRoster"),
  phoneRemoteMedia: document.querySelector("#phoneRemoteMedia"),
  phoneRemotePlayerHost: document.querySelector("#phoneRemotePlayerHost"),
  phoneRemotePlayerStatus: document.querySelector("#phoneRemotePlayerStatus"),
  phoneRemotePlayButton: document.querySelector("#phoneRemotePlayButton"),
  phoneRemoteShieldTitle: document.querySelector("#phoneRemoteShieldTitle"),
  phoneRemoteShieldNote: document.querySelector("#phoneRemoteShieldNote"),
  phoneLatencyValue: document.querySelector("#phoneLatencyValue"),
  phoneLatencyNote: document.querySelector("#phoneLatencyNote"),
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
  settings:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2 2 0 0 1-2.83 2.83l-.05-.05A1.8 1.8 0 0 0 15 19.4a1.8 1.8 0 0 0-1 .6l-.08.08a2 2 0 0 1-3.84 0L10 20a1.8 1.8 0 0 0-1-.6 1.8 1.8 0 0 0-1.93.41l-.05.05a2 2 0 0 1-2.83-2.83l.05-.05A1.8 1.8 0 0 0 4.6 15a1.8 1.8 0 0 0-.6-1l-.08-.08a2 2 0 0 1 0-3.84L4 10a1.8 1.8 0 0 0 .6-1 1.8 1.8 0 0 0-.41-1.93l-.05-.05a2 2 0 0 1 2.83-2.83l.05.05A1.8 1.8 0 0 0 9 4.6a1.8 1.8 0 0 0 1-.6l.08-.08a2 2 0 0 1 3.84 0L14 4a1.8 1.8 0 0 0 1 .6 1.8 1.8 0 0 0 1.93-.41l.05-.05a2 2 0 0 1 2.83 2.83l-.05.05A1.8 1.8 0 0 0 19.4 9c.08.38.29.73.6 1l.08.08a2 2 0 0 1 0 3.84L20 14c-.31.27-.52.62-.6 1Z"/></svg>',
};

localStorage.setItem(PLAYER_ID_KEY, state.playerId);
els.playerName.value = state.name;
applyPhoneSettings();
showNameStep();
applyPlayerMode();
updateJoinPreview();

els.joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  joinGame();
});

els.playerName.addEventListener("input", updateJoinPreview);

els.buzzButton.addEventListener("click", () => {
  hapticPulse([18, 30, 18]);
  send({ type: "buzz", questionId: state.game?.questionId });
  els.buzzButton.disabled = true;
  els.phoneResult.textContent = "已送出搶答";
});

els.micToggleButton?.addEventListener("click", () => {
  if (state.micActive) {
    stopMic();
    return;
  }

  startMic();
});

els.openLeaderboardButton.addEventListener("click", openLeaderboard);
els.closeLeaderboardButton.addEventListener("click", closeLeaderboard);
els.phoneSettingsButton?.addEventListener("click", openSettings);
els.closeSettingsButton?.addEventListener("click", closeSettings);
els.motionEffectsToggle?.addEventListener("change", () => updatePhoneSetting("motionEffects", els.motionEffectsToggle.checked));
els.hapticsToggle?.addEventListener("change", () => updatePhoneSetting("haptics", els.hapticsToggle.checked));
els.compactModeToggle?.addEventListener("change", () => updatePhoneSetting("compactMode", els.compactModeToggle.checked));
els.onsiteModeButton?.addEventListener("click", () => {
  setPlayerMode("onsite");
});
els.remoteModeButton?.addEventListener("click", () => {
  setPlayerMode("remote");
});
els.speakerModeButton?.addEventListener("click", () => {
  setPlayerMode("onsite");
});
els.phoneRemotePlayButton?.addEventListener("click", () => {
  primeRemoteListening();
  retryRemotePlayback();
});
els.phoneRemoteListenButton?.addEventListener("click", () => {
  primeRemoteListening();
  playHostAudioBroadcast();
});
els.phoneLatencyCalibrationButton?.addEventListener("click", sendLatencyCalibration);
setIconButton(els.openLeaderboardButton, "leaderboard", "排行榜");
setIconButton(els.closeLeaderboardButton, "close", "關閉排行榜");
setIconButton(els.phoneSettingsButton, "settings", "設定");
setIconButton(els.closeSettingsButton, "close", "關閉設定");
setListenButtonState(false);
updateMicUi();
els.leaderboardModal.addEventListener("click", (event) => {
  if (event.target === els.leaderboardModal) closeLeaderboard();
});
els.settingsModal?.addEventListener("click", (event) => {
  if (event.target === els.settingsModal) closeSettings();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !els.leaderboardModal.hidden) closeLeaderboard();
  if (event.key === "Escape" && !els.settingsModal?.hidden) closeSettings();
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
  if (!document.hidden && state.joined && state.hostAudioStream) {
    primeRemoteListening();
    playHostAudioBroadcast({ quiet: true });
  }
});

window.addEventListener("beforeunload", () => {
  if (state.firebaseReady && state.firebase) {
    state.firebase.set(["players", state.playerId, "connected"], false).catch(() => {});
  }
  stopFirebaseHostAudio();
  stopMic({ notifyHost: false, message: "已離開" });
  stopHostAudioBroadcast({ closeCall: true, message: defaultListenStatus() });
});

window.setInterval(updateLiveClock, 700);
window.setInterval(checkHostAudioHealth, HOST_AUDIO_HEALTH_CHECK_MS);

if (!roomId) {
  setStatus("QR 連結缺少房間碼，請重新掃描");
} else {
  setStatus("請輸入名字加入");
}

function updateJoinPreview() {
  const rawName = String(els.playerName?.value || state.name || "").trim();
  const displayName = rawName || "準備加入";
  const initial = Array.from(rawName || "你")[0] || "你";
  if (els.phoneJoinPreviewName) els.phoneJoinPreviewName.textContent = displayName;
  if (els.phoneJoinAvatar) els.phoneJoinAvatar.textContent = initial;
  if (els.phoneJoinRoomPill) {
    els.phoneJoinRoomPill.textContent = !roomId
      ? "連結錯誤"
      : state.joinAudioUnlocking
        ? "開聲中"
      : state.connecting
        ? "連線中"
      : state.joined
        ? "已入房"
        : state.audioReady
          ? "已開聲"
        : rawName
          ? "準備好"
          : "連線就緒";
  }
  if (els.joinSubmitButton) {
    els.joinSubmitButton.disabled = state.joinAudioUnlocking || state.connecting || state.joined;
    els.joinSubmitButton.textContent = state.joinAudioUnlocking ? "開聲中..." : "開聲並加入";
  }
}

function playJoinSubmitMotion() {
  if (!els.joinForm) return;
  els.joinForm.classList.remove("is-joining");
  void els.joinForm.offsetWidth;
  els.joinForm.classList.add("is-joining");
  window.setTimeout(() => els.joinForm?.classList.remove("is-joining"), 760);
}

async function joinGame() {
  if (state.joinAudioUnlocking || state.connecting || state.joined) return;

  const name = els.playerName.value.trim();
  if (!name) {
    setStatus("請先輸入名字");
    updateJoinPreview();
    return;
  }

  state.name = name.slice(0, 18);
  state.displayName = "";
  state.entryNameReady = true;
  state.remoteMode = true;
  state.speakerMode = false;
  state.modeLocked = true;
  localStorage.setItem(PLAYER_NAME_KEY, state.name);
  localStorage.setItem(PLAYER_REMOTE_MODE_KEY, "remote");
  hapticPulse(10);
  playJoinSubmitMotion();
  state.joinAudioUnlocking = true;
  if (els.joinSubmitButton) els.joinSubmitButton.disabled = true;
  setStatus("正在開聲，請保持這個頁面");
  updateJoinPreview();

  const unlocked = await primeRemoteListening();
  state.joinAudioUnlocking = false;
  state.audioReady = true;
  setStatus(unlocked ? "已開聲，正在加入房間" : "已收到開聲點擊，正在加入房間");
  notifyAudioReady();
  applyPlayerMode();
  startJoinWithSelectedMode();
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
  setStatus("準備加入手機房間");
  applyPlayerMode();
}

function startJoinWithSelectedMode() {
  if (!state.entryNameReady || state.joined || state.connecting) return;
  state.speakerMode = false;
  lockPlayerMode();
  els.joinForm.hidden = true;
  connectToRoom({ resetAttempts: true });
}

function showJoinFormAfterFailure() {
  els.joinForm.hidden = false;
  els.joinForm.classList.remove("is-joining");
  state.joinAudioUnlocking = false;
  if (els.joinSubmitButton) els.joinSubmitButton.disabled = false;
  showNameStep();
}

async function connectToRoom({ resetAttempts = false } = {}) {
  if (window.GuessSongFirebase?.isConfigured?.()) {
    await connectToFirebaseRoom({ resetAttempts });
    return;
  }

  connectToRoomViaPeer({ resetAttempts });
}

async function connectToFirebaseRoom({ resetAttempts = false } = {}) {
  clearTimeout(state.reconnectTimer);
  state.reconnectTimer = null;
  if (resetAttempts) {
    state.reconnectAttempts = 0;
    roomCandidateIndex = 0;
    connectionProfileIndex = 0;
  }
  activeRoomId = roomCandidates[roomCandidateIndex] || roomId;

  state.connecting = true;
  closeCurrentPeer();
  stopFirebaseHostAudio();
  setStatus("連接 Firebase 全球房間中");

  try {
    const firebase = await window.GuessSongFirebase.createRoomClient({
      roomId: activeRoomId,
      role: "player",
    });
    if (!firebase) throw new Error("Firebase not configured");

    state.firebase = firebase;
    state.firebaseReady = true;
    state.firebaseConnectedAt = Date.now();
    state.joined = true;
    state.connecting = false;
    state.reconnectAttempts = 0;
    localStorage.setItem(ROOM_ID_KEY, activeRoomId);
    lockPlayerMode();
    els.joinForm.hidden = true;

    await firebase.set(["players", state.playerId], {
      id: state.playerId,
      name: state.name,
      connected: true,
      remoteMode: state.remoteMode,
      speakerMode: false,
      audioReady: Boolean(state.audioReady),
      updatedAt: Date.now(),
    });
    firebase.onDisconnectSet(["players", state.playerId, "connected"], false);
    firebase.onValue(["playerStates", state.playerId], (message) => {
      if (!message) return;
      handleMessage(message);
    });
    firebase.onChildAdded(["messages", state.playerId], (message, key) => {
      if (!message || state.firebaseMessageKeys.has(key)) return;
      state.firebaseMessageKeys.add(key);
      if (Number(message.createdAt || 0) < state.firebaseConnectedAt - 3000) return;
      handleMessage(message);
    });
    firebase.onValue(["rtc", state.playerId, "offer"], handleFirebaseAudioOffer);

    setStatus("已加入 Firebase 全球房間");
    renderJoinedWaiting();
    updateMicUi();
    applyPlayerMode();
  } catch (error) {
    state.firebaseReady = false;
    state.firebase = null;
    console.warn("Firebase player connect failed", error);
    if (window.Peer) {
      connectToRoomViaPeer({ resetAttempts: false });
      return;
    }
    handleConnectionFailure("Firebase 全球房間連線失敗，請確認設定和網絡");
  }
}

function connectToRoomViaPeer({ resetAttempts = false } = {}) {
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
    connectionProfileIndex = 0;
  }
  activeRoomId = roomCandidates[roomCandidateIndex] || roomId;
  const connectionProfile = activeConnectionProfile();

  const token = crypto.randomUUID();
  state.connectionToken = token;
  state.connecting = true;
  closeCurrentPeer();
  setStatus(`${state.reconnectAttempts ? "重新連線中" : "連線中"}：${connectionProfile.label}`);
  state.connectionTimeout = window.setTimeout(() => {
    if (state.connectionToken !== token || state.joined) return;
    handleConnectionFailure("連線逾時，正在嘗試其他線路");
  }, CONNECTION_TIMEOUT_MS);

  const peer = new Peer(undefined, connectionProfile.options);
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
    handleConnectionFailure(connectionFailureMessage(error), {
      skipProfileRetry: String(error?.type || "").trim() === "peer-unavailable",
    });
  });
}

function bindRoomConnection(connection, token) {
  connection.on("open", () => {
    if (state.connectionToken !== token) return;
    clearConnectionTimeout();
    state.joined = true;
    state.connecting = false;
    state.reconnectAttempts = 0;
    localStorage.setItem(ROOM_ID_KEY, activeRoomId);
    lockPlayerMode();
    sendJoinMessage();
    scheduleJoinHandshakeRetry();
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
    else handleConnectionFailure("連線失敗，請確認主持頁仍然開住");
  });

  connection.on("error", (error) => {
    if (state.connectionToken !== token) return;
    handleConnectionFailure(connectionFailureMessage(error));
  });
}

function closeCurrentPeer() {
  clearConnectionTimeout();
  clearJoinHandshakeTimer();
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

function handleConnectionFailure(message, options = {}) {
  const { skipProfileRetry = false } = options;
  clearConnectionTimeout();
  state.connecting = false;
  if (state.joined) {
    scheduleReconnect(message);
    return;
  }

  if (!skipProfileRetry && advanceConnectionProfile()) {
    setStatus(`正在切換至 ${activeConnectionProfile().label}...`);
    connectToRoom();
    return;
  }

  if (advanceRoomCandidate()) {
    connectionProfileIndex = 0;
    setStatus("正在嘗試另一個房間...");
    connectToRoom();
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

function sendJoinMessage() {
  send({
    type: "join",
    playerId: state.playerId,
    name: state.name,
    remoteMode: state.remoteMode,
    speakerMode: state.speakerMode,
    audioReady: Boolean(state.audioReady),
  });
}

function scheduleJoinHandshakeRetry() {
  clearJoinHandshakeTimer();
  state.joinHandshakeTimer = window.setTimeout(() => {
    state.joinHandshakeTimer = null;
    if (!state.connection?.open) return;
    sendJoinMessage();
    scheduleJoinHandshakeRetry();
  }, 1800);
}

function clearJoinHandshakeTimer() {
  clearTimeout(state.joinHandshakeTimer);
  state.joinHandshakeTimer = null;
}

function connectionFailureMessage(error) {
  const type = String(error?.type || "").trim();
  if (type === "peer-unavailable") return "找不到主持房間，請確認主持頁保持開住";
  if (type === "network") return "手機網絡暫時連不到同步服務，正在嘗試其他線路";
  if (type === "browser-incompatible") return "連線失敗：這個手機瀏覽器不支援同步連線";
  return "連線失敗，正在嘗試其他線路";
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
  if (roomCandidates.length <= 1) return false;
  if (roomCandidateIndex >= roomCandidates.length - 1) return false;
  roomCandidateIndex += 1;
  activeRoomId = roomCandidates[roomCandidateIndex] || roomId;
  return true;
}

function advanceConnectionProfile() {
  if (connectionProfileIndex >= CONNECTION_PROFILES.length - 1) return false;
  connectionProfileIndex += 1;
  return true;
}

function activeConnectionProfile() {
  return CONNECTION_PROFILES[connectionProfileIndex] || CONNECTION_PROFILES[0];
}

function currentRoomId() {
  return activeRoomId || roomId || DEFAULT_ROOM_ID;
}

function handleMessage(message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "join-ack") {
    state.displayName = message.playerName || state.name;
    state.team = normalizeTeam(message.team);
    state.joined = true;
    state.connecting = false;
    state.reconnectAttempts = 0;
    lockPlayerMode();
    els.joinForm.hidden = true;
    setStatus("已加入，等候主持同步");
    renderJoinedWaiting();
    updateMicUi();
    return;
  }

  if (message.type === "state") {
    clearJoinHandshakeTimer();
    const previousGame = state.game;
    const previousQuestionId = previousGame?.questionId;
    const previousStagePhase = phoneStagePhase(previousGame);
    const gameMessage = sanitizeGameState(message);
    updateRemoteCountdownWindow(gameMessage, previousQuestionId);
    state.game = gameMessage;
    state.displayName = gameMessage.playerName || state.name;
    state.team = normalizeTeam(gameMessage.team);
    state.joined = true;
    state.connecting = false;
    state.reconnectAttempts = 0;
    lockPlayerMode();
    els.joinForm.hidden = true;
    setStatus(joinedStatus());
    if (previousQuestionId !== gameMessage.questionId) {
      state.lastResult = "";
      state.selectedAnswer = "";
      state.lastLatencyCalibrationKey = "";
      state.latencyCalibrationStatus = "";
      state.lastAnswerRevealKey = "";
      clearAnswerRevealEffect();
      hidePhoneMoment();
    }
    if (gameMessage.selectedAnswer) state.selectedAnswer = gameMessage.selectedAnswer;
    renderGame();
    maybeShowStageTransition(gameMessage, previousGame, previousStagePhase);
    updateMicUi();
  }

  if (message.type === "result" && message.questionId === state.game?.questionId) {
    if (message.cooldownUntil && state.game) {
      state.game.quickPickCooldownUntil = Number(message.cooldownUntil || 0);
    }
    state.lastResult = message.excludedPlayerId === state.playerId
      ? "你今題已答錯，不能再補答"
      : message.message || "";
    showResultMoment(message);
    renderGame();
  }

  if (message.type === "mic-targets") {
    return;
  }

  if (message.type === "buzz-mic-open" && message.questionId === state.game?.questionId) {
    return;
  }

  if (message.type === "buzz-mic-close") {
    return;
  }
}

function sanitizeGameState(game) {
  if (!game || typeof game !== "object") return game;
  const mode = game.mode === "buzz" ? "buzz" : "choice";
  return {
    ...game,
    mode,
    hasQuestion: Boolean(game.hasSong),
  };
}

function updateRemoteCountdownWindow(game, previousQuestionId = "") {
  if (!game || game.type !== "state") return;
  if (previousQuestionId && previousQuestionId !== game.questionId) {
    state.remoteCountdownWindow = null;
  }

  if (!game.hasSong || game.revealed || game.fullPlayback) {
    state.remoteCountdownWindow = null;
    return;
  }

  const duration = Number(game.clipDuration || game.playDuration || 0);
  const hostPlayEndsAt = Number(game.playEndsAt || 0);
  const remoteEndAt =
    Number(game.remotePlayEndsAt || game.answerOpenUntil || 0) ||
    (hostPlayEndsAt ? hostPlayEndsAt + remoteAudioDelayMs(game) : 0);

  if (!duration || !remoteEndAt || (!game.isPlaying && remoteEndAt <= Date.now())) {
    if (state.remoteCountdownWindow?.questionId === game.questionId && state.remoteCountdownWindow.endAt <= Date.now()) {
      state.remoteCountdownWindow = null;
    }
    return;
  }

  state.remoteCountdownWindow = {
    questionId: game.questionId,
    duration,
    startAt: Number(game.remotePlayStartsAt || 0) || remoteEndAt - duration * 1000,
    endAt: remoteEndAt,
  };
}

function renderJoinedWaiting() {
  syncBodyState();
  state.lastRenderedScore = null;
  resetLeaderboardMotion();
  setPlayerScoreText(0);
  hideScoreBurst();
  hideStageCue();
  clearAnswerRevealEffect();
  renderRevealBridge(null);
  renderAnswerCountdown(null);
  renderAnswerGate(null);
  els.playerRound.textContent = `隊伍：${teamLabel(state.team)}`;
  els.phoneStatus.textContent = "已加入遊戲";
  els.phoneTitle.textContent = "等候主持開始";
  els.phoneHints.replaceChildren();
  els.phoneChoices.replaceChildren();
  els.buzzButton.hidden = true;
  els.phoneResult.textContent = "手機已連到主持頁，等候題目同步。";
}

async function startMic(options = {}) {
  if (ONSITE_ONLY) {
    setMicStatus("手機版不使用手機咪");
    updateMicUi();
    return;
  }

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
    const call = state.peer.call(currentRoomId(), stream, {
      metadata: {
        type: "player-mic",
        roomId: currentRoomId(),
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

function clearDisplayMicBroadcasts() {
  return;
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

function setListenButtonState(needsUnlock, canRetry = false) {
  const button = els.phoneRemoteListenButton;
  if (!button) return;

  const icon = ICONS.volume || "";
  const visibleLabel = needsUnlock ? "開聲" : canRetry ? "重連" : "收聽";
  const label = needsUnlock ? "啟用手機收聽" : canRetry ? "重新接駁主持音訊" : "手機收聽已準備";
  button.innerHTML = `${icon}<span class="phone-listen-label">${visibleLabel}</span><span class="visually-hidden">${label}</span>`;
  button.classList.add("icon-action-button");
  button.classList.toggle("is-needed", needsUnlock);
  button.classList.toggle("is-retry", canRetry && !needsUnlock);
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
    markAudioReady();
    playHostAudioBroadcast();
    return Promise.resolve(true);
  }

  if (state.remoteAudioPrimed || state.remoteAudioPriming) {
    if (state.remoteAudioPrimed) markAudioReady();
    return Promise.resolve(state.remoteAudioPrimed);
  }

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

  if (!tasks.length || synchronousUnlock) return finishRemoteAudioPriming(synchronousUnlock);

  return settleAudioUnlockTasks(tasks);
}

function finishRemoteAudioPriming(unlocked) {
  state.remoteAudioPriming = false;
  state.remoteAudioPrimed = state.remoteAudioPrimed || Boolean(unlocked);
  if (state.remoteAudioPrimed) markAudioReady();

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

function settleAudioUnlockTasks(tasks) {
  return new Promise((resolve) => {
    let settled = 0;
    let done = false;
    const finish = (unlocked) => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      resolve(finishRemoteAudioPriming(unlocked));
    };
    const timer = window.setTimeout(() => finish(false), AUDIO_UNLOCK_TIMEOUT_MS);

    tasks.forEach((task) => {
      Promise.resolve(task).then(
        () => finish(true),
        () => {
          settled += 1;
          if (settled >= tasks.length) finish(false);
        }
      );
    });
  });
}

function markAudioReady() {
  if (state.audioReady) return;
  state.audioReady = true;
  notifyAudioReady();
  updateJoinPreview();
}

function notifyAudioReady() {
  if (!state.audioReady) return;

  if (state.firebaseReady && state.firebase) {
    state.firebase.update(["players", state.playerId], {
      audioReady: true,
      updatedAt: Date.now(),
    }).catch(() => {
      setStatus("開聲狀態同步失敗，請檢查網絡");
    });
    return;
  }

  if (state.connection?.open) {
    try {
      state.connection.send({
        type: "audio-ready",
        audioReady: true,
      });
    } catch {
      setStatus("開聲狀態同步失敗，請檢查網絡");
    }
  }
}

async function handleFirebaseAudioOffer(offer) {
  if (!state.firebaseReady || !state.firebase || !offer?.description) return;
  if (!state.remoteMode || !state.joined) return;
  if (offer.sessionId && offer.sessionId === state.firebaseRtcSessionId) return;

  stopFirebaseHostAudio({ message: "正在接駁主持音訊" });
  state.firebaseRtcSessionId = offer.sessionId || "";
  setHostAudioStatus("正在接駁主持音訊");

  const peerConnection = new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 4,
  });
  state.firebaseRtcPeer = peerConnection;

  peerConnection.ontrack = (event) => {
    const stream = event.streams?.[0];
    if (!stream || state.firebaseRtcPeer !== peerConnection) return;
    attachHostAudioBroadcastStream(stream);
  };

  peerConnection.onicecandidate = (event) => {
    if (!event.candidate || state.firebaseRtcPeer !== peerConnection) return;
    state.firebase.push(["rtc", state.playerId, "playerCandidates"], {
      sessionId: state.firebaseRtcSessionId,
      candidate: event.candidate.toJSON(),
      createdAt: Date.now(),
    }).catch(() => {});
  };

  const handleConnectionState = () => {
    if (state.firebaseRtcPeer !== peerConnection) return;
    if (hostAudioPeerNeedsReconnect(peerConnection)) {
      requestHostAudioReconnect("connection-state");
    }
  };
  peerConnection.onconnectionstatechange = handleConnectionState;
  peerConnection.oniceconnectionstatechange = handleConnectionState;

  state.firebaseRtcCleanup.push(state.firebase.onChildAdded(["rtc", state.playerId, "hostCandidates"], (payload) => {
    if (!payload || payload.sessionId !== state.firebaseRtcSessionId || !payload.candidate) return;
    addFirebaseIceCandidateWhenReady(peerConnection, payload.candidate);
  }));

  try {
    await peerConnection.setRemoteDescription(offer.description);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    await state.firebase.set(["rtc", state.playerId, "answer"], {
      sessionId: state.firebaseRtcSessionId,
      description: peerConnection.localDescription.toJSON(),
      createdAt: Date.now(),
    });
  } catch {
    stopFirebaseHostAudio({ message: "無法接駁主持音訊" });
  }
}

function addFirebaseIceCandidateWhenReady(peerConnection, candidate, attempt = 0) {
  if (peerConnection.remoteDescription) {
    peerConnection.addIceCandidate(candidate).catch(() => {});
    return;
  }

  if (attempt > 20) return;
  window.setTimeout(() => addFirebaseIceCandidateWhenReady(peerConnection, candidate, attempt + 1), 150);
}

function stopFirebaseHostAudio(options = {}) {
  const { keepStatus = false, message = defaultListenStatus() } = options;
  state.firebaseRtcCleanup.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch {
      // Ignore cleanup failures.
    }
  });
  state.firebaseRtcCleanup = [];

  try {
    state.firebaseRtcPeer?.close();
  } catch {
    // Ignore closed peer connections.
  }
  state.firebaseRtcPeer = null;
  state.firebaseRtcSessionId = "";
  resetHostAudioHealthStats();

  if (!keepStatus && state.hostAudioStream) {
    stopHostAudioBroadcast({ closeCall: false, message });
  } else if (!keepStatus) {
    setHostAudioStatus(message);
  }
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

  if (!state.remoteMode || !state.joined || call.metadata?.roomId !== currentRoomId()) {
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
  resetHostAudioHealthStats();
  state.hostAudioAttachedAt = Date.now();

  audio.pause();
  audio.srcObject = null;
  audio.removeAttribute("src");
  audio.load();
  audio.srcObject = stream;
  audio.onplaying = () => {
    if (state.hostAudioElement !== audio) return;
    state.hostAudioBlocked = false;
    setHostAudioStatus("正在收聽主持音訊");
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

  if (!state.joined || call.metadata?.roomId !== currentRoomId()) {
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

function playHostAudioBroadcast(options = {}) {
  const { quiet = false } = options;
  const audio = state.hostAudioElement;
  if (!audio || !state.hostAudioStream) {
    state.hostAudioBlocked = false;
    setHostAudioStatus(defaultListenStatus());
    return;
  }

  audio.muted = false;
  audio.volume = 1;
  state.hostAudioLastRetryAt = Date.now();
  if (!quiet) setHostAudioStatus("正在啟用主持音訊");

  const playPromise = audio.play();
  if (!playPromise?.then) {
    state.hostAudioBlocked = false;
    setHostAudioStatus("正在收聽主持音訊");
    return;
  }

  playPromise
    .then(() => {
      state.hostAudioBlocked = false;
      setHostAudioStatus("正在收聽主持音訊");
    })
    .catch(() => {
      state.hostAudioBlocked = true;
      setHostAudioStatus("請按「啟用收聽」");
    });
}

function checkHostAudioHealth() {
  if (!state.joined || !state.hostAudioStream || !state.hostAudioElement) return;

  const tracks = state.hostAudioStream.getAudioTracks?.() || [];
  const hasLiveTrack = tracks.some((track) => track.readyState === "live");
  if (!hasLiveTrack) {
    if (!requestHostAudioReconnect("track-ended")) {
      stopHostAudioBroadcast({ closeCall: false, message: "主持音訊已中斷，等候重新接駁" });
    }
    return;
  }

  const peerConnection = currentHostAudioPeerConnection();
  if (hostAudioPeerNeedsReconnect(peerConnection)) {
    requestHostAudioReconnect("connection-state");
    return;
  }

  const audio = state.hostAudioElement;
  const shouldRetry = state.hostAudioBlocked || audio.paused || audio.readyState === 0;
  if (shouldRetry && Date.now() - Number(state.hostAudioLastRetryAt || 0) >= HOST_AUDIO_RETRY_GAP_MS) {
    playHostAudioBroadcast({ quiet: true });
  }

  checkInboundHostAudioStats(peerConnection);
}

function currentHostAudioPeerConnection() {
  return (
    state.firebaseRtcPeer ||
    state.hostAudioCall?.peerConnection ||
    state.hostAudioCall?._peerConnection ||
    state.hostAudioCall?._pc ||
    null
  );
}

function hostAudioPeerNeedsReconnect(peerConnection) {
  if (!peerConnection) return false;

  const connectionState = peerConnection.connectionState || "";
  const iceState = peerConnection.iceConnectionState || "";
  const now = Date.now();

  if (["failed", "closed"].includes(connectionState) || ["failed", "closed"].includes(iceState)) return true;

  if (connectionState === "disconnected" || iceState === "disconnected") {
    state.hostAudioDisconnectedAt = Number(state.hostAudioDisconnectedAt || now);
    return now - state.hostAudioDisconnectedAt >= HOST_AUDIO_DISCONNECT_GRACE_MS;
  }

  state.hostAudioDisconnectedAt = 0;
  return false;
}

async function checkInboundHostAudioStats(peerConnection) {
  if (!hostAudioShouldBeFlowing() || !peerConnection?.getStats) return;

  try {
    const report = await peerConnection.getStats();
    let foundAudio = false;
    let bytesReceived = 0;
    let packetsReceived = 0;

    report.forEach((stat) => {
      if (stat.type !== "inbound-rtp") return;
      if (stat.kind !== "audio" && stat.mediaType !== "audio") return;
      foundAudio = true;
      bytesReceived += Number(stat.bytesReceived || 0);
      packetsReceived += Number(stat.packetsReceived || 0);
    });

    if (!foundAudio) return;

    const now = Date.now();
    const attachedAt = Number(state.hostAudioAttachedAt || now);
    const hasPreviousStats = Boolean(state.hostAudioLastStatsAt);
    const stalled =
      hasPreviousStats &&
      bytesReceived <= Number(state.hostAudioLastBytesReceived || 0) &&
      packetsReceived <= Number(state.hostAudioLastPacketsReceived || 0);

    state.hostAudioLastBytesReceived = bytesReceived;
    state.hostAudioLastPacketsReceived = packetsReceived;
    state.hostAudioLastStatsAt = now;

    if (now - attachedAt < HOST_AUDIO_STATS_WARMUP_MS) {
      state.hostAudioStaleStatsCount = 0;
      return;
    }

    state.hostAudioStaleStatsCount = stalled ? Number(state.hostAudioStaleStatsCount || 0) + 1 : 0;
    if (state.hostAudioStaleStatsCount >= HOST_AUDIO_STALE_STATS_LIMIT) {
      requestHostAudioReconnect("inbound-stats-stale");
    }
  } catch {
    // Stats are best-effort; audio.play() retries and connection events still run.
  }
}

function hostAudioShouldBeFlowing() {
  const game = state.game;
  return Boolean(game?.isPlaying || game?.mediaPlaying || state.remoteCountdownWindow);
}

function resetHostAudioHealthStats() {
  state.hostAudioDisconnectedAt = 0;
  state.hostAudioLastBytesReceived = 0;
  state.hostAudioLastPacketsReceived = 0;
  state.hostAudioLastStatsAt = 0;
  state.hostAudioStaleStatsCount = 0;
}

function requestHostAudioReconnect(reason = "health-check") {
  if (!state.joined) return false;

  const now = Date.now();
  if (now - Number(state.hostAudioReconnectRequestedAt || 0) < HOST_AUDIO_RECONNECT_REQUEST_GAP_MS) return false;
  state.hostAudioReconnectRequestedAt = now;
  setHostAudioStatus("正在重新接駁主持音訊");

  send({
    type: "audio-restart-request",
    reason,
    requestedAt: now,
  });

  if (state.firebaseRtcPeer) {
    stopFirebaseHostAudio({ message: "正在重新接駁主持音訊" });
    return true;
  }

  stopHostAudioBroadcast({ closeCall: true, message: "正在重新接駁主持音訊" });
  return true;
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
  resetHostAudioHealthStats();
  state.hostAudioAttachedAt = 0;

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
  return Boolean(state.remoteMode);
}

function defaultListenStatus() {
  if (state.remoteMode) return "等候主持音訊";
  return "等候其他手機開咪";
}

function primedListenStatus() {
  if (state.remoteMode) return "已啟用自動收聽，等候主持音訊";
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
  const canRetry = Boolean(hasHostAudio);
  const waitingForAudio = !hasPlayableAudio;
  const hasDefaultWaitingStatus =
    !state.hostAudioStatus ||
    ["等候主持音訊廣播", "等候主持音訊", "等候玩家開咪或主持音訊", "等候玩家開咪", "等候其他手機開咪"].includes(state.hostAudioStatus);
  els.phoneRemoteListenStatus.textContent =
    waitingForAudio && state.remoteAudioPriming
      ? "正在啟用手機出聲"
      : waitingForAudio && state.remoteAudioPrimed && hasDefaultWaitingStatus
      ? primedListenStatus()
      : state.hostAudioStatus || defaultListenStatus();
  els.phoneRemoteListen?.classList.toggle("needs-unlock", needsUnlock);
  els.phoneRemoteListen?.classList.toggle("can-retry", canRetry && !needsUnlock);
  setListenButtonState(needsUnlock, canRetry);
  els.phoneRemoteListenButton.hidden = !canRetry;
  els.phoneRemoteListenButton.disabled = !canRetry;
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
  if (els.onsiteModeButton) els.onsiteModeButton.disabled = true;
  if (els.remoteModeButton) els.remoteModeButton.disabled = true;
  if (els.speakerModeButton) els.speakerModeButton.disabled = true;
  applyPlayerMode();
}

function unlockPlayerMode() {
  if (state.joined) return;
  state.modeLocked = false;
  document.body.classList.remove("is-mode-locked");
  if (els.onsiteModeButton) els.onsiteModeButton.disabled = false;
  if (els.remoteModeButton) els.remoteModeButton.disabled = false;
  if (els.speakerModeButton) els.speakerModeButton.disabled = false;
  applyPlayerMode();
}

function applyPlayerMode() {
  if (ONSITE_ONLY) {
    state.remoteMode = false;
    state.speakerMode = false;
    document.body.classList.remove("is-remote-player", "is-speaker-phone");
    document.body.classList.toggle("is-mode-locked", state.modeLocked);
    if (els.playerModeField) els.playerModeField.hidden = true;
    if (els.speakerModeButton) els.speakerModeButton.hidden = true;
    if (els.phoneRemotePanel) els.phoneRemotePanel.hidden = true;
    if (els.phoneRemoteMedia) els.phoneRemoteMedia.hidden = true;
    teardownRemoteMedia();
    stopHostAudioBroadcast({ closeCall: true, message: defaultListenStatus() });
    return;
  }

  const hasChosenMode = state.modeLocked || state.joined || state.connecting;
  state.remoteMode = true;
  const audioListener = isPhoneAudioListener();
  state.speakerMode = false;
  document.body.classList.toggle("is-remote-player", state.remoteMode);
  document.body.classList.remove("is-speaker-phone");
  document.body.classList.toggle("is-mode-locked", state.modeLocked);
  if (els.playerModeField) els.playerModeField.hidden = true;
  if (els.speakerModeButton) els.speakerModeButton.hidden = true;
  if (els.onsiteModeButton) els.onsiteModeButton.classList.toggle("is-active", false);
  if (els.remoteModeButton) els.remoteModeButton.classList.toggle("is-active", hasChosenMode && state.remoteMode);
  if (els.speakerModeButton) els.speakerModeButton.classList.remove("is-active");
  if (els.onsiteModeButton) els.onsiteModeButton.setAttribute("aria-pressed", "false");
  if (els.remoteModeButton) els.remoteModeButton.setAttribute("aria-pressed", String(hasChosenMode && state.remoteMode));
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
  if (state.game.isPlaying || state.remoteCountdownWindow) els.phoneStatus.textContent = phoneStatusText(state.game);
  if (isPhoneAudioListener() && state.joined && !els.phoneRemotePanel.hidden) {
    els.phoneRemoteStatus.textContent = phoneStatusText(state.game);
    els.phoneRemoteCountdown.textContent = remoteCountdownText(state.game);
    updateRemotePlaybackUi(state.game);
  }
}

function phoneStatusText(game) {
  if (!game) return "等候主持";
  const songlistLabel = game.songlistLabel || "歌單";
  if (isCompensatedPlaybackActive(game)) return `${songlistLabel} · 播放中 · ${remainingSeconds(game)} 秒`;
  if (game.revealed) return isPhoneRevealVisible(game) ? "已開估" : "同步聲音中";
  if (game.frontReady) return "主持已預備";
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
  renderLatencyCalibration(game);

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
  if (isCompensatedPlaybackActive(game)) return `${remainingSeconds(game)} 秒`;
  if (game.revealed) return isPhoneRevealVisible(game) ? "開估" : "同步中";
  if (game.hasQuestion) return "待開始";
  return "--";
}

function renderLatencyCalibration(game) {
  if (!els.phoneLatencyCalibration) return;

  const available = canSendLatencyCalibration(game);
  els.phoneLatencyCalibration.hidden = !available;
  if (!available) return;

  const seconds = Math.round(remoteAudioDelayMs(game) / 1000);
  const key = latencyCalibrationKey(game);
  const alreadySent = state.lastLatencyCalibrationKey === key;
  els.phoneLatencyCalibrationButton.disabled = alreadySent;
  els.phoneLatencyCalibrationButton.textContent = alreadySent ? "已回報" : "聽到音樂";
  els.phoneLatencyCalibrationStatus.textContent =
    state.latencyCalibrationStatus || `目前補償 ${seconds}s`;
}

function canSendLatencyCalibration(game) {
  return Boolean(
    game?.hasSong &&
      !game.revealed &&
      !game.fullPlayback &&
      game.playEndsAt &&
      game.questionId &&
      isCompensatedPlaybackActive(game)
  );
}

function latencyCalibrationKey(game) {
  return `${game?.questionId || ""}:${Number(game?.playbackRevision || 0)}`;
}

function sendLatencyCalibration() {
  const game = state.game;
  if (!canSendLatencyCalibration(game)) return;

  const duration = Number(game.clipDuration || game.playDuration || 0);
  const playEndsAt = Number(game.playEndsAt || 0);
  const heardAt = Date.now();
  const estimatedDelayMs = Math.max(0, heardAt - (playEndsAt - duration * 1000));
  const key = latencyCalibrationKey(game);
  state.lastLatencyCalibrationKey = key;
  state.latencyCalibrationStatus = `已回報 ${formatLatencySampleSeconds(estimatedDelayMs)}`;
  hapticPulse([10, 24, 10]);
  send({
    type: "latency-calibration",
    questionId: game.questionId,
    heardAt,
    playEndsAt,
    clipDuration: duration,
    estimatedDelayMs,
    configuredDelayMs: remoteAudioDelayMs(game),
  });
  renderLatencyCalibration(game);
}

function formatLatencySampleSeconds(ms) {
  const seconds = Number(ms || 0) / 1000;
  const text = seconds >= 10 ? seconds.toFixed(0) : seconds.toFixed(1);
  return `${text.replace(/\.0$/, "")}s`;
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
  return false;
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
  const revealVisible = isPhoneRevealVisible(game);

  syncBodyState();
  applyPlayerMode();
  updatePhoneAppState(game);
  updateLatencySettingUi(game);
  renderPlayerScore(game);
  els.playerRound.textContent = game.hasQuestion
    ? `第 ${game.round} 題 · ${teamLabel(game.team)}`
    : `未開始 · ${teamLabel(state.team)}`;
  els.phoneStatus.textContent = phoneStatusText(game);
  els.phoneTitle.textContent = game.revealed
    ? revealVisible
      ? game.title
      : game.songlistLabel || "準備開估"
    : game.hasQuestion
      ? game.title || game.songlistLabel || "估呢首歌"
      : "準備中";
  renderRevealBridge(game);
  renderAnswerCard(game);
  maybeShowRevealMoment(game);
  maybeShowDelayedRevealStageCue(game);
  els.phoneResult.textContent =
    state.lastResult ||
    (game.buzzWinner
      ? `${game.buzzWinner.name} 已估中`
      : "");

  renderHints(game.hints || []);
  renderChoices(game);
  renderAnswerGate(game);
  renderCooldown(game);
  renderLeaderboard(game.leaderboard || [], game.teamScores || {});
  if (!ONSITE_ONLY) renderRemotePanel(game);
}

function updatePhoneAppState(game) {
  const isPlaying = isCompensatedPlaybackActive(game);
  const revealVisible = isPhoneRevealVisible(game);
  document.body.classList.toggle("has-question", Boolean(game?.hasQuestion));
  document.body.classList.toggle("is-game-playing", isPlaying);
  document.body.classList.toggle("is-game-revealed", Boolean(game?.revealed && revealVisible));
  document.body.classList.toggle("is-reveal-waiting", Boolean(game?.revealed && !revealVisible));
  document.body.classList.toggle("is-quick-mode", game?.mode === "buzz");
  document.body.classList.toggle("is-choice-mode", game?.mode === "choice");

  if (!els.phoneLivePill) return;
  els.phoneLivePill.textContent = game?.revealed
    ? revealVisible
      ? "開估"
      : "同步"
    : isPlaying
      ? "播放中"
      : game?.buzzOpen
        ? "開放"
        : state.hostAudioStream
          ? "收聽中"
          : state.joined
            ? "已入房"
            : "待命";
}

function maybeShowStageTransition(game, previousGame = null, previousStagePhase = "") {
  if (!game?.hasQuestion) return;

  const previousQuestionId = previousGame?.questionId || "";
  const questionChanged = Boolean(previousQuestionId && previousQuestionId !== game.questionId);
  const currentPhase = phoneStagePhase(game);
  const revealVisible = isPhoneRevealVisible(game);
  const previousRevealVisible = isPhoneRevealVisible(previousGame);
  let cue = null;

  if (game.revealed && !revealVisible) return;

  if (game.revealed && revealVisible && !previousRevealVisible) {
    cue = {
      type: "reveal",
      icon: "✓",
      title: "開估",
      detail: game.title || game.answer || "答案揭曉",
      key: `${game.questionId}:reveal:${game.title || game.answer || ""}`,
      duration: 1450,
    };
  } else if (questionChanged) {
    cue = {
      type: "next",
      icon: "→",
      title: `第 ${game.round || ""} 題`,
      detail: "下一題開始",
      key: `${game.questionId}:next:${game.round || ""}`,
      duration: 1350,
    };
  } else if (!previousGame?.hasQuestion) {
    cue = {
      type: "round",
      icon: "♪",
      title: `第 ${game.round || ""} 題`,
      detail: stageModeLabel(game),
      key: `${game.questionId}:round:${game.round || ""}`,
      duration: 1300,
    };
  } else if (currentPhase === "play" && previousStagePhase !== "play") {
    cue = {
      type: "play",
      icon: "♪",
      title: "播放開始",
      detail: `${remainingSeconds(game)} 秒`,
      key: `${game.questionId}:play:${Number(game.playbackRevision || 0)}`,
      duration: 1250,
    };
  }

  if (cue) showStageCue(cue);
}

function phoneStagePhase(game) {
  if (!game?.hasQuestion) return "waiting";
  if (game.revealed && isPhoneRevealVisible(game)) return "reveal";
  if (isCompensatedPlaybackActive(game) || game.isPlaying || game.mediaPlaying) return "play";
  if (game.buzzOpen) return "open";
  return "ready";
}

function maybeShowDelayedRevealStageCue(game) {
  if (!game?.revealed || !isPhoneRevealVisible(game)) return;
  showStageCue({
    type: "reveal",
    icon: "✓",
    title: "開估",
    detail: game.title || game.answer || "答案",
    key: `${game.questionId}:reveal:${game.title || game.answer || ""}`,
    duration: 1450,
  });
}

function stageModeLabel(game) {
  if (game?.mode === "choice") return "四選一";
  if (game?.mode === "buzz") return "快選估歌";
  return "準備開始";
}

function showStageCue({ type, icon, title, detail, key, duration = 1300 }) {
  if (!els.phoneStageCue) return;
  if (key && state.lastStageCueKey === key) return;
  state.lastStageCueKey = key || `${type}:${Date.now()}`;

  clearTimeout(state.stageCueTimer);
  els.phoneStageCue.hidden = false;
  els.phoneStageCue.dataset.type = type || "round";
  if (els.phoneStageCueIcon) els.phoneStageCueIcon.textContent = icon || "♪";
  if (els.phoneStageCueTitle) els.phoneStageCueTitle.textContent = title || "";
  if (els.phoneStageCueDetail) els.phoneStageCueDetail.textContent = detail || "";

  els.phoneStageCue.classList.remove("is-entering");
  els.phoneQuestion?.classList.remove("is-stage-transition");
  void els.phoneStageCue.offsetWidth;
  els.phoneStageCue.classList.add("is-entering");
  els.phoneQuestion?.classList.add("has-stage-cue");
  els.phoneQuestion?.classList.add("is-stage-transition");

  state.stageCueTimer = window.setTimeout(() => {
    hideStageCue();
  }, duration);
}

function hideStageCue() {
  clearTimeout(state.stageCueTimer);
  state.stageCueTimer = null;
  if (els.phoneStageCue) {
    els.phoneStageCue.hidden = true;
    els.phoneStageCue.classList.remove("is-entering");
    delete els.phoneStageCue.dataset.type;
  }
  els.phoneQuestion?.classList.remove("has-stage-cue");
  els.phoneQuestion?.classList.remove("is-stage-transition");
}

function openLeaderboard() {
  hapticPulse(8);
  els.leaderboardModal.hidden = false;
  requestAnimationFrame(() => replayLeaderboardMotion());
  els.closeLeaderboardButton.focus();
}

function closeLeaderboard() {
  els.leaderboardModal.hidden = true;
  els.openLeaderboardButton.focus();
}

function openSettings() {
  hapticPulse(8);
  syncPhoneSettingsControls();
  els.settingsModal.hidden = false;
  els.closeSettingsButton.focus();
}

function closeSettings() {
  els.settingsModal.hidden = true;
  els.phoneSettingsButton.focus();
}

function renderPlayerScore(game) {
  const score = Number(game?.score || 0);
  const previous = state.lastRenderedScore;
  setPlayerScoreText(score);

  if (previous !== null && score !== previous) {
    showScoreChange(score - previous);
  }
  state.lastRenderedScore = score;
}

function setPlayerScoreText(score) {
  const text = `${Number(score || 0)} 分`;
  if (els.playerScoreValue) {
    els.playerScoreValue.textContent = text;
    return;
  }
  els.playerScore.textContent = text;
}

function showScoreChange(delta) {
  if (!els.phoneScoreBurst || !els.playerScore || !delta) return;

  clearTimeout(state.scoreBurstTimer);
  const isUp = delta > 0;
  els.phoneScoreBurst.hidden = false;
  els.phoneScoreBurst.textContent = isUp ? `+${delta}` : String(delta);
  els.phoneScoreBurst.dataset.type = isUp ? "up" : "down";
  els.playerScore.classList.remove("is-score-pop", "is-score-down");
  els.phoneScoreBurst.classList.remove("is-floating");
  void els.phoneScoreBurst.offsetWidth;
  els.playerScore.classList.add(isUp ? "is-score-pop" : "is-score-down");
  els.phoneScoreBurst.classList.add("is-floating");

  state.scoreBurstTimer = window.setTimeout(() => {
    hideScoreBurst();
  }, 1100);
}

function hideScoreBurst() {
  clearTimeout(state.scoreBurstTimer);
  state.scoreBurstTimer = null;
  if (els.playerScore) els.playerScore.classList.remove("is-score-pop", "is-score-down");
  if (els.phoneScoreBurst) {
    els.phoneScoreBurst.hidden = true;
    els.phoneScoreBurst.classList.remove("is-floating");
    delete els.phoneScoreBurst.dataset.type;
  }
}

function showResultMoment(message) {
  if (!message || message.excludedPlayerId === state.playerId) {
    showPhoneMoment({
      type: "miss",
      icon: "!",
      title: "不能補答",
      detail: "今題已記錄，等下一題再來",
      key: `excluded:${message?.questionId || Date.now()}`,
      duration: 2800,
    });
    return;
  }

  const points = Number(message.points || 0);
  if (message.correct) {
    showPhoneMoment({
      type: "correct",
      icon: "+",
      title: message.message || "答中",
      detail: points ? `今題 +${points} 分` : "提交成功",
      key: `correct:${message.questionId}:${message.message || ""}`,
      duration: 3600,
    });
    hapticPulse([18, 35, 18]);
    return;
  }

  showPhoneMoment({
    type: points < 0 ? "miss" : "notice",
    icon: points < 0 ? "−" : "·",
    title: message.message || "已提交",
    detail: message.cooldownUntil ? "稍等一下再答" : "等候下一個狀態",
    key: `result:${message.questionId}:${message.message || ""}`,
    duration: 3000,
  });
  hapticPulse(10);
}

function maybeShowRevealMoment(game) {
  if (!game?.revealed || !game.title) return;
  if (!isPhoneRevealVisible(game)) return;
  const key = `reveal:${game.questionId}:${game.title}`;
  if (state.lastMomentKey === key) return;
  showPhoneMoment({
    type: "reveal",
    icon: "♪",
    title: game.title,
    detail: "正確答案",
    key,
    duration: 4200,
  });
}

function showPhoneMoment({ type, icon, title, detail, key, duration = 3200 }) {
  if (!els.phoneMoment) return;
  if (key && state.lastMomentKey === key) return;
  state.lastMomentKey = key || `${type}:${Date.now()}`;

  clearTimeout(state.momentTimer);
  els.phoneMoment.hidden = false;
  els.phoneMoment.dataset.type = type || "notice";
  els.phoneMomentIcon.textContent = icon || "✓";
  els.phoneMomentTitle.textContent = title || "";
  els.phoneMomentDetail.textContent = detail || "";
  els.phoneMoment.classList.remove("is-entering");
  void els.phoneMoment.offsetWidth;
  els.phoneMoment.classList.add("is-entering");

  state.momentTimer = window.setTimeout(() => {
    hidePhoneMoment();
  }, duration);
}

function hidePhoneMoment() {
  clearTimeout(state.momentTimer);
  state.momentTimer = null;
  if (els.phoneMoment) {
    els.phoneMoment.hidden = true;
    els.phoneMoment.classList.remove("is-entering");
  }
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

function renderRevealBridge(game) {
  if (!els.phoneRevealBridge) return;
  const info = revealCountdownInfo(game);
  const visible = Boolean(game?.revealed && info && !info.started && info.waitingMs > 0);
  els.phoneRevealBridge.hidden = !visible;

  if (!visible) {
    els.phoneRevealBridge.style.setProperty("--reveal-sync-progress", "0");
    if (els.phoneRevealBridgeCount) els.phoneRevealBridgeCount.textContent = "";
    if (els.phoneRevealBridgeDetail) els.phoneRevealBridgeDetail.textContent = "";
    return;
  }

  const seconds = Math.max(1, Math.ceil(info.waitingMs / 1000));
  if (els.phoneRevealBridgeKicker) els.phoneRevealBridgeKicker.textContent = "聲音同步";
  if (els.phoneRevealBridgeTitle) els.phoneRevealBridgeTitle.textContent = "同步聲音中";
  if (els.phoneRevealBridgeCount) els.phoneRevealBridgeCount.textContent = String(seconds);
  if (els.phoneRevealBridgeDetail) {
    els.phoneRevealBridgeDetail.textContent = `${seconds} 秒後顯示答案`;
  }
  els.phoneRevealBridge.style.setProperty("--reveal-sync-progress", info.waitingProgress.toFixed(3));
}

function renderAnswerCard(game) {
  if (!els.phoneAnswerCard) return;
  const hasAnswer = Boolean(game?.revealed && (game.answer || game.title));
  const shouldShow = Boolean(hasAnswer && isPhoneRevealVisible(game));
  els.phoneAnswerCard.hidden = !shouldShow;
  if (!shouldShow) {
    if (els.phoneAnswerTitle) els.phoneAnswerTitle.textContent = "";
    if (els.phoneAnswerMeta) els.phoneAnswerMeta.textContent = "";
    clearAnswerRevealEffect();
    renderAnswerCountdown(hasAnswer ? game : null);
    return;
  }

  const meta = Array.isArray(game.meta) ? game.meta.filter(Boolean).join(" · ") : "";
  els.phoneAnswerTitle.textContent = game.answer || game.title || "已開估";
  els.phoneAnswerMeta.textContent = meta || "5 秒後自動下一題";
  triggerAnswerRevealEffect(answerRevealKey(game));
  renderAnswerCountdown(game);
}

function answerRevealKey(game) {
  return `${game?.questionId || ""}:${game?.answer || game?.title || ""}:${Number(game?.revealAutoNextStartsAt || 0)}`;
}

function triggerAnswerRevealEffect(key) {
  if (!els.phoneAnswerCard || !key || state.lastAnswerRevealKey === key) return;
  state.lastAnswerRevealKey = key;
  clearTimeout(state.answerRevealTimer);
  els.phoneAnswerCard.classList.remove("is-answer-revealing");
  els.phoneQuestion?.classList.remove("is-answer-bloom");
  void els.phoneAnswerCard.offsetWidth;
  els.phoneAnswerCard.classList.add("is-answer-revealing");
  els.phoneQuestion?.classList.add("is-answer-bloom");
  hapticPulse([12, 28, 12]);

  state.answerRevealTimer = window.setTimeout(() => {
    clearAnswerRevealEffect();
  }, 1400);
}

function clearAnswerRevealEffect() {
  clearTimeout(state.answerRevealTimer);
  state.answerRevealTimer = null;
  els.phoneAnswerCard?.classList.remove("is-answer-revealing");
  els.phoneQuestion?.classList.remove("is-answer-bloom");
}

function renderAnswerCountdown(game) {
  clearAnswerCountdownTimer();
  const info = revealCountdownInfo(game);
  const visible = Boolean(info && info.started && info.remainingMs > 0);

  if (els.phoneAnswerCountdown) els.phoneAnswerCountdown.hidden = !visible;
  if (!visible) {
    if (els.phoneAnswerCountdownText) els.phoneAnswerCountdownText.textContent = "";
    if (els.phoneAnswerCountdownRing) els.phoneAnswerCountdownRing.style.strokeDashoffset = "100";
    if (info?.waitingMs > 0) scheduleAnswerCountdownRender(Math.min(info.waitingMs, 250));
    return;
  }

  if (els.phoneAnswerCountdownText) els.phoneAnswerCountdownText.textContent = String(info.seconds);
  if (els.phoneAnswerCountdownRing) {
    els.phoneAnswerCountdownRing.style.strokeDashoffset = String(Math.round((1 - info.progress) * 100));
  }

  scheduleAnswerCountdownRender(info.remainingMs > 1000 ? 250 : 120);
}

function scheduleAnswerCountdownRender(delayMs) {
  state.answerCountdownTimer = window.setTimeout(() => {
    state.answerCountdownTimer = null;
    if (state.game) renderGame();
  }, Math.max(60, delayMs));
}

function revealCountdownInfo(game) {
  if (!game?.revealed) return null;
  const endAt = Number(game.revealAutoNextEndsAt || 0);
  if (!endAt) return null;
  const total = Math.max(1000, Number(game.revealAutoNextDelayMs || 5000));
  const startAt = Number(game.revealAutoNextStartsAt || 0) || endAt - total;
  const now = Date.now();
  const openedAt = Number(game.revealAutoNextOpenedAt || 0) || startAt - remoteAudioDelayMs(game);
  const waitingTotalMs = Math.max(0, startAt - openedAt);
  const waitingMs = Math.max(0, startAt - now);
  const remainingMs = Math.max(0, endAt - now);
  const started = waitingMs <= 0;
  const activeRemainingMs = started ? remainingMs : total;
  const progress = Math.max(0, Math.min(1, activeRemainingMs / total));
  const waitingProgress = waitingTotalMs
    ? Math.max(0, Math.min(1, (now - openedAt) / waitingTotalMs))
    : started
      ? 1
      : 0;
  return {
    started,
    startAt,
    endAt,
    openedAt,
    waitingMs,
    waitingTotalMs,
    waitingProgress,
    remainingMs,
    progress,
    seconds: Math.max(1, Math.ceil(activeRemainingMs / 1000)),
  };
}

function isPhoneRevealVisible(game) {
  if (!game?.revealed) return false;
  const info = revealCountdownInfo(game);
  return !info || info.started;
}

function clearAnswerCountdownTimer() {
  clearTimeout(state.answerCountdownTimer);
  state.answerCountdownTimer = null;
}

function renderCooldown(game) {
  if (!els.phoneCooldown) return;

  const remainingMs =
    game?.mode === "buzz" && !game.revealed && !game.buzzWinner ? quickPickCooldownRemaining(game) : 0;
  const isVisible = remainingMs > 0;
  els.phoneCooldown.hidden = !isVisible;
  if (!isVisible) {
    els.phoneCooldown.style.setProperty("--cooldown-progress", "0");
    clearCooldownMotionEffect();
    return;
  }

  const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const total = Math.max(remainingMs, Number(game.quickPickCooldownMs || QUICK_PICK_COOLDOWN_MS));
  const progress = Math.max(0, Math.min(1, remainingMs / total));
  els.phoneCooldownTitle.textContent = "答錯冷卻中";
  els.phoneCooldownText.textContent = `${seconds} 秒後可以再答`;
  els.phoneCooldown.style.setProperty("--cooldown-progress", progress.toFixed(3));
  triggerCooldownMotionEffect(game);
  scheduleQuickPickCooldownRender(remainingMs);
}

function triggerCooldownMotionEffect(game) {
  if (!els.phoneCooldown) return;
  const key = `${game?.questionId || ""}:${Number(game?.quickPickCooldownUntil || 0)}`;
  if (!key || state.cooldownMotionKey === key) return;
  state.cooldownMotionKey = key;
  clearTimeout(state.cooldownMotionTimer);
  els.phoneCooldown.classList.remove("is-cooldown-entering");
  void els.phoneCooldown.offsetWidth;
  els.phoneCooldown.classList.add("is-cooldown-entering");
  state.cooldownMotionTimer = window.setTimeout(() => {
    els.phoneCooldown?.classList.remove("is-cooldown-entering");
  }, 900);
}

function clearCooldownMotionEffect() {
  clearTimeout(state.cooldownMotionTimer);
  state.cooldownMotionTimer = null;
  state.cooldownMotionKey = "";
  els.phoneCooldown?.classList.remove("is-cooldown-entering");
}

function remoteAnswerStartRemainingMs(game) {
  if (!game || game.revealed || game.fullPlayback) return 0;
  const info = compensatedCountdownInfo(game);
  return info && !info.started ? info.waitingMs : 0;
}

function renderAnswerGate(game) {
  if (!els.phoneAnswerGate) return;

  const info = compensatedCountdownInfo(game);
  const visible = Boolean(
    game &&
      (game.mode === "choice" || game.mode === "buzz") &&
      !game.revealed &&
      !game.fullPlayback &&
      game.choices?.length &&
      info &&
      !info.started &&
      info.waitingMs > 0
  );
  els.phoneAnswerGate.hidden = !visible;
  els.phoneResult?.classList.toggle("is-answer-gate-muted", visible);

  if (!visible) {
    els.phoneAnswerGate.style.setProperty("--answer-gate-progress", "0");
    clearAnswerGateMotionEffect();
    return;
  }

  const seconds = Math.max(1, Math.ceil(info.waitingMs / 1000));
  const total = Math.max(info.waitingMs, remoteAudioDelayMs(game), 1000);
  const progress = Math.max(0, Math.min(1, 1 - info.waitingMs / total));
  const modeLabel = game.mode === "buzz" ? "快選準備中" : "答題準備中";
  const detail = game.mode === "buzz" ? "音樂同步後自動開放快選" : "音樂同步後自動開放答題";

  els.phoneAnswerGateTitle.textContent = modeLabel;
  els.phoneAnswerGateText.textContent = detail;
  els.phoneAnswerGateCount.textContent = String(seconds);
  els.phoneAnswerGate.style.setProperty("--answer-gate-progress", progress.toFixed(3));
  triggerAnswerGateMotionEffect(game);
}

function triggerAnswerGateMotionEffect(game) {
  if (!els.phoneAnswerGate) return;
  const key = `${game?.questionId || ""}:${Number(state.remoteCountdownWindow?.startAt || 0)}`;
  if (!key || state.answerGateMotionKey === key) return;
  state.answerGateMotionKey = key;
  clearTimeout(state.answerGateMotionTimer);
  els.phoneAnswerGate.classList.remove("is-answer-gate-entering");
  void els.phoneAnswerGate.offsetWidth;
  els.phoneAnswerGate.classList.add("is-answer-gate-entering");
  state.answerGateMotionTimer = window.setTimeout(() => {
    els.phoneAnswerGate?.classList.remove("is-answer-gate-entering");
  }, 900);
}

function clearAnswerGateMotionEffect() {
  clearTimeout(state.answerGateMotionTimer);
  state.answerGateMotionTimer = null;
  state.answerGateMotionKey = "";
  els.phoneAnswerGate?.classList.remove("is-answer-gate-entering");
}

function renderChoices(game) {
  els.phoneChoices.replaceChildren();
  els.buzzButton.hidden = true;
  els.phoneChoices.classList.toggle("is-quick-pick", game.mode === "buzz");
  els.phoneChoices.classList.remove("has-cooldown");
  els.phoneChoices.classList.remove("is-waiting-sync");
  clearAnswerStartTimer();
  clearQuickPickCooldownTimer();

  if (!game.hasQuestion || game.revealed) return;

  if (game.mode === "choice" || game.mode === "buzz") {
    const isQuickPick = game.mode === "buzz";
    if (!game.choices?.length) {
      const empty = document.createElement("div");
      empty.className = "phone-empty";
      empty.textContent = isQuickPick
        ? "等主持開放快選"
        : game.frontReady
          ? "等主持播放 / 重播片段"
          : "選項同步中，請等主持重新整理主持頁或按下一題";
      els.phoneChoices.append(empty);
      return;
    }

    const answerStartRemaining = remoteAnswerStartRemainingMs(game);
    const answerLocked = answerStartRemaining > 0;
    const cooldownRemaining = isQuickPick ? quickPickCooldownRemaining(game) : 0;
    els.phoneChoices.classList.toggle("is-waiting-sync", answerLocked);
    els.phoneChoices.classList.toggle("has-cooldown", isQuickPick && cooldownRemaining > 0);
    if (answerLocked) scheduleAnswerStartRender(answerStartRemaining);
    if (cooldownRemaining > 0) scheduleQuickPickCooldownRender(cooldownRemaining);

    (game.choices || []).forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice-button phone-choice${isQuickPick ? " is-quick-pick-choice" : ""}`;
      const number = document.createElement("span");
      number.className = "phone-choice-index";
      number.textContent = String(index + 1);
      const title = document.createElement("strong");
      title.className = "phone-choice-title";
      title.textContent = choice;
      button.append(number, title);
      const selected = sameChoice(state.selectedAnswer, choice);
      button.classList.toggle("is-selected", selected);
      button.classList.toggle("is-sync-locked", answerLocked);
      button.classList.toggle("is-cooldown-locked", isQuickPick && cooldownRemaining > 0);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = isQuickPick
        ? Boolean(game.answered || game.buzzWinner || !game.buzzOpen || answerLocked || cooldownRemaining > 0)
        : Boolean(game.answered || answerLocked);
      button.addEventListener("click", () => {
        hapticPulse(isQuickPick ? [12, 24, 12] : 12);
        playChoiceTapMotion(button, isQuickPick);
        state.selectedAnswer = choice;
        send({ type: "answer", questionId: game.questionId, answer: choice });
        [...els.phoneChoices.querySelectorAll("button")].forEach((item) => {
          item.disabled = true;
          item.classList.toggle("is-selected", item === button);
          item.setAttribute("aria-pressed", String(item === button));
          item.classList.toggle("is-choice-confirming", item === button);
          item.classList.remove("is-choice-pressing");
        });
        els.phoneResult.textContent = isQuickPick ? `已選：${choice}` : `已提交答案：${choice}`;
      });
      els.phoneChoices.append(button);
    });

    if (!isQuickPick) {
      if (answerLocked) {
        els.phoneResult.textContent = `準備聽歌，${Math.ceil(answerStartRemaining / 1000)} 秒後開放答題`;
      } else if (!state.lastResult && !game.answered) {
        els.phoneResult.textContent = "請選擇答案";
      }
      return;
    }

    if (answerLocked) {
      els.phoneResult.textContent = `準備聽歌，${Math.ceil(answerStartRemaining / 1000)} 秒後開放快選`;
    } else if (game.buzzWinner) {
      els.phoneResult.textContent = `${game.buzzWinner.name} 已估中`;
    } else if (cooldownRemaining > 0) {
      els.phoneResult.textContent = `未中，${Math.ceil(cooldownRemaining / 1000)} 秒後可以再答`;
    } else if (game.buzzOpen) {
      els.phoneResult.textContent = state.lastResult?.includes("未中")
        ? state.lastResult
        : `快選估歌開放：答中 +${game.quickPickCorrectPoints || 5}，答錯 ${game.quickPickWrongPoints || -1}`;
    } else if (!game.answered) {
      els.phoneResult.textContent = "等主持開放快選";
    }

    return;
  }

  els.buzzButton.hidden = true;
}

function playChoiceTapMotion(button, isQuickPick = false) {
  if (!button) return;
  button.classList.remove("is-choice-pressing", "is-choice-confirming");
  void button.offsetWidth;
  button.classList.add("is-choice-pressing");
  window.setTimeout(() => {
    button.classList.remove("is-choice-pressing");
    button.classList.add("is-choice-confirming");
  }, isQuickPick ? 120 : 90);
  window.setTimeout(() => {
    button.classList.remove("is-choice-confirming");
  }, 760);
}

function clearAnswerStartTimer() {
  clearTimeout(state.answerStartTimer);
  state.answerStartTimer = null;
}

function scheduleAnswerStartRender(remainingMs) {
  clearAnswerStartTimer();
  const nextTick = remainingMs > 1000 ? 1000 : remainingMs + 50;
  state.answerStartTimer = window.setTimeout(() => {
    state.answerStartTimer = null;
    if (state.game) renderGame();
  }, Math.max(120, nextTick));
}

function clearQuickPickCooldownTimer() {
  clearTimeout(state.quickPickCooldownTimer);
  state.quickPickCooldownTimer = null;
}

function quickPickCooldownRemaining(game) {
  const cooldownUntil = Number(game?.quickPickCooldownUntil || 0);
  return Math.max(0, cooldownUntil - Date.now());
}

function scheduleQuickPickCooldownRender(remainingMs) {
  clearQuickPickCooldownTimer();
  const nextTick = remainingMs > 1000 ? 1000 : remainingMs + 50;
  state.quickPickCooldownTimer = window.setTimeout(() => {
    state.quickPickCooldownTimer = null;
    renderGame();
  }, Math.max(150, nextTick));
}

function renderLeaderboard(players, teamScores = {}) {
  els.phoneLeaderboard.replaceChildren();
  els.phoneLeaderboard.append(renderPhoneTeamSummary(teamScores));

  if (!players.length) {
    resetLeaderboardMotion();
    const empty = document.createElement("div");
    empty.className = "phone-empty";
    empty.textContent = "等候排行榜";
    els.phoneLeaderboard.append(empty);
    return;
  }

  const rankedPlayers = players.filter(Boolean).slice(0, 10);
  els.phoneLeaderboard.append(renderPhoneSettlementHero(players, teamScores));
  const movements = resolveLeaderboardMovements(players);
  els.phoneLeaderboard.append(renderPhoneLeaderboardPodium(rankedPlayers, movements));

  const list = document.createElement("div");
  list.className = "phone-rank-list";
  const topScore = Math.max(1, ...rankedPlayers.map((player) => Number(player?.score || 0)));

  rankedPlayers.forEach((player, index) => {
    const movement = movements.get(leaderboardPlayerKey(player, index));
    const scoreValue = Number(player.score || 0);
    const item = document.createElement("div");
    item.className = "phone-rank";
    item.classList.toggle("is-leader", index === 0);
    item.classList.toggle("is-self", isCurrentLeaderboardPlayer(player));
    item.dataset.team = normalizeTeam(player.team);
    item.style.setProperty("--rank-progress", scoreValue > 0 ? Math.min(1, scoreValue / topScore).toFixed(3) : "0");
    applyLeaderboardMovement(item, movement);

    const badge = document.createElement("b");
    badge.className = "phone-rank-badge";
    badge.textContent = index === 0 ? "冠" : String(index + 1);

    const main = document.createElement("span");
    main.className = "phone-rank-main";
    const titleLine = document.createElement("span");
    titleLine.className = "phone-rank-titleline";
    const name = document.createElement("strong");
    name.className = "phone-rank-name";
    name.textContent = player.name || "玩家";
    const teamChip = document.createElement("small");
    teamChip.className = "phone-team-chip";
    teamChip.dataset.team = normalizeTeam(player.team);
    teamChip.textContent = teamLabel(player.team);
    titleLine.append(name, teamChip);
    if (isCurrentLeaderboardPlayer(player)) {
      const selfChip = document.createElement("small");
      selfChip.className = "phone-self-chip";
      selfChip.textContent = "你";
      titleLine.append(selfChip);
    }
    const meter = document.createElement("i");
    meter.className = "phone-rank-meter";
    meter.append(document.createElement("span"));
    main.append(titleLine, meter);

    const scoreWrap = document.createElement("span");
    scoreWrap.className = "phone-rank-score";
    const score = document.createElement("strong");
    score.textContent = `${scoreValue} 分`;
    const delta = document.createElement("small");
    delta.className = "phone-rank-delta";
    delta.hidden = !movement?.label;
    delta.textContent = movement?.label || "";
    scoreWrap.append(score, delta);

    item.append(badge, main, scoreWrap);
    list.append(item);
  });

  els.phoneLeaderboard.append(list);
}

function resolveLeaderboardMovements(players) {
  const now = Date.now();
  const movements = new Map();
  const nextRanks = new Map();
  const nextScores = new Map();

  state.leaderboardMovementCache.forEach((movement, key) => {
    if (!movement?.expiresAt || movement.expiresAt <= now) state.leaderboardMovementCache.delete(key);
  });

  players.forEach((player, index) => {
    const key = leaderboardPlayerKey(player, index);
    const rank = index + 1;
    const score = Number(player?.score || 0);
    const previousRank = state.leaderboardRankSnapshot.get(key);
    const previousScore = state.leaderboardScoreSnapshot.get(key);
    let type = "";
    let label = "";

    if (state.leaderboardSnapshotReady) {
      if (!previousRank) {
        type = "new";
        label = "NEW";
      } else if (rank < previousRank) {
        type = "up";
        label = `↑${previousRank - rank}`;
      } else if (rank > previousRank) {
        type = "down";
        label = `↓${rank - previousRank}`;
      } else if (Number.isFinite(previousScore) && score !== previousScore) {
        const diff = score - previousScore;
        type = diff > 0 ? "score-up" : "score-down";
        label = diff > 0 ? `+${diff}` : String(diff);
      }
    }

    if (type) {
      state.leaderboardMovementCache.set(key, { type, label, expiresAt: now + 3600 });
    }

    movements.set(key, state.leaderboardMovementCache.get(key) || { type: "", label: "" });
    nextRanks.set(key, rank);
    nextScores.set(key, score);
  });

  state.leaderboardRankSnapshot = nextRanks;
  state.leaderboardScoreSnapshot = nextScores;
  state.leaderboardSnapshotReady = true;
  return movements;
}

function leaderboardPlayerKey(player, index = 0) {
  return String(player?.id || `${normalizePlayerName(player?.name || "player")}:${normalizeTeam(player?.team)}:${index}`);
}

function applyLeaderboardMovement(item, movement) {
  if (!item || !movement?.type) return;
  item.dataset.move = movement.type;
  item.classList.add("is-rank-animating");
}

function replayLeaderboardMotion() {
  if (!els.phoneLeaderboard) return;
  els.phoneLeaderboard.querySelectorAll(".phone-rank[data-move], .phone-podium-card[data-move]").forEach((item) => {
    item.classList.remove("is-rank-animating");
    void item.offsetWidth;
    item.classList.add("is-rank-animating");
  });
}

function resetLeaderboardMotion() {
  state.leaderboardSnapshotReady = false;
  state.leaderboardRankSnapshot = new Map();
  state.leaderboardScoreSnapshot = new Map();
  state.leaderboardMovementCache = new Map();
}

function renderPhoneLeaderboardPodium(players, movements) {
  const podium = document.createElement("div");
  podium.className = "phone-podium";
  const topPlayers = players.slice(0, 3);
  podium.dataset.count = String(topPlayers.length);
  const order = topPlayers.length >= 3 ? [1, 0, 2] : topPlayers.map((_, index) => index);

  order.forEach((playerIndex) => {
    const player = topPlayers[playerIndex];
    const rank = playerIndex + 1;
    const card = document.createElement("div");
    card.className = "phone-podium-card";
    card.dataset.rank = String(rank);
    card.classList.toggle("is-winner", rank === 1);
    card.classList.toggle("is-self", isCurrentLeaderboardPlayer(player));
    applyLeaderboardMovement(card, movements.get(leaderboardPlayerKey(player, playerIndex)));

    const medal = document.createElement("b");
    medal.className = "phone-podium-medal";
    medal.textContent = rank === 1 ? "冠" : String(rank);

    const name = document.createElement("strong");
    name.textContent = player?.name || "玩家";

    const teamChip = document.createElement("small");
    teamChip.className = "phone-team-chip";
    teamChip.dataset.team = normalizeTeam(player?.team);
    teamChip.textContent = teamLabel(player?.team);

    const score = document.createElement("em");
    score.textContent = `${Number(player?.score || 0)} 分`;

    const movement = movements.get(leaderboardPlayerKey(player, playerIndex));
    const delta = document.createElement("small");
    delta.className = "phone-rank-delta phone-podium-delta";
    delta.hidden = !movement?.label;
    delta.textContent = movement?.label || "";

    card.append(medal, name, teamChip, score, delta);
    podium.append(card);
  });

  return podium;
}

function renderPhoneSettlementHero(players, teamScores = {}) {
  const top = players[0] || {};
  const aScore = Number(teamScores.A || 0);
  const bScore = Number(teamScores.B || 0);
  const teamStatus = aScore === bScore ? "分組暫時平手" : `${aScore > bScore ? "A" : "B"} 組領先`;
  const hero = document.createElement("div");
  hero.className = "phone-settlement-hero";
  hero.dataset.team = normalizeTeam(top.team);
  hero.classList.toggle("is-self", isCurrentLeaderboardPlayer(top));

  const badge = document.createElement("b");
  badge.textContent = "冠";

  const copy = document.createElement("span");
  const name = document.createElement("strong");
  name.textContent = top.name ? `${top.name} 暫列第一` : "暫未有領先玩家";
  const meta = document.createElement("small");
  meta.textContent = teamStatus;
  copy.append(name, meta);

  const score = document.createElement("em");
  score.textContent = `${Number(top.score || 0)} 分`;

  hero.append(badge, copy, score);
  return hero;
}

function renderPhoneTeamSummary(teamScores) {
  const aScore = Number(teamScores.A || 0);
  const bScore = Number(teamScores.B || 0);
  const topScore = Math.max(1, aScore, bScore);
  const summary = document.createElement("div");
  summary.className = "phone-team-summary";
  const teams = [
    ["A", aScore],
    ["B", bScore],
  ];
  teams.forEach(([team, score]) => {
    const item = document.createElement("span");
    item.classList.toggle("is-leading", score > (team === "A" ? bScore : aScore));
    item.style.setProperty("--team-progress", score > 0 ? Math.min(1, score / topScore).toFixed(3) : "0");
    const label = document.createElement("b");
    label.textContent = `${team} 組`;
    const value = document.createElement("strong");
    value.textContent = String(score);
    const meter = document.createElement("i");
    item.append(label, value, meter);
    summary.append(item);
  });
  return summary;
}

function isCurrentLeaderboardPlayer(player) {
  if (!player) return false;
  if (player.id && player.id === state.playerId) return true;
  const playerName = normalizePlayerName(player.name || "");
  const displayName = normalizePlayerName(state.displayName || state.name || "");
  return Boolean(playerName && displayName && playerName === displayName && normalizeTeam(player.team) === normalizeTeam(state.team));
}

function sameChoice(left, right) {
  return String(left || "").trim() === String(right || "").trim();
}

function send(message) {
  if (state.firebaseReady && state.firebase) {
    state.firebase.push(["events"], {
      playerId: state.playerId,
      type: message?.type || "message",
      message,
      createdAt: Date.now(),
    }).catch(() => {
      setStatus("送出失敗，請檢查網絡");
    });
    return;
  }

  if (state.connection?.open) state.connection.send(message);
}

function setStatus(message) {
  els.playerStatus.textContent = message;
  if (els.phoneLivePill && !state.game) {
    els.phoneLivePill.textContent = state.connecting ? "連線中" : state.joined ? "已入房" : "待命";
  }
  updateJoinPreview();
  syncBodyState();
}

function syncBodyState() {
  document.body.classList.toggle("is-joined", Boolean(state.joined));
  document.body.classList.toggle("is-connecting", Boolean(state.connecting && !state.joined));
  document.body.classList.toggle("effects-off", !state.settings.motionEffects);
  document.body.classList.toggle("is-compact-ui", Boolean(state.settings.compactMode));
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
  const compensated = compensatedCountdownInfo(game);
  if (compensated) return compensated.remaining;
  if (!game.playEndsAt) return game.playDuration || 0;
  return Math.max(0, Math.ceil((game.playEndsAt - Date.now()) / 1000));
}

function isCompensatedPlaybackActive(game) {
  return Boolean(compensatedCountdownInfo(game));
}

function compensatedCountdownInfo(game) {
  if (!game || game.revealed || game.fullPlayback) return null;
  const activeWindow = state.remoteCountdownWindow;
  if (!activeWindow || activeWindow.questionId !== game.questionId) return null;

  const now = Date.now();
  if (now >= activeWindow.endAt) {
    state.remoteCountdownWindow = null;
    return null;
  }

  const duration = Number(activeWindow.duration || game.clipDuration || game.playDuration || 0);
  if (!duration) return null;
  const waitingMs = Math.max(0, activeWindow.startAt - now);
  const started = waitingMs <= 0;
  const remaining = Math.min(duration, Math.max(0, Math.ceil((activeWindow.endAt - now) / 1000)));
  return { remaining, duration, started, waitingMs };
}

function remoteAudioDelayMs(game) {
  const configured = Number(game?.remoteAudioDelayMs);
  return Number.isFinite(configured) && configured >= 0 ? configured : DEFAULT_REMOTE_AUDIO_COUNTDOWN_DELAY_MS;
}

function updateLatencySettingUi(game = state.game) {
  if (!els.phoneLatencyValue && !els.phoneLatencyNote) return;
  const seconds = Math.round(remoteAudioDelayMs(game) / 1000);
  if (els.phoneLatencyValue) els.phoneLatencyValue.textContent = `${seconds}s`;
  if (els.phoneLatencyNote) {
    els.phoneLatencyNote.textContent = `手機倒數已按主持設定延遲 ${seconds} 秒`;
  }
}

function loadPhoneSettings() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(PHONE_SETTINGS_KEY) || "{}") || {};
  } catch {
    saved = {};
  }

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  return {
    ...DEFAULT_PHONE_SETTINGS,
    motionEffects: prefersReducedMotion ? false : saved.motionEffects ?? DEFAULT_PHONE_SETTINGS.motionEffects,
    haptics: saved.haptics ?? DEFAULT_PHONE_SETTINGS.haptics,
    compactMode: saved.compactMode ?? DEFAULT_PHONE_SETTINGS.compactMode,
  };
}

function savePhoneSettings() {
  localStorage.setItem(PHONE_SETTINGS_KEY, JSON.stringify(state.settings));
}

function syncPhoneSettingsControls() {
  if (els.motionEffectsToggle) els.motionEffectsToggle.checked = Boolean(state.settings.motionEffects);
  if (els.hapticsToggle) els.hapticsToggle.checked = Boolean(state.settings.haptics);
  if (els.compactModeToggle) els.compactModeToggle.checked = Boolean(state.settings.compactMode);
}

function applyPhoneSettings() {
  syncPhoneSettingsControls();
  syncBodyState();
}

function updatePhoneSetting(key, value) {
  state.settings = {
    ...state.settings,
    [key]: Boolean(value),
  };
  savePhoneSettings();
  applyPhoneSettings();
  hapticPulse(6);
}

function hapticPulse(pattern = 10) {
  if (!state.settings.haptics || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Some browsers expose vibrate but ignore it in background tabs.
  }
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
