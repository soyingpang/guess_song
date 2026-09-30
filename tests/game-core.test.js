const test = require("node:test");
const assert = require("node:assert/strict");
const { createChoiceTitles, isChoiceAnswerAllowed, normalizeTitle, youtubeFailureDetail } = require("../game-core.js");

const fixedRandom = () => 0;

test("choice titles are distinct even when the library has multiple recordings of one song", () => {
  const correct = { id: "a", title: "喜歡你" };
  const pool = [
    correct,
    { id: "b", title: "喜歡你" },
    { id: "c", title: "喜 歡 你" },
    { id: "d", title: "海闊天空" },
    { id: "e", title: "光輝歲月" },
    { id: "f", title: "真的愛你" },
  ];
  const choices = createChoiceTitles(correct, pool, 4, [], fixedRandom);
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices.map(normalizeTitle)).size, 4);
  assert.equal(choices.filter((title) => normalizeTitle(title) === normalizeTitle(correct.title)).length, 1);
});

test("a small filtered pool uses fallback songs to keep four choices", () => {
  const correct = { id: "a", title: "詩歌甲" };
  const choices = createChoiceTitles(correct, [correct], 4, [
    { title: "詩歌乙" }, { title: "詩歌丙" }, { title: "詩歌丁" },
  ], fixedRandom);
  assert.equal(choices.length, 4);
  assert.equal(new Set(choices.map(normalizeTitle)).size, 4);
});

test("host accepts only an answer present in the current options", () => {
  assert.equal(isChoiceAnswerAllowed("喜歡你", ["喜歡你", "海闊天空"]), true);
  assert.equal(isChoiceAnswerAllowed("答案未顯示", ["喜歡你", "海闊天空"]), false);
  assert.equal(isChoiceAnswerAllowed("", ["喜歡你"]), false);
});

test("YouTube errors give the host a recovery action", () => {
  assert.match(youtubeFailureDetail(100), /下一題播放/);
  assert.match(youtubeFailureDetail(101), /禁止嵌入/);
  assert.match(youtubeFailureDetail("autoplay"), /重播片段/);
});
