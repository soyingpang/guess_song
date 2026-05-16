# 粵語詩歌估歌仔

一個用 YouTube 影片片段做題目嘅粵語詩歌估歌仔 web app，適合團契、小組、主日學、詩班遊戲或營會破冰。

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

- 逐首加入粵語詩歌 YouTube 連結
- 設定前奏 / 副歌開始秒數同片段長度
- 可填分類、詩歌集 / 來源、編號、提示、可接受答案
- 可揀全部分類或只玩某一類
- 可用輸入答案或四選一
- 可揀初級 30 秒、中級 20 秒、高手 15 秒
- 題目用隨機抽袋，出晒先會重洗，減少連續重複
- 未開估 / 未答完之前，題庫列表會鎖住歌名，主持人都唔會預先見到答案
- `index.html` 是主持人後台控制台；`display.html` 是前台投影畫面
- 後台按「開前台」後，播放、提示、開估、下一題會同步到前台
- 前台右下會顯示 QR code，玩家手機掃碼後輸入名字加入
- 四選一答中加 1 分；搶答題最快搶答加 2 分
- 後台可按「排行榜」，前台會顯示即時排名
- 線上題庫已按粵語 / 廣東話詩歌來源篩選，剔走未能確認粵語的普通話來源
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
    "start": 43,
    "duration": 30,
    "category": "敬拜",
    "source": "詩歌集 / 來源",
    "hint": "提示文字",
    "number": "詩歌編號"
  }
]
```

`videoId` 可以係 YouTube ID，亦可以喺 app 入面直接貼 YouTube URL。

## 線上題庫

想所有人開同一條 GitHub Pages link 都有同一批題目，可以更新 repo 入面嘅 `hymns.json`。格式同上面一樣。更新後 push 到 GitHub，網站入面按「線上題庫」就會載入最新題庫。

目前線上題庫已預載 93 首公開 YouTube 粵語詩歌影片；按「線上題庫」會替換成官方純粵語題庫，避免舊普通話歌曲留在瀏覽器。
