# 更新進度 - 2026-05-22 23:07:37 HKT

## 今次新增

- 新增橫向版手機端加入教學圖，方便在 WhatsApp / 投影 / 電腦橫向畫面一次睇晒三步。
- 橫向版沿用實際 `player.html` 手機畫面截圖：
  - 輸入名字。
  - 選擇「我不在現場」。
  - 進入深色等候畫面並保持手機開住。

## 新增檔案

- `docs/mobile-remote-waiting-guide-landscape.png`
- `docs/UPDATE_PROGRESS_2026-05-22_230737_HKT.md`

## 驗證

- 檢查最終 PNG 文字可讀、三步方向清楚、重點框位置正確。
- `Invoke-WebRequest http://127.0.0.1:5173/docs/mobile-remote-waiting-guide-landscape.png` 回傳 `200 image/png`。

## GitHub 狀態

- 本更新準備提交並推送至 `origin/main`。
