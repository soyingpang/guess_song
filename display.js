const DISPLAY_STATE_KEY = "cantonese-hymn-quiz-display-state-v1";
const DEFAULT_ROOM_ID = "soyingpang-guess-song-fellowship-room";
const RECONNECT_BASE_DELAY = 1200;
const RECONNECT_MAX_DELAY = 8000;
const LOCAL_VIDEO_EXTENSIONS = /\.(mp4|m4v|mov|ogv|webm)$/i;

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || "";
const qrRoomId = roomId || DEFAULT_ROOM_ID;

const els = {
  hero: document.querySelector(".stage-hero"),
  playerHost: document.querySelector("#stagePlayerHost"),
  mask: document.querySelector("#stageMask"),
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
  qrPanel: document.querySelector("#stageQrPanel"),
  qr: document.querySelector("#stageQr"),
  room: document.querySelector("#stageRoom"),
};

let latestFrameKey = "";
let latestPlaybackState = null;
let latestRemoteState = null;
let currentDisplayState = null;
const displaySync = {
  peer: null,
  connection: null,
  token: "",
  reconnectAttempts: 0,
  reconnectTimer: null,
};

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
      roomId ? "等待遠端同步" : "等待同步",
      roomId ? `正在連接房間：${roomId}` : "前台會自動跟住後台更新"
    );
    return;
  }

  renderState(state);
}

function renderState(state) {
  currentDisplayState = state;
  els.round.textContent = state.hasSong ? `第 ${state.round} 題` : "未有題目";
  if (state.hasWord) els.round.textContent = `第 ${state.round} 題`;
  els.score.textContent = `${state.correct} / ${state.total}`;
  els.teams.textContent = `A ${state.teamScores?.A || 0} · B ${state.teamScores?.B || 0}`;
  els.status.textContent = state.status || (state.hasSong ? "聽片段，估詩歌名" : "等候主持開始");
  els.title.textContent = state.hasWord ? state.title : state.revealed ? state.title : "估呢首詩歌";

  const prepCover = Boolean(state.frontReady && !state.isPlaying && !state.revealed);
  const showFrontPlayer = Boolean(state.revealed || state.frontReady || state.isPlaying);
  els.prompt.textContent = state.revealed
    ? "答案"
    : state.isPlaying
      ? `播放中 · ${remainingSeconds(state)} 秒`
      : prepCover
        ? "前台預備中"
      : state.hasWord
        ? "主題搶唱"
        : "聽前奏，估詩歌";
  els.subPrompt.textContent = state.revealed
    ? state.answer
    : prepCover
      ? "答案已遮住，只留右下角廣告操作區"
    : state.hasWord
      ? "鬥快唱出切合這個主題的詩歌"
      : "答案未公開，請留心聽";

  els.mask.classList.toggle("is-hidden", showFrontPlayer && !prepCover);
  els.mask.classList.toggle("is-prep-cover", prepCover);
  els.playerHost.classList.toggle("is-masked", !showFrontPlayer);
  document.body.classList.toggle("is-revealed", Boolean(state.revealed));
  document.body.classList.toggle("is-playing", Boolean(state.isPlaying));
  document.body.classList.add("is-sound-unlocked");
  els.hero.classList.toggle("is-winner-reveal", Boolean(state.showWinner));

  renderFrame(state);
  renderMeta(state);
  renderHints(state.hints || []);
  renderChoices(state);
  renderLeaderboard(state);
  renderQr(state);
}

function connectToHostDisplay({ resetAttempts = false } = {}) {
  if (!window.Peer) {
    renderWaiting("未能連接房間", "同步工具未載入，請重新整理");
    return;
  }

  clearTimeout(displaySync.reconnectTimer);
  displaySync.reconnectTimer = null;
  if (resetAttempts) displaySync.reconnectAttempts = 0;

  const token = crypto.randomUUID();
  displaySync.token = token;
  closeDisplayPeer();
  renderWaiting("連接主持中", `房間：${roomId}`);

  const peer = new Peer(undefined, { debug: 0 });
  displaySync.peer = peer;

  peer.on("open", () => {
    if (displaySync.token !== token) return;
    const connection = peer.connect(roomId, { reliable: true });
    displaySync.connection = connection;
    bindDisplayConnection(connection, token);
  });

  peer.on("error", () => {
    if (displaySync.token !== token) return;
    scheduleDisplayReconnect("未能連接主持");
  });
}

function bindDisplayConnection(connection, token) {
  connection.on("open", () => {
    if (displaySync.token !== token) return;
    connection.send({ type: "display-join" });
    renderWaiting("已連接房間", "等待主持同步畫面");
  });

  connection.on("data", (message) => {
    if (displaySync.token !== token || !message || typeof message !== "object") return;
    if (message.type !== "display-state" || !message.state) return;

    latestRemoteState = message.state;
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
  clearTimeout(displaySync.reconnectTimer);
  displaySync.reconnectAttempts += 1;
  const delay = Math.min(RECONNECT_MAX_DELAY, RECONNECT_BASE_DELAY * displaySync.reconnectAttempts);
  renderWaiting(message, `${Math.ceil(delay / 1000)} 秒後重新連接房間：${roomId}`);
  displaySync.reconnectTimer = window.setTimeout(() => {
    displaySync.reconnectTimer = null;
    connectToHostDisplay();
  }, delay);
}

function closeDisplayPeer() {
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

function readDisplayState() {
  try {
    const raw = localStorage.getItem(DISPLAY_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function renderWaiting(prompt = "等待同步", subPrompt = "前台會自動跟住後台更新") {
  els.round.textContent = "未連接";
  els.score.textContent = "0 / 0";
  els.status.textContent = roomId ? `房間：${roomId}` : "請先喺後台按「開前台」";
  els.title.textContent = "等待主持開始";
  els.prompt.textContent = prompt;
  els.subPrompt.textContent = subPrompt;
  els.meta.replaceChildren();
  els.hints.replaceChildren();
  els.choices.replaceChildren();
  els.leaderboard.replaceChildren();
  els.leaderboard.classList.remove("is-final", "is-winner");
  els.hero.classList.remove("is-winner-reveal");
  renderQr({
    playerUrl: buildFallbackPlayerUrl(),
    roomId: qrRoomId,
    roomReady: Boolean(roomId),
  });
  els.playerHost.classList.add("is-masked");
  els.playerHost.replaceChildren();
  latestFrameKey = "";
  latestPlaybackState = null;
  currentDisplayState = null;
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

  if (state.audioUrl) {
    renderLocalMedia(state);
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = buildEmbedUrl(state);
  iframe.title = "YouTube 詩歌片段";
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
    media.currentTime = Number(state.start || 0);
    if (state.isPlaying) media.play().catch(() => {});
  }, { once: true });
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
  if (latestPlaybackState === shouldPlay) return;
  latestPlaybackState = shouldPlay;

  const media = els.playerHost.firstElementChild;
  if (!media) return;

  if (state.audioUrl) {
    if (shouldPlay) {
      media.currentTime = Number(state.start || 0);
      media.play().catch(() => {});
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
  iframe.contentWindow.postMessage(JSON.stringify({ event: "command", func: command, args: [] }), "*");
}

function buildEmbedUrl(state) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${state.videoId}`);
  url.searchParams.set("start", String(state.start || 0));
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
      ? `${state.buzzWinner.name} 搶答成功`
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
      ? `${state.buzzWinner.name}（${state.buzzWinner.team || "A"} 組）搶唱成功`
      : state.buzzOpen
        ? "搶唱開放：鬥快唱出合題詩歌"
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
