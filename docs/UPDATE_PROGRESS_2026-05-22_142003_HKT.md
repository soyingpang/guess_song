# 更新進度 - 2026-05-22 14:20:03 HKT

## 今次更新重點

- 繼續盡量豐富「教會詩歌」題庫。
- 教會詩歌由 130 首增加至 434 首，淨增加 304 首。
- 總歌庫由 230 首增加至 534 首。
- 所有保留在遊戲內的教會詩歌標題，均可在宣道會大埔堂 2021-05-22 至 2026-05-22 程序表整理摘要中找到。
- 每首保留題目均有 YouTube video ID，可供遊戲播放。

## 質素控制

- 擴充時維持兩個條件：
  - 標題必須出現在宣道會大埔堂程序表整理清單。
  - YouTube 標題需要明確對應該詩歌標題。
- 已清走或跳過同名但不適合的項目，例如流行曲、電影歌、講故事、靈修短片、聖經故事、講道片、過短或過於通用的英文標題。
- 已加入工具黑名單，避免後續重跑時再次加入已知錯配影片。

## 檔案更新

- `hymns.json`
- `songlists/all-songlists.json`
- `tools/enrich_tpmac_hymns.js`
- `docs/TPMAC_YOUTUBE_MATCHES_2026-05-22_EXTENDED.csv`
- `docs/TPMAC_YOUTUBE_HYMN_LIST_2026-05-22_EXTENDED.md`
- `app.js`
- `index.html`

## 前端快取

- `app.js` 題庫快取鍵更新為 `guess-song-library-v7`。
- `index.html` 腳本版本更新為 `app.js?v=hymn-library-434-1`。

## 驗證結果

- `hymns.json`：434 首教會詩歌。
- `songlists/all-songlists.json`：534 首總歌曲。
- 教會詩歌缺失於 TPMAC 摘要清單的數量：0。
- 教會詩歌 YouTube video ID 重複數量：0。
- 總歌單前 434 首與 `hymns.json` 完全一致。
- `tools/enrich_tpmac_hymns.js` 語法檢查通過。
- `git diff --check` 通過。

## 下一步建議

- 題庫數量已足夠大，下一步應優先做主持人分類玩法介面：只保留「教會詩歌 / 80年代 / 90年代 / 全部流行曲」作主要選項，避免下方再出現額外歌單分頁。
- 如要繼續增加詩歌，建議改為半人工審核模式，因為餘下 179 個候選多數是低出現率、同名風險高或暫時未能找到清楚歌唱版本的項目。
