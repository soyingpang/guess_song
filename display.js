const DISPLAY_STATE_KEY = "cantonese-hymn-quiz-display-state-v1";

const els = {
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
  if (state.hasWord) els.round.textContent = `第 ${state.round} 題`;
  els.score.textContent = `${state.correct} / ${state.total}`;
  els.teams.textContent = `A ${state.teamScores?.A || 0} · B ${state.teamScores?.B || 0}`;
  els.status.textContent = state.status || (state.hasSong ? "聽片段，估詩歌名" : "等候主持開始");
  els.title.textContent = state.hasWord ? state.title : state.revealed ? state.title : "估呢首詩歌";

  els.prompt.textContent = state.revealed
    ? "答案"
    : state.isPlaying
      ? `播放中 · ${remainingSeconds(state)} 秒`
      : state.hasWord
        ? "一字搶唱"
        : "聽前奏，估詩歌";
  els.subPrompt.textContent = state.revealed
    ? state.answer
    : state.hasWord
      ? "鬥快唱出含有這個字的詩歌"
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
  if (!state.hasSong || (!state.videoId && !state.audioUrl)) {
    els.playerHost.replaceChildren();
    latestFrameKey = "";
    return;
  }

  const frameKey = [state.audioUrl || state.videoId, state.start, state.end, state.isPlaying ? "play" : "cue"].join(":");
  if (frameKey === latestFrameKey) return;
  latestFrameKey = frameKey;

  if (state.audioUrl) {
    renderAudio(state);
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

function renderAudio(state) {
  const audio = document.createElement("audio");
  audio.src = state.audioUrl;
  audio.autoplay = Boolean(state.isPlaying);
  audio.preload = "metadata";
  audio.addEventListener("loadedmetadata", () => {
    audio.currentTime = Number(state.start || 0);
    if (state.isPlaying) audio.play().catch(() => {});
  }, { once: true });
  audio.addEventListener("timeupdate", () => {
    if (state.end && audio.currentTime >= state.end) audio.pause();
  });
  els.playerHost.replaceChildren(audio);
}

function buildEmbedUrl(state) {
  const url = new URL(`https://www.youtube-nocookie.com/embed/${state.videoId}`);
  url.searchParams.set("start", String(state.start || 0));
  if (state.end) url.searchParams.set("end", String(state.end));
  url.searchParams.set("autoplay", state.isPlaying ? "1" : "0");
  url.searchParams.set("controls", "0");
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
        ? "搶唱開放：鬥快唱出詩歌"
        : "等待主持開放搶唱";
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
    item.innerHTML = `<span>${index + 1}. ${escapeHtml(player.name)} · ${escapeHtml(player.team || "A")} 組</span><strong>${player.score} 分</strong>`;
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
