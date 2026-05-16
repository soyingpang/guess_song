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

## 玩法

- 逐首加入粵語詩歌 YouTube 連結
- 設定前奏 / 副歌開始秒數同片段長度
- 可填分類、詩歌集 / 來源、編號、提示、可接受答案
- 可揀全部分類或只玩某一類
- 可用輸入答案或四選一
- 可揀初級 12 秒、中級 8 秒、高手 5 秒
- 題目用隨機抽袋，出晒先會重洗，減少連續重複
- 未開估 / 未答完之前，題庫列表會鎖住歌名，主持人都唔會預先見到答案
- 題庫會存在同一部裝置嘅瀏覽器 localStorage
- `hymns.json` 可以做 GitHub Pages 線上題庫，所有裝置都可以一鍵載入

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
    "duration": 12,
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

目前線上題庫已預載 101 首公開 YouTube 粵語詩歌影片。
