const PLAYER_ID_KEY = "cantonese-hymn-quiz-player-id-v1";
const PLAYER_NAME_KEY = "cantonese-hymn-quiz-player-name-v1";
const PLAYER_TEAM_KEY = "cantonese-hymn-quiz-player-team-v1";

const params = new URLSearchParams(window.location.search);
const roomId = params.get("room") || "";
const urlName = params.get("name") || "";

const state = {
  peer: null,
  connection: null,
  playerId: localStorage.getItem(PLAYER_ID_KEY) || crypto.randomUUID(),
  name: urlName || localStorage.getItem(PLAYER_NAME_KEY) || "",
  team: localStorage.getItem(PLAYER_TEAM_KEY) || "A",
  joined: false,
  game: null,
  lastResult: "",
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
  localStorage.setItem(PLAYER_NAME_KEY, state.name);
  localStorage.setItem(PLAYER_TEAM_KEY, state.team);
  els.joinForm.hidden = true;
  setStatus("連線中...");

  if (!window.Peer) {
    setStatus("未能載入連線工具，請重新整理");
    return;
  }

  state.peer = new Peer(undefined, { debug: 0 });
  state.peer.on("open", () => {
    state.connection = state.peer.connect(roomId, { reliable: true });
    state.connection.on("open", () => {
      state.joined = true;
      send({ type: "join", playerId: state.playerId, name: state.name, team: state.team });
      setStatus("已加入，等候題目");
    });
    state.connection.on("data", handleMessage);
    state.connection.on("close", () => setStatus("連線中斷，請重新整理"));
    state.connection.on("error", () => {
      if (state.joined) return;
      setStatus("連線失敗，請確認主持人後台仍然開住");
      els.joinForm.hidden = false;
    });
  });

  state.peer.on("error", () => {
    if (state.joined || state.connection?.open) return;
    setStatus("連線失敗，請確認主持人後台仍然開住");
    els.joinForm.hidden = false;
  });
}

function handleMessage(message) {
  if (!message || typeof message !== "object") return;

  if (message.type === "state") {
    const previousQuestionId = state.game?.questionId;
    state.game = message;
    state.joined = true;
    els.joinForm.hidden = true;
    setStatus("已加入，等候題目");
    if (previousQuestionId !== message.questionId) state.lastResult = "";
    renderGame();
  }

  if (message.type === "result" && message.questionId === state.game?.questionId) {
    state.lastResult = message.message || "";
    renderGame();
  }
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
  renderLeaderboard(game.leaderboard || []);
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

function renderLeaderboard(players) {
  els.phoneLeaderboard.replaceChildren();
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

function send(message) {
  if (state.connection?.open) state.connection.send(message);
}

function setStatus(message) {
  els.playerStatus.textContent = message;
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
