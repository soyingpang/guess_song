# 更新進度 - 2026-05-22 14:36:35 HKT

## 今次更新重點

- 加入宣道會大埔堂程序表歌詞核對流程。
- 新增工具 `tools/verify_tpmac_lyrics.js`，可從 TPMAC 程序表 PDF 抽取歌詞段落，再與 YouTube 可讀字幕或描述作相似度比對。
- 報告不保存完整歌詞，只保存來源、字數、hash、相似度分數及狀態，避免把完整歌詞放入 repo。
- 根據歌詞比對結果，移除 61 首 `probable_mismatch` 題目。

## 題庫變化

- 教會詩歌：434 首 -> 373 首。
- 總歌庫：534 首 -> 473 首。
- 被移除清單：`docs/TPMAC_LYRIC_REJECTED_2026-05-22.csv`。
- 目前保留題目仍全部出現在 TPMAC 2021-05-22 至 2026-05-22 程序表整理摘要內。

## 歌詞核對結果

- 已檢查教會詩歌：373 首。
- 成功抽到 TPMAC 歌詞段落：340 首。
- YouTube 有可讀字幕或描述可比對：258 首。
- 歌詞直接確認：180 首。
- 歌詞弱匹配：11 首。
- YouTube 未提供可讀歌詞：105 首。
- 需要人工覆核：44 首。
- 未能從程序表切出足夠歌詞段落：33 首。
- 明顯歌詞不對並已移除：61 首。

## 檔案更新

- `.gitignore`：新增 `.cache/`，避免 PDF/YouTube 快取進入 Git。
- `tools/verify_tpmac_lyrics.js`
- `docs/TPMAC_LYRIC_VERIFICATION_2026-05-22.csv`
- `docs/TPMAC_LYRIC_VERIFICATION_2026-05-22.md`
- `docs/TPMAC_LYRIC_REJECTED_2026-05-22.csv`
- `hymns.json`
- `songlists/all-songlists.json`
- `docs/TPMAC_YOUTUBE_MATCHES_2026-05-22_EXTENDED.csv`
- `docs/TPMAC_YOUTUBE_HYMN_LIST_2026-05-22_EXTENDED.md`
- `app.js`
- `index.html`

## 前端快取

- `app.js` 題庫快取鍵更新為 `guess-song-library-v8`。
- `index.html` 腳本版本更新為 `app.js?v=hymn-library-373-lyrics-1`。

## 下一步建議

- 對 44 首 `needs_manual_review` 逐首人工看 YouTube 片段。
- 對 105 首 `no_youtube_lyrics` 可考慮日後做 OCR 或改找有字幕/歌詞描述的 YouTube 版本。
- 若要最高準確度，可在主持人後台加入「只用歌詞確認題目」模式。
