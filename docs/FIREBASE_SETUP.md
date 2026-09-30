# Firebase 現場答題同步設定

本功能用 Firebase Realtime Database 同步現場房間、玩家狀態、答案和分數。聲音只由主持電腦在現場播放，不經 Firebase、WebRTC 或玩家手機。

## 建立 Firebase 專案

目前已建立並啟用：

- Project ID：`guess-song-260531`
- Web app：`Guess Song Web`
- Realtime Database：`https://guess-song-260531-default-rtdb.asia-southeast1.firebasedatabase.app`
- 本 repo 已加入 `.firebaserc`、`firebase.json` 和 `database.rules.json`
- `firebase-config.js` 已設為 `enabled: true`、`anonymousAuth: true`
- Authentication 的 Anonymous 登入方式已啟用

1. 在 Firebase Console 建立 project。
2. 新增 Web app。
3. 建立 Realtime Database。
4. 將 Web app config 填入根目錄 `firebase-config.js`：

```js
window.GUESS_SONG_FIREBASE_CONFIG = {
  enabled: true,
  anonymousAuth: true,
  sdkVersion: "12.7.0",
  apiKey: "你的 apiKey",
  authDomain: "你的 project.firebaseapp.com",
  databaseURL: "https://你的 database.firebasedatabase.app",
  projectId: "你的 projectId",
  appId: "你的 appId",
};
```

## 目前的 Database Rules

正式專案於 2026-09-30 已部署 `database.rules.json` 的角色規則。主持以獨立匿名 UID 建立房間、寫入題目及分數；玩家以自己的匿名 UID 加入、寫自己的連線資料與答案事件，只讀自己的題目狀態。未登入請求不能讀房間。`firebase.json` 預設指向這份安全規則，日後一般部署不會意外還原成公開讀寫。

如要重新部署 rules：

```powershell
firebase deploy --only database --project guess-song-260531
```

## 權限與驗證

主持與玩家即使在同一瀏覽器來源開不同分頁，也使用分開的 Firebase app 身分。規則已在本機 emulator 測試允許及拒絕情況，並在公開 GitHub Pages 網址驗證新房、玩家答題、自動開估和計分。正式規則與 repo 內容一致；未登入讀取房間會收到 HTTP 401。

舊版瀏覽器若仍用公開讀寫流程，必須重新載入到 `onsite-v4` 才可入房。

本機覆核規則可執行 `npm ci`、`npm run test:rules`。測試使用 `demo-guess-song` 專案 ID，只連本機 emulator。

## 使用流程

1. 主持人開 `index.html`。
2. 主持電腦接好現場喇叭，確認瀏覽器／Windows 音量。
3. 玩家掃主持頁 QR，輸入名字後按「加入遊戲」。
4. 主持確認玩家名單，再按「開始第一題」。
5. 手機只顯示答案選項、結果和排行榜，不需要音訊或咪高峰權限。

## 限制

- 匿名登入可保護玩家之間的資料操作，但房間仍可被知道房名的人嘗試加入；活動時請使用主持頁產生的隨機房名。
- 如果 Firebase 未配置或 `enabled: false`，PeerJS data channel 仍可作房間狀態／答題後備，但不會傳音訊。
- YouTube 影片可能被下架、禁嵌入或出現廣告；正式活動前應試播所選歌單，重要歌曲宜改用已授權本地媒體 URL。
