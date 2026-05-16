# 估歌仔

一個用 YouTube 影片片段做題目嘅估歌仔小 web app。

## 出街用

呢個 app 係純前端，可以直接放上 GitHub Pages：

1. 在 GitHub 建立一個 public repository，例如 `guess_song`
2. 將呢個 folder push 上去 `main` branch
3. 到 repo 的 `Settings` > `Pages`
4. `Build and deployment` 選 `Deploy from a branch`
5. `Branch` 選 `main`，folder 選 `/root`
6. 儲存後等一兩分鐘，GitHub 會顯示公開網址

之後用手機、街外電腦都可以用個 GitHub Pages URL 開。

## 本機開始

```powershell
node server.js
```

然後打開：

```text
http://localhost:5173
```

## 歌庫 JSON 格式

```json
[
  {
    "title": "Song title",
    "aliases": ["Artist name", "Other accepted answer"],
    "videoId": "dQw4w9WgXcQ",
    "start": 43,
    "duration": 12
  }
]
```

`videoId` 可以係 YouTube ID，亦可以喺 app 入面直接貼 YouTube URL。
