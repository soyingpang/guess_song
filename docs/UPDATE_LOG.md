# 更新記錄

本文件記錄每次重要討論、規格改動、程式改動和部署狀態。之後每次更新都應在最上方新增一段，使用香港時間。

格式：

```text
## YYYY-MM-DD HH:mm HKT

類型：規格 / 程式 / 題庫 / 設計 / 部署 / 修正

摘要：
- ...

影響：
- ...

後續：
- ...
```

---

## 2026-05-20 21:11 HKT

類型：程式 / 播放流程 / YouTube 廣告

摘要：
- 按用戶最新要求，取消「前台預備 → 正式開始」兩步流程，改回一按自動播放。
- 後台「前台預備」改為「下一題播放」：按下即抽題、載入前台、嘗試自動播放並開始倒數。
- 「正式開始」按鈕改回「重播片段」，用於同題再播。
- 保留防穿答案遮罩：估歌期間即使正在播放，也用實色遮住 YouTube 大部分畫面，只留右下角小窗給主持手動處理廣告。
- cache version 更新至 `youtube-autoplay-1`，並同步更新 `README.md`、`docs/GAME_PLAN.md`、`docs/AI_HANDOFF.md`。

影響：
- 現場操作回到一鍵出題播放；如果有廣告，主持最多在 MON2 的右下角小窗手動處理。
- 手機四選一仍只在播放中顯示，未播放 / 停止狀態不能偷答。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認：按「下一題播放」後，後台 iframe 使用 `autoplay=1`，按鈕變「播放中」。
- Browser 本機確認：前台 `display.html` 進入 `is-playing`，倒數顯示「播放中」，iframe 使用 `autoplay=1`；遮罩仍有 `stage-mask.is-prep-cover`，大畫面被實色遮住，只留右下角操作窗，無 console error。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-20 21:02 HKT

類型：修正 / 前台預備遮罩 / 手機答題

摘要：
- 修正「前台預備」直接露出 YouTube 縮圖 / 歌名，令未開始估已經穿答案的問題。
- 前台預備時仍會載入 iframe，但 `display.js` 會保留遮罩並加上 `stage-mask.is-prep-cover`；`styles.css` 用實色遮住大部分影片，只留右下角小窗給主持處理廣告。
- 手機四選一選項改為正式播放後才顯示；預備階段顯示「前台預備中，等主持正式開始」。
- 後台 `handleChoiceAnswer()` 會拒絕未正式播放時送來的答案，避免玩家在預備階段偷答。
- cache version 更新至 `youtube-prep-2`。

影響：
- 現場仍可在 MON2 處理廣告，但觀眾不會在預備階段看見 YouTube 歌名 / 縮圖中央答案。
- 玩家手機要等主持按「正式開始」後才見到四選一選項。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認：前台預備狀態有 `stage-mask.is-prep-cover`，`#stagePlayerHost` 未被移走，iframe 已載入，但 `#stageMask` 沒有 `is-hidden`；遮罩 pseudo-element 用實色 box-shadow 覆蓋大部分畫面，只留右下角小窗。
- Browser 本機確認前台無 console error。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-20 20:50 HKT

類型：程式 / YouTube 預備流程 / 現場操作

摘要：
- 按用戶最新決定，保留 YouTube 作現場折衷方案，新增「前台預備 → 正式開始」流程。
- 後台「下一題」改為「前台預備」：抽題並把 YouTube 載入前台，但不開始倒數。
- 前台預備狀態會顯示播放器和控制列，方便主持在 `MON2` 手動處理 / 跳過廣告。
- 後台「前台播放」改為「正式開始」：按下後才開始 60 / 30 / 15 秒播放和倒數。
- `display.js` 會盡量沿用已預備的 YouTube iframe，用 `enablejsapi=1` 和 `postMessage` 發 `seekTo` / `playVideo`，避免正式開始時重新載入一次廣告。
- 更新 cache version 至 `youtube-prep-1`，並同步更新 `README.md`、`docs/GAME_PLAN.md`、`docs/AI_HANDOFF.md`。

影響：
- 現場流程變成：主持按「前台預備」→ 在 MON2 處理廣告 → 回後台按「正式開始」。
- 未正式開始前不會計時；真正計時只在「正式開始」後發生。
- 21:02 已再修正：前台預備不可直接露出 YouTube 歌名 / 縮圖，只應留右下角小範圍處理廣告。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認：按「前台預備」後，後台狀態顯示「前台已預備」，YouTube iframe 使用 `autoplay=0`、`controls=1`；按「正式開始」後，後台狀態變「前台播放中：30 秒 · 由頭播」，按鈕變「播放中」並開始倒數。
- Browser 本機確認：前台 `display.html` 在預備 / 播放狀態都會顯示播放器而非遮住 iframe，播放狀態有 `is-playing`，無 console error。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-20 17:45 HKT

類型：程式 / 本地影片 / 交接

摘要：
- 回應「想有畫面」需求，加入本地 / 已授權影片檔播放支援。
- 保留 `audioUrl` 欄位作舊題庫相容，但現在可填 `./audio/song.mp3` 或 `./video/song.mp4`；`app.js` 和 `display.js` 會按副檔名自動使用 `<audio>` 或 `<video>`。
- 後台本地音訊 / 影片維持靜音預覽，前台負責出聲；MP4 / M4V / MOV / OGV / WEBM 會以影片方式顯示。
- 新增 `video/README.md`，說明授權影片應放在 `video/`；更新 `audio/README.md`、`README.md`、`docs/GAME_PLAN.md` 和 `docs/AI_HANDOFF.md`。
- 本機 `server.js` 加入影片 MIME type，cache version 更新至 `local-video-1`。

影響：
- 如果想大螢幕有畫面，可把已授權影片放入 `video/`，主持題庫欄填 `./video/song-name.mp4`。
- 仍然要確保教會有使用 / 播放授權，影片內容未開估前也不應露出歌名或字幕答案。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認主持頁新增 `./video/sample.mp4` 題目後，`#playerHost` 會建立 `VIDEO` 元件且保持靜音；前台 `display.html` 的 `#stagePlayerHost` 亦會建立 `VIDEO` 元件，無 console error。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-20 16:26 HKT

類型：修正 / 手機加入 / 交接

摘要：
- 修正手機玩家頁不應自動用瀏覽器舊名字加入的問題。
- `player.js` 仍保留玩家自己輸入名字的原有流程，但不再從 `localStorage` 讀舊名字後自動 `joinGame()`。
- 玩家打開 QR 連結時會先停在名字輸入畫面，狀態顯示「請輸入名字加入」。
- 保留同一手機的 player ID，用於玩家輸入名字後接回原本分數 / 組別；但不再跳過名字輸入表單。
- 更新 cache version 至 `player-name-entry-1`。
- `docs/AI_HANDOFF.md` 補充規則：玩家名字必須由玩家在手機首次進入 game 時自己輸入，不可由後台代輸入，也不可因舊 localStorage 測試名自動入場。

影響：
- 測試手機或同一瀏覽器曾用過的 `Sunny` / `測試` 等舊名字不會再自動加入。
- 玩家進場行為回到用戶要求：第一下入 game 先自己輸入名字。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認 `player.html` 載入 `player-name-entry-1`，名字輸入表單沒有 hidden，名字欄為空，狀態顯示「請輸入名字加入」，無 console error。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-20 16:17 HKT

類型：流程 / 交接 / GitHub 同步

摘要：
- 確認固定工作規則：每次有實質更新，都要即時更新文件、提交 commit，並 push 同步到 GitHub。
- `docs/AI_HANDOFF.md` 新增「GitHub 同步規則」，列明更新文件、跑檢查、commit、push 的固定流程。
- 若日後因認證、網絡或遠端衝突未能 push，必須明確告知用戶目前只在本機，未同步 GitHub。

影響：
- 下一個 AI 或開發者可以直接按交接文件接手，不會只把改動留在本機。
- 更新記錄會繼續按香港日期時間放在最上方。

測試：
- 文件流程更新，無程式邏輯改動。

後續：
- 本次手機 compact、主題搶唱、自動分組等改動會一併 commit 並 push 到 GitHub。

---

## 2026-05-20 16:12 HKT

類型：介面 / 手機 / 分組公平

摘要：
- 手機頁加入後改成 compact 版：品牌區收起，狀態、分數、咪高峰和題目區壓縮，盡量一頁看完主要操作。
- 手機排行榜不再常駐頁面，改由「排行榜」按鈕打開彈窗；彈窗內保留 A/B 組分數摘要和個人榜。
- 手機加入表單移除 A/B 組選擇，改提示「系統會自動平均分 A/B 組」。
- 後台收到新玩家加入時會自動派到人數較少的一組；A/B 人數相同時隨機分配。玩家重連或同名離線接回時保留原組。
- 主持後台仍保留玩家列表的 A/B 下拉選單，可按現場需要手動微調。
- 更新 cache version 至 `mobile-compact-teams-1`。

影響：
- 手機主畫面更集中在答題、搶答 / 搶唱和開咪，不被排行榜長列表拖長頁面。
- 第三環節分組比玩家自行揀組更公平，尤其是現場有人遲加入或同一批朋友想坐同組時。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 以 390 × 844 手機 viewport 檢查 `player.html`：確認已載入 `mobile-compact-teams-1`、沒有 A/B 組 select、排行榜在彈窗、彈窗可開關，無 console error。

後續：
- 真機測試時可再按 390px 闊、短螢幕手機微調四選一按鈕高度。

---

## 2026-05-20 16:03 HKT

類型：規格 / 程式 / 現場玩法

摘要：
- 第三環節由「一字搶唱」改成「主題搶唱」，避免題目太難或太考專業詩歌知識。
- 內置題庫改為大路主題 / 關鍵詞，例如平安、恩典、愛、信、盼望、喜樂、讚美、耶穌、十架、救恩等。
- 後台文案改為「主題 / 關鍵詞」、「抽主題」、「開始主題」，輸入長度放寬至 8 字。
- 前台和手機文案同步改成主題搶唱；前台提示改為唱出切合主題的詩歌。
- 手機四選一選項補上序號和標題樣式，方便玩家掃描選項。
- 更新 cache version 至 `topic-sing-1`。

影響：
- 非專業團友更容易即場唱到歌，第三環節會較像團契互動，而不是考試。
- 仍然保留 A/B 組搶唱、主持判定、答中組別加分的流程。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認後台 / 手機 / 前台入口載入 `topic-sing-1`，無 console error；目前固定房間被另一個後台佔用，所以未能在瀏覽器直接點擊主持控制。

後續：
- 如現場仍覺得難，可以再把主題庫縮窄到更常唱的 10 至 15 個，例如平安、恩典、愛、信、讚美、耶穌、十架、救恩、喜樂、感謝。

---

## 2026-05-20 15:08 HKT

類型：修正 / 手機同步 / 固定房間

摘要：
- 修正手機四選一保險邏輯：`buildPlayerState()` 送手機前會用 `ensureChoiceOptions()` 確保四選一題有選項。
- 手機端如暫時未收到選項，會顯示「選項同步中」提示，而不是空白。
- 後台如果發現固定房間已被另一個後台佔用，會清楚提示並鎖住播放、下一題、開估、模式等主持控制。
- 避免出現「眼前後台在播，但手機其實連到另一個後台」的不同步情況。
- 更新 cache version 至 `sync-choice-room-lock-1`。

影響：
- 手機端四選一選項會保留。
- 同一時間只允許一個後台真正控制固定房間；其他誤開的後台不能繼續出題。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若手機顯示等候題目但後台正在播，先看後台右側房間狀態；如顯示另一個後台已開，關閉多餘後台後重新整理主持頁。

---

## 2026-05-20 14:55 HKT

類型：修正 / 後台 / 作答流程

摘要：
- 後台不再提供估歌作答功能。
- 移除後台文字估歌表單的 submit handler。
- 後台四選一選項不再顯示，也不再建立可點擊的 `choice-button`。
- HTML 預設把後台 `guessForm` 和 `choices` 設為 hidden，避免載入期間短暫露出。
- 手機端四選一和作答流程不受影響。
- 更新 cache version 至 `host-no-guessing-1`。

影響：
- 主持後台只負責播放、開估、提示、搶答判分和下一題。
- 玩家只在手機端作答，避免主持畫面被誤用成答題端。

測試：
- Browser 本機按「下一題」後，確認後台沒有四選一選項卡片。
- Browser 本機確認手機端仍由 player state 收到四選一選項。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若主持需要查看手機端選項，可另做一個只讀「手機預覽」區，但不應可作答。

---

## 2026-05-20 14:47 HKT

類型：修正 / 前台 QR / 玩家加入

摘要：
- 修正前台等待同步時 QR code 會消失的問題。
- `display.js` 加入固定房間 fallback：即使未收到後台 `display-state`，仍用 `soyingpang-guess-song-fellowship-room` 生成玩家手機 QR。
- `renderWaiting()` 不再隱藏 QR panel，而是顯示可加入固定房間的玩家連結。
- `renderQr()` 在沒有 `playerUrl` 時會自動建立 fallback player URL。
- 更新 cache version 至 `front-qr-always-1`。

影響：
- 前台右下角 QR code 會保留，玩家可以照樣掃碼加入。
- 後台同步、前台播放、手機答題邏輯不受影響。

測試：
- Browser 本機打開 `display.html?room=soyingpang-guess-song-fellowship-room`，確認 QR panel 沒有 hidden。
- Browser 本機確認 QR 連去 `player.html?room=soyingpang-guess-song-fellowship-room`。
- `node --check display.js`

後續：
- 若之後仍要開多房間，前台連結必須帶 `room` query；沒有 query 時會用固定房間作預設。

---

## 2026-05-20 14:38 HKT

類型：設計 / 後台排版 / 主持介面

摘要：
- 整理後台主持頁排版，令頂部按鈕和分數區更整齊。
- 右側玩家和題庫區改成清楚的卡片分組，桌面版保持 sticky 側欄。
- 普通桌面寬度保留大型影片預覽，避免主持手動處理 YouTube 廣告時畫面太細；超寬畫面才切換成影片與控制列並排。
- 底部狀態列改成淺色紙卡，提高「播放中 / 開估 / 答案」文字可讀性。
- 更新 cache version 至 `backend-layout-cleanup-1`。

影響：
- 後台更像主持控制台，主控、玩家、題庫分區更清楚。
- 前台和手機端功能邏輯沒有改動。

測試：
- Browser 本機檢查後台初始狀態。
- Browser 本機檢查按「下一題」後的四選一後台狀態。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若仍覺得主持頁太長，可再把播放設定收成一個「難度設定」小區塊。

---

## 2026-05-20 14:19 HKT

類型：程式 / 前台介面 / 四選一流程

摘要：
- 前台大螢幕不再顯示四選一歌名選項。
- `app.js` 的 display state 改為不傳四選一歌名：`choices: []`。
- `display.js` 在 `choice` mode 不再 render `stage-choice` 歌名卡片，即使舊 state 有選項也不會顯示。
- 手機端四選一不受影響，玩家仍然在手機看到 4 個選項並作答。
- 更新 cache version 至 `front-hide-choice-names-1`。

影響：
- 前台畫面不會出現像可點擊按鈕的歌名卡片，避免觀眾誤會可以在大螢幕互動。
- 前台更專注於「聽歌、看狀態、看答案/排行榜」，手機才是答題介面。

測試：
- Browser 本機打開前台頁面，確認前台沒有殘留舊的歌名選項卡片。
- 程式碼檢查：display state 不再傳四選一歌名，player state 仍保留四選一選項。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若需要，可在前台用非按鈕樣式顯示「請用手機作答」提示，但不要顯示歌名。

---

## 2026-05-20 14:08 HKT

類型：設計 / 主視覺 / 韓式漫畫手繪風

摘要：
- 按用戶要求，把主視覺改向韓式漫畫 / webtoon 手繪感。
- 用 imagegen 生成新的 project-bound raster asset：`assets/fellowship-main-visual-manhwa.png`。
- 新主圖保留教會團契、暖光客廳、詩歌本、結他、城市窗景和溫馨家的感覺，但線條和上色改成更精緻的韓式漫畫手繪風。
- CSS 改為引用新主圖，舊主圖 `assets/fellowship-main-visual.png` 保留作備份。
- 更新 cache version 至 `korean-manhwa-ui-1`。

影響：
- 前台遮罩、手機背景、後台背景都會使用新的漫畫風主視覺。
- 仍保持暖色團契方向，不回到黑色風格。

測試：
- Browser 本機檢查後台、前台、手機三個入口載入新主圖。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若要再精修，可做第二張更近似活動海報封面的版本，用於開場 / 公布勝方畫面。

---

## 2026-05-20 13:52 HKT

類型：設計 / 色彩方向 / 介面美化

摘要：
- 按用戶要求把整體由黑色風格改向更溫馨的團契活動感。
- 新增 warm fellowship theme override：暖白紙面、玫瑰木、鼠尾草綠、燭光金和淺木色成為主要視覺。
- 前台、後台、手機端都減少黑色 overlay，改用明亮紙卡、暖光和柔和插畫背景。
- 前台 YouTube 遮罩仍是完整覆蓋，不會透出影片標題或縮圖，但不再是黑沉風格。
- 更新 cache version 至 `warm-fellowship-ui-1`。

影響：
- 畫面更像教會團契 / 家中客廳活動，而不是夜店、電競或黑色舞台。
- 投影和手機仍保留高對比大字，避免因為變暖色而影響可讀性。

測試：
- Browser 本機檢查後台、前台、手機三個入口的新暖色畫面。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若仍覺得太深，可再生成一張日間 / 黃昏版本主視覺，讓背景本身更明亮。

---

## 2026-05-20 13:45 HKT

類型：程式 / 前台播放 / 介面簡化

摘要：
- 移除前台可見的「啟用聲音」按鈕。
- `display.js` 移除 `soundUnlocked` 和 `renderSoundButton()` 流程。
- 前台預設就是有聲播放模式：YouTube iframe 不加 `mute`，播放時仍用 `autoplay=1`。
- YouTube iframe 保持 `controls=0`，避免前台出現多餘播放器控制。
- 更新 cache version 至 `front-auto-sound-1`。

影響：
- 前台大螢幕更像正式活動畫面，不需要主持或觀眾多按一粒聲音按鈕。
- 若個別遠端瀏覽器仍硬性阻擋有聲 autoplay，屬瀏覽器政策；app 不再在畫面上提供額外「啟用聲音」流程。

測試：
- Browser 本機檢查前台沒有 `#stageSoundButton`。
- Browser 本機檢查前台載入 `display.js?v=front-auto-sound-1`。
- `node --check display.js`
- `node --check app.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若現場仍遇到個別瀏覽器阻擋聲音，優先用同一部電腦的前台視窗播放；不要輕易把可見聲音按鈕加回來。

---

## 2026-05-20 13:34 HKT

類型：設計 / 主視覺 / 介面美化

摘要：
- 用 imagegen 生成一張真正的主視覺插畫：都會團契客廳、暖燈、詩歌本、結他、城市夜景和桌面敬拜氣氛。
- 新增 project-bound raster asset：`assets/fellowship-main-visual.png`。
- 前台播放遮罩改用這張主視覺做完整海報式畫面，不再只是簡單 SVG 圖案或小裝飾。
- 手機端和後台背景也改成延伸同一張主視覺，令三邊畫面更像同一套活動視覺。
- 保留實色遮罩原則：前台遮罩仍然是完整實色畫面，不會透出 YouTube 標題或縮圖答案。
- 更新 cache version 至 `fellowship-art-ui-1`。

影響：
- 視覺方向由「加裝飾」提升到「完整活動主圖 / poster art direction」。
- 手機端更有家的感覺，前台更像團契活動主視覺。

測試：
- Browser 本機檢查後台、前台、手機三個入口可載入新圖和新 cache version。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若仍想再提升，可再做第二張「答題 / 排行榜結算」專用插畫，令完場畫面更像正式活動投影片。

---

## 2026-05-20 13:23 HKT

類型：程式 / 房間流程 / 場控

摘要：
- 後台改為固定使用同一間房：`soyingpang-guess-song-fellowship-room`。
- 不再因為新一局或重新整理而隨機開新房，QR 和前台 / 手機連結會保持同一個房間碼。
- 後台按鈕由「本場重設」改為「分數重置」。
- 分數重置會清個人分、A/B 組分、當前題目、答案和搶答狀態，但保留房間、QR、玩家連線和題庫。
- 如果固定房間已被另一個後台佔用，後台會顯示提示，要求關閉其他後台再重新整理，不會偷偷產生新房間。
- 更新 cache version 至 `stable-room-reset-1`。

影響：
- 團契可以長期用同一個 QR / 同一條前台連結玩，不需要每次開新房。
- 開新一局時只需按「分數重置」，玩家不用重新掃碼加入。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機檢查後台可載入固定房間、顯示「分數重置」按鈕。

後續：
- 若日後想同時開多個不同聚會房間，可再加「進階自訂房間碼」，但預設仍應保持固定房間。

---

## 2026-05-20 10:46 HKT

類型：設計 / 介面精修

摘要：
- 再做一輪紙卡 / 桌面活動卡質感美化。
- 新增本地 SVG 素材 `assets/paper-grain.svg`，用於卡片、按鈕、QR 邀請卡和分數牌的微細紙感。
- 後台控制區加入更清楚的分區背景，令播放、模式、答案和組分更像一個主持控制台。
- 前台分數牌、選項、答案資訊和 QR 邀請卡加入紙卡層次和更柔和的高光。
- 手機端卡片、狀態、排行榜和選項按鈕加入紙感和更一致的暖色質感。
- 更新 cache version 至 `paper-card-ui-1`。

影響：
- 視覺更像完整活動套件，保持都會團契家的方向。
- 沒有改動玩法流程、題庫或同步邏輯。
- 前台遮罩仍維持實色，不會露 YouTube 答案。

已測試：
- 本機 Browser 檢查前台、後台、手機端新視覺。
- 本機 Browser console 無 error / warning。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若現場燈光較暗，可再略為提高前台 QR card 和題目文字亮度。

---

## 2026-05-20 10:41 HKT

類型：設計 / 介面精修

摘要：
- 再做一輪 lounge 風格美化，提升「都會團契客廳」完整度。
- 新增本地 SVG 素材 `assets/soft-garland-corners.svg`，作為柔和花葉角落和布邊層次。
- 後台、前台、手機端卡片加入更細緻的內框、花葉角落、暖光和層次陰影。
- 前台答案區加入柔和底線，令大螢幕資訊更有視覺秩序。
- 四選一選項、手機選項和排行榜卡片調整成更一致的暖色卡片質感。
- 前台 QR 邀請卡再精修，保留清楚掃碼焦點。
- 更新 cache version 至 `lounge-polish-ui-1`。

影響：
- 介面更接近完整活動視覺，而不是單純功能頁。
- 沒有改動玩法流程或同步邏輯。
- 前台遮罩仍維持實色，不會露 YouTube 答案。

已測試：
- 本機 Browser 檢查前台、後台、手機端新視覺。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若再調整，建議以真實投影距離測試字體大小和 QR code 可掃性。

---

## 2026-05-20 10:36 HKT

類型：設計 / 介面精修

摘要：
- 再做一輪「都會團契家的感覺」細節美化。
- 新增本地 SVG 素材 `assets/string-lights.svg`，加入柔和燈串和暖光。
- 前台、後台、手機端加入更細緻的卡片內框、燈光層次、按鈕掃光 hover、輸入框 focus 狀態。
- 前台 QR code 區改得更像邀請卡，加入虛線內框和更清楚的掃碼焦點。
- 前台遮罩保留實色遮答案，同時提升客廳場景層次。
- 手機端增加狀態 pill、卡片陰影和按鈕質感，減少壓迫感。
- 更新 cache version 至 `cozy-detail-ui-1`。

影響：
- 視覺更完整、更有活動設計感，但沒有改動遊戲流程。
- 全部素材仍是本地 SVG，GitHub Pages 可直接載入。

已測試：
- 本機 Browser 檢查前台、後台、手機端新視覺。
- 本機 Browser console 無 error / warning。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 若現場投影偏暗，可再把前台遮罩場景亮度提高少許。

---

## 2026-05-20 10:30 HKT

類型：設計 / 介面美化

摘要：
- 按「都會團契、溫馨、有家的感覺」方向再美化一次。
- 新增本地 SVG 素材：
  - `assets/home-fellowship-scene.svg`：城市窗景、暖燈、木桌、詩歌本、杯和植物的客廳團契場景。
  - `assets/warm-fabric-pattern.svg`：柔和布紋背景。
- 前台遮罩改成更像客廳聚會空間：實色底、城市窗景、暖燈光，不會看穿 YouTube。
- 後台和手機端加入更柔和的暖布紋、燈光和「家」的層次。
- 手機端背景改成帶客廳場景的深暖色卡片，減少冷冰冰 app 感。
- 更新 cache version 至 `home-fellowship-ui-1`。

影響：
- 前台更適合都會團契大螢幕：仍清楚、仍遮答案，但氣氛更像團契聚會。
- 新素材全部是本地 SVG，GitHub Pages 可直接載入，不需要外部圖片。

已測試：
- 本機 Browser 檢查前台、後台、手機端新視覺。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 可再用實際投影 / 電視尺寸微調場景濃淡和前台標題大小。

---

## 2026-05-20 10:19 HKT

類型：設計 / 介面美化

摘要：
- 前台、後台、手機端做一輪溫馨團契風格美化。
- 新增本地 SVG 素材：
  - `assets/worship-crest.svg`：詩歌本 / 敬拜 emblem。
  - `assets/fellowship-pattern.svg`：淡色教會窗格與樂譜線背景紋理。
- 三個入口頁加入同一個品牌圖示，令後台、前台、手機視覺一致。
- 調整色盤為深酒紅、燭光金、鼠尾草綠和暖白，減少冷冰冰控制台感。
- 強化前台遮罩為實色設計，不靠半透明遮住 YouTube。
- 美化手機端卡片、搶答按鈕、排行榜和開咪區。
- 更新 cache version 至 `warm-fellowship-ui-1`。
- 本機測試 server 加入 `.svg` MIME type，方便本機預覽素材。

影響：
- GitHub Pages 會直接載入本地 SVG 素材，不依賴外部圖片服務。
- 前台仍保留 QR code、啟用聲音、四選一和排行榜等既有流程。
- 視覺更貼近教會團契現場使用，而不是一般考試 / 控制台畫面。

已測試：
- 本機 Browser 檢查後台、前台、手機端載入新素材和新版 CSS。
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`

後續：
- 可再按現場投影尺寸微調字體大小和 QR code 位置。

---

## 2026-05-20 10:11 HKT

類型：修正 / 前台播放

摘要：
- 解釋並修正「用前台連結開出來的前台無聲」問題。
- 原因是遠端前台由主持後台隔空觸發 YouTube，有聲 autoplay 會被手機和不少電腦瀏覽器阻擋。
- 前台播放器加入「啟用聲音」按鈕。
- 外地朋友或用連結打開前台的人，進入前台後要先按一次「啟用聲音」。
- 按下後會重載目前片段嘗試播放；之後 YouTube iframe 會顯示控制列，若瀏覽器仍阻擋，可直接在影片內按播放。
- 更新 cache version 至 `display-sound-unlock-1`。

影響：
- 遠端前台仍可同步主持畫面，但聲音需要該前台裝置先做一次人手互動。
- 同一部電腦開前台也可按「啟用聲音」作保險。

已測試：
- `node --check display.js`
- `node --check app.js`
- `node --check player.js`
- `node --check local-qr.js`
- `git diff --check`
- 本機 Browser 檢查前台頁已加入 `stageSoundButton`，並載入 `display.js?v=display-sound-unlock-1`。
- 本機 Browser 驗證按「啟用聲音」後，YouTube iframe 由 `controls=0` 重載為 `controls=1`，並保留 `autoplay=1`。

後續：
- 現場提醒遠端前台：「一入前台先按啟用聲音」。這是瀏覽器限制，無法完全用程式繞過。

---

## 2026-05-20 10:01 HKT

類型：修正 / 遠端同步

摘要：
- 修正外地朋友直接開 `display.html` 只見到「等待同步」的問題。
- 原因是舊版前台只靠同一部電腦瀏覽器的 `localStorage` 同步；外地瀏覽器沒有主持後台的本機狀態。
- 後台現在會產生「前台連結」：`display.html?room=...`。
- 後台加入「複製前台連結」按鈕，方便傳給外地朋友。
- `display.html` 現在如帶 `room` 參數，會用 PeerJS 連到主持後台並接收 `display-state`。
- 同一部電腦的前台仍可用本機同步作後備。
- 更新 cache version 至 `remote-display-1`。

影響：
- 外國朋友要用「複製前台連結」取得的 URL，不能只開普通 `display.html`。
- 後台房間狀態會顯示已連接前台數量。
- 多個遠端前台可同時跟住主持後台更新。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `git diff --check`
- 本機檢查 `display.html` 已載入 PeerJS 和 `display.js?v=remote-display-1`。

後續：
- 現場/外地測試時，主持必須保持後台開住，外地朋友使用「複製前台連結」而不是手打普通前台網址。

---

## 2026-05-20 09:33 HKT

類型：程式 / 手機功能

摘要：
- 手機端加入「開咪對話」按鈕，玩家加入房間後可授權手機咪高峰。
- 玩家開咪後會用 PeerJS media call 把聲音傳到主持後台。
- 後台玩家列表會顯示「開咪中」，並出現可播放/控制的音訊元件。
- 後台可按「收咪」中斷玩家咪高峰。
- 手機端可按「關咪」自行停止，斷線或重連時會自動關咪。
- 更新 cache version 至 `phone-mic-1`。

影響：
- 搶答或一字搶唱時，玩家可直接用手機講答案，主持在後台聽到。
- 詩歌播放規則不變：歌曲仍以前台播放為主，後台歌曲 iframe 維持靜音。
- 開咪需要手機瀏覽器允許麥克風權限；GitHub Pages HTTPS 可支援。

已測試：
- `node --check app.js`
- `node --check player.js`
- `node --check display.js`
- `node --check local-qr.js`
- `git diff --check`
- 本機 Browser 檢查後台和手機頁載入 `phone-mic-1` 版本、手機有「開咪對話」按鈕，未見 console error。

後續：
- 現場測試時要用真手機授權咪高峰，確認音量、回音和場地喇叭擺位。

---

## 2026-05-20 09:22 HKT

類型：程式 / 播放流程

摘要：
- 後台加入「播放起點」選擇：`由頭播` / `隨機中段`。
- 選「由頭播」時，每題從 0 秒開始播放。
- 選「隨機中段」時，每題會抽一次中段起點，並按目前選好的 60 / 30 / 15 秒播放。
- 同一題重播會沿用同一個抽中的起點，避免同一題前後聽到不同片段。
- 開估後全首播放仍然從 0 秒開始，不受隨機中段影響。
- 更新 cache version 至 `start-mode-1`。

影響：
- 主持可以即場把難度分成「由頭聽前奏」或「直接聽中段」。
- 連續按「下一題」時會同時套用秒數設定和起點設定。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `git diff --check`
- 本機 Browser 確認後台有「由頭播 / 隨機中段」按鈕，並可載入新版 `app.js?v=start-mode-1`。
- 本機 Browser 驗證「60 秒 + 隨機中段 + 下一題」會令前台 iframe 的 `start` 大於 0、`end - start = 60`，並保留 `autoplay=1`。
- 本機 Browser 驗證「隨機中段 + 開估」仍會由 `start=0` 全首播放，且沒有 `end`。

後續：
- 若將來有完整歌曲長度資料，可把隨機中段改成按真正影片長度抽取更精準的中間區間。

---

## 2026-05-20 09:16 HKT

類型：程式 / 播放流程

摘要：
- 後台按「下一題」時，現在會即時抽下一首並自動開始前台播放。
- 自動播放會沿用主持目前選好的 `60 秒`、`30 秒` 或 `15 秒` 難度設定。
- 「開估」後全首播放的規則保持不變；下一題會重新回到限時估歌片段。
- 更新 cache version 至 `next-autoplay-1`。

影響：
- 主持不用再按「下一題」後再按「前台播放」，現場操作少一步。
- 適合連續出題：選好 60 / 30 / 15 秒後，每次按下一題就自動播相應秒數。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `git diff --check`
- 本機將播放秒數切到 60 秒後按「下一題」，確認前台 iframe 有 `autoplay=1` 和 `end=60`。

後續：
- 可再加一個「載入但不播放」的次要按鈕，給主持需要先預備 YouTube 廣告時使用。

---

## 2026-05-20 09:12 HKT

類型：程式 / 播放流程

摘要：
- 後台按「開估」時，會把前台狀態改成「開估，全首播放中」。
- 前台大螢幕會自動播放該首詩歌全首，不再受 60 / 30 / 15 秒估歌片段限制。
- 一般估歌播放仍然保留 60 / 30 / 15 秒設定和倒數停止。
- 手機端不會把開估後的全首播放當成手機播放狀態，維持只答題不播歌。
- 更新 cache version 至 `reveal-full-song-1`。

影響：
- 主持開估後不用再手動去前台按播放，可以即場讓全場聽完整首歌。
- 前台 YouTube iframe 在開估全首播放時不帶 `end` 參數；估歌片段播放時才帶 `end`。
- 後台仍是控制和預備用途；聲音主體仍以前台為準。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- 本機 Browser 驗證後台載入 `app.js?v=reveal-full-song-1`，沒有 console error。
- 本機 Browser 實測「下一題」後按「開估」：前台狀態顯示「開估，全首播放中」，iframe 有 `autoplay=1`，沒有 `end=`。

後續：
- 若要再提升現場穩定性，可加「前台播放確認 / 重新同步播放」按鈕，方便 YouTube 自動播放被瀏覽器攔截時補救。

---

## 2026-05-20 08:54 HKT

類型：程式 / 後台優化

摘要：
- 後台玩家列表加入組別下拉選單，主持可即場把玩家改到 A 組 / B 組。
- 改組後會即時同步到手機、前台排行榜和分組資訊。
- 後台玩家列表加入「移」按鈕，只可移除離線玩家。
- 若玩家仍在線，移除按鈕會 disabled，避免主持誤踢。
- 更新 cache version 至 `player-tools-1`。

影響：
- 團契現場可先讓玩家自行加入，再由主持按需要微調分組。
- 有人手機離線、重入或測試玩家殘留時，主持可以清走離線名單，玩家欄會乾淨好多。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `git diff --check`
- 本機 server 已重新啟動於 `http://127.0.0.1:5173/`。
- 本機瀏覽器確認後台載入 `app.js?v=player-tools-1`，沒有 console error。
- 本機 HTTP 檢查確認 `setPlayerTeam`、`removeOfflinePlayer`、`.mini-select`、`.player-actions` 已載入。

後續：
- 可加前台連線狀態提示，讓主持和全場知道手機房間是否穩定。
- 可加主持端玩家分數微調，用作人工補分或扣錯分修正。

---

## 2026-05-20 01:25 HKT

類型：程式 / 現場後備

摘要：
- 後台玩家欄加入「複製玩家連結」按鈕。
- 房間建立完成後按鈕才可使用。
- 複製成功時按鈕會短暫顯示「已複製」，並在後台狀態列提示可傳給團友。
- 如果瀏覽器不允許自動複製，會顯示手動複製視窗。
- 更新 cache version 至 `copy-link-1`。

影響：
- 團友如果掃不到 QR code，主持可以直接複製玩家加入連結，用 WhatsApp / AirDrop / 聊天工具傳給對方。
- QR code 仍然保留，這只是現場後備方案。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `git diff --check`
- 本機瀏覽器確認後台載入 `app.js?v=copy-link-1`。
- 本機瀏覽器確認「複製玩家連結」按鈕存在，且房間建立後不是 disabled。

後續：
- 可在後台加入手動踢走離線玩家 / 改組別。
- 可加前台連線狀態提示，讓主持更易判斷手機連線是否穩定。

---

## 2026-05-20 01:17 HKT

類型：程式 / 現場穩定性

摘要：
- 手機端加入自動重連：
  - 玩家已加入後，如果連線中斷，手機會倒數後自動嘗試重連。
  - 網絡離線時會顯示等待網絡恢復。
  - 手機回到前景時，如果未連線會嘗試恢復連線。
- 後台加入同名玩家處理：
  - 同一個手機 / 同一個玩家 ID 重連時，保留原本分數和答題記錄。
  - 如果同名玩家已離線，新連線會接回原本玩家資料。
  - 如果同名玩家仍在線，新加入者會自動顯示為「名字（2）」、「名字（3）」。
- 手機端會收到後台實際顯示名，若被加上序號，會顯示「已加入：名字（2）」。
- 更新 cache version 至 `player-reconnect-1`。

影響：
- 團友刷新手機頁、短暫斷線或返回頁面時，不容易失去分數。
- 現場有人輸入相同名字時，排行榜和主持玩家列表不會混淆。

已測試：
- `node --check app.js`
- `node --check player.js`
- `node --check display.js`
- `node --check local-qr.js`
- `git diff --check`
- 本機瀏覽器確認主持頁載入 `app.js?v=player-reconnect-1`。
- 用小型 Node 檢查同名處理邏輯：在線同名加序號、離線同名接回舊分數、同一玩家 ID 保留舊分數。

後續：
- 可加入主持端「複製玩家連結」作 QR 掃不到時的後備。
- 可在後台加入手動踢走離線玩家 / 改組別。

---

## 2026-05-20 01:09 HKT

類型：程式 / 現場穩定性

摘要：
- 加入 `local-qr.js`，前台改為本地生成 QR code SVG。
- 移除前台對 `api.qrserver.com` 的依賴。
- 前台 QR code 圖片來源改為 `data:image/svg+xml`，只由本機 JavaScript 產生。
- 略為放大大螢幕 QR code，方便團友在投影或電視上掃碼。
- 更新 cache version 至 `qr-local-1`。

影響：
- 現場不會因第三方 QR 圖片服務慢、封鎖或斷線而無法掃碼加入。
- GitHub Pages 靜態部署仍然可以直接使用，不需要後端服務。

已測試：
- `node --check local-qr.js`
- `node --check display.js`
- `node --check app.js`
- `node --check player.js`
- `git diff --check`
- 本機瀏覽器確認前台 QR panel 顯示。
- 本機瀏覽器確認 QR 圖片 `src` 是 `data:image/svg+xml`。
- 本機瀏覽器確認 QR 圖片沒有再使用 `api.qrserver.com`。

後續：
- 可繼續處理玩家同名 / 斷線重連。
- 可加入主持端「複製玩家連結」作後備方案。

---

## 2026-05-20 00:59 HKT

類型：介面 / 完場公布

摘要：
- 後台頂部加入「公布勝方」按鈕。
- 前台加入分組勝方全屏畫面：
  - 大字顯示 A 組 / B 組勝出或平手。
  - 清楚顯示 A 組和 B 組分數。
  - 若有個人分數，底部顯示個人最高分。
- 「排行榜」和「公布勝方」互斥顯示，主持可按需要切換。
- 開新題、播放、重新開放搶答 / 搶唱或重設本場時，會退出完場公布畫面。
- 更新 cache version 至 `winner-reveal-1`。

影響：
- 完場時可以先用「公布勝方」做更有儀式感的分組結果，再按「排行榜」看個人榜。
- 保持自由場控，不限制題數，也不自動完場。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `git diff --check`
- 本機瀏覽器確認後台「公布勝方」按鈕存在並會變成 active。
- 本機瀏覽器確認前台顯示 `.stage-winner-final`，並切到 `stage-hero is-winner-reveal`。
- 本機瀏覽器確認前台無 console error。

後續：
- 可以把 QR code 改成本地生成，避免依賴外部 QR API。
- 可以再處理同名玩家 / 斷線重連，增加現場穩定性。

---

## 2026-05-20 00:49 HKT

類型：介面 / 排行榜

摘要：
- 前台排行榜改成更有完場感的「分數結算」畫面。
- 前台按排行榜時會先顯示 A/B 組戰況：
  - A 組分數。
  - B 組分數。
  - 領先組別或平手提示。
- 前台在分組戰況下方顯示個人排行榜。
- 手機排行榜加入 A/B 組分數摘要。
- 更新 cache version 至 `winner-board-1`。

影響：
- 主持手動按「排行榜」時，大螢幕不再只是普通列表，而是更像一個結算畫面。
- 保持自由場控方向，仍由主持決定何時顯示排行榜。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `git diff --check`
- 本機瀏覽器確認按排行榜後前台顯示「分數結算」。
- 本機瀏覽器確認前台顯示 A/B 組分數區。

後續：
- 可以再加一個「分組勝方全屏」模式，讓最後公布結果更有儀式感。
- 可為排行榜加簡單動畫，但要避免太花和干擾聚會。

---

## 2026-05-20 00:43 HKT

類型：程式 / 自由場控

摘要：
- 後台頂部加入「本場重設」按鈕。
- 按下會先確認，再重設本場遊戲狀態：
  - 清個人分數。
  - 清 A/B 組分數。
  - 清目前題目、一字題、搶答狀態和排行榜狀態。
  - 清玩家本場答題記錄。
- 題庫、房間 ID、已加入玩家和玩家連線會保留。
- 更新 cache version 至 `session-reset-1`。

影響：
- 主持可以先綵排流程，正式開始前一鍵重設本場。
- 也可以中途重新開始，而不用清題庫或重新叫玩家掃 QR。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `git diff --check`
- 本機瀏覽器確認「本場重設」按鈕存在。
- 本機瀏覽器確認 `app.js` 使用 `session-reset-1` cache version。

後續：
- 可以為「本場重設」補一個較清楚的提示/狀態視覺，例如短暫顯示「正式開始」。
- 可繼續優化排行榜，加入分組勝方畫面。

---

## 2026-05-20 00:39 HKT

類型：介面 / 自由場控

摘要：
- 重新整理後台右側欄。
- 「同場玩家」和房間狀態移到右側欄最上方。
- 「題庫管理」改成預設收起的摺疊區，需要維護題庫時才展開。
- 更新 CSS cache version 至 `host-layout-1`。

影響：
- 主持現場使用時，視線先看到玩家和連線狀態，不會被大量題庫和表格干擾。
- 題庫仍可管理，但不再佔據主要視覺位置。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `git diff --check`
- 本機瀏覽器確認右欄第一個標題是「玩家」。
- 本機瀏覽器確認 `題庫管理` details 預設未展開。

後續：
- 可加入「本場重設」按鈕，清分數和分組分，但保留題庫與房間。
- 可繼續優化前台排行榜顯示，令完場更有儀式感。

---

## 2026-05-20 00:33 HKT

類型：程式 / 自由場控

摘要：
- 後台加入「停止」按鈕，主持可即時停止前台播放。
- 搶答估歌和一字搶唱改成主持明確開放：
  - 題目載入後，手機端不能立即搶答。
  - 主持按「開放搶答」或「開放搶唱」後，手機按鈕才可使用。
  - 有人搶到後，搶答自動關閉，等主持判定。
  - 主持按「未中」後，不會自動重開，需按開放按鈕才繼續。
- 前台狀態文字同步顯示「等待主持開放搶答 / 搶唱」或「搶答 / 搶唱開放」。
- 手機端會在未開放時禁用搶答 / 搶唱按鈕。
- 更新 cache version 至 `free-control-1`。

影響：
- 更符合「主持自由場控」方向。
- 主持可以控制何時開始播放、何時停止、何時開放搶答，不會被系統自動推流程。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- 本機瀏覽器確認搶答按鈕初始為「開放搶答」，按後變「搶答已開放」並禁用。
- 本機瀏覽器確認播放後「停止」可用，停止後狀態變「已停止播放」。
- 本機前台確認未開放時顯示「等待主持開放搶答」。

後續：
- 可以繼續優化後台控制台版面，將「題庫管理」收起，令現場控制更集中。
- 也可加入「本場重設」按鈕，清分數但保留題庫和玩家房間。

---

## 2026-05-20 00:23 HKT

類型：規格修正 / 文件 / 介面文字

摘要：
- 用戶確認不想限制每個環節玩幾多題。
- 最新玩法改成「主持自由場控」：
  - 不設定固定題數。
  - 不由系統自動完場。
  - 主持可以即場決定幾時玩四選一、搶答估歌、一字搶唱。
  - 主持可以即場決定幾時顯示排行榜。
- 更新 `docs/GAME_PLAN.md`，移除固定題數和自動完場作為主流程的描述。
- 更新 `docs/AI_HANDOFF.md`，提醒後續 AI 不要再設計題數限制。
- 後台分數欄「題數」改為「已判」，避免誤會有題數上限。

影響：
- 下一步不應做「環節題數設定 / 自動完場」。
- 下一步應做「更順手的自由場控按鈕和狀態提示」。

後續：
- 改善後台控制台，令主持可以更直覺地切環節、載入題目、播放、開估、判分和顯示排行榜。

---

## 2026-05-20 00:17 HKT

類型：程式 / 規格落地

摘要：
- 開始實作三環節玩法骨架。
- 後台加入播放秒數設定：60 秒 / 30 秒 / 15 秒，預設 30 秒。
- 後台答題模式改成三個環節：
  - 一：四選一。
  - 二：搶答估歌。
  - 三：一字搶唱。
- 後台加入搶答判定控制：答中 / 未中 / 重新開放搶答。
- 後台加入一字題控制：手動輸入字、隨機抽字、開始一字題。
- 加入 A/B 組分數。
- 手機加入表單加入 A/B 組選擇。
- 前台加入 A/B 組分數顯示。
- 播放邏輯改向最新器材需求：後台 iframe 靜音，前台 iframe 不加 mute；前台使用 `end` 和倒數秒數播放。

影響：
- 現場可初步按三環節流程操作。
- 搶答估歌不再一搶即加分，改由主持判定。
- 一字搶唱不播放 YouTube，前台顯示大字，組別加分由主持判定。
- 播放時間重新變成 60 / 30 / 15 秒，而不是完整播放。

已測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- 本機瀏覽器確認後台有 60/30/15、三環節按鈕和 A/B 組。
- 本機瀏覽器確認後台 YouTube iframe 有 `end=30`、`mute=1`、`autoplay=1`。
- 本機瀏覽器確認前台 YouTube iframe 有 `end=30`、`autoplay=1`，沒有 `mute=1`。
- 本機瀏覽器確認一字題可同步到前台。

後續：
- 仍要做更完整的自由場控流程。
- 仍要加玩家斷線重連和 QR code 本地生成。
- 固定題數和自動完場方向已在 2026-05-20 00:23 HKT 被取消。

---

## 2026-05-20 00:03 HKT

類型：規格 / 文件

摘要：
- 建立正式玩法計劃書 `docs/GAME_PLAN.md`。
- 建立本更新記錄檔 `docs/UPDATE_LOG.md`。
- 建立 AI 交接摘要 `docs/AI_HANDOFF.md`。
- 確認現場器材配置：同一部電腦雙螢幕，`MON1` 後台，`MON2` 前台大螢幕。
- 確認新目標：只有前台出聲，後台和手機不出聲。
- 確認播放時間應可由後台選擇：60 秒 / 30 秒 / 15 秒。
- 確認今次團契有三個環節：
  - 四選一選擇題。
  - 按時間搶答估歌。
  - 出一個字，分兩組鬥快唱出含有該字的歌。

影響：
- 下一階段不應只沿用舊版「估歌仔」流程，而要改成三環節正式遊戲流程。
- 現行程式曾經改成「後台有聲 / 可播完整首」，但新規格要求改回「前台有聲 / 可設定倒數秒數」。
- 後續 AI 接手時應以 `docs/GAME_PLAN.md` 為最新玩法基準。

後續：
- 先確認未決問題：分組計分、答錯後是否可再搶。
- 「每個環節題數」方向已在 2026-05-20 00:23 HKT 被取消，改為主持自由場控。
- 確認後再開始改程式架構。

---

## 2026-05-19 HKT

類型：程式 / 部署

摘要：
- 已把線上題庫重建為 88 首華語詩歌。
- 白名單來源包括：讚美之泉、HKACM、約書亞樂團、泥土音樂、同心圓、原始和聲、鹹蛋音樂事工、角聲使團、玻璃海樂團、小羊詩歌、基恩敬拜、建道神學院新祢呈敬拜隊、團契遊樂園、播道神學院。
- 已推上 GitHub Pages。
- 曾按當時需求把播放改成「後台按下一題自動播放，後台有聲，前台可播完整首」。

影響：
- 這些程式狀態未必等同 2026-05-20 的最新玩法規格。
- 2026-05-20 新規格要求前台才出聲，並加回 60 / 30 / 15 秒倒數控制。

後續：
- 下一次程式修改要調整播放責任：前台出聲，後台靜音控制。

---

## 2026-05-16 至 2026-05-18 HKT

類型：初版開發 / 題庫 / 設計

摘要：
- 建立 GitHub Pages 版華語詩歌估歌仔。
- 建立後台 `index.html`、前台 `display.html`、手機端 `player.html`。
- 加入 YouTube 題目播放、四選一、搶答、排行榜、QR code 加入。
- 前台曾重做為較溫馨、適合教會團契的視覺方向。
- 題庫曾多次按用戶白名單調整，避免普通話/粵語、來源和神學立場混亂。

影響：
- App 已有可用骨架，但未完全符合三環節玩法。
- 多人連線目前依賴 PeerJS，主持後台要保持開啟。
- 前台同步目前適合同一部電腦雙視窗使用。

後續：
- 需要把現有骨架重構成三環節遊戲流程。
