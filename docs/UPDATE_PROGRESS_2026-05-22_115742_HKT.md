# 更新進度 - 2026-05-22 11:57:42 HKT

## 今次目標

- 新增非教會朋友都可以玩的流行曲歌單。
- 分別建立 80 年代流行曲、90 年代流行曲、全部流行曲三份線上歌單。
- 沿用之前做法，自動搜尋 YouTube，保存可用影片 ID，並產生配對報告。
- 按用戶要求，本次沒有進行本機或 in-app browser 測試。

## 已完成

- 新增 `songlists/pop-80s.json`，共 50 首。
- 新增 `songlists/pop-90s.json`，共 50 首。
- 新增 `songlists/pop-all.json`，共 100 首。
- 新增流行曲 YouTube 配對明細：`docs/POP_YOUTUBE_MATCHES_2026-05-22.csv`。
- 新增流行曲歌單整理報告：`docs/POP_SONGLISTS_2026-05-22.md`。
- 主持後台新增線上歌單選擇，可載入：
  - 教會詩歌
  - 80 年代流行曲
  - 90 年代流行曲
  - 全部流行曲
- 將主要介面字眼由「估詩歌」改為較通用的「估歌 / 歌曲」。
- 更新前台、手機端、後台 script cache 版本，避免舊檔快取。
- 更新 README，加入多歌單說明。

## 配對摘要

- 自動搜尋候選：164 首。
- 自動找到 YouTube 配對：164 首。
- 最終納入：80s 50 首、90s 50 首、全部流行曲 100 首。
- 人工抽查後修正 6 個 YouTube 配對，並將 `半夢半醒` 修正為 `半夢半醒之間`。

## 技術調整

- `app.js` 新增 `CLOUD_LIBRARY_OPTIONS`，由單一 `hymns.json` 改為多線上歌單。
- `app.js` 載入線上歌單時會替換目前題庫、重置分類和抽題袋。
- 自動出題白名單加入 `youtube` 和 `流行曲題庫`，讓 YouTube 配對歌單可以正常抽題。

## 已執行檢查

- `node --check app.js` 通過。
- `node --check display.js` 通過。
- `node --check player.js` 通過。
- JSON 歌單驗證通過：
  - `hymns.json` 100 首。
  - `songlists/pop-80s.json` 50 首。
  - `songlists/pop-90s.json` 50 首。
  - `songlists/pop-all.json` 100 首。
  - 所有 `videoId` 格式有效。
  - 沒有重複歌名或重複影片 ID。
- `git diff --check` 通過。

## 注意

- 歌單只保存公開 YouTube 影片 ID，不下載或儲存音樂檔。
- 正式活動前建議人工抽查版本、音量、影片是否可播放、開頭長度，以及實際活動使用權限。
