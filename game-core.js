(function (root, factory) {
  const core = factory();
  if (typeof module === "object" && module.exports) module.exports = core;
  if (root) root.GuessSongCore = core;
})(typeof window !== "undefined" ? window : null, function () {
  function normalizeTitle(value) {
    return String(value || "")
      .toLocaleLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}]+/gu, "");
  }

  function shuffle(items, random = Math.random) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function createChoiceTitles(correctSong, pool, count, fallbackPool = [], random = Math.random) {
    const correctTitle = String(correctSong?.title || "").trim();
    if (!correctTitle) return [];

    const optionCount = Math.max(4, Math.floor(Number(count) || 4));
    const seen = new Set([normalizeTitle(correctTitle)]);
    const alternatives = [];

    for (const source of [pool, fallbackPool]) {
      for (const song of shuffle(Array.isArray(source) ? source : [], random)) {
        const title = String(song?.title || "").trim();
        const key = normalizeTitle(title);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        alternatives.push(title);
        if (alternatives.length >= optionCount - 1) break;
      }
      if (alternatives.length >= optionCount - 1) break;
    }

    return shuffle([correctTitle, ...alternatives], random);
  }

  function isChoiceAnswerAllowed(answer, choices) {
    const selected = normalizeTitle(answer);
    return Boolean(selected && Array.isArray(choices) && choices.some((choice) => normalizeTitle(choice) === selected));
  }

  function youtubeFailureDetail(errorCode) {
    if (errorCode === "autoplay") return "瀏覽器阻止自動播放，請按「重播片段」或直接在影片按播放";
    if ([100, 101, 150].includes(errorCode)) return "影片可能已移除、設為私人或禁止嵌入；請按「下一題播放」";
    return "YouTube 影片無法播放；請檢查影片或按「下一題播放」";
  }

  return { normalizeTitle, createChoiceTitles, isChoiceAnswerAllowed, youtubeFailureDetail };
});
