# 更新進度 - 2026-05-22 12:25:13 HKT

## 今次目標

- 回應用戶要求：歌單應該在「只玩分類」位置分開，而不是在右側另外設「線上歌單」選擇器。
- 讓主持只需要用主操作區的分類下拉選單，就可以選擇教會詩歌、80 年代流行曲或 90 年代流行曲。
- 按用戶要求，本次沒有進行本機或 in-app browser 測試。

## 已完成

- 新增 `songlists/all-songlists.json`，預設載入全部 200 首：
  - 教會詩歌 100 首
  - 80 年代流行曲 50 首
  - 90 年代流行曲 50 首
- 將教會詩歌在合併歌單內歸類為 `教會詩歌`。
- 將主操作區下拉由 `只玩分類` 調整為 `只玩歌單 / 分類`。
- 下拉選項會顯示：
  - 全部歌單
  - 80 年代流行曲
  - 90 年代流行曲
  - 教會詩歌
- 移除右側玩家區下方額外的「線上歌單 / 載入歌單」控制。
- 更新 `app.js` 預設線上題庫為 `songlists/all-songlists.json`。
- 更新 localStorage key 至 `guess-song-library-v5`，避免舊瀏覽器題庫繼續蓋住新預設歌單。
- 更新 `index.html` 的 `app.js` cache-busting 版本至 `category-songlists-1`。
- 更新 README 及流行曲歌單報告。

## 已執行檢查

- `node --check app.js` 通過。
- `node --check display.js` 通過。
- `node --check player.js` 通過。
- JSON 歌單驗證通過：
  - `hymns.json` 100 首。
  - `songlists/pop-80s.json` 50 首。
  - `songlists/pop-90s.json` 50 首。
  - `songlists/pop-all.json` 100 首。
  - `songlists/all-songlists.json` 200 首。
  - 所有 `videoId` 格式有效。
  - 沒有重複歌名或重複影片 ID。
- `git diff --check` 通過。

## 注意

- 網頁版更新後應該直接載入新的 200 首全部歌單。
- 若瀏覽器仍顯示舊畫面，可用 `?v=20260522-1225` 重新開啟避開快取。
