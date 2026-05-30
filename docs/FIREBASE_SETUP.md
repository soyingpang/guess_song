# Firebase 全球手機模式設定

本功能用 Firebase Realtime Database 做全球房間、玩家狀態、搶答事件和 WebRTC signaling。聲音仍然用 WebRTC；Firebase 不直接傳音訊。

## 建立 Firebase 專案

目前已建立並啟用：

- Project ID：`guess-song-260531`
- Web app：`Guess Song Web`
- Realtime Database：`https://guess-song-260531-default-rtdb.asia-southeast1.firebasedatabase.app`
- 本 repo 已加入 `.firebaserc`、`firebase.json` 和 `database.rules.json`
- `firebase-config.js` 已改為 `enabled: true`

1. 在 Firebase Console 建立 project。
2. 新增 Web app。
3. 建立 Realtime Database。
4. 將 Web app config 填入根目錄 `firebase-config.js`：

```js
window.GUESS_SONG_FIREBASE_CONFIG = {
  enabled: true,
  sdkVersion: "12.7.0",
  apiKey: "你的 apiKey",
  authDomain: "你的 project.firebaseapp.com",
  databaseURL: "https://你的 database.firebasedatabase.app",
  projectId: "你的 projectId",
  appId: "你的 appId",
};
```

## 測試用 Database Rules

以下 rules 已部署到目前 Firebase project，只適合私人測試。公開活動前應加入更嚴格的房間碼或登入驗證。

```json
{
  "rules": {
    "rooms": {
      "$room": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

如要重新部署 rules：

```powershell
firebase deploy --only database --project guess-song-260531
```

## 使用流程

1. 主持人開 `index.html`。
2. 玩家開玩家連結，輸入名字後選「我不在現場」。
3. 主持人按「開始現場聲音廣播」，允許咪高峰。
4. 主持人用同一部或旁邊裝置播放 YouTube Premium，讓主持咪收到聲音。
5. 玩家手機如見到「開聲」按鈕，按一次啟用收聽。

## 限制

- B1 是用主持咪收聲，不是擷取 YouTube 內部音訊。
- 主持端是一對多 WebRTC 上傳；5 至 10 人可先試，更多人要考慮 LiveKit / Agora 之類音訊伺服器。
- 如果 Firebase 未配置或 `enabled: false`，現有 PeerJS / 本機玩法仍會照常運作。
