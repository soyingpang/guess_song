# 更新進度 - 2026-05-22 15:01:46 HKT

## 今次修正

- 修正前台、手機直接網址沒有 `room` 參數時不會加入固定房間的問題。
- `display.html` 現在會自動連入固定房間 `soyingpang-guess-song-fellowship-room`，後台應可看到前台數量。
- `player.html` 現在用直接網址打開亦會自動使用同一個固定房間。
- 三個介面統一使用明確 PeerJS cloud + STUN 設定，減少不同瀏覽器或手機網絡下連線不穩。
- 前台加入連線逾時、同步服務斷線、找不到主持房間等提示。
- 後台房間狀態加入「可連線」提示，方便確認房間已經真正開好。
- 更新 `app.js`、`display.js`、`player.js` 的快取版本，避免手機繼續載入舊檔。

## 驗證

- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `git diff --check`

## 使用提醒

- 後台、前台、手機玩家可繼續用固定直接網址。
- 如果後台仍顯示「前台 0 個」，先重新整理後台和前台，並確認沒有另一個後台分頁佔用固定房間。
