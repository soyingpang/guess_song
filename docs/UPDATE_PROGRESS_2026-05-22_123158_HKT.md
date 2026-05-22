# 更新進度 - 2026-05-22 12:31:58 HKT

## 今次目標

- 排查手機掃前台 QR 後連不到線的問題。
- 用戶補充：房間有開到，前台可正常使用，但手機掃 QR 仍然連不到。
- 按用戶要求，本次沒有進行本機或 in-app browser 測試。

## 判斷

- 後台和前台同步可用，代表主持端房間不一定是完全未建立。
- 手機端獨立連不到，常見原因是手機頁未能載入外部 PeerJS 連線工具，或手機網絡連 WebRTC 同步服務時被阻擋。
- 原本三個頁面都由 `https://unpkg.com` 載入 PeerJS；若手機網絡或瀏覽器阻擋該 CDN，手機頁會無法建立連線。

## 已完成修正

- 新增本地 PeerJS 檔案：`vendor/peerjs.min.js`。
- 將後台、前台、手機頁都改為載入本 repo 內的 PeerJS，不再依賴外部 CDN：
  - `index.html`
  - `display.html`
  - `player.html`
- 手機端新增 9 秒連線逾時提示，避免一直停在「連線中」。
- 手機端連線錯誤訊息更清楚：
  - 找不到主持房間
  - 手機網絡連不到同步服務
  - 手機瀏覽器不支援同步連線
- 前台 QR 防呆：若後台房間明確未成功建立，前台不再顯示會誤導人的 QR。
- 更新 script cache-busting 版本至 `phone-connect-fix-1`。

## 已執行檢查

- `node --check app.js` 通過。
- `node --check display.js` 通過。
- `node --check player.js` 通過。
- `node --check vendor/peerjs.min.js` 通過。
- `git diff --check` 通過。

## 注意

- 若手機仍未能連線，請看手機頁實際顯示的錯誤文字；新版本會比之前清楚指出是房間、網絡或瀏覽器問題。
- 正式測試時請使用同一組 GitHub Pages 固定網址，避免手機掃到舊快取 QR。
