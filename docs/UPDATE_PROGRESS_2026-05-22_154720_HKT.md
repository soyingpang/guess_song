# 更新進度 - 2026-05-22 15:47:20 HKT

## 今次修正

- 加入開咪播放保護：玩家開咪、收到咪音訊、收咪時，如果題目音樂原本正在播放，系統會重新推送播放指令。
- 後台新增 `playbackRevision`，只在需要保護播放時遞增，不會把開咪當成停止或重播題目。
- 前台 `display.html` 會因應 `playbackRevision` 重新同步播放器，避免瀏覽器因音訊焦點令音樂停住。
- 遠端手機同步播放器亦會因應 `playbackRevision` 重新同步。
- 更新三個入口的快取版本到 `mic-playback-guard-1`。

## 驗證

- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `git diff --check`

## 行為規則

- 開咪不會停止音樂。
- 只有搶答 / 搶唱、主持按停止、題目流程判定，才會主動暫停或停止音樂。
