# 更新進度 - 2026-05-22 13:41:24 HKT

## 今次更新重點

- 重點優化「教會詩歌」題庫，確認目前遊戲內的教會詩歌題目全部來自宣道會大埔堂 2021-05-22 至 2026-05-22 程序表整理清單。
- 將可靠 YouTube 對應的教會詩歌由 100 首增加至 130 首。
- 總歌庫由 200 首增加至 230 首，包括 130 首教會詩歌及 100 首流行曲。
- 新增可重跑的題庫擴充工具：`tools/enrich_tpmac_hymns.js`。
- 新增擴充後的 YouTube 對照紀錄：
  - `docs/TPMAC_YOUTUBE_MATCHES_2026-05-22_EXTENDED.csv`
  - `docs/TPMAC_YOUTUBE_HYMN_LIST_2026-05-22_EXTENDED.md`
- 更新前端載入版本，讓 GitHub Pages 使用者可重新取得新歌庫：
  - `app.js` 題庫快取鍵改為 `guess-song-library-v6`
  - `index.html` 腳本版本改為 `app.js?v=hymn-library-130-1`

## 來源確認

- 官方程序表來源：`https://www.tpmac.org/worship_guide`
- 已整理的官方程序表摘要：`docs/TPMAC_HYMNS_2021-05-22_to_2026-05-22_SUMMARY.csv`
- 今次加入遊戲的 130 首教會詩歌，全部可在上述 TPMAC 摘要清單中找到。
- 不是把 733 個已整理標題全部放入遊戲，因為部分標題屬固定禮儀、過於通用、重複變體，或暫時未能找到足夠可信的 YouTube 對應。

## 驗證結果

- `hymns.json`：130 首。
- `songlists/all-songlists.json`：230 首。
- 總歌單前 130 首與 `hymns.json` 完全一致。
- 教會詩歌缺失於 TPMAC 摘要清單的數量：0。
- 教會詩歌 YouTube video ID 重複數量：0。
- 前端快取版本及 `index.html` 載入版本已更新。

## 下一步建議

- 繼續擴充第 131 首之後的教會詩歌，但每首都應保留「TPMAC 程序表出現紀錄 + 可信 YouTube 對應」兩個條件。
- 可再加一個後台題庫管理篩選，讓主持人只玩「教會詩歌 / 80年代 / 90年代 / 全部流行曲」其中一個分類，不再顯示下面額外歌單分頁。
