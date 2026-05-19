# 華語詩歌估歌仔

一個用 YouTube 影片片段做題目嘅華語詩歌估歌仔 web app，支援粵語同國語詩歌，適合團契、小組、主日學、詩班遊戲或營會破冰。

## 文件

後續開發請先睇：

- `docs/GAME_PLAN.md`：團契三環節玩法計劃書
- `docs/UPDATE_LOG.md`：按日期時間記錄的更新記錄
- `docs/AI_HANDOFF.md`：給其他 AI / 開發者的交接摘要

## 出街用

呢個 app 係純前端，可以直接放上 GitHub Pages：

1. 在 GitHub 建立一個 public repository，例如 `guess_song`
2. 將呢個 folder push 上去 `main` branch
3. 到 repo 的 `Settings` > `Pages`
4. `Build and deployment` 選 `Deploy from a branch`
5. `Branch` 選 `main`，folder 選 `/root`
6. 儲存後等一兩分鐘，GitHub 會顯示公開網址

之後用手機、街外電腦都可以用個 GitHub Pages URL 開。

前台畫面網址：

```text
https://soyingpang.github.io/guess_song/display.html
```

前台同步使用同一部機 / 同一個瀏覽器 profile 的 localStorage，適合一部電腦開兩個視窗：一個後台控制，一個拖去投影或大電視。

## 玩法

- 逐首加入詩歌 YouTube 連結，或使用教會已授權 / 自己錄製的音訊檔
- 每題固定由歌曲 0 秒開始播放 60 秒
- 可填分類、詩歌集 / 來源、編號、提示、可接受答案
- 可揀全部分類或只玩某一類
- 可用輸入答案或四選一
- 如填寫本地 / 已授權音訊 URL，程式會優先使用音訊檔，完全避開 YouTube 廣告
- 後台播放器預設靜音，只作主持人跳過廣告和預覽；前台投影負責出聲
- 題目用隨機抽袋，出晒先會重洗，減少連續重複
- 未開估 / 未答完之前，題庫列表會鎖住歌名；後台影片會保持可見，方便主持人先處理 YouTube 廣告，前台仍會遮住答案
- `index.html` 是主持人後台控制台；`display.html` 是前台投影畫面
- 後台按「開前台」後，播放、提示、開估、下一題會同步到前台
- 前台右下會顯示 QR code，玩家手機掃碼後輸入名字加入
- 四選一答中加 1 分；搶答題最快搶答加 2 分
- 後台可按「排行榜」，前台會顯示即時排名
- 線上題庫已按你確認的白名單來源重做，優先保留經典、多人常唱、團契容易估到的粵語/國語詩歌
- 隨機抽題只會使用已批准來源；待審來源會保留在題庫，但不會被抽中
- 題庫會存在同一部裝置嘅瀏覽器 localStorage
- `hymns.json` 可以做 GitHub Pages 線上題庫，所有裝置都可以一鍵載入

## 玩家手機

主持人先開後台，再按「開前台」。前台右下角會出現 QR code。玩家用手機掃碼，輸入名字，就可以加入遊戲。

多人連線使用瀏覽器 WebRTC peer-to-peer；主持人後台要保持開住，因為分數同房間狀態由主持人頁面管理。

## 本機開始

```powershell
node server.js
```

然後打開：

```text
http://localhost:5173
```

## 題庫 JSON 格式

```json
[
  {
    "title": "詩歌名",
    "aliases": ["可接受別名", "英文名或簡稱"],
    "videoId": "dQw4w9WgXcQ",
    "audioUrl": "./audio/song.mp3",
    "start": 0,
    "duration": 60,
    "category": "敬拜",
    "source": "詩歌集 / 來源",
    "hint": "提示文字",
    "number": "詩歌編號"
  }
]
```

`videoId` 可以係 YouTube ID，亦可以喺 app 入面直接貼 YouTube URL。`audioUrl` 只應填你教會有權使用的音訊檔，例如自己錄音、已獲授權的 MP3/M4A/WAV/OGG，或已確認授權的公開音訊；有 `audioUrl` 時會優先播放音訊檔。你可以把音訊放入 `audio/`，然後填 `./audio/song-name.mp3`。

## 線上題庫

想所有人開同一條 GitHub Pages link 都有同一批題目，可以更新 repo 入面嘅 `hymns.json`。格式同上面一樣。更新後 push 到 GitHub，網站入面按「線上題庫」就會載入最新題庫。

目前線上題庫已預載 88 首公開 YouTube 詩歌影片；按「線上題庫」會替換成白名單經典題庫，避免舊題庫留在瀏覽器。

目前自動出題白名單包括：小羊詩歌、同心圓敬拜福音平台 One Circle、角聲使團 The Heralders、原始和聲 Raw Harmony、基恩敬拜 Amazing Grace Worship、播道神學院 Evangel Seminary、鹹蛋音樂事工 Salted Egg Music Ministry、玻璃海樂團 Worship Nations、讚美之泉 Stream of Praise、建道神學院新祢呈敬拜隊、泥土音樂 Clay Music、約書亞樂團 Joshua Band、團契遊樂園、HKACM 香港基督徒音樂事工協會。其他來源會先標示為「待審」。

後續新增題目時，以教會團契常唱、旋律一出較多人認得、華人教會大路的經典詩歌為優先；冷門歌、個人翻唱、來源不清楚的影片先留待審。
