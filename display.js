const DISPLAY_STATE_KEY = "cantonese-hymn-quiz-display-state-v1";
const DEFAULT_ROOM_ID = "soyingpang-guess-song-fellowship-room";
const RECONNECT_BASE_DELAY = 1200;
const RECONNECT_MAX_DELAY = 8000;
const DISPLAY_CONNECTION_TIMEOUT_MS = 9000;
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
    ],
  },
};
const LOCAL_VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|ogv|webm)$/i;

const params = new URLSearchParams(window.location.search);
const roomId = (params.get("room") || DEFAULT_ROOM_ID).trim();
const qrRoomId = roomId;

const els = {
  hero: document.querySelector(".stage-hero"),
  eyebrow: document.querySelector("#stageEyebrow"),
  gameTitle: document.querySelector("#stageGameTitle"),
  playerHost: document.querySelector("#stagePlayerHost"),
  mask: document.querySelector("#stageMask"),
  soundButton: document.querySelector("#stageSoundButton"),
  prompt: document.querySelector("#stagePrompt"),
  subPrompt: document.querySelector("#stageSubPrompt"),
  round: document.querySelector("#stageRound"),
  score: document.querySelector("#stageScore"),
  teams: document.querySelector("#stageTeams"),
  status: document.querySelector("#stageStatus"),
  title: document.querySelector("#stageTitle"),
  meta: document.querySelector("#stageMeta"),
  hints: document.querySelector("#stageHints"),
  choices: document.querySelector("#stageChoices"),
  leaderboard: document.querySelector("#stageLeaderboard"),
  roster: document.querySelector("#stageRoster"),
  qrPanel: document.querySelector("#stageQrPanel"),
  qr: document.querySelector("#stageQr"),
  room: document.querySelector("#stageRoom"),
};

let latestFrameKey = "";
let latestPlaybackState = null;
let latestPlaybackRevision = 0;
let latestRemoteState = null;
let currentDisplayState = null;
let stageAudioUnlocked = false;
let stagePlaybackBlocked = false;
const stageMic = {
  calls: new Map(),
  items: new Map(),
  layer: null,
};
const displaySync = {
  peer: null,
  connection: null,
  token: "",
  reconnectAttempts: 0,
  reconnectTimer: null,
  connectionTimeout: null,
};

els.soundButton?.addEventListener("click", unlockStageSound);

window.addEventListener("storage", (event) => {
  if (event.key === DISPLAY_STATE_KEY && !latestRemoteState) renderFromStorage();
});

if (roomId) {
  connectToHostDisplay({ resetAttempts: true });
} else {
  renderFromStorage();
}

window.setInterval(() => {
  if (latestRemoteState) {
    renderState(latestRemoteState);
    return;
  }

  renderFromStorage();
}, 700);

function renderFromStorage() {
  const state = readDisplayState();
  if (!state) {
    renderWaiting(
      "等待遠端同步",
      `正在連接房間：${roomId}`
    );
    return;
  }

  renderState(state);
}

function renderState(state) {
  currentDisplayState = state;
  const songlistLabel = state.songlistLabel || "估歌仔";
  if (els.eyebrow) els.eyebrow.textContent = "估歌仔";
  if (els.gameTitle) els.gameTitle.textContent = songlistLabel;
  els.round.textContent = state.hasSong ? `第 ${state.round} 題` : "未有題目";
  if (state.hasWord) els.round.textContent = `第 ${state.round} 題`;
  els.score.textContent = `${state.correct} / ${state.total}`;
  els.teams.textContent = `A ${state.teamScores?.A || 0} · B ${state.teamScores?.B || 0}`;
  els.status.textContent = state.status || (state.hasSong ? `${songlistLabel} · 聽片段估歌名` : "等候主持開始");
  els.title.textContent = state.hasWord ? state.title : state.revealed ? state.title : songlistLabel;

  const prepCover = Boolean(state.hasSong && !state.revealed);
  const showFrontPlayer = Boolean(state.revealed || prepCover);
  els.prompt.textContent = state.revealed
    ? "答案"
    : state.isPlaying
      ? `播放中 · ${remainingSeconds(state)} 秒`
      : prepCover
        ? "答案遮罩中"
      : state.hasWord
        ? "主題搶唱"
        : "聽前奏，估歌名";
  els.subPrompt.textContent = state.revealed
    ? state.answer
    : prepCover
      ? `歌單：${songlistLabel}`
    : state.hasWord
      ? "鬥快唱出切合這個主題的歌"
      : "答案未公開，請留心聽";

  els.mask.classList.toggle("is-hidden", showFrontPlayer && !prepCover);
  els.mask.classList.toggle("is-prep-cover", prepCover);
  els.playerHost.classList.toggle("is-masked", !showFrontPlayer);
  document.body.classList.toggle("is-revealed", Boolean(state.revealed));
  document.body.classList.toggle("is-playing", Boolean(state.isPlaying));
  document.body.classList.toggle("is-sound-unlocked", stageAudioUnlocked);
  els.hero.classList.toggle("is-winner-reveal", Boolean(state.showWinner));

  renderFrame(state);
  updateStageSoundButton(state);
  renderMeta(state);
  renderHints(state.hints || []);
  renderChoices(state);
  renderLeaderboard(state);
  renderRoster(state);
  renderQr(state);
}

function connectToHostDisplay({ resetAttempts = false } = {}) {
  if (!window.Peer) {
    renderWaiting("未能連接房間", "同步工具未載入，請重新整理");
    return;
  }

  clearTimeout(displaySync.reconnectTimer);
  displaySync.reconnectTimer = null;
  clearDisplayConnectionTimeout();
  if (resetAttempts) displaySync.reconnectAttempts = 0;

  const token = crypto.randomUUID();
  displaySync.token = token;
  closeDisplayPeer();
  renderWaiting("連接主持中", `房間：${roomId}`);

  const peer = new Peer(undefined, PEER_OPTIONS);
  displaySync.peer = peer;
  peer.on("call", handleDisplayMicCall);

  peer.on("open", () => {
    if (displaySync.token !== token) return;
    const connection = peer.connect(roomId, { reliable: true });
    displaySync.connection = connection;
    bindDisplayConnection(connection, token);
  });

  peer.on("disconnected", () => {
    if (displaySync.token !== token) return;
    scheduleDisplayReconnect("同步服務斷線");
  });

  peer.on("close", () => {
    if (displaySync.token !== token || displaySync.reconnectTimer) return;
    scheduleDisplayReconnect("同步服務已關閉");
  });

  peer.on("error", (error) => {
    if (displaySync.token !== token) return;
    scheduleDisplayReconnect(displayConnectionFailureMessage(error));
  });
}

function bindDisplayConnection(connection, token) {
  displaySync.connectionTimeout = window.setTimeout(() => {
    if (displaySync.token !== token || connection.open) return;
    latestRemoteState = null;
    scheduleDisplayReconnect("前台連線逾時");
  }, DISPLAY_CONNECTION_TIMEOUT_MS);

  connection.on("open", () => {
    if (displaySync.token !== token) return;
    clearDisplayConnectionTimeout();
    connection.send({ type: "display-join" });
    renderWaiting("已連接房間", "等待主持同步畫面");
  });

  connection.on("data", (message) => {
    if (displaySync.token !== token || !message || typeof message !== "object") return;
    if (message.type !== "display-state" || !message.state) return;

    latestRemoteState = message.state;
    clearDisplayConnectionTimeout();
    displaySync.reconnectAttempts = 0;
    localStorage.setItem(DISPLAY_STATE_KEY, JSON.stringify(message.state));
    renderState(message.state);
  });

  connection.on("close", () => {
    if (displaySync.token !== token) return;
    latestRemoteState = null;
    scheduleDisplayReconnect("前台同步中斷");
  });

  connection.on("error", () => {
    if (displaySync.token !== token) return;
    latestRemoteState = null;
    scheduleDisplayReconnect("前台同步失敗");
  });
}

function scheduleDisplayReconnect(message) {
  clearDisplayConnectionTimeout();
  clearTimeout(displaySync.reconnectTimer);
  displaySync.reconnectAttempts += 1;
  const delay = Math.min(RECONNECT_MAX_DELAY, RECONNECT_BASE_DELAY * displaySync.reconnectAttempts);
  renderWaiting(message, `${Math.ceil(delay / 1000)} 秒後重新連接房間：${roomId}`);
  displaySync.reconnectTimer = window.setTimeout(() => {
    displaySync.reconnectTimer = null;
    connectToHostDisplay();
  }, delay);
}

function clearDisplayConnectionTimeout() {
  clearTimeout(displaySync.connectionTimeout);
  displaySync.connectionTimeout = null;
}

function displayConnectionFailureMessage(error) {
  const type = String(error?.type || "").trim();
  if (type === "peer-unavailable") return "找不到主持房間";
  if (type === "network") return "網絡暫時連不到同步服務";
  if (type === "browser-incompatible") return "此瀏覽器不支援同步連線";
  return "未能連接主持";
}

function closeDisplayPeer() {
  clearDisplayConnectionTimeout();
  clearStageMic();

  try {
    displaySync.connection?.close();
  } catch {
    // PeerJS can already be closed when reconnecting.
  }

  try {
    displaySync.peer?.destroy();
  } catch {
    // PeerJS can already be closed when reconnecting.
  }

  displaySync.connection = null;
  displaySync.peer = null;
}

function handleDisplayMicCall(call) {
  if (call.metadata?.type !== "display-player-mic") {
    try {
      call.answer();
      call.close();
    } catch {
      // Ignore unknown media calls.
    }
    return;
  }

  const playerId = String(call.metadata?.playerId || call.peer || crypto.randomUUID());
  const playerName = String(call.metadata?.playerName || "玩家").trim() || "玩家";
  closeStageMicCall(playerId);
  stageMic.calls.set(playerId, call);

  call.on("stream", (stream) => {
    renderStageMic(playerId, playerName, stream);
  });
  call.on("close", () => closeStageMicCall(playerId));
  call.on("error", () => closeStageMicCall(playerId));

  try {
    call.answer();
  } catch {
    closeStageMicCall(playerId);
  }
}

function renderStageMic(playerId, playerName, stream) {
  const layer = ensureStageMicLayer();
  const existing = stageMic.items.get(playerId);
  if (existing) existing.remove();

  const item = document.createElement("div");
  item.className = "stage-mic-item";

  const label = document.createElement("strong");
  label.textContent = `手機咪：${playerName}`;

  const status = document.createElement("span");
  status.textContent = "前台播放中";

  const audio = document.createElement("audio");
  audio.controls = true;
  audio.autoplay = true;
  audio.playsInline = true;
  audio.srcObject = stream;
  audio.addEventListener("play", () => {
    status.textContent = "前台播放中";
  });
  audio.play().catch(() => {
    item.classList.add("needs-tap");
    status.textContent = "點一下播放手機咪";
  });

  item.append(label, status, audio);
  layer.append(item);
  stageMic.items.set(playerId, item);
}

function ensureStageMicLayer() {
  if (stageMic.layer?.isConnected) return stageMic.layer;

  const layer = document.createElement("div");
  layer.className = "stage-mic-layer";
  layer.setAttribute("aria-live", "polite");
  document.body.append(layer);
  stageMic.layer = layer;
  return layer;
}

function closeStageMicCall(playerId) {
  const call = stageMic.calls.get(playerId);
  stageMic.calls.delete(playerId);
  try {
    call?.close();
  } catch {
    // PeerJS may already have closed the forwarded mic call.
  }

  const item = stageMic.items.get(playerId);
  stageMic.items.delete(playerId);
  item?.remove();
}

function clearStageMic() {
  Array.from(stageMic.calls.keys()).forEach(closeStageMicCall);
  stageMic.layer?.remove();
  stageMic.layer = null;
}

function readDisplayState() {
  try {
    const raw = localStorage.getItem(DISPLAY_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function renderWaiting(prompt = "等待同步", subPrompt = "前台會自動跟住後台更新") {
  if (els.eyebrow) els.eyebrow.textContent = "估歌仔";
  if (els.gameTitle) els.gameTitle.textContent = "估歌仔";
  els.round.textContent = "未連接";
  els.score.textContent = "0 / 0";
  els.status.textContent = `房間：${roomId}`;
  els.title.textContent = "等待主持開始";
  els.prompt.textContent = prompt;
  els.subPrompt.textContent = subPrompt;
  els.meta.replaceChildren();
  els.hints.replaceChildren();
  els.choices.replaceChildren();
  els.leaderboard.replaceChildren();
  els.leaderboard.classList.remove("is-final", "is-winner");
  renderRoster({ players: [] });
  els.hero.classList.remove("is-winner-reveal");
  renderQr({
    playerUrl: buildFallbackPlayerUrl(),
    roomId: qrRoomId,
    roomReady: Boolean(qrRoomId),
  });
  els.playerHost.classList.add("is-masked");
  els.playerHost.replaceChildren();
  latestFrameKey = "";
  latestPlaybackState = null;
  currentDisplayState = null;
  updateStageSoundButton(null);
}

function renderFrame(state) {
  if (!state.hasSong || (!state.videoId && !state.audioUrl)) {
    els.playerHost.replaceChildren();
    latestFrameKey = "";
    latestPlaybackState = null;
    return;
  }

  const frameKey = [
    state.audioUrl || state.videoId,
    state.start,
    state.end,
    state.frontReady ? "front-ready" : "masked",
    state.revealed ? "revealed" : "blind",
  ].join(":");
  if (frameKey === latestFrameKey) {
    syncFramePlayback(state);
    return;
  }
  latestFrameKey = frameKey;
  latestPlaybackState = Boolean(state.isPlaying);
  latestPlaybackRevision = Number(state.playbackRevision || 0);

  if (state.audioUrl) {
    renderLocalMedia(state);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = buildEmbedUrl(state);
  iframe.title = "YouTube 歌曲片段";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  els.playerHost.replaceChildren(iframe);
}

function renderLocalMedia(state) {
  const media = document.createElement(isVideoMediaUrl(state.audioUrl) ? "video" : "audio");
  media.src = state.audioUrl;
  media.autoplay = Boolean(state.isPlaying);
  media.controls = true;
  media.preload = "metadata";
  if (media.tagName === "VIDEO") media.playsInline = true;
  media.addEventListener("loadedmetadata", () => {
    media.currentTime = currentPlaybackTime(state);
    if (state.isPlaying) {
      media.play()
        .then(markStageAudioUnlocked)
        .catch(markStagePlaybackBlocked);
    }
  }, { once: true });
  media.addEventListener("play", markStageAudioUnlocked);
  media.addEventListener("timeupdate", () => {
    if (state.end && media.currentTime >= state.end) media.pause();
  });
  els.playerHost.replaceChildren(media);
}

function isVideoMediaUrl(url) {
  return LOCAL_VIDEO_EXTENSIONS.test(String(url || "").split(/[?#]/)[0]);
}

function syncFramePlayback(state) {
  const shouldPlay = Boolean(state.isPlaying);
  const playbackRevision = Number(state.playbackRevision || 0);
  if (latestPlaybackState === shouldPlay && latestPlaybackRevision === playbackRevision) return;
  latestPlaybackState = shouldPlay;
  latestPlaybackRevision = playbackRevision;

  const media = els.playerHost.firstElementChild;
  if (!media) return;

  if (state.audioUrl) {
    if (shouldPlay) {
      media.currentTime = currentPlaybackTime(state);
      media.play()
        .then(markStageAudioUnlocked)
        .catch(markStagePlaybackBlocked);
    } else {
      media.pause();
    }
    return;
  }

  postYouTubeCommand(shouldPlay ? "playVideo" : "pauseVideo", shouldPlay ? [Number(state.start || 0)] : []);
}

function postYouTubeCommand(command, args = []) {
  const iframe = els.playerHost.querySelector("iframe");
  if (!iframe?.contentWindow) return;
  if (command === "playVideo" && args.length) {
    iframe.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "seekTo", args: [args[0], true] }),
      "*"
    );
  }
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: "command", func: command, args: command === "playVideo" ? [] : args }),
    "*"
  );
}

function buildEmbedUrl(state) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${state.videoId}`);
  url.searchParams.set("start", String(Math.floor(currentPlaybackTime(state))));
  if (state.end) url.searchParams.set("end", String(state.end));
  url.searchParams.set("autoplay", state.isPlaying ? "1" : "0");
  url.searchParams.set("controls", state.frontReady && !state.revealed ? "1" : "0");
  url.searchParams.set("enablejsapi", "1");
  url.searchParams.set("origin", window.location.origin);
  url.searchParams.set("rel", "0");
  url.searchParams.set("modestbranding", "1");
  url.searchParams.set("playsinline", "1");
  return url.toString();
}

async function unlockStageSound() {
  stageAudioUnlocked = true;
  stagePlaybackBlocked = false;
  updateStageSoundButton(currentDisplayState);

  const state = currentDisplayState;
  const media = els.playerHost.firstElementChild;
  if (!state) return;

  if (state.audioUrl && media?.play) {
    media.muted = false;
    media.volume = 1;
    if (!state.isPlaying) {
      markStageAudioUnlocked();
      return;
    }

    media.currentTime = currentPlaybackTime(state);
    try {
      await media.play();
      markStageAudioUnlocked();
    } catch {
      markStagePlaybackBlocked();
    }
    return;
  }

  postYouTubeCommand("unMute");
  postYouTubeCommand("setVolume", [100]);
  if (state.isPlaying) postYouTubeCommand("playVideo", [currentPlaybackTime(state)]);
  markStageAudioUnlocked();
}

function updateStageSoundButton(state) {
  if (!els.soundButton) return;
  const hasMedia = Boolean(state?.hasSong && (state.audioUrl || state.videoId));
  const frontCanPlay = Boolean(state?.frontReady || state?.isPlaying || state?.revealed);
  const needsUnlock = hasMedia && frontCanPlay && !stageAudioUnlocked;
  els.soundButton.hidden = !needsUnlock;
  document.body.classList.toggle("is-sound-unlocked", stageAudioUnlocked);
}

function markStageAudioUnlocked() {
  stageAudioUnlocked = true;
  stagePlaybackBlocked = false;
  updateStageSoundButton(currentDisplayState);
}

function markStagePlaybackBlocked() {
  stageAudioUnlocked = false;
  stagePlaybackBlocked = true;
  updateStageSoundButton(currentDisplayState);
}

function currentPlaybackTime(state) {
  const start = Number(state?.start || 0);
  const end = Number(state?.end || 0);
  const duration = Number(state?.clipDuration || state?.playDuration || (end ? end - start : 0));
  if (!state?.isPlaying || !state?.playEndsAt || !duration) return start;

  const startedAt = Number(state.playEndsAt) - duration * 1000;
  const elapsed = Math.max(0, (Date.now() - startedAt) / 1000);
  const current = start + elapsed;
  return end ? Math.min(end, current) : current;
}

function remainingSeconds(state) {
  if (!state.playEndsAt) return state.playDuration || 0;
  return Math.max(0, Math.ceil((state.playEndsAt - Date.now()) / 1000));
}

function renderMeta(state) {
  els.meta.replaceChildren();
  if (!state.revealed) return;

  const answer = document.createElement("strong");
  answer.textContent = state.answer || state.title;
  els.meta.append(answer);

  (state.meta || []).forEach((item) => {
    const badge = document.createElement("span");
    badge.textContent = item;
    els.meta.append(badge);
  });
}

function renderHints(hints) {
  els.hints.replaceChildren();
  hints.forEach((hint) => {
    const item = document.createElement("div");
    item.className = "stage-hint";
    item.textContent = hint;
    els.hints.append(item);
  });
}

function renderChoices(state) {
  els.choices.replaceChildren();
  if (state.revealed) return;

  if (state.mode === "buzz") {
    const item = document.createElement("div");
    item.className = "stage-choice buzz-live";
    item.textContent = state.buzzWinner
      ? `第一個搶答：${state.buzzWinner.name}`
      : state.buzzOpen
        ? "搶答開放：鬥快按手機"
        : "等待主持開放搶答";
    els.choices.append(item);
    return;
  }

  if (state.mode === "word") {
    const item = document.createElement("div");
    item.className = "stage-choice buzz-live";
    item.textContent = state.buzzWinner
      ? `第一個搶唱：${state.buzzWinner.name}（${state.buzzWinner.team || "A"} 組）`
      : state.buzzOpen
        ? "搶唱開放：鬥快唱出合題歌曲"
        : "等待主持開放搶唱";
    els.choices.append(item);
    return;
  }

  if (state.mode === "choice") return;
}

function renderLeaderboard(state) {
  els.leaderboard.replaceChildren();
  els.leaderboard.classList.toggle("is-winner", Boolean(state.showWinner));
  els.leaderboard.classList.toggle("is-final", Boolean(state.showLeaderboard));
  if (state.showWinner) {
    els.leaderboard.append(renderWinnerReveal(state));
    return;
  }

  if (!state.showLeaderboard && !state.buzzWinner) return;

  const title = document.createElement("h2");
  title.textContent = state.showLeaderboard ? "分數結算" : "搶答結果";
  els.leaderboard.append(title);

  if (state.showLeaderboard) {
    els.leaderboard.append(renderTeamFinal(state.teamScores || {}));
  }

  const players = state.buzzWinner ? [state.buzzWinner, ...(state.leaderboard || []).filter((p) => p.id !== state.buzzWinner.id)] : state.leaderboard || [];
  if (state.showLeaderboard && players.length) {
    const personalTitle = document.createElement("h2");
    personalTitle.className = "stage-subtitle";
    personalTitle.textContent = "個人排行榜";
    els.leaderboard.append(personalTitle);
  }

  if (!players.length && state.showLeaderboard) {
    const empty = document.createElement("div");
    empty.className = "stage-rank";
    empty.textContent = "未有個人分數";
    els.leaderboard.append(empty);
    return;
  }

  players.slice(0, 10).forEach((player, index) => {
    const item = document.createElement("div");
    item.className = "stage-rank";
    item.innerHTML = `<span>${index + 1}. ${escapeHtml(player.name)} · ${escapeHtml(player.team || "A")} 組</span><strong>${player.score} 分</strong>`;
    els.leaderboard.append(item);
  });
}

function renderRoster(state) {
  if (!els.roster) return;

  const players = (state.players || state.leaderboard || []).filter(Boolean);
  els.roster.replaceChildren();
  els.roster.hidden = players.length === 0;
  if (!players.length) return;

  const liveCount = players.filter((player) => player.micActive).length;
  const header = document.createElement("div");
  header.className = "stage-roster-header";

  const title = document.createElement("strong");
  title.textContent = "已加入玩家";

  const summary = document.createElement("span");
  summary.textContent = `${players.length} 位${liveCount ? ` · ${liveCount} 開咪` : ""}`;

  header.append(title, summary);

  const list = document.createElement("div");
  list.className = "stage-roster-list";

  players.slice(0, 12).forEach((player) => {
    const item = document.createElement("div");
    item.className = "stage-roster-player";
    item.classList.toggle("is-live", Boolean(player.micActive));
    item.classList.toggle("is-offline", !player.connected);

    const name = document.createElement("span");
    name.className = "stage-roster-name";
    name.textContent = player.name || "玩家";

    const meta = document.createElement("span");
    meta.className = "stage-roster-meta";
    meta.textContent = `${player.team || "A"} 組`;

    const score = document.createElement("strong");
    score.className = "stage-roster-score";
    score.textContent = `${Number(player.score || 0)} 分`;

    item.append(name, meta, score);

    if (player.micActive || !player.connected) {
      const badge = document.createElement("span");
      badge.className = `stage-roster-badge${player.micActive ? "" : " is-muted"}`;
      badge.textContent = player.micActive ? "開咪" : "離線";
      item.append(badge);
    }

    list.append(item);
  });

  if (players.length > 12) {
    const more = document.createElement("div");
    more.className = "stage-roster-more";
    more.textContent = `還有 ${players.length - 12} 位玩家`;
    list.append(more);
  }

  els.roster.append(header, list);
}

function renderWinnerReveal(state) {
  const teamScores = state.teamScores || {};
  const aScore = Number(teamScores.A || 0);
  const bScore = Number(teamScores.B || 0);
  const wrapper = document.createElement("div");
  wrapper.className = "stage-winner-final";

  const label = document.createElement("p");
  label.textContent = "分組勝方";

  const headline = document.createElement("h2");
  headline.textContent = winnerHeadline(aScore, bScore);

  const scores = document.createElement("div");
  scores.className = "stage-winner-scores";
  scores.append(winnerScoreCard("A 組", aScore, aScore > bScore), winnerScoreCard("B 組", bScore, bScore > aScore));

  const note = document.createElement("div");
  note.className = "stage-winner-note";
  const topPlayer = (state.leaderboard || [])[0];
  note.textContent = topPlayer ? `個人最高分：${topPlayer.name} · ${topPlayer.score} 分` : "感謝大家一齊投入參與";

  wrapper.append(label, headline, scores, note);
  return wrapper;
}

function winnerHeadline(aScore, bScore) {
  if (aScore === 0 && bScore === 0) return "準備公布";
  if (aScore === bScore) return "A / B 組平手";
  return `${aScore > bScore ? "A" : "B"} 組勝出`;
}

function winnerScoreCard(label, score, leading) {
  const card = document.createElement("div");
  card.className = `stage-winner-score${leading ? " is-leading" : ""}`;

  const name = document.createElement("span");
  name.textContent = label;

  const value = document.createElement("strong");
  value.textContent = score;

  card.append(name, value);
  return card;
}

function renderTeamFinal(teamScores) {
  const aScore = Number(teamScores.A || 0);
  const bScore = Number(teamScores.B || 0);
  const wrapper = document.createElement("div");
  wrapper.className = "stage-team-final";

  const headline = document.createElement("strong");
  if (aScore === bScore) {
    headline.textContent = aScore === 0 ? "分組戰況" : "A / B 組平手";
  } else {
    headline.textContent = `${aScore > bScore ? "A" : "B"} 組暫時領先`;
  }

  const scores = document.createElement("div");
  scores.className = "stage-team-scores";
  scores.append(teamScoreBlock("A 組", aScore, aScore > bScore), teamScoreBlock("B 組", bScore, bScore > aScore));
  wrapper.append(headline, scores);
  return wrapper;
}

function teamScoreBlock(label, score, leading) {
  const item = document.createElement("span");
  item.className = leading ? "is-leading" : "";
  item.innerHTML = `${escapeHtml(label)} <b>${score}</b>`;
  return item;
}

function renderQr(state) {
  const hostBlocked = state && state.roomReady === false && state.roomError && !state.playerUrl;
  if (hostBlocked) {
    els.qrPanel.hidden = false;
    els.qr.removeAttribute("src");
    delete els.qr.dataset.qrValue;
    els.room.textContent = state.roomError;
    return;
  }

  const playerUrl = state.playerUrl || buildFallbackPlayerUrl();
  const displayRoomId = state.roomId || qrRoomId;

  if (!playerUrl) {
    els.qrPanel.hidden = true;
    els.qr.removeAttribute("src");
    delete els.qr.dataset.qrValue;
    return;
  }

  els.qrPanel.hidden = false;
  if (els.qr.dataset.qrValue !== playerUrl) {
    els.qr.dataset.qrValue = playerUrl;
    els.qr.src = createQrImageSource(playerUrl);
  }
  els.room.textContent = state.roomReady ? `房間：${displayRoomId}` : `房間建立中：${displayRoomId}`;
}

function buildFallbackPlayerUrl() {
  if (!qrRoomId) return "";
  const url = new URL("./player.html", window.location.href);
  url.searchParams.set("room", qrRoomId);
  return url.toString();
}

function createQrImageSource(playerUrl) {
  try {
    return window.createLocalQrCodeDataUrl(playerUrl);
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
