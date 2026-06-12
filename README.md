# 估歌仔

一個用 YouTube 影片片段做題目嘅估歌仔 web app，支援詩歌、80年代流行曲、90年代流行曲同自訂歌單，適合團契、小組、朋友聚會或營會破冰。

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

## 多房間同時玩

主持人直接開首頁即可。系統會自動檢查空房：第一個主持用原本固定房，第二個主持自動用 `soyingpang-guess-song-fellowship-room-2`，第三個用 `...-3`，如此類推。主持頁右側 QR / 玩家連結會自動帶正確房名。

```text
https://soyingpang.github.io/guess_song/
```

如要指定固定活動房名，仍可在主持頁網址加 `room` 參數。每個房間會有自己獨立的玩家、題目、分數和音訊連線。

```text
https://soyingpang.github.io/guess_song/index.html?room=fellowship-a
https://soyingpang.github.io/guess_song/index.html?room=fellowship-b
```

目前主流程已收窄為手機全球版：主持頁負責播歌、出題、分數和聲音廣播，玩家只需用手機加入房間。

## 玩法

- 逐首加入歌曲 YouTube 連結，或使用已授權 / 自己錄製的音訊或影片檔
- 每題由歌曲 0 秒或隨機中段開始播放，主持可手動輸入播放秒數
- 可填分類、來源 / 歌單、編號、提示、可接受答案
- 可揀全部分類或只玩某一類
- 可玩四選一或快選估歌
- 如填寫本地 / 已授權媒體 URL，程式會優先使用該音訊或影片檔，完全避開 YouTube 廣告
- 主持頁播放器平時預設靜音，只作主持人跳過廣告和預覽；桌面 Chrome / Edge 可用分頁音訊分享把電腦播放聲音廣播給遠距玩家，咪高峰收聲保留作後備
- 題目用隨機抽袋，出晒先會重洗，減少連續重複
- 未開估 / 未答完之前，題庫列表會鎖住歌名；主持頁影片會保持可見，方便主持人先處理 YouTube 廣告
- `index.html` 是主持頁；`player.html` 是玩家手機
- 主持頁按「下一題播放」會一按抽題並自動播放 / 倒數
- 玩家手機輸入名字後直接加入手機版房間
- 手機端全部視為遠距手機玩家；Firebase 配好後會收聽主持廣播的分頁聲音或咪高峰聲音，手機本身不再播放 YouTube
- 四選一答中加 1 分；全部在線玩家已選後會自動開估，只顯示文字答案 5 秒，不播完整歌曲，然後自動播放下一題；快選估歌可選 4 / 6 / 8 個歌名，答中 +5 分、答錯 -1 分並冷卻 5 秒，答中後同樣顯示答案再自動下一題
- 主持頁可按「排行榜」，玩家手機會看到排名
- 線上歌單已合併詩歌、80年代流行曲、90年代流行曲和 00 後 / 最近15年流行曲，可直接用「線上歌單」或「只玩語言 / 年代 / 分類」切換玩法
- 隨機抽題只會使用已批准來源；待審來源會保留在題庫，但不會被抽中
- 題庫會存在同一部裝置嘅瀏覽器 localStorage
- `songlists/all-songlists.json` 是預設線上歌單，會把詩歌、80年代流行曲、90年代流行曲和 00 後流行曲一併載入；主持亦可直接載入粵語 / 國語或最近15年歌單

## 玩家手機

主持人先開主持頁，右側玩家區會直接顯示「掃碼加入」QR code，也可複製玩家連結給大家。玩家用手機打開連結後，輸入名字即可加入遊戲；A/B 組會由系統按人數自動平均分配，主持仍可在主持頁手動調整。

全球手機模式已接上 Firebase Realtime Database，同步房間、玩家、搶答和分數；聲音用 WebRTC 送到玩家手機。桌面 Chrome / Edge 建議按「廣播電腦/分頁聲音」，選播放 YouTube 的分頁並勾選分享分頁音訊；如瀏覽器不支援，才用「用咪高峰收聲」作後備。Firebase 設定見 `docs/FIREBASE_SETUP.md`。

如日後將 `firebase-config.js` 改回 `enabled: false`，多人連線仍會使用原本瀏覽器 WebRTC / PeerJS 後備；主持頁要保持開住，因為分數同房間狀態由主持頁管理。

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

想所有人開同一條 GitHub Pages link 都有同一批題目，可以更新 repo 入面嘅 JSON 歌單。格式同上面一樣。更新後 push 到 GitHub，網站會載入 `songlists/all-songlists.json`，主持可用「只玩語言 / 年代 / 分類」選擇今次玩邊個歌單。

目前線上歌單包括：

- `songlists/all-songlists.json`：全部歌單，3529 首
- `hymns.json`：詩歌，183 首
- `songlists/pop-80s.json`：80年代流行曲，552 首
- `songlists/pop-90s.json`：90年代流行曲，894 首
- `songlists/pop-00s.json`：00後流行曲，1900 首
- `songlists/pop-recent-15.json`：最近15年流行曲，1874 首
- `songlists/pop-cantonese.json`：粵語流行曲，1633 首
- `songlists/pop-mandarin.json`：國語流行曲，1713 首
- `songlists/all-cantonese.json`：全部粵語歌，1721 首
- `songlists/all-mandarin.json`：全部國語歌，1808 首
- `songlists/pop-all.json`：全部流行曲，3346 首

目前線上歌單只保留現有 `viewCount` metadata 達 50 萬或以上的歌曲；完整清理報告見 `docs/YOUTUBE_VIEW_FILTER_2026-06-12_500K.md`。語言 / 年代拆分 audit 見 `docs/SONGLIST_LANGUAGE_ERA_SPLIT_2026-06-12.md`。

目前自動出題白名單包括：小羊詩歌、同心圓敬拜福音平台 One Circle、角聲使團 The Heralders、原始和聲 Raw Harmony、基恩敬拜 Amazing Grace Worship、播道神學院 Evangel Seminary、鹹蛋音樂事工 Salted Egg Music Ministry、玻璃海樂團 Worship Nations、讚美之泉 Stream of Praise、建道神學院新祢呈敬拜隊、泥土音樂 Clay Music、約書亞樂團 Joshua Band、團契遊樂園、HKACM 香港基督徒音樂事工協會、YouTube、流行曲題庫。其他來源會先標示為「待審」。

後續新增題目時，以教會團契常唱、旋律一出較多人認得、華人教會大路的經典詩歌為優先；冷門歌、個人翻唱、來源不清楚的影片先留待審。
