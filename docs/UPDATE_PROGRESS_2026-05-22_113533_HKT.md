# 更新進度 - 2026-05-22 11:35:33 HKT

## 今次目標

- 使用早前整理的宣道會大埔堂詩歌資料，查找哪些詩歌可在 YouTube 找到。
- 用 YouTube 可配對的詩歌更換現有估歌仔歌單。
- 按用戶要求，本次沒有進行本機或 in-app browser 測試。

## 已完成

- 以 `docs/TPMAC_HYMNS_2021-05-22_to_2026-05-22_SUMMARY.csv` 作候選歌庫。
- 自動搜尋 YouTube，並按歌名相似度、影片標題、重複影片 ID 等條件篩選。
- 排除固定禮儀、過於泛用或不適合作估歌仔的項目。
- 成功配對 100 首有 YouTube 影片的詩歌。
- 已用新配對結果更換 `hymns.json`。
- 新增 YouTube 配對明細：`docs/TPMAC_YOUTUBE_MATCHES_2026-05-22.csv`。
- 新增整理報告：`docs/TPMAC_YOUTUBE_HYMN_LIST_2026-05-22.md`。

## 配對摘要

- 新歌單數量：100 首。
- 每首歌均有 11 字元 YouTube video ID。
- 已檢查沒有重複歌名。
- 已檢查沒有重複 YouTube video ID。
- 未納入例子：
  - `一心宣講祢的愛`：自動搜尋未找到足夠可信的 YouTube 配對。
  - `慈愛長存`：自動搜尋未找到足夠可信的 YouTube 配對。
  - `至高尊貴的袮`：與 `至高尊貴的祢` 視作同一歌名，避免重複。

## 已執行檢查

- `hymns.json` JSON 驗證通過。
- 確認 `hymns.json` 共有 100 首歌。
- 確認所有 `videoId` 格式有效。
- 確認沒有重複歌名或重複影片。
- `node --check app.js` 通過。
- `node --check player.js` 通過。
- `git diff --check` 通過。

## 注意

- YouTube 配對是自動搜尋及規則篩選結果，正式活動前建議人工抽查音源是否正確、音量是否合適，以及是否符合活動使用需要。
