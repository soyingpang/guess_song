# AI 交接摘要

更新時間：2026-05-20 15:08 HKT

## 必讀順序

後續 AI 或開發者接手時，請按以下順序讀文件：

1. `docs/GAME_PLAN.md`：最新玩法和產品規格。
2. `docs/UPDATE_LOG.md`：按日期記錄的進度。
3. `README.md`：現有 app 使用方式和題庫背景。
4. `hymns.json`：目前線上題庫。

## 用戶語境

用戶想做一個教會團契用的華語詩歌遊戲，不是一般音樂猜歌 app。語氣偏香港粵語，回覆最好用繁體中文 / 粵語書面語。

最重要的現場需求：

- 同一部電腦雙螢幕。
- `MON1` 是主持後台。
- `MON2` 是前台大螢幕。
- 只有前台出聲。
- 手機玩家只答題，不播放音樂。
- 約 10 位團友參與。
- 預設使用同一間固定房，重開一局只重置分數，不重新開房。

## 最新玩法方向

今次團契有三個環節：

1. 四選一選擇題。
2. 按時間搶答估歌。
3. 出一個字，分 A/B 兩組鬥快唱出含有該字的詩歌。

後台要可選播放秒數：

- 60 秒
- 30 秒
- 15 秒

## 現有程式概況

主要檔案：

- `index.html` / `app.js`：主持後台。
- `display.html` / `display.js`：前台大螢幕。
- `player.html` / `player.js`：手機玩家。
- `styles.css`：所有畫面樣式。
- `assets/worship-crest.svg`：本地詩歌本 / 敬拜 emblem。
- `assets/fellowship-pattern.svg`：本地淡色教會窗格 / 樂譜紋理。
- `assets/home-fellowship-scene.svg`：本地城市窗景 / 暖燈 / 木桌 / 詩歌本客廳團契場景。
- `assets/warm-fabric-pattern.svg`：本地暖布紋背景。
- `assets/string-lights.svg`：本地柔和燈串素材。
- `assets/soft-garland-corners.svg`：本地柔和花葉角落 / 布邊素材。
- `assets/paper-grain.svg`：本地微細紙卡紋理素材。
- `assets/fellowship-main-visual-manhwa.png`：imagegen 生成的韓式漫畫 / webtoon 手繪風主視覺，現時用於前台遮罩、手機背景和整體氛圍。
- `assets/fellowship-main-visual.png`：上一版較寫實 editorial poster 主視覺，保留作備份。
- `hymns.json`：線上題庫。
- `server.js`：本機測試 server。

現有功能：

- 後台可抽題。
- 前台可顯示題目狀態和 QR code。
- 手機可加入房間。
- 四選一可答題並加分。
- 搶答可加分。
- 排行榜可顯示。
- 題庫已按白名單來源重建為 88 首。

## 重要狀態提醒

2026-05-20 已開始把程式改向三環節團契版：

- 後台有 60 / 30 / 15 秒播放設定。
- 後台播放 iframe 已靜音，只有前台 iframe 不帶 mute 參數。
- 前台會收到 `end` 和 `playEndsAt`，用作倒數和停止播放。
- 手機加入時已有 A/B 組選擇。
- 後台已有一字搶唱模式和 A/B 組分數。
- 後台已有「停止」按鈕。
- 搶答估歌 / 一字搶唱需要主持按「開放搶答 / 搶唱」才可讓手機按鈕生效。
- 後台右欄已改成玩家狀態優先，題庫管理預設收起。
- 後台已有「分數重置」按鈕，可清分數、組分、題目、答案和搶答狀態，但保留題庫、固定房間、QR 和玩家。
- 前台排行榜已改成「分數結算」畫面，先顯示 A/B 組戰況，再顯示個人榜；手機也有 A/B 組分數摘要。
- 後台已有「公布勝方」按鈕，前台會切到分組勝方全屏畫面；「公布勝方」和「排行榜」互斥顯示。
- 開新題、播放、重新開放搶答 / 搶唱或分數重置時，會退出完場公布畫面。
- 前台 QR code 已改成本地生成：`display.html` 先載入 `local-qr.js`，`display.js` 用 `window.createLocalQrCodeDataUrl()` 產生 SVG data URL，不再依賴 `api.qrserver.com`。
- 手機端已有自動重連；後台會用玩家 ID 保留分數，並在同名玩家離線時接回舊資料。同名仍在線時，新加入者會顯示為「名字（2）」。
- 後台玩家欄有「複製玩家連結」按鈕，房間建立後可用；用作 QR 掃不到時的後備。
- 後台玩家列表已有 A/B 組下拉選單，可即時改組並同步手機/前台；離線玩家可用「移」按鈕清走。
- 後台按「開估」後，前台會自動以全首播放狀態開播：display state 會有 `fullPlayback: true`、`isPlaying: true`、`end: 0`，所以前台 iframe 有 `autoplay=1` 並沒有 `end` 參數。
- 後台按「下一題」會直接 `startRound(null, { autoplay: true })`，即時用目前選好的 60 / 30 / 15 秒開始前台播放。
- 後台已有播放起點設定：`playStartMode` 可為 `beginning` 或 `random`。每題在 `startRound()` 設定 `currentClipStart`；重播同一題沿用同一段。`fullPlayback` 時前台 start 固定回到 0。
- 手機端已有「開咪對話」：`player.js` 用 `navigator.mediaDevices.getUserMedia({ audio })` 和 `state.peer.call(roomId, stream)` 傳到後台；`app.js` 用 `state.peer.on("call")` 接收，後台玩家列表顯示音訊元件和「收咪」按鈕。
- 遠端前台已支援：後台有 `displayConnections`，`display.html?room=...` 會送 `display-join`，後台用 `display-state` 推送 `buildDisplayState()`。外地朋友必須用「複製前台連結」，普通 `display.html` 只會本機等待同步。
- 前台不再有 `#stageSoundButton` 或 `soundUnlocked` 流程；`display.js` 預設前台就是有聲播放，YouTube iframe 不加 `mute`，並保持 `autoplay=1`、`controls=0`。
- 固定房間 ID 是 `soyingpang-guess-song-fellowship-room`，由 `DEFAULT_ROOM_ID` 控制。不要再用 `makeRoomId()` 或 random room 作為預設；若 PeerJS 回報 `unavailable-id`，應提示關閉其他後台，不應靜默開新房。
- 介面已做八輪美化。最新 cache version 是 `sync-choice-room-lock-1`。三個入口頁都載入 `assets/worship-crest.svg`；背景和遮罩使用 `assets/fellowship-main-visual-manhwa.png`、`assets/fellowship-pattern.svg`、`assets/home-fellowship-scene.svg`、`assets/warm-fabric-pattern.svg`、`assets/string-lights.svg`、`assets/soft-garland-corners.svg`、`assets/paper-grain.svg`。本機 `server.js` 已加入 `.svg` MIME type。
- 最新美術方向是「都會團契的家 / 韓式漫畫手繪主視覺 / 明亮暖白紙卡 / lounge 活動套件」：城市窗景、暖燈、木桌、詩歌本、杯、植物、結他、柔和燈串、花葉角落和紙卡質感。用戶明確不想要黑色風格，所以不要再用大片黑底或黑色 overlay。前台遮罩仍必須是實色，不可改回半透明，也不要退回只靠簡單 SVG 圖示裝飾。

仍要留意：程式曾在較早版本做過「後台有聲 / 全首播放」，如見到舊文件或舊 commit，不要當成最新需求。

## 最新場控方向

用戶已確認：

- 不想被固定題數限制。
- 不要做「每個環節必須玩幾題」或「自動完場」作為主流程。
- App 應是主持自由場控：幾時玩哪個環節、玩幾多題、幾時顯示排行榜，都由後台手動控制。
- 播放秒數 60 / 30 / 15 可每題前自由切換。
- 播放起點可每題前自由切換：由頭播或隨機中段。
- 手機開咪是給主持後台聽，不是前台播放器；若要全場聽見，要由電腦/場地音響路由決定。
- 外地前台同步靠 PeerJS 房間碼，不靠 localStorage；主持後台必須保持開住。
- 後台固定房間碼；「分數重置」只清場次資料，不踢走玩家或換 QR。
- 前台畫面不再要求玩家/觀眾按「啟用聲音」。但個別遠端瀏覽器仍可能阻擋有聲 autoplay；這是瀏覽器政策，不應重新加可見聲音按鈕，除非用戶再改規格。
- 前台不顯示四選一歌名選項。`buildDisplayState()` 對 display state 傳 `choices: []`，`display.js` 在 `choice` mode 不 render `stage-choice` 歌名；手機端 `buildPlayerState()` 仍正常提供四選一選項。
- 後台主持頁已整理排版：普通桌面保留大影片預覽，超寬畫面才用影片與控制列並排；右側玩家/題庫是 sticky 卡片分組，底部 `result-bar` 改成淺色紙卡以提高可讀性。
- 前台 QR 必須保留。`display.js` 已加入 `DEFAULT_ROOM_ID` / `qrRoomId` fallback，`renderWaiting()` 會顯示玩家 QR，不再 hidden；即使尚未收到後台 `display-state`，仍會生成 `player.html?room=soyingpang-guess-song-fellowship-room`。
- 後台不應作答。`index.html` 將 `guessForm` 和 `choices` 預設 hidden；`app.js` 不再綁定後台 guess submit，`renderChoices()` 只會清空並隱藏後台選項。手機端仍由 `buildPlayerState()` 取得四選一選項。
- 手機四選一同步有保險：`ensureChoiceOptions(song)` 會在送 player state 前補回 `currentChoices`；`player.js` 如收到空選項會顯示「選項同步中」。後台如固定房間 ID 被另一個後台佔用，`isRoomBlocked()` 會鎖住出題/播放/開估等主持控制，避免手機連到另一個後台但眼前後台仍可操作。

後續如果要加「建議流程」可以是輔助提示，不應鎖死主持。

## 文件更新規則

每次完成有意義的修改，都要更新 `docs/UPDATE_LOG.md`，放在最上方，使用香港時間。

需要記錄：

- 做了什麼。
- 改了哪些檔案。
- 對玩法或現場使用有什麼影響。
- 是否已測試。
- 下一步是什麼。

如果改動影響玩法規格，也要同步更新 `docs/GAME_PLAN.md`。
