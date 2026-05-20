const PLAYER_ID_KEY = "cantonese-hymn-quiz-player-id-v1";
const PLAYER_NAME_KEY = "cantonese-hymn-quiz-player-name-v1";
const PLAYER_TEAM_KEY = "cantonese-hymn-quiz-player-team-v1";
const RECONNECT_BASE_DELAY = 1200;
const RECONNECT_MAX_DELAY = 8000;

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || "";
const urlName = params.get("name") || "";

const state = {
  peer: null,
  connection: null,
  playerId: localStorage.getItem(PLAYER_ID_KEY) || crypto.randomUUID(),
  name: urlName || localStorage.getItem(PLAYER_NAME_KEY) || "",
  displayName: "",
  team: localStorage.getItem(PLAYER_TEAM_KEY) || "A",
  joined: false,
  connecting: false,
  reconnectAttempts: 0,
  reconnectTimer: null,
  connectionToken: "",
  game: null,
  lastResult: "",
  micStream: null,
  micCall: null,
  micActive: false,
};

const els = {
  joinForm: document.querySelector("#joinForm"),
  playerName: document.querySelector("#playerName"),
  playerTeam: document.querySelector("#playerTeam"),
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
};

localStorage.setItem(PLAYER_ID_KEY, state.playerId);
els.playerName.value = state.name;
els.playerTeam.value = state.team;

els.joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  joinGame();
});

els.buzzButton.addEventListener("click", () => {
  send({ type: "buzz", questionId: state.game?.questionId });
  els.buzzButton.disabled = true;
  els.phoneResult.textContent = "已送出搶答";
});

els.micToggleButton.addEventListener("click", () => {
  if (state.micActive) {
    stopMic();
    return;
  }

  startMic();
});

window.addEventListener("online", () => {
  if (state.joined && !state.connection?.open) scheduleReconnect("網絡已恢復");
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && state.joined && !state.connection?.open && !state.connecting) {
    scheduleReconnect("正在恢復連線");
  }
});

window.addEventListener("beforeunload", () => {
  stopMic({ notifyHost: false, message: "咪已關閉" });
});

if (!roomId) {
  setStatus("QR 連結缺少房間碼，請重新掃描");
} else if (state.name) {
  joinGame();
}

function joinGame() {
  const name = els.playerName.value.trim();
  if (!name) {
    setStatus("請先輸入名字");
    return;
  }

  state.name = name.slice(0, 18);
  state.team = normalizeTeam(els.playerTeam.value);
  state.displayName = "";
  localStorage.setItem(PLAYER_NAME_KEY, state.name);
  localStorage.setItem(PLAYER_TEAM_KEY, state.team);
  els.joinForm.hidden = true;
  connectToRoom({ resetAttempts: true });
}

function connectToRoom({ resetAttempts = false } = {}) {
  if (!window.Peer) {
    setStatus("未能載入連線工具，請重新整理");
    els.joinForm.hidden = false;
    return;
  }

  clearTimeout(state.reconnectTimer);
  state.reconnectTimer = null;
  if (resetAttempts) state.reconnectAttempts = 0;

  const token = crypto.randomUUID();
  state.connectionToken = token;
  state.connecting = true;
  closeCurrentPeer();
  setStatus(state.reconnectAttempts ? "重新連線中..." : "連線中...");

  const peer = new Peer(undefined, { debug: 0 });
  state.peer = peer;

  peer.on("open", () => {
    if (state.connectionToken !== token) return;
    const connection = peer.connect(roomId, { reliable: true });
    state.connection = connection;
    bindRoomConnection(connection, token);
  });

  peer.on("error", () => {
    if (state.connectionToken !== token) return;
    handleConnectionFailure("連線失敗，請確認主持人後台仍然開住");
  });
}

function bindRoomConnection(connection, token) {
  connection.on("open", () => {
    if (state.connectionToken !== token) return;
    state.joined = true;
    state.connecting = false;
    state.reconnectAttempts = 0;
    send({ type: "join", playerId: state.playerId, name: state.name, team: state.team });
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

  connection.on("error", () => {
    if (state.connectionToken !== token) return;
    handleConnectionFailure("連線失敗，請確認主持人後台仍然開住");
  });
}

function closeCurrentPeer() {
  stopMic({ notifyHost: false, message: "重新連線，咪已關閉" });

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
  state.connecting = false;
  if (state.joined) {
    scheduleReconnect(message);
    return;
  }

  setStatus(message);
  updateMicUi();
  els.joinForm.hidden = false;
}

function scheduleReconnect(message) {
  if (!roomId || !state.name) {
    setStatus(`${message}，請重新掃 QR 加入`);
    els.joinForm.hidden = false;
    return;
  }

  if (navigator.onLine === false) {
    setStatus(`${message}，等候網絡恢復`);
    return;
  }

  clearTimeout(state.reconnectTimer);
  state.connecting = false;
  state.reconnectAttempts += 1;
  const delay = Math.min(RECONNECT_MAX_DELAY, RECONNECT_BASE_DELAY * state.reconnectAttempts);
  setStatus(`${message}，${Math.ceil(delay / 1000)} 秒後自動重連`);
  state.reconnectTimer = window.setTimeout(() => {
    state.reconnectTimer = null;
    connectToRoom();
  }, delay);
}

function handleMessage(message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "state") {
    const previousQuestionId = state.game?.questionId;
    state.game = message;
    state.displayName = message.playerName || state.name;
    state.joined = true;
    state.connecting = false;
    state.reconnectAttempts = 0;
    els.joinForm.hidden = true;
    setStatus(joinedStatus());
    if (previousQuestionId !== message.questionId) state.lastResult = "";
    renderGame();
    updateMicUi();
  }

  if (message.type === "result" && message.questionId === state.game?.questionId) {
    state.lastResult = message.message || "";
    renderGame();
  }
}

async function startMic() {
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
    const call = state.peer.call(roomId, stream, {
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

  if (notifyHost) send({ type: "mic-stop", playerId: state.playerId });
  setMicStatus(message);
  updateMicUi();
}

function micErrorMessage(error) {
  if (error?.name === "NotAllowedError") return "未允許使用咪高峰";
  if (error?.name === "NotFoundError") return "找不到手機咪高峰";
  return "開咪失敗，請再試";
}

function updateMicUi(options = {}) {
  const { busy = false } = options;
  const canUseMic = Boolean(state.joined && state.connection?.open && state.peer);
  els.micToggleButton.disabled = busy || !canUseMic;
  els.micToggleButton.textContent = state.micActive ? "關咪" : "開咪對話";
  els.micToggleButton.classList.toggle("is-live", state.micActive);
  if (!canUseMic && !state.micActive) setMicStatus("連線後可開咪");
}

function setMicStatus(message) {
  els.phoneMicStatus.textContent = message;
}

function renderGame() {
  const game = state.game;
  if (!game) return;

  els.playerScore.textContent = `${game.score || 0} 分`;
  els.playerRound.textContent = game.hasQuestion ? `第 ${game.round} 題 · ${teamLabel(game.team)}` : `未開始 · ${teamLabel(state.team)}`;
  els.phoneStatus.textContent = game.isPlaying
    ? `播放中：${remainingSeconds(game)} 秒`
    : game.status || "等候主持";
  els.phoneTitle.textContent = game.revealed ? game.title : "估呢首詩歌";
  if (game.hasWord) els.phoneTitle.textContent = game.title;
  els.phoneResult.textContent = state.lastResult || (game.buzzWinner ? `${game.buzzWinner.name} 搶答成功` : "");

  renderHints(game.hints || []);
  renderChoices(game);
  renderLeaderboard(game.leaderboard || [], game.teamScores || {});
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
    (game.choices || []).forEach((choice) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-button phone-choice";
      button.textContent = choice;
      button.disabled = Boolean(game.answered);
      button.addEventListener("click", () => {
        send({ type: "answer", questionId: game.questionId, answer: choice });
        [...els.phoneChoices.querySelectorAll("button")].forEach((item) => {
          item.disabled = true;
        });
      });
      els.phoneChoices.append(button);
    });
  }

  if (game.mode === "buzz" || game.mode === "word") {
    els.buzzButton.hidden = false;
    els.buzzButton.disabled = Boolean(game.answered || game.buzzWinner || !game.buzzOpen);
    els.buzzButton.textContent = game.mode === "word" ? "搶唱" : "搶答";
    if (!game.buzzOpen && !game.buzzWinner && !game.answered) {
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

function send(message) {
  if (state.connection?.open) state.connection.send(message);
}

function setStatus(message) {
  els.playerStatus.textContent = message;
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
