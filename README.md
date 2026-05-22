# 估歌仔

一個用 YouTube 影片片段做題目嘅估歌仔 web app，支援教會詩歌、80年代流行曲、90年代流行曲同自訂歌單，適合團契、小組、朋友聚會或營會破冰。

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

- 逐首加入歌曲 YouTube 連結，或使用已授權 / 自己錄製的音訊或影片檔
- 每題由歌曲 0 秒開始播放，主持可選 60 / 30 / 15 秒
- 可填分類、來源 / 歌單、編號、提示、可接受答案
- 可揀全部分類或只玩某一類
- 可用輸入答案或四選一
- 如填寫本地 / 已授權媒體 URL，程式會優先使用該音訊或影片檔，完全避開 YouTube 廣告
- 後台播放器預設靜音，只作主持人跳過廣告和預覽；前台投影負責出聲
- 題目用隨機抽袋，出晒先會重洗，減少連續重複
- 未開估 / 未答完之前，題庫列表會鎖住歌名；後台影片會保持可見，方便主持人先處理 YouTube 廣告，前台仍會遮住答案
- `index.html` 是主持人後台控制台；`display.html` 是前台投影畫面
- 後台按「下一題播放」會一按抽題並自動播放 / 倒數；估歌期間前台會遮住 YouTube 答案，只留右下角小窗方便手動處理廣告
- 前台右下會顯示 QR code，玩家手機掃碼後輸入名字加入
- 前台會顯示已加入玩家、分數、A/B 組和開咪狀態
- 手機端入房前先選「在現場 / 不在現場」；不在現場模式會用遮罩播放器同步播放聲音，並顯示倒數、組分、開咪和玩家狀態，入房後不可切換
- 玩家開咪對話時，聲音會由後台接收並轉發到前台播放
- 四選一答中加 1 分；搶答估歌由主持判定，答中加 2 分；主題搶唱支援 A/B 組分組計分
- 後台可按「排行榜」，前台會顯示即時排名
- 線上歌單已合併教會詩歌、80年代流行曲和90年代流行曲，可直接用「只玩歌單 / 分類」切換玩法
- 隨機抽題只會使用已批准來源；待審來源會保留在題庫，但不會被抽中
- 題庫會存在同一部裝置嘅瀏覽器 localStorage
- `songlists/all-songlists.json` 是預設線上歌單，會把教會詩歌、80年代流行曲和90年代流行曲一併載入

## 玩家手機

主持人先開後台，再按「開前台」。前台右下角會出現 QR code。玩家用手機掃碼後，先選「在現場 / 不在現場」，再輸入名字加入遊戲；A/B 組會由系統按人數自動平均分配，主持仍可在後台手動調整。不在現場玩家的手機會同步狀態和遮住答案。YouTube 在手機瀏覽器不能可靠自動開聲；如要不手按而自動同步有聲，題庫應改用已授權的本地音訊或影片檔。

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
    "title": "歌名",
    "aliases": ["可接受別名", "英文名或簡稱"],
    "videoId": "dQw4w9WgXcQ",
    "audioUrl": "./audio/song.mp3",
    "start": 0,
    "duration": 60,
    "category": "敬拜",
    "source": "來源 / 歌單",
    "hint": "提示文字",
    "number": "歌曲編號"
  }
]
```

`videoId` 可以係 YouTube ID，亦可以喺 app 入面直接貼 YouTube URL。`audioUrl` 保留舊名作相容用途，但而家可以填你教會有權使用的本地 / 已授權媒體檔：音訊建議放入 `audio/`，例如 `./audio/song-name.mp3`；影片建議放入 `video/`，例如 `./video/song-name.mp4`。支援常用音訊 MP3/M4A/WAV/OGG，同常用影片 MP4/M4V/MOV/OGV/WEBM；有 `audioUrl` 時會優先播放本地 / 授權檔，不用 YouTube。

## 線上歌單

想所有人開同一條 GitHub Pages link 都有同一批題目，可以更新 repo 入面嘅 JSON 歌單。格式同上面一樣。更新後 push 到 GitHub，網站會載入 `songlists/all-songlists.json`，主持可用「只玩歌單 / 分類」選擇今次玩邊個歌單。

目前線上歌單包括：

- `songlists/all-songlists.json`：全部歌單
- `hymns.json`：教會詩歌
- `songlists/pop-80s.json`：80年代流行曲
- `songlists/pop-90s.json`：90年代流行曲
- `songlists/pop-all.json`：全部流行曲

目前自動出題白名單包括：小羊詩歌、同心圓敬拜福音平台 One Circle、角聲使團 The Heralders、原始和聲 Raw Harmony、基恩敬拜 Amazing Grace Worship、播道神學院 Evangel Seminary、鹹蛋音樂事工 Salted Egg Music Ministry、玻璃海樂團 Worship Nations、讚美之泉 Stream of Praise、建道神學院新祢呈敬拜隊、泥土音樂 Clay Music、約書亞樂團 Joshua Band、團契遊樂園、HKACM 香港基督徒音樂事工協會、YouTube、流行曲題庫。其他來源會先標示為「待審」。

後續新增題目時，以教會團契常唱、旋律一出較多人認得、華人教會大路的經典詩歌為優先；冷門歌、個人翻唱、來源不清楚的影片先留待審。
