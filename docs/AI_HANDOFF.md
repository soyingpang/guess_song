# AI 交接摘要

更新時間：2026-06-02 23:46 HKT

## 必讀順序

後續 AI 或開發者接手時，請按以下順序讀文件：

1. `docs/GAME_PLAN.md`：最新玩法和產品規格。
2. `docs/UPDATE_LOG.md`：按日期記錄的進度。
3. `README.md`：現有 app 使用方式和題庫背景。
4. `hymns.json`：目前線上題庫。

## 用戶語境

用戶想做一個教會團契用的華語詩歌遊戲，不是一般音樂猜歌 app。語氣偏香港粵語，回覆最好用繁體中文 / 粵語書面語。

最重要的最新需求：

- 手機全球版主流程不再分「前台 / 後台」；主角色是主持頁 + 玩家手機。
- `index.html` 是主持頁，負責出題、播放控制、快選估歌 / 主題搶唱控制、分數和主持音訊廣播。
- `player.html` 是玩家手機，負責加入、四選一、快選估歌、搶唱、排行榜和遠距收聲。
- `display.html` 只保留做可選投影畫面；有大電視 / 投影時才開，不應成為手機全球版必需流程。
- 現在沒有現場版分支；所有玩家手機都視為遠距手機玩家，輸入名字後直接加入並收聽主持廣播的電腦/分頁聲音或咪高峰聲音。
- 約 10 位團友參與。
- 預設使用自動分房，重開一局只重置分數，不重新開房。主持直接開首頁時，系統會用 Firebase 佔房和主持心跳找第一間空房：原房、`-2`、`-3` 如此類推；如要固定活動房名，可在主持頁 URL 加 `?room=fellowship-a`。
- 最新自動場控：第一位玩家加入空場會自動開始第一題；全部玩家離開後會自動清場，下一位玩家加入時重新開始。
- 最新公平性規則：每題只讓題目開始時已在線的玩家作答；中途加入玩家要等下一首，避免影響當題「全部已答」或快選搶答判斷。
- 手機玩家畫面不應顯示「同步校準 / 聽到音樂」按鈕；延遲補償由主持端統一設定和場控。
- iPhone / iOS Safari 音訊要特別小心：玩家按「開聲並加入」後，`player.js` 會保持已解鎖的隱藏靜音 audio element 循環播放，等主持音訊 stream 到達時沿用同一 element。不要改回入房後立即 pause，否則 iPhone 可能又會要求再按開聲。
- 有遠端手機玩家時，主持未開始「廣播電腦/分頁聲音」或「用咪高峰收聲」前不應自動開題或播放；否則手機已開聲也沒有音訊來源。

## 最新玩法方向

今次團契有三個環節：

1. 四選一選擇題：全部在線玩家提交答案後，自動開估；開估只顯示文字答案 5 秒，不播放完整歌曲，然後自動播放下一題。
2. 快選估歌：手機顯示 8 個歌名，玩家鬥快撳中答案。
3. 出一個大路主題 / 關鍵詞，分 A/B 兩組鬥快唱出切合主題的詩歌。

主持頁要可選播放秒數：

- 60 秒
- 30 秒
- 15 秒

## 現有程式概況

主要檔案：

- `index.html` / `app.js`：主持頁。
- `display.html` / `display.js`：可選投影畫面。
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
- `audio/`：放教會有權使用的本地音訊檔，題庫路徑例如 `./audio/song-name.mp3`。
- `video/`：放教會有權使用的本地影片檔，題庫路徑例如 `./video/song-name.mp4`。
- `server.js`：本機測試 server。

現有功能：

- 主持頁可抽題。
- 可選投影畫面可顯示題目狀態和 QR code。
- 手機可加入房間。
- 四選一可答題並加分；所有在線玩家都答完後，主持頁會自動開估，文字顯示答案 5 秒後自動下一題播放。
- 快選估歌可自動判分：答中 +5，答錯 -1，答錯後該玩家冷卻 5 秒；有人答中時只顯示文字答案 5 秒，不播放完整歌曲，然後自動下一題。
- 排行榜可顯示。
- 題庫已擴充和重整；目前 `hymns.json` 約 500 首，`songlists/all-songlists.json` 約 2513 首。
- 已加入並啟用 Firebase 全球手機模式：Project ID 是 `guess-song-260531`，Realtime Database 是 `https://guess-song-260531-default-rtdb.asia-southeast1.firebasedatabase.app`。Firebase Realtime Database 負責房間、玩家、題目狀態、搶答事件和 WebRTC signaling；聲音仍由 WebRTC 傳送。

## 重要狀態提醒

2026-05-31 已加入並 live 驗證自動分房：主持頁無 `room` 參數時會用 Firebase transaction 由 `soyingpang-guess-song-fellowship-room`、`...-2`、`...-3` 起找第一間空房，並用 `hostHeartbeatAt` 心跳避免仍在線的主持被誤搶。有 `?room=...` 時仍使用指定房間。正式網址已驗證三個首頁分頁會分別取得原房、`-2`、`-3`，測試房已清理。

2026-05-31 已修正並 live 驗證開估流程：所有歌曲開估後都只顯示文字答案 5 秒，不播放完整歌曲，然後自動下一題。主持手動開估、四選一全員已選、快選估歌答中都已用 GitHub Pages 正式網址驗證；reveal 時 Firebase player state 是 `revealed: true`、`isPlaying: false`、`mediaPlaying: false`、`fullPlayback: false`，測試房已清理。

2026-05-31 已加入手機延遲補償；2026-06-01 已改成主持可調 5 / 7 / 10 秒，預設 7 秒。主持端用 `state.remoteAudioLatencyMs` 保留遠距答題 grace window，手機端用 player state 的 `remoteAudioDelayMs` 令倒數延後才開始扣。player state 包含 `remoteAudioDelayMs`、`remotePlayStartsAt`、`remotePlayEndsAt`、`answerOpenUntil`。最新行為是：補償期間玩家可先看四選一 / 快選選項，但按鈕會鎖住，到手機預期聽到音樂時自動開放，避免未聽到歌前亂撳。

2026-06-01 已開始手機 premium app UI 改造：`player.html` 新增頂部 app bar、狀態 pill、設定 modal、動態背景光層和更 app-like 的主答題面板；`player.js` 新增手機 UI 設定 localStorage、動態特效 / 觸感 / 精簡畫面控制、haptic feedback 和 body 狀態 class。手機入口 cache version 已推進至 `premium-mobile-32`，主持入口也是 `premium-mobile-32`，投影入口仍是 `mobile-delay-1`。第二輪已加 `phoneMoment` 高峰彈層：答中、答錯 / 冷卻、開估答案會有 app-like 彈層；排行榜 modal 也有冠軍 badge 和分組領先 highlight。第三輪已加開估「正確答案」卡、快選答錯冷卻倒數條、排行榜頂部第一名 / 分組領先摘要。第四輪已加主持可調手機延遲補償 5 / 7 / 10 秒，手機設定頁同步顯示實際補償秒數。第五輪曾加手機「聽到音樂」校準回報；2026-06-02 已按用戶要求從手機畫面移除玩家可按的同步校準入口，延遲主要由主持設定控制。第六輪已加 PWA app 外殼：`manifest.webmanifest`、app icon PNG/SVG、Apple mobile web app metadata、`pwa.js` 和 network-first `sw.js`。第七輪已加手機分數升降動畫：`phoneScoreBurst`、加分 pulse、扣分 shake。第八輪已加手機排行榜名次升跌動畫：上一輪名次快照、升跌 / 新上榜 / 同名次分數變化 chip、打開排行榜時重播動畫。第九輪已加手機題目轉場 cue：回合開始、播放開始、開估、下一題會在題目卡內顯示短暫玻璃質感 cue，並把底下內容淡出。第十輪已加答案展示倒數 ring：主持同步 `revealAutoNextEndsAt` / `revealAutoNextDelayMs`，手機答案卡右上角顯示 5 秒 ring 倒數。第十一輪已把開估答案展示接上手機音訊延遲：主持自動下一題會等待 `remoteAudioLatencyMs + 5 秒`，手機到最後 5 秒才顯示答案卡和倒數 ring。第十二輪已加 `phoneRevealBridge`：在延遲期間顯示「同步聲音中」玻璃卡、聲波和進度條，不爆答案，過渡到最後 5 秒答案卡。第十三輪已加答案揭曉 micro-interaction：`is-answer-revealing` 答案卡進場、光帶掃過、倒數圈彈入、題目卡 bloom 和一次短觸感 pulse。第十四輪已打磨手機答題手感：選項按下/確認 class、光帶掃過、冷卻鎖定樣式和冷卻卡進場。第十五輪已加 `phoneAnswerGate`：7 秒補償期間顯示答題準備卡、聲波、倒數 badge 和同步進度條，並暫時收起重複的 `phoneResult` 文字。第十六輪已重做排行榜 modal：top 3 podium、冠軍 hero、分組進度、排名分數 meter、自己玩家高亮和 podium/list 動效。第十七輪已重做加入頁 onboarding：房間 pill、玩家預覽卡、名字 avatar、三格流程狀態、輸入即時預覽和加入按鈕光帶動效。

2026-06-02 最新自動場控改動：`app.js` 加入 `handleRosterAutomation()`，有玩家首次加入空場會自動 `startRound(null, { autoplay: true })`；所有玩家離開後會自動 `resetGameSession({ skipConfirm: true, reason: "empty-room" })`，清走分數、題目、已玩紀錄和玩家名單。每題開始時用 `currentQuestionEligiblePlayerIds` 記錄當時在線玩家；中途加入者 `buildPlayerState()` 會收到 `answerEligible: false` / `waitingForNextQuestion: true`，手機顯示等下一首，主持端亦會拒絕當題答案。

2026-05-31 已加入並 live 驗證多房間 URL 模式：主持頁、玩家 QR / 連結、投影連結和 Firebase room key 都跟該房間分開。同一瀏覽器開不同房間不會互相接管。GitHub Pages 已驗證 `codex-room-a` / `codex-room-b` 分別產生不同玩家連結和 Firebase meta，測試房已清理。

2026-05-31 已在 GitHub Pages 正式網址 `index.html?test=choice-auto-1` 驗證四選一自動流程：在線玩家全數選擇後會自動開估，5 秒後自動播放下一題。測試用 Firebase 玩家與事件已清理。

2026-05-20 已開始把程式改向三環節團契版：

- 主持頁有 60 / 30 / 15 秒播放設定。
- 主持頁播放 iframe 平時靜音，只作預覽 / 跳廣告；當主持用「廣播電腦/分頁聲音」時，程式會嘗試 unmute 當前 YouTube iframe / 本地媒體，讓桌面瀏覽器的分頁音訊可被分享。最新 B1 全球手機模式下，玩家手機不再自己播 YouTube。
- 可選投影畫面會收到 `end` 和 `playEndsAt`，用作倒數和停止播放。
- 手機加入時不再自選 A/B 組；主持頁會按現有人數自動平均分配，主持仍可在主持頁手動調組。
- 主持頁已有主題搶唱模式和 A/B 組分數。
- 主持頁已有「停止」按鈕。
- 快選估歌 / 主題搶唱需要主持按「開放快選 / 搶唱」才可讓手機按鈕生效。快選估歌不再開咪或由主持人工判定；一有人撳中，系統顯示「XXX 已估中」和文字答案 5 秒，然後自動下一題。
- 主持頁右欄已改成玩家狀態優先，題庫管理預設收起。
- 主持頁已有「分數重置」按鈕，可清分數、組分、題目、答案和搶答狀態，但保留題庫、固定房間、QR 和玩家。
- 可選投影畫面排行榜已改成「分數結算」畫面，先顯示 A/B 組戰況，再顯示個人榜；手機排行榜已移入彈窗，彈窗內保留 A/B 組分數摘要。
- 主持頁已有「公布勝方」按鈕，可選投影畫面會切到分組勝方全屏畫面；「公布勝方」和「排行榜」互斥顯示。
- 開新題、播放、重新開放快選 / 搶唱或分數重置時，會退出完場公布畫面。
- 投影畫面 QR code 已改成本地生成：`display.html` 先載入 `local-qr.js`，`display.js` 用 `window.createLocalQrCodeDataUrl()` 產生 SVG data URL，不再依賴 `api.qrserver.com`。
- 手機端已有自動重連；主持頁會用玩家 ID 保留分數，並在同名玩家離線時接回舊資料。同名仍在線時，新加入者會顯示為「名字（2）」。
- 主持頁玩家欄有「複製玩家連結」按鈕，房間建立後可用。
- 主持頁玩家列表已有 A/B 組下拉選單，可即時改組並同步手機 / 投影；離線玩家可用「移」按鈕清走。
- 主持頁按「開估」後不播放完整歌曲，只同步文字答案 5 秒：display / player state 會是 `revealed: true`、`isPlaying: false`、`fullPlayback: false`，之後自動下一題播放。
- 主持頁按「下一題播放」會執行 `startRound(null, { autoplay: true })`，一按抽題、自動播放和開始倒數。
- 開估流程統一用 `revealCurrentSongThenAutoNext()`：停止當前片段，不播完整歌曲，只顯示文字答案 5 秒，然後用 `choiceAutoNextTimer` 執行 `startRound(null, { autoplay: true })`。四選一全員答完、快選答中、主持手動開估都走這個流程。
- 估歌期間不可直接露出 YouTube 縮圖 / 歌名。`display.js` 會在未開估但有歌曲時加 `stage-mask.is-prep-cover`，`styles.css` 只留右下角小窗給主持處理廣告，其餘畫面用實色遮住。
- 主持頁已有播放起點設定：`playStartMode` 可為 `beginning` 或 `random`。每題在 `startRound()` 設定 `currentClipStart`；重播同一題沿用同一段。`fullPlayback` 時投影 start 固定回到 0。
- 已支援本地 / 已授權媒體檔：`audioUrl` 欄位保留舊名，但可填 `./audio/*.mp3`、`./audio/*.m4a` 或 `./video/*.mp4` 等。`app.js` 和 `display.js` 會按副檔名自動用 `<audio>` 或 `<video>` 播放；主持頁本地媒體預設靜音，投影畫面負責出聲。
- 手機端已有「開咪對話」：`player.js` 用 `navigator.mediaDevices.getUserMedia({ audio })` 和 `state.peer.call(currentRoomId(), stream)` 傳到主持頁；`app.js` 用 `state.peer.on("call")` 接收。
- 手機咪已會轉發到投影畫面：`app.js` 收到 `player.micStream` 後用 `state.peer.call(displayPeer, stream, { metadata: { type: "display-player-mic" } })` 轉發給所有 `displayConnections`；`display.js` 用 `peer.on("call")` 接收並在 `.stage-mic-layer` 播放。投影如被瀏覽器擋自動播放，會顯示音訊控制列供主持點一下。
- 投影畫面已加入玩家狀態名單：`buildDisplayState()` 會傳 `players`，每個 player 包含 `connected` / `micActive`；`display.js` 用 `#stageRoster` 顯示已加入玩家、A/B 組、分數、離線和開咪狀態。手機開咪 / 收咪時要 `publishDisplayState()`，否則投影名單不會即時更新。
- 手機端入房流程已改為「輸入名字即加入手機版房間」，不再顯示「在現場 / 不在現場」選擇。`player.js` 預設 `remoteMode: true` 並把所有玩家當遠距手機玩家；手機不再自己播 YouTube，只收聽主持透過 WebRTC 廣播的音訊。桌面 Chrome / Edge 優先用 `getDisplayMedia` 分享播放 YouTube 的分頁音訊；「用咪高峰收聲」只作後備。
- Firebase 設定檔是 `firebase-config.js`，目前已填入 `guess-song-260531` config 並 `enabled: true`。如日後要關掉 Firebase，可改回 `enabled: false`，現有 PeerJS / 本機玩法仍會照常運作。設定方法見 `docs/FIREBASE_SETUP.md`。
- 主持頁右側玩家區已直接顯示「掃碼加入」QR code，手機全球版不需要先開 `display.html` 才能讓玩家掃碼。`buildPlayerUrl()` 不再把 `v` 參數加到玩家連結，避免本地 QR 產生器因 GitHub Pages 長網址超出長度限制；三個 HTML 入口仍用 script query 版本做快取更新。
- `app.js` 的 player state 仍保留 `mediaPlaying`、`videoId`、`audioUrl`、`start`、`end` 等欄位作相容；最新手機玩家不使用這些欄位播放 YouTube，只用題目狀態、快選估歌和分數同步。四選一 / 快選歌名選項仍只在正式播放或主持開放快選、且未開估時送給手機。
- 遠端投影已支援：主持頁有 `displayConnections`，`display.html?room=...` 會送 `display-join`，主持頁用 `display-state` 推送 `buildDisplayState()`。這是 optional，不是手機全球版主流程。
- 投影畫面不再有 `#stageSoundButton` 或 `soundUnlocked` 流程；`display.js` 預設投影就是有聲播放，YouTube iframe 不加 `mute`，並保持 `autoplay=1`、`controls=0`。
- 預設房間 ID 是 `soyingpang-guess-song-fellowship-room`，由 `DEFAULT_ROOM_ID` 控制；自動分房會加 `-2`、`-3` 等後綴，最多檢查 `AUTO_ROOM_MAX_CANDIDATES`。主持頁可用 `?room=custom-room` 開指定場。不要再用 `makeRoomId()` 或 random room 作為預設。
- 介面已做多輪美化。手機入口和主持入口最新 cache version 是 `premium-mobile-32`，投影入口是 `mobile-delay-1`。三個入口頁都載入 `assets/worship-crest.svg`；背景和遮罩使用 `assets/fellowship-main-visual-manhwa.png`、`assets/fellowship-pattern.svg`、`assets/home-fellowship-scene.svg`、`assets/warm-fabric-pattern.svg`、`assets/string-lights.svg`、`assets/soft-garland-corners.svg`、`assets/paper-grain.svg`。手機頁另外用 `assets/home-fellowship-scene.svg` 做暖色團契主視覺卡。本機 `server.js` 已加入 `.svg`、`.mp4`、`.m4v`、`.mov`、`.ogv`、`.webm`、`.webmanifest` MIME type。PWA 外殼檔案包括 `manifest.webmanifest`、`pwa.js`、`sw.js`、`assets/app-icon.svg` 和 PNG icon。
- 最新美術方向是「都會團契的家 / 韓式漫畫手繪主視覺 / 明亮暖白紙卡 / lounge 活動套件」：城市窗景、暖燈、木桌、詩歌本、杯、植物、結他、柔和燈串、花葉角落和紙卡質感。用戶明確不想要黑色風格，所以不要再用大片黑底或黑色 overlay。投影遮罩仍必須是實色，不可改回半透明，也不要退回只靠簡單 SVG 圖示裝飾。

仍要留意：程式曾在較早版本做過「後台有聲 / 全首播放」，如見到舊文件或舊 commit，不要當成最新需求。

## 最新場控方向

用戶已確認：

- 不想被固定題數限制。
- 不要做「每個環節必須玩幾題」或「自動完場」作為主流程。
- App 應是主持自由場控：幾時玩哪個環節、玩幾多題、幾時顯示排行榜，都由主持頁手動控制。
- 播放秒數 60 / 30 / 15 可每題前自由切換。
- 播放起點可每題前自由切換：由頭播或隨機中段。
- 最新 YouTube 手機全球流程是「下一題播放」一按抽題並自動播放 / 倒數；如果有廣告，主持在主持頁預覽或 YouTube 播放裝置上處理。
- 手機四選一選項只應在正式播放中顯示；`buildPlayerState()` 不在非播放狀態送選項，`handleChoiceAnswer()` 亦會拒絕未正式播放時的答案。
- 手機開咪應可在投影畫面聽到；主持頁仍接收原始 stream，並轉發到 display peer。現場仍要留意喇叭與手機距離，避免回音 / 嘯叫。
- 外地投影同步靠 PeerJS 房間碼，不靠 localStorage；主持頁必須保持開住。
- 主持頁預設自動分配房間碼；如 URL 帶 `room`，該場使用該自訂房間碼。「分數重置」只清場次資料，不踢走玩家或換 QR。
- 前台畫面不再要求玩家/觀眾按「啟用聲音」。但個別遠端瀏覽器仍可能阻擋有聲 autoplay；這是瀏覽器政策，不應重新加可見聲音按鈕，除非用戶再改規格。
- 前台不顯示四選一歌名選項。`buildDisplayState()` 對 display state 傳 `choices: []`，`display.js` 在 `choice` mode 不 render `stage-choice` 歌名；手機端 `buildPlayerState()` 仍正常提供四選一選項。
- 主持頁已整理排版：普通桌面保留大影片預覽，超寬畫面才用影片與控制列並排；右側玩家/題庫是 sticky 卡片分組，底部 `result-bar` 改成淺色紙卡以提高可讀性。
- 前台 QR 必須保留。`display.js` 已加入 `DEFAULT_ROOM_ID` / `qrRoomId` fallback，`renderWaiting()` 會顯示玩家 QR，不再 hidden；即使尚未收到後台 `display-state`，仍會用目前房間生成 `player.html?room=...`。
- 主持頁不應作答。`index.html` 將 `guessForm` 和 `choices` 預設 hidden；`app.js` 不再綁定主持頁 guess submit，`renderChoices()` 只會清空並隱藏主持頁選項。手機端仍由 `buildPlayerState()` 取得四選一選項。
- 手機四選一同步有保險：`ensureChoiceOptions(song)` 會在送 player state 前補回 `currentChoices`；`player.js` 如收到空選項會顯示「選項同步中」。如同一房間 ID 被另一個主持頁佔用，`isRoomBlocked()` 會鎖住出題/播放/開估等主持控制，避免手機連到另一個主持頁但眼前主持頁仍可操作。
- 第三環節已由「一字搶唱」改為「主題搶唱」：不要再抽太冷門的單字，內置題庫應以平安、恩典、愛、信、盼望、喜樂、讚美、耶穌、十架、救恩等大路關鍵詞為主，讓非專業團友更容易即場唱到。
- 手機頁已做 compact：加入後品牌區會收起，排行榜不再常駐頁面，只由「排行榜」按鈕開彈窗，主畫面留給題目、選項、快選估歌 / 搶唱和狀態。
- 玩家名字必須由玩家在手機首次進入 game 時自己輸入；`player.js` 不應再用 localStorage 舊名字自動加入，避免測試名殘留。可以保留同一手機的 player ID 用作重連，但不能跳過名字輸入表單。
- 最新全球手機方向是 B1：主持用 YouTube Premium 播歌，App 不讓玩家手機各自播 YouTube。桌面主持優先用瀏覽器分頁音訊分享把播放聲送給玩家手機；不支援分頁音訊時才用主持裝置咪高峰收聲。這避免每部玩家手機自己播 YouTube、廣告不同步和 YouTube Premium 共用風險。

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

## GitHub 同步規則

用戶已確認：每一次有實質更新，都應即時同步到 GitHub。

固定流程：

1. 完成程式或規格修改。
2. 用香港時間更新 `docs/UPDATE_LOG.md`。
3. 如影響玩法或交接狀態，同步更新 `docs/GAME_PLAN.md` / `docs/AI_HANDOFF.md`。
4. 跑必要檢查，例如 `node --check`、`git diff --check`、Browser sanity check。
5. `git add`、`git commit`、`git push` 到 GitHub。
6. 如因認證、網絡或遠端衝突無法 push，必須清楚告知用戶目前只在本機，未同步 GitHub。
