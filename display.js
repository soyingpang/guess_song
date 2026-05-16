const DISPLAY_STATE_KEY = "cantonese-hymn-quiz-display-state-v1";

const els = {
  playerHost: document.querySelector("#stagePlayerHost"),
  mask: document.querySelector("#stageMask"),
  prompt: document.querySelector("#stagePrompt"),
  subPrompt: document.querySelector("#stageSubPrompt"),
  round: document.querySelector("#stageRound"),
  score: document.querySelector("#stageScore"),
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

window.addEventListener("storage", (event) => {
  if (event.key === DISPLAY_STATE_KEY) renderFromStorage();
});

renderFromStorage();
window.setInterval(renderFromStorage, 700);

function renderFromStorage() {
  const state = readDisplayState();
  if (!state) {
    renderWaiting();
    return;
  }

  els.round.textContent = state.hasSong ? `第 ${state.round} 題` : "未有題目";
  els.score.textContent = `${state.correct} / ${state.total}`;
  els.status.textContent = state.status || (state.hasSong ? "聽片段，估詩歌名" : "等候主持開始");
  els.title.textContent = state.revealed ? state.title : "估呢首粵語詩歌";

  els.prompt.textContent = state.revealed
    ? "答案"
    : state.isPlaying
      ? `播放中 · ${state.clipDuration || 0} 秒`
      : "聽前奏，估詩歌";
  els.subPrompt.textContent = state.revealed
    ? state.answer
    : "答案未公開，請留心聽";

  els.mask.classList.toggle("is-hidden", Boolean(state.revealed));
  els.playerHost.classList.toggle("is-masked", !state.revealed);
  document.body.classList.toggle("is-revealed", Boolean(state.revealed));
  document.body.classList.toggle("is-playing", Boolean(state.isPlaying));

  renderFrame(state);
  renderMeta(state);
  renderHints(state.hints || []);
  renderChoices(state);
  renderLeaderboard(state);
  renderQr(state);
}

function readDisplayState() {
  try {
    const raw = localStorage.getItem(DISPLAY_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function renderWaiting() {
  els.round.textContent = "未連接";
  els.score.textContent = "0 / 0";
  els.status.textContent = "請先喺後台按「開前台」";
  els.title.textContent = "等待主持開始";
  els.prompt.textContent = "等待同步";
  els.subPrompt.textContent = "前台會自動跟住後台更新";
  els.meta.replaceChildren();
  els.hints.replaceChildren();
  els.choices.replaceChildren();
  els.leaderboard.replaceChildren();
  els.qrPanel.hidden = true;
  els.playerHost.classList.add("is-masked");
  els.playerHost.replaceChildren();
  latestFrameKey = "";
}

function renderFrame(state) {
  if (!state.hasSong || !state.videoId) {
    els.playerHost.replaceChildren();
    latestFrameKey = "";
    return;
  }

  const frameKey = [state.videoId, state.start, state.end, state.isPlaying ? "play" : "cue"].join(":");
  if (frameKey === latestFrameKey) return;
  latestFrameKey = frameKey;

  const iframe = document.createElement("iframe");
  iframe.src = buildEmbedUrl(state);
  iframe.title = "YouTube 詩歌片段";
  iframe.allow =
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = "strict-origin-when-cross-origin";
  els.playerHost.replaceChildren(iframe);
}

function buildEmbedUrl(state) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${state.videoId}`);
  url.searchParams.set("start", String(state.start || 0));
  url.searchParams.set("end", String(state.end || state.start || 0));
  url.searchParams.set("autoplay", state.isPlaying ? "1" : "0");
  url.searchParams.set("controls", "0");
  url.searchParams.set("rel", "0");
  url.searchParams.set("modestbranding", "1");
  url.searchParams.set("playsinline", "1");
  return url.toString();
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
      : "搶答題：準備按手機搶答";
    els.choices.append(item);
    return;
  }

  if (state.mode !== "choice") return;

  (state.choices || []).forEach((choice, index) => {
    const item = document.createElement("div");
    item.className = "stage-choice";
    item.textContent = `${index + 1}. ${choice}`;
    els.choices.append(item);
  });
}

function renderLeaderboard(state) {
  els.leaderboard.replaceChildren();
  if (!state.showLeaderboard && !state.buzzWinner) return;

  const title = document.createElement("h2");
  title.textContent = state.showLeaderboard ? "排行榜" : "搶答結果";
  els.leaderboard.append(title);

  const players = state.buzzWinner ? [state.buzzWinner, ...(state.leaderboard || []).filter((p) => p.id !== state.buzzWinner.id)] : state.leaderboard || [];
  players.slice(0, 10).forEach((player, index) => {
    const item = document.createElement("div");
    item.className = "stage-rank";
    item.innerHTML = `<span>${index + 1}. ${escapeHtml(player.name)}</span><strong>${player.score} 分</strong>`;
    els.leaderboard.append(item);
  });
}

function renderQr(state) {
  if (!state.playerUrl) {
    els.qrPanel.hidden = true;
    return;
  }

  els.qrPanel.hidden = false;
  els.qr.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(state.playerUrl)}`;
  els.room.textContent = state.roomReady ? `房間：${state.roomId}` : "房間建立中";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
