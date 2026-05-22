# 更新進度 - 2026-05-22 12:17:11 HKT

## 今次目標

- 回應用戶在網頁版看不到新流行曲歌單資料的問題。
- 確認 GitHub Pages 是否已經有最新檔案。
- 將線上歌單選擇器放到更明顯的位置。
- 按用戶要求，本次沒有進行本機或 in-app browser 測試。

## 已確認

- GitHub `origin/main` 已在 `990e4b2`。
- GitHub Pages 的 `index.html` 已包含：
  - `cloudLibrarySelect`
  - `載入歌單`
  - `app.js?v=pop-songlists-1`
- GitHub Pages 的三份流行曲歌單均可讀：
  - `songlists/pop-80s.json`
  - `songlists/pop-90s.json`
  - `songlists/pop-all.json`

## 原因判斷

- 新歌單資料已經上線。
- 用戶看不到，多數是因為原本選擇器放在「題庫管理」摺疊區內，需要展開才見到。
- 另一個常見原因是瀏覽器已有舊 localStorage 題庫；網頁會先顯示本機保存的舊題庫，除非手動按「載入歌單」替換。

## 已完成修正

- 將「線上歌單」選擇器移到右側玩家區下方，打開後台即可看到。
- 保留「載入歌單」按鈕，選擇教會詩歌 / 80年代流行曲 / 90年代流行曲 / 全部流行曲後按下即可替換目前題庫。
- 更新 `index.html` 的 `app.js` cache-busting 版本至 `songlists-visible-1`。

## 已執行檢查

- `node --check app.js` 通過。
- `git diff --check` 通過。

## 注意

- 若瀏覽器仍顯示舊頁，可重新整理或加 `?v=20260522` 開啟 GitHub Pages 連結，避開瀏覽器快取。
