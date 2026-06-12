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

## 2026-06-12 23:07 HKT

類型：題庫 / 語言年代拆分 / 主持 UI

變更：
- 新增 `tools/rebuild_songlist_splits.js`，由現有 50 萬以上正式題庫重建語言和年代派生歌單。
- 補回流行曲 `language`，並新增 `eraTags` 支援一首歌同時屬於 `00後流行曲` 和 `最近15年流行曲`。
- 新增語言歌單：`songlists/pop-cantonese.json` 1633 首、`songlists/pop-mandarin.json` 1713 首、`songlists/all-cantonese.json` 1721 首、`songlists/all-mandarin.json` 1808 首。
- 新增年代歌單：`songlists/pop-00s.json` 1900 首、`songlists/pop-recent-15.json` 1874 首；`00後流行曲` 代表原近25年 / 2000年後整包，`最近15年流行曲` 是較近 subset。
- 主持頁線上歌單下拉新增「全部粵語歌」「全部國語歌」「粵語流行曲」「國語流行曲」「00後流行曲」「最近15年流行曲」。
- 主持頁 chips 由「年代 / 分類」改為「語言 / 年代 / 分類」，可直接按 `粵語` / `國語` 篩選已載入題庫。
- 主持和手機入口 cache version 推進到 `premium-mobile-33`，service worker cache 同步更新。
- 新增拆分 audit：`docs/SONGLIST_LANGUAGE_ERA_SPLIT_2026-06-12.md` 和 `docs/SONGLIST_LANGUAGE_ERA_SPLIT_2026-06-12.csv`。

影響：
- 預設 `songlists/all-songlists.json` 仍是 3529 首，但題目 metadata 現在可支援語言和年代切換。
- 語言分類先用既有 `language`，再用 artist / channel / source 規則判斷；如之後發現個別歌分錯，可用 audit CSV 精準修正。

測試：
- 已跑 `node tools/rebuild_songlist_splits.js`：12 個輸出 JSON 全部 `badViews=0`。
- 已跑 `node --check app.js`、`node --check tools/rebuild_songlist_splits.js`、`node --check player.js`、`node --check display.js`、`node --check firebase-sync.js`、`node --check sw.js`。
- 已跑 JSON parse/count validation：12 個輸出 JSON 都 `badViews=0` / `badLang=0`。
- 已跑本機靜態載入檢查：`http://localhost:5173/` 可 200 載入 12 個正式 JSON。
- 已跑本機 Browser host UI 檢查：主持頁載入 `app.js?v=premium-mobile-33`，下拉有全部粵語 / 全部國語 / 粵語流行曲 / 國語流行曲 / 00後 / 最近15年，chips 有 `粵語` / `國語` / `00後` / `最近15年`，載入 `國語流行曲` 顯示 1713/1713 可出題，按 `粵語` chip 可 active 並開新題，console error 0。
- 已驗證 GitHub raw `main`：6 個新增派生 JSON count 正確。
- 已驗證 GitHub Pages 正式網址：`index.html?v=0c1b241-check1` 已載入 `premium-mobile-33`，`pop-cantonese` 1633、`pop-mandarin` 1713、`pop-00s` 1900、`pop-recent-15` 1874、`all-cantonese` 1721、`all-mandarin` 1808 都可 200 載入。

下一步：
- 如發現個別歌曲語言分類不準，按 `docs/SONGLIST_LANGUAGE_ERA_SPLIT_2026-06-12.csv` 修正規則後重跑 `node tools/rebuild_songlist_splits.js`。

---

## 2026-06-12 22:31 HKT

類型：題庫 / 清理

變更：
- 按用戶要求，把正式線上題庫清理成只保留現有 `viewCount` metadata 達 50 萬或以上的歌曲。
- `hymns.json` 由 500 首減至 183 首。
- `songlists/pop-80s.json` 由 1019 首減至 552 首。
- `songlists/pop-90s.json` 由 1398 首減至 894 首。
- `songlists/pop-recent-25.json` 由 2143 首減至 1900 首。
- 重建 `songlists/pop-all.json`，全部流行曲共 3346 首。
- 重建 `songlists/all-songlists.json`，全部正式題庫共 3529 首。
- 新增清理報告 `docs/YOUTUBE_VIEW_FILTER_2026-06-12_500K.md` 和逐首 CSV `docs/YOUTUBE_VIEW_FILTER_2026-06-12_500K.csv`。
- 更新 `README.md` 和 `docs/AI_HANDOFF.md` 的題庫數量與 50 萬門檻規則。

影響：
- 主持頁預設載入的歌單會少了低觀看數 / 較冷門歌曲，出題更偏向大路和較多人認得的版本。
- 今次使用 repo 內現有 `viewCount` / `viewCheckedAt` metadata 過濾，沒有即時重新抓 YouTube 最新觀看數。

測試：
- 已驗證 `hymns.json`、`songlists/pop-80s.json`、`songlists/pop-90s.json`、`songlists/pop-recent-25.json`、`songlists/pop-all.json`、`songlists/all-songlists.json` 每首保留歌曲都有 `viewCount >= 500000`，最低保留觀看數為 500,131。
- 已跑 JSON parse/count validation：6 個正式歌單皆可解析，且 `bad=0`。
- 已跑 `node --check app.js`、`node --check player.js`、`node --check display.js`、`node --check firebase-sync.js`、`node --check sw.js`。
- 已跑本機靜態載入檢查：`http://localhost:5173/` 可 200 載入 6 個正式 JSON，且每個回應都 `bad=0`。
- 已跑 `git diff --check`，只出現既有 Windows CRLF 提示，沒有 whitespace error。

下一步：
- 如要用最新 YouTube 觀看數再精準篩一次，可用工具重新抓取 view count 後再跑同一個 50 萬門檻。

---

## 2026-06-02 23:46 HKT

類型：修正 / iPhone 音訊 / 場控

變更：
- 修正 iPhone / iOS Safari 入房後容易再次顯示要開聲或聽不到主持音訊的情況：手機按「開聲並加入」後，會保持已解鎖的隱藏靜音 audio element 循環播放，不再立即 pause，等主持音訊 stream 到達時沿用同一個 audio element。
- 隱藏 audio element 補上 `playsinline` / `webkit-playsinline` 屬性，減少 iOS 對內嵌音訊播放的限制。
- 主持端新增音訊廣播 gate：有遠端手機玩家時，如果主持未按「廣播電腦/分頁聲音」或「用咪高峰收聲」，自動開局和手動播放都會暫停並提示先開主持音訊。
- 主持開始音訊廣播成功後會重新檢查玩家名單自動流程，若玩家已入房且空場，才自動開始第一題。
- 手機和主持入口 cache version 更新到 `premium-mobile-32`，PWA / service worker cache 同步更新。

原因：
- iPhone Safari 對音訊播放權限特別嚴格；之前入房時播一瞬間靜音後即刻 pause，之後主持 WebRTC 音訊到達時再 `play()`，Safari 可能視為沒有使用者手勢而擋住。
- 另一個現場原因是主持未開始全球手機音訊廣播時，手機即使已開聲都沒有音訊來源可聽。

測試：
- `node --check app.js`、`node --check player.js`、`node --check display.js`、`node --check firebase-sync.js`、`node --check sw.js` 通過。
- `git diff --check` 通過，只有既有 CRLF 提示。
- 本機 Browser sanity check：`index.html?room=codex-iphone-audio-...` 和 `player.html?room=...&name=Codex` 都正常載入，host 載入 `app.js?v=premium-mobile-32`，player 載入 `player.js?v=premium-mobile-32`，console error 為 0。

下一步：
- 仍需用真 iPhone Safari 測一次：先開主持頁、按「廣播電腦/分頁聲音」、再用 iPhone 掃碼入房，確認不再提示要重新開聲，並能聽到主持分頁音訊。

---

## 2026-06-02 17:49 HKT

類型：手機版 / 場控 / 簡化

變更：
- 移除玩家手機畫面的「同步校準 / 聽到音樂」卡和按鈕。
- `player.js` 不再 render 手機端延遲校準入口，也不再由玩家手機送出 latency calibration sample。
- 主持端手動延遲補償設定仍保留，手機端只顯示同步狀態和按主持設定延後倒數。
- 手機和主持入口 cache version 更新到 `premium-mobile-31`，PWA / service worker cache 同步更新。

影響：
- 玩家手機畫面更乾淨，不會誤導團友以為每題要按「聽到音樂」才可同步。
- 延遲補償由主持統一場控，減少現場操作負擔。

測試：
- `node --check app.js`、`node --check player.js`、`node --check display.js`、`node --check firebase-sync.js`、`node --check sw.js` 通過。
- `git diff --check` 通過，只有既有 CRLF 提示。
- 本機 Browser sanity check：`player.html?room=codex-no-calibration-...&name=Codex` 載入 `player.js?v=premium-mobile-31`；頁面沒有 `#phoneLatencyCalibration` / `#phoneLatencyCalibrationButton` / `.phone-latency-calibration`，亦沒有「同步校準」或「聽到音樂」文字；console error 為 0。

下一步：
- 可用正式網址確認手機頁已載入 `player.js?v=premium-mobile-31`，並確認同步收聽區沒有校準按鈕。

---

## 2026-06-02 17:34 HKT

類型：程式 / 自動場控 / 玩家入房

變更：
- 主持頁新增玩家名單自動流程：第一位玩家加入且房間未在出題時，會短暫延遲後自動開始第一題。
- 當本場曾有玩家連線，但之後所有玩家離開，系統會在 4.5 秒後自動清場，重置分數、題目、已玩紀錄和玩家名單，並停止音訊廣播。
- 每題開始時會 snapshot 當時在線玩家；遲入房玩家不能插入當前題作答，只會看到「本題已開始，請等下一首」。
- 四選一、快選估歌、搶答可用玩家判斷都改為只計算當題合資格玩家，避免遲到玩家影響全員答完或可搶答狀態。
- 手機端新增等下一題提示和狀態 pill，並在不合資格時隱藏當題選項 / 搶答開放狀態。
- 手機和主持入口 cache version 更新到 `premium-mobile-30`，PWA / service worker cache 同步更新。

影響：
- 活動開始時，玩家一入房就可以自動起局，主持不用先手動按第一題。
- 全部玩家離開後，下一批玩家加入會是乾淨新場，減少舊分數、舊玩家和舊題目殘留。
- 中途加入的玩家不會影響當前題公平性，也不會令四選一「全部已答」判斷失準。

測試：
- `node --check app.js`、`node --check player.js`、`node --check display.js`、`node --check firebase-sync.js`、`node --check sw.js`、`node --check server.js` 通過。
- `git diff --check` 通過，只有既有 CRLF 提示。
- 本機 Browser sanity check：`index.html?room=codex-progress-check-...` 和 `player.html?room=...&name=Codex` 均正常載入，主要 UI 可見，console error 為 0。

下一步：
- 仍建議用兩至三部真手機 / 分頁做 Firebase 實機流程測試：首位玩家自動開局、中途加入等待下一題、全員離開自動清場。

---

## 2026-06-01 03:44 HKT

類型：手機版 / 視覺 / 加入頁

變更：
- 手機加入頁改成 onboarding sheet：新增房間狀態 pill、玩家預覽卡、名字 avatar、三格手機流程狀態。
- 玩家輸入名字時，預覽卡會即時更新名字和首字 avatar；提交時加入卡會有輕微按下和按鈕光帶動效。
- 加入卡樣式升級為暖色玻璃卡、內部 sweep、柔和陰影和更高級的輸入框 / 加入按鈕。
- `player.js` 新增 `updateJoinPreview()` / `playJoinSubmitMotion()`，並在狀態更新時同步房間 pill。
- 手機和主持入口 cache version 更新到 `premium-mobile-17`，PWA / service worker cache 同步更新。

影響：
- 玩家第一眼不再是普通表單，而是完整 app 的入房體驗。
- 入名、準備加入、連線狀態更有回饋，也更符合手機操作節奏。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `git diff --check` 通過，只有既有 CRLF 提示。
- 本機 Chrome mobile viewport 驗證加入頁：未加入狀態顯示 onboarding sheet、房間 pill 為 `連線就緒`、預覽名為 `準備加入`、avatar 為 `你`、三格流程狀態出現，390px 無橫向溢出。
- 本機 Chrome mobile viewport 驗證輸入互動：輸入 `So Ying` 後，房間 pill 變 `準備好`、預覽名變 `So Ying`、avatar 變 `S`，提交 motion class 正常出現。
- 本機 Chrome 360x740 窄 viewport 驗證長名字：預覽名和 avatar 更新，三格流程仍在，無橫向溢出。
- 本機截圖檢查：加入卡、主視覺、輸入框和加入按鈕沒有互相遮擋，第一屏視覺重心清楚。
- GitHub Pages 正式網址 `player.html?test=premium-mobile-17-live-join` 已用全新 Chrome mobile profile 驗證：已載入 `player.js?v=premium-mobile-17` / `pwa.js?v=premium-mobile-17`；加入頁 onboarding、房間 pill、預覽名、avatar、三格流程狀態、輸入即時更新和提交 motion 都正常，390px 無橫向溢出。

下一步：
- 下一輪可打磨設定 modal，或集中做一次全手機流程 screenshots audit。

---

## 2026-06-01 03:33 HKT

類型：手機版 / 視覺 / 排行榜

變更：
- 手機排行榜 modal 升級為完整 leaderboard view：保留 A/B 組分數摘要，新增 top 3 podium、冠軍 hero、細緻排名列表。
- 排名列新增分數進度條、組別 chip、自己玩家高亮、分數 meter 動效，保留升跌 / 新上榜 / 分數變動徽章。
- `renderLeaderboard()` 改為先算 movement，再渲染 podium 和列表；`replayLeaderboardMotion()` 會同時重播 podium 和排名列動效。
- `renderPhoneTeamSummary()` 改成 DOM 結構和分組進度條，不再用 `innerHTML`。
- 手機和主持入口 cache version 更新到 `premium-mobile-16`，PWA / service worker cache 同步更新。

影響：
- 排行榜不再只是清單，玩家一打開就能看到前三名、自己位置、分組差距和分數相對距離。
- modal 進場和排名視覺層次更接近正式 mobile app 的 leaderboard。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `git diff --check` 通過，只有既有 CRLF 提示。
- 本機 Chrome mobile viewport 390x844 驗證排行榜 modal：`phone-podium-card` 3 張、冠軍為目前玩家、自己玩家排名列 `is-self`、升位徽章 `↑1`、新上榜 `NEW`、A/B 組分數 meter 和 5 條排名 meter 都出現。
- 本機截圖檢查：排行榜 modal 430px 寬內無橫向溢出，top 3 podium、冠軍 hero、分組分數和排名列層次清楚，底部可自然滾動。
- GitHub Pages 正式網址 `player.html?test=premium-mobile-16-live-leaderboard` 已用全新 Chrome mobile profile 驗證：已載入 `player.js?v=premium-mobile-16` / `pwa.js?v=premium-mobile-16`；podium 3 張、冠軍為目前玩家、自己排名列 `is-self`、升位徽章 `↑1`、新上榜 `NEW`、A/B 組 meter 和 5 條排名 meter 都出現，390px 無橫向溢出。

下一步：
- 下一輪可打磨手機設定 modal / 加入頁，或針對實機手指操作距離再收細 spacing。

---

## 2026-06-01 03:21 HKT

類型：手機版 / 視覺 / 聲音同步等待

變更：
- 手機 7 秒音訊補償期間新增 `phoneAnswerGate` 狀態卡，顯示答題準備、倒數 badge、聲波動畫和同步進度條。
- 補償等待時 `phoneResult` 會暫時收起，避免同一個提示在畫面重複出現，視覺焦點落在同步卡和選項上。
- `player.js` 新增 `renderAnswerGate()`、`answerGateMotionKey` 和進場 motion，等待卡每題只觸發一次進場。
- 手機和主持入口 cache version 更新到 `premium-mobile-15`，PWA / service worker cache 同步更新。

影響：
- 玩家在延遲補償期間會感覺 app 正在主動同步，而不是按鈕突然不能按。
- 7 秒等待狀態更像正式 app 的 loading / gate interaction，對手機實機體驗更友善。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `git diff --check` 通過，只有既有 CRLF 提示。
- 本機 Chrome mobile viewport 390x844 驗證快選等待卡：8 個快選一開始 disabled / `is-sync-locked`，`phoneAnswerGate` 顯示 `快選準備中`、倒數 badge `7`、進場 class、聲波和進度條；`phoneResult.is-answer-gate-muted` 生效；8.3 秒後等待卡隱藏、選項解鎖、倒數開始扣，390px 無橫向溢出。
- 本機 Chrome mobile viewport 390x844 驗證四選一等待卡：4 個選項一開始 disabled，等待卡顯示 `答題準備中` / `音樂同步後自動開放答題`；3.6 秒後等待卡隱藏、選項解鎖、結果文案回到 `請選擇答案`。
- 本機截圖檢查：等待卡位於選項下方，倒數 badge、聲波、進度條和同步收聽卡沒有互相遮擋。
- GitHub Pages 正式網址 `player.html?test=premium-mobile-15-live-gate` 已用全新 Chrome mobile profile 驗證：已載入 `player.js?v=premium-mobile-15` / `pwa.js?v=premium-mobile-15`；快選等待卡顯示、選項鎖定、倒數停在 30 秒、8.3 秒後解鎖和隱藏等待卡；四選一等待卡同樣顯示 `答題準備中`，3.6 秒後解鎖並回到 `請選擇答案`；390px 無橫向溢出。

下一步：
- 下一輪可打磨排行榜 / 設定 modal 的細節，或加入主持端延遲校準引導。

---

## 2026-06-01 05:22 HKT

類型：手機版 / 互動手感 / 答題回饋

變更：
- 手機答題開放時間接上 7 秒音訊補償：播放開始後選項可先看，但四選一 / 快選提交會等手機預期聽到音樂時才開放。
- 主持送出的 player state 新增 `remotePlayStartsAt`，玩家端用它和 `remotePlayEndsAt` 計算「先停在完整秒數、延後才開始扣秒」。
- 手機選項新增 `is-choice-pressing` / `is-choice-confirming` 狀態，按下後有 tactile 壓下、確認彈起和光帶掃過。
- 快選答錯冷卻期間，選項會加 `is-cooldown-locked` 和 `phoneChoices.has-cooldown`，視覺上明確顯示暫時鎖定。
- 冷卻卡新增 `is-cooldown-entering` 進場動效，避免答錯後冷卻提示突然硬切出現。
- `player.js` 新增 `playChoiceTapMotion()`、冷卻 motion key 和答題開放 timer，確保冷卻進場每次冷卻只觸發一次，也令補償倒數到點後自動解鎖。
- 手機和主持入口 cache version 更新到 `premium-mobile-14`，PWA / service worker cache 同步更新。

影響：
- 手機平均慢約 7 秒時，玩家看到的倒數會先停在 30 / 15 / 60 秒，到聲音預期抵達才開始扣，感覺更貼近同步。
- 玩家不會在未聽到歌前亂撳快選或提交四選一，公平性更好。
- 玩家最常按的答案按鈕更有 app 觸感，選中狀態更明確。
- 答錯冷卻狀態更清楚，不會像按鈕突然變灰。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `git diff --check` 通過，只有既有 CRLF 提示。
- 本機 Chrome mobile viewport 390x844 驗證 7 秒延遲補償：8 個快選一開始全部 disabled / `is-sync-locked`，`phoneChoices.is-waiting-sync` 開啟，提示「準備聽歌，7 秒後開放快選」，倒數停在 30 秒；8.3 秒後自動解鎖，倒數變 29 秒，390px 無橫向溢出。
- 本機 Chrome mobile viewport 390x844 驗證：8 個快選選項正常顯示；點第一個選項後 `is-choice-confirming` 出現、`aria-pressed=true`、8 個選項 disabled；約 0.9 秒後確認 class 移除但選中狀態保留。
- 本機 Chrome mobile viewport 390x844 驗證冷卻狀態：`phoneChoices.has-cooldown`、8 個 `is-cooldown-locked`、`phoneCooldown.is-cooldown-entering` 會出現；約 0.95 秒後進場 class 移除，冷卻進度仍更新，390px 無橫向溢出。
- 本機截圖檢查冷卻畫面：8 個鎖定快選、冷卻卡和同步收聽卡沒有互相遮擋，冷卻狀態清楚可掃讀。
- GitHub Pages 正式網址 `player.html?test=premium-mobile-14-live-delay` 已用全新 Chrome mobile profile 驗證：已載入 `player.js?v=premium-mobile-14` / `pwa.js?v=premium-mobile-14`；7 秒補償期間 8 個快選 disabled / `is-sync-locked`，倒數停在 30 秒；8.3 秒後自動解鎖，倒數變 29 秒；點答案有確認動效；冷卻狀態有 `has-cooldown`、8 個 `is-cooldown-locked`、`is-cooldown-entering`，390px 無橫向溢出。

下一步：
- 下一輪可繼續打磨手機實機體驗，例如加入主持端一鍵「延遲校準流程」提示，或美化玩家等待開放答題時的細微聲波動效。

---

## 2026-06-01 04:58 HKT

類型：手機版 / 視覺 / 答案揭曉動效

變更：
- 手機答案卡新增 `is-answer-revealing` 進場 micro-interaction：答案卡彈入、光帶掃過、右上彩色 badge 微彈、倒數圈彈入。
- 題目卡新增 `is-answer-bloom` 短暫亮起，令「同步聲音中」過渡到答案揭曉更有完成感。
- `player.js` 新增 `lastAnswerRevealKey` / `answerRevealTimer`，確保同一題重新 render 不會重複觸發 reveal 動效。
- 答案揭曉時加入一次短 haptic pulse；使用者關閉觸感或瀏覽器不支援時會自然跳過。
- 手機和主持入口 cache version 更新到 `premium-mobile-13`，PWA / service worker cache 同步更新。

影響：
- 開估等待完結的一刻更像正式 app 的狀態轉換，不只是突然出文字。
- 動效只在每題答案第一次真正顯示時觸發，倒數重繪不會令卡片不停跳動。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `git diff --check` 通過，只有既有 CRLF 提示。
- 本機 Chrome mobile viewport 390x844 驗證：答案卡第一次顯示時 `is-answer-revealing` / `is-answer-bloom` 會出現，約 1.4 秒後自動移除；同一題重新 render 不會重複觸發；倒數 ring 5→4→3，390px 無橫向溢出。
- 本機截圖檢查答案揭曉畫面：stage cue、答案卡、倒數圈和同步收聽卡沒有互相遮擋，答案卡是視覺主體。
- GitHub Pages 正式網址 `player.html?test=premium-mobile-13-live` 已用全新 Chrome mobile profile 驗證：已載入 `player.js?v=premium-mobile-13` / `pwa.js?v=premium-mobile-13`，答案卡第一次顯示時 `is-answer-revealing` / `is-answer-bloom` 會出現，約 1.4 秒後自動移除；同一題重新 render 不會重複觸發；倒數 ring 5→4→3，390px 無橫向溢出。

下一步：
- 下一輪可打磨玩家操作手感，例如快選按下的 pressed 狀態、答錯冷卻進場和排行榜入口的細微 motion。

---

## 2026-06-01 04:34 HKT

類型：手機版 / 視覺 / 延遲過渡

變更：
- 手機開估延遲期間新增 `phoneRevealBridge` 玻璃卡，顯示「同步聲音中」、秒數、聲波動效和進度條。
- 主持 state 新增 `revealAutoNextOpenedAt`，手機可用開估時間、答案展示開始時間和截止時間計算等待進度。
- 手機等待補償時不顯示答案卡、歌名或開估特效；到最後 5 秒才切換成答案卡和 ring 倒數。
- 手機和主持入口 cache version 更新到 `premium-mobile-12`，PWA / service worker cache 同步更新。

影響：
- 7 秒音訊延遲不再像卡住或空等，而是變成 app 內自然的同步過渡。
- 玩家仍不會在聽完遠端音樂前看到答案。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `git diff --check` 通過，只有既有 CRLF 提示。
- 本機 Chrome mobile viewport 390x844 驗證：7 秒等待 window 內同步卡顯示、stage cue 隱藏、答案卡隱藏；短等待測試中進度條推進；補償後答案卡 `Song B` 顯示、倒數 ring 5→4，390px 無橫向溢出。
- 本機截圖檢查同步卡排版：狀態 pill、聲波、倒數數字和進度條未互相遮擋，答案未提前曝光。
- GitHub Pages 正式網址 `player.html?test=premium-mobile-12-live` 已用全新 Chrome mobile profile 驗證：已載入 `player.js?v=premium-mobile-12` / `pwa.js?v=premium-mobile-12`，7 秒等待 window 內同步卡顯示、stage cue 隱藏、答案卡隱藏；短等待測試中進度條推進；補償後答案卡 `Song B` 顯示、倒數 ring 5→4，390px 無橫向溢出。

下一步：
- 下一輪可繼續打磨答案揭曉瞬間的 micro-interaction，例如答案卡進場光帶、按鈕 tactile feedback 或玩家排名摘要。

---

## 2026-06-01 04:05 HKT

類型：手機版 / 延遲補償 / 開估節奏

變更：
- 開估後自動下一題時間改為 `remoteAudioLatencyMs + REVEAL_AUTO_NEXT_DELAY_MS`，預設即 7 秒手機音訊補償 + 5 秒答案展示。
- player state 新增 `revealAutoNextStartsAt`，手機可知道何時才正式開始顯示答案倒數。
- 手機答案卡、開估狀態、開估 moment 和 stage cue 都會等到最後 5 秒才顯示，避免玩家仍在聽延遲音訊時被畫面提早爆答案。
- 手機和主持入口 cache version 更新到 `premium-mobile-11`，PWA / service worker cache 同步更新。

影響：
- 手機聽到大約 7 秒延遲時，畫面會等 7 秒才開始 5 秒答案倒數，看起來會更像沒有 delay。
- 主持端仍可即時知道已開估，但下一題播放會延後到遠端手機答案展示完成後才開始。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `git diff --check` 通過，只有既有 CRLF 提示。
- 本機 Chrome mobile viewport 390x844 驗證：7 秒等待 window 內答案卡和倒數 ring 隱藏，補償後答案卡 `Song B` 顯示、倒數 ring 5→4、stroke offset 推進，390px 無橫向溢出。
- GitHub Pages 正式網址 `player.html?test=premium-mobile-11-live` 已用全新 Chrome mobile profile 驗證：已載入 `player.js?v=premium-mobile-11` / `pwa.js?v=premium-mobile-11`，7 秒等待 window 內答案卡和倒數 ring 隱藏，補償後答案卡 `Song B` 顯示、倒數 ring 5→4、stroke offset 推進，390px 無橫向溢出。

下一步：
- 如實機聽感仍有偏差，可用現有主持端 5 / 7 / 10 秒延遲設定或「聽到音樂」校準回報再微調。

---

## 2026-06-01 03:38 HKT

類型：設計 / 程式 / 開估倒數

摘要：
- 主持端開估時新增 `revealAutoNextEndsAt` 和 `revealAutoNextDelayMs`，同步真正的 5 秒自動下一題截止時間給手機。
- 手機答案卡新增右上角 `phoneAnswerCountdown` ring，顯示剩餘秒數並隨時間縮短。
- 手機端新增答案倒數 timer，會跟 player state 的截止時間重繪，不靠手機自己猜固定 5 秒。
- 手機和主持入口 cache version 更新到 `premium-mobile-10`，PWA / service worker cache 同步更新。

影響：
- 開估後玩家能清楚感覺答案展示還剩幾秒，下一題切換更可預期，整體流程更接近正式手機 app。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- 本機 Chrome mobile viewport 390x844 驗證：答案卡顯示 `Song A`，倒數 ring 顯示 5 秒後跳到 4 秒，ring stroke offset 有推進，無橫向溢出。

後續：
- 可再加入答案卡收起 / 下一題進場的連續轉場，令倒數完結的一刻更自然。

---

## 2026-06-01 03:12 HKT

類型：設計 / 程式 / 手機題目轉場

摘要：
- 手機題目卡新增 `phoneStageCue` 玻璃質感轉場 cue，支援回合開始、播放開始、開估和下一題四種狀態。
- `player.js` 新增 stage phase 偵測：根據上一個題目狀態和新 player state 判斷何時顯示 `round`、`play`、`reveal`、`next` cue。
- cue 顯示期間題目卡內其他內容會短暫淡出，避免轉場卡和歌單 / 選項互相搶視覺焦點。
- 手機和主持入口 cache version 更新到 `premium-mobile-9`，PWA / service worker cache 同步更新。

影響：
- 手機流程由「狀態文字切換」變成更接近正式 app 的回合轉場，玩家更容易感覺到新一題、播放、開估和下一題的節奏。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- 本機 Chrome mobile viewport 390x844 驗證：`round` 顯示「第 1 題」、`play` 顯示「播放開始 / 30 秒」、`reveal` 顯示「開估 / Song A」、`next` 顯示「第 2 題 / 下一題開始」；cue 和題目卡 transition class 正確，內容淡出狀態生效，無橫向溢出。
- GitHub Pages 正式網址 `player.html?test=premium-mobile-9-live` 已用全新 Chrome mobile profile 驗證：已載入 `player.js?v=premium-mobile-9` / `pwa.js?v=premium-mobile-9`，四種 stage cue、內容淡出和 390px 無橫向溢出全部通過。

後續：
- 可再做答案揭曉後 5 秒自動下一題的微型倒數 ring，令開估等待時間更可感知。

---

## 2026-06-01 02:48 HKT

類型：設計 / 程式 / 手機排行榜動效

摘要：
- 手機排行榜新增上一輪名次快照，玩家排名變化時會標記升位、跌位、新上榜或同名次分數變化。
- 排行榜列新增 `phone-rank-delta` 小徽章：升位顯示 `↑1`，跌位顯示 `↓1`，新上榜顯示 `NEW`，同名次分數變動顯示分數差。
- 排行榜列加入 rise / drop / new / score pulse 和掃光動畫，打開排行榜 modal 時會重播仍在有效時間內的變動。
- 手機和主持入口 cache version 更新到 `premium-mobile-8`，PWA / service worker cache 同步更新。

影響：
- 玩家答中後除了分數本身有回饋，排行榜名次也有更即時和更像正式 app 的動態反應。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- 本機 Chrome mobile viewport 390x844 驗證：Bob 由第 2 升第 1 顯示 `up` / `↑1`，Alice 由第 1 跌第 2 顯示 `down` / `↓1`，Charlie 新上榜顯示 `new` / `NEW`；排行榜 modal 可打開，無橫向溢出。
- GitHub Pages 正式網址 `player.html?test=premium-mobile-8-live` 已用全新 Chrome mobile profile 驗證：已載入 `player.js?v=premium-mobile-8` / `pwa.js?v=premium-mobile-8`，Bob 升位、Alice 跌位、Charlie 新上榜三種排行榜動效狀態通過；390px 手機寬度無橫向溢出。

後續：
- 可再做「回合開始 / 開估 / 下一題」之間的頁面轉場，令整個手機流程更像完整 app。

---

## 2026-06-01 02:25 HKT

類型：設計 / 程式 / 手機分數動畫

摘要：
- 手機分數格改為保留內部 `playerScoreValue`，避免重繪時清走分數動畫元素。
- 新增 `phoneScoreBurst` 浮層：分數上升顯示 `+5` 綠色浮起，分數下降顯示 `-1` 紅色浮起。
- 分數格加入加分 pulse 和扣分 shake 動畫，與現有 `phoneMoment` 高峰彈層配合。
- 手機和主持入口 cache version 更新到 `premium-mobile-7`，PWA / service worker cache 同步更新。

影響：
- 答中、答錯扣分時手機端有即時且明確的遊戲回饋，手感更接近正式手機遊戲 app。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `manifest.webmanifest` JSON parse 通過。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- 本機 Chrome mobile viewport 390x844 驗證：分數 10 → 15 顯示 `+5` / `up` / `is-score-pop`；15 → 14 顯示 `-1` / `down` / `is-score-down`；無橫向溢出。
- GitHub Pages 正式網址 `player.html?test=premium-mobile-7-live` 已用全新 Chrome mobile profile 驗證：已載入 `player.js?v=premium-mobile-7` / `pwa.js?v=premium-mobile-7`，分數 10 → 15 顯示 `+5` / `up` / `is-score-pop`；15 → 14 顯示 `-1` / `down` / `is-score-down`；390px 手機寬度無橫向溢出。

後續：
- 可再做排行榜名次變動動畫，讓個人榜升跌更清楚。

---

## 2026-06-01 02:08 HKT

類型：設計 / 程式 / PWA app 外殼

摘要：
- 新增 `manifest.webmanifest`，提供手機安裝名稱、啟動 URL、主題色、分類、圖示和加入 / 主持 shortcuts。
- 新增 `assets/app-icon.svg`、`assets/app-icon-192.png`、`assets/app-icon-512.png`、`assets/apple-touch-icon.png`、`assets/maskable-icon-512.png`，讓加入主畫面和 Android maskable icon 更像正式 app。
- 新增 `pwa.js` 和 `sw.js`：用保守 network-first service worker 支援 app shell 快取，避免優先使用舊檔。
- 主持頁和手機頁加入 `theme-color`、Apple mobile web app metadata、`viewport-fit=cover`、manifest link 和 PWA 註冊。
- 手機和主持入口 cache version 更新到 `premium-mobile-6`；本機 server 加入 `.webmanifest` MIME type。

影響：
- 手機玩家可以更自然地把頁面加入主畫面，開啟時有 app 名稱、圖示、主題色和 standalone 外觀，整體更接近可上架 / 可安裝 app 的感覺。

測試：
- `node --check app.js`、`node --check player.js`、`node --check pwa.js`、`node --check sw.js` 通過。
- `manifest.webmanifest` JSON parse 通過。
- 產生並驗證 PNG icon 尺寸：192x192、512x512、180x180、512x512。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- 本機 Chrome mobile viewport 390x844 驗證手機頁：manifest name/display/start_url/icons 正確、service worker 註冊成功、載入 `player.js?v=premium-mobile-6` 和 `pwa.js?v=premium-mobile-6`、8 個快選選項無橫向溢出。
- GitHub Pages 正式網址已驗證 `manifest.webmanifest?v=premium-mobile-6`、`pwa.js?v=premium-mobile-6`、`sw.js?v=premium-mobile-6` 和 app icon 可載入；正式手機頁 manifest / meta / service worker 註冊成功，390x844 快選畫面無橫向溢出。

後續：
- 可再做 install prompt / iOS 加入主畫面提示，但要保持不打擾遊戲主流程。

---

## 2026-06-01 01:48 HKT

類型：設計 / 程式 / 手機延遲校準

摘要：
- 手機同步收聽面板新增「同步校準」卡；播放中玩家聽到音樂時可按「聽到音樂」回報實際延遲。
- 主持頁新增延遲校準卡，收集每位玩家每題一筆樣本，使用中位數計算實測延遲，並在 5 / 7 / 10 秒之間給出最接近建議。
- 主持頁可一鍵「套用建議」，即時更新手機延遲補償並同步到 player state。
- 手機和主持入口 cache version 更新到 `premium-mobile-5`。

影響：
- 全球手機玩法不再只靠主持估 delay；現場可用玩家手機回報校準，令手機倒數與實際聽到的音樂更接近。

測試：
- `node --check app.js` 通過。
- `node --check player.js` 通過。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- 本機 Chrome 驗證主持收到 9.2 秒樣本後顯示「實測 9.2 秒 · 建議 10 秒」，「套用建議」後補償切到 10 秒。
- 本機 Chrome mobile viewport 390x844 驗證手機播放中顯示「聽到音樂」按鈕，按下後變「已回報」，無橫向溢出。
- GitHub Pages 正式網址已驗證 `app.js?v=premium-mobile-5` 和 `player.js?v=premium-mobile-5` 載入成功；正式頁同樣通過主持端 9.2 秒樣本建議 10 秒、套用後 active 10 秒，以及手機端「聽到音樂」回報流程。

後續：
- 可再做更細的高級互動，例如把多部手機的校準分布做成小型 sparkline。

---

## 2026-06-01 01:28 HKT

類型：設計 / 程式 / 手機延遲補償

摘要：
- 主持頁新增「手機延遲補償」分段控制，可即場切換 5 秒 / 7 秒 / 10 秒，預設仍是 7 秒。
- 主持設定會寫入 `guess-song-host-settings-v1`，重新整理後保留。
- player state 改為送出目前主持設定的 `remoteAudioDelayMs`，`remotePlayEndsAt` 和遠端答題 grace window 會跟設定同步調整。
- 手機設定頁的「聲音延遲補償」由固定 7s 改成顯示主持目前設定值。
- 手機和主持入口 cache version 更新到 `premium-mobile-4`。

影響：
- 不同網絡或地區有 5 秒、7 秒、10 秒 delay 時，主持可以現場調校，不需要改程式再部署。

測試：
- `node --check app.js` 通過。
- `node --check player.js` 通過。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- 本機 Chrome 驗證主持切到 10 秒後：10 秒按鈕 active、設定寫入 localStorage、player state 的 `remoteAudioDelayMs` / `remotePlayEndsAt - playEndsAt` / `answerOpenUntil - playEndsAt` 都是 10000ms。
- 本機 Chrome mobile viewport 390x844 驗證手機收到 10 秒補償：同步倒數仍以玩家聽到音訊為準，設定頁顯示 `10s`，8 個快選選項無橫向溢出。
- GitHub Pages 正式網址已驗證 `app.js?v=premium-mobile-4` 和 `player.js?v=premium-mobile-4` 載入成功；正式頁同樣通過 10 秒補償設定、player state 10000ms 差值、手機設定顯示 `10s` 和無橫向溢出。

後續：
- 可再做「自動校準」流程：玩家按聽到音樂的一刻，估算更準確的 delay。

---

## 2026-06-01 01:06 HKT

類型：設計 / 程式 / 手機體驗

摘要：
- 確認 7 秒手機音訊延遲補償仍然生效：主持端 player state 會送出 `remoteAudioDelayMs: 7000`、`remotePlayEndsAt` 和延長後的答題窗口，手機端倒數會跟遠端音訊感覺對齊。
- 手機開估畫面新增「正確答案」卡，開估後只顯示文字答案和資料來源，不播放完整歌曲。
- 快選估歌答錯後新增冷卻卡和倒數進度條，玩家能清楚看到幾秒後可再次回答。
- 手機排行榜 modal 新增目前第一名 / 分組領先摘要，結算感更強。
- 手機和主持入口 cache version 更新到 `premium-mobile-3`。

影響：
- 玩家端更容易理解「開估、冷卻、等待下一題」三種狀態，減少遠距音訊 delay 帶來的錯覺。

測試：
- `node --check app.js` 通過。
- `node --check player.js` 通過。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- 本機 Chrome mobile viewport 390x844 驗證：手機同步倒數顯示 30 秒，快選冷卻由 5 秒自動跳到 4 秒，8 個快選選項無橫向溢出。
- 本機 Chrome mobile viewport 390x844 驗證開估：答案卡顯示、冷卻卡收起、選項清空，題目卡高度收回到約 201px，無橫向溢出。
- GitHub Pages 正式網址已驗證 `player.js?v=premium-mobile-3` 載入成功；正式手機頁模擬同樣通過：30 秒補償倒數、冷卻 5 秒跳 4 秒、答案卡顯示、無橫向溢出。

後續：
- 可按實測網絡把 7 秒延遲補償改成主持頁可調。

---

## 2026-06-01 00:32 HKT

類型：設計 / 程式 / 手機高峰動畫

摘要：
- 手機頁新增 `phoneMoment` 高峰彈層：答中、答錯 / 冷卻、開估顯示答案時會有 app-like 彈層和粒子點綴。
- `player.js` 新增 moment state 管理：根據 result message 和 revealed state 觸發 correct / miss / reveal 動畫，並自動收起。
- 排行榜 modal 重新整理：冠軍 badge、分組領先 highlight、排名列改成三欄 app list，減少普通表格式感覺。
- 手機入口 cache version 更新到 `premium-mobile-2`。

影響：
- 玩家答中、開估和看排行榜時有更完整的高峰回饋，不再只是普通文字狀態。
- 動態特效開關會同時關閉 moment 粒子和其他動效。

測試：
- `node --check player.js` 通過。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- 本機 Chrome mobile viewport 390x844 模擬快選答中：moment 彈層顯示、8 個選項無橫向溢出。
- 本機 Chrome mobile viewport 390x844 模擬排行榜：冠軍 badge 顯示、A/B 組領先狀態顯示，modal 排版正常。
- GitHub Pages 正式網址已驗證 `player.js?v=premium-mobile-2` 載入成功；模擬答中後 `phoneMoment` 顯示 `correct` 狀態，8 個快選選項沒有橫向溢出。

後續：
- 下一輪可做開估後答案詳情頁、答錯冷卻倒數視覺化、結算勝方全屏動畫和實機手機微調。

---

## 2026-06-01 00:10 HKT

類型：設計 / 程式 / 手機介面

摘要：
- 手機玩家頁完成第一輪 premium app UI 改造：加入頂部 app bar、狀態 pill、設定按鈕、玻璃感主面板、動態背景光層、播放倒數脈衝和收聽音量波效果。
- 重新設計已加入遊戲後的分數列、題目卡、四選一 / 快選選項、收聽狀態卡和排行榜入口，讓手機主流程更像原生 app。
- 新增手機設定面板：動態特效、觸感回饋、精簡畫面，以及 7 秒聲音延遲補償狀態。
- 手機端新增 localStorage 設定保存、body 狀態 class、答題 / 搶答 haptic feedback、動效關閉和精簡模式。
- 手機入口 cache version 更新到 `premium-mobile-1`。

影響：
- 手機玩家畫面視覺層次、觸控反饋和狀態感明顯提升。
- 舊手機或弱網絡可用「精簡畫面」減少背景效果；怕暈動者可關閉動態特效。

測試：
- `node --check player.js` 和 `node --check app.js` 通過。
- 本機 Chrome mobile viewport 390x844 截圖檢查主答題畫面：scoreline 三欄固定，排行榜按鈕沒有掉行，題目與四選一選項沒有橫向溢出。
- 本機 Chrome mobile viewport 390x844 驗證設定 modal：4 個設定列正常顯示，toggle 初始狀態正確。
- 本機 Chrome mobile viewport 360x740 驗證快選 8 個選項：沒有橫向溢出，choice count 正確為 8。
- GitHub Pages 正式網址已驗證 `player.js?v=premium-mobile-1` 載入成功，app bar 和 4 個設定列存在；模擬遊戲 state 後 scoreline 三欄固定、4 個選項沒有橫向溢出。

後續：
- 第二輪可再加「開估 / 答中」動畫、排行榜結算動效、更多 app-like microcopy 和實機手機檢查。

---

## 2026-05-31 23:45 HKT

類型：規格 / 程式 / 手機延遲補償

摘要：
- 新增 7 秒遠距音訊延遲補償：手機倒數會先停在原本秒數，約 7 秒後才開始扣秒，貼近玩家實際聽到的 WebRTC 聲音。
- 主持端同步保留同一個 7 秒遠距答題窗口；即使主持端片段已到時，手機在延遲聲音最後幾秒仍可提交答案。
- Firebase player state 新增 `remoteAudioDelayMs`、`remotePlayEndsAt`、`answerOpenUntil`，給手機端計算補償倒數和答題狀態。
- 將三個入口頁 cache version 更新到 `mobile-delay-1`。

影響：
- 手機玩家看到的倒數會更接近實際聽到的歌曲，不會再因約 7 秒聲音延遲而提早歸零。
- 四選一和快選估歌的手機答題時間與手機收聽時間更一致。

測試：
- `node --check app.js`、`node --check player.js`、`node --check display.js` 通過。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- GitHub Pages 正式網址已驗證載入 `app.js?v=mobile-delay-1`。
- 正式網址用 15 秒題目驗證：播放中 player state 有 `remoteAudioDelayMs: 7000`，`remotePlayEndsAt - playEndsAt = 7000`，`answerOpenUntil - playEndsAt = 7000`。
- 主持端片段到時後，player state 會變成 `isPlaying: false`、`playEndsAt: 0`，但 7 秒補償期內仍保留 `answerOpenUntil` 和 4 個選項；補償期完結後 `answerOpenUntil` 歸零並清走選項。
- 測試用 Firebase 房間已清理。

後續：
- 如實測不同網絡延遲不是 7 秒，可把 `REMOTE_AUDIO_LATENCY_MS` / `REMOTE_AUDIO_COUNTDOWN_DELAY_MS` 改成更貼近現場的數字，或之後做成主持頁可調設定。

---

## 2026-05-31 23:21 HKT

類型：規格 / 程式 / 開估流程

摘要：
- 修正開估規格：所有歌曲開估後不再播放完整歌曲。
- 開估時只顯示清楚文字答案 5 秒，然後自動播放下一題。
- 四選一全員已選、快選估歌有人答中、主持手動按「開估」都統一使用同一個文字開估流程。
- 開估會停止目前片段，並同步 `revealed: true`、`isPlaying: false`、`fullPlayback: false` 給玩家 / 投影。
- 將三個入口頁 cache version 更新到 `auto-room-3`。

影響：
- 遊戲節奏更快，開估只作核對答案，不會再播全首歌。
- 快選估歌答中後也會 5 秒顯示答案，然後自動下一題。

測試：
- `node --check app.js`、`node --check player.js`、`node --check display.js`、`node --check firebase-sync.js`、`node --check local-qr.js` 通過。
- `git diff --check` 通過（只見既有 CRLF 提示）。
- GitHub Pages 正式網址已驗證主持手動「開估」：開估後顯示文字答案，YouTube iframe 保持 `autoplay=0`，`stop` / `skip` 停用，約 5 秒後自動進入下一題並重新播放片段。
- GitHub Pages 正式網址已驗證四選一全員已選：Firebase player state 變成 `revealed: true`、`isPlaying: false`、`mediaPlaying: false`、`fullPlayback: false`，約 5 秒後自動下一題。
- GitHub Pages 正式網址已驗證快選估歌答中：玩家 +5 分，Firebase player state 同樣是 `revealed: true`、`isPlaying: false`、`mediaPlaying: false`、`fullPlayback: false`，約 5 秒後自動下一題。
- 測試用 Firebase 房間和舊測試房已清理。

後續：
- 如想日後有「聽完整首」作敬拜 / 回顧，可另加獨立按鈕，不再綁在開估流程。

---

## 2026-05-31 16:14 HKT

類型：規格 / 程式 / 自動分房

摘要：
- 主持人直接開首頁時，不再需要自己改 `room` 參數；系統會自動檢查並佔用第一間空房。
- 自動順序是 `soyingpang-guess-song-fellowship-room`、`soyingpang-guess-song-fellowship-room-2`、`...-3`，最多檢查 `AUTO_ROOM_MAX_CANDIDATES` 間。
- Firebase 新增主持佔房 transaction 和 `hostHeartbeatAt` 心跳，避免仍在線的主持被後來開頁誤搶。
- 指定房間模式仍保留：如果主持頁 URL 帶 `?room=custom-room`，就只用該指定房間。
- 將三個入口頁 cache version 更新到 `auto-room-2`。

影響：
- 多個主持人可以全部直接開同一個 GitHub Pages 首頁，系統自動分配不同場。
- 玩家仍只需要掃當前主持頁 QR；QR / 玩家連結會自動帶正確房間。

測試：
- `node --check app.js`
- `node --check player.js`
- `node --check display.js`
- `node --check firebase-sync.js`
- `node --check local-qr.js`
- `git diff --check` 通過；只剩 Git 在 Windows 提示 LF 之後會轉 CRLF。
- GitHub Pages 正式網址驗證通過：第一個首頁分頁取得 `soyingpang-guess-song-fellowship-room`，第二個首頁分頁自動取得 `soyingpang-guess-song-fellowship-room-2`，第三個首頁分頁自動取得 `soyingpang-guess-song-fellowship-room-3`。
- 三個正式頁都載入 `app.js?v=auto-room-2`，且主持頁 QR / 玩家連結跟隨各自房間。
- 測試完成後已關閉 Chrome 測試分頁，並清理測試建立的 `-2` / `-3` Firebase 房間。

後續：
- 可再在主持頁顯示「目前是第幾個場」的簡短標籤，令多場活動更易分辨。

---

## 2026-05-31 15:43 HKT

類型：規格 / 程式 / 多房間

摘要：
- 新增 URL 多房間模式；主持頁無 `room` 參數時仍用預設固定房 `soyingpang-guess-song-fellowship-room`。
- 主持頁可用 `?room=fellowship-a` / `?room=fellowship-b` 開獨立場，玩家 QR、玩家連結、投影連結、Firebase room key 和 PeerJS 房間都跟房名分開。
- 同一部電腦 / 同一瀏覽器開不同房間時，主持頁接管訊息只會影響同房間，不會互相踢走。
- 玩家頁和投影頁會正規化並記住目前房間；自訂房間不會在連線失敗時誤跳回預設房。
- 將三個入口頁 cache version 更新到 `multi-room-1`。

影響：
- 可以用同一個 GitHub Pages 網站同時開兩個或以上聚會房間，各自有獨立玩家、題目、分數和聲音連線。
- 原本日常用法不變，直接開首頁仍是原本固定房。

測試：
- `node --check app.js`
- `node --check player.js`
- `node --check display.js`
- `node --check firebase-sync.js`
- `node --check local-qr.js`
- `git diff --check` 通過；只剩 Git 在 Windows 提示 LF 之後會轉 CRLF。
- GitHub Pages 正式網址驗證通過：`index.html?room=codex-room-a&test=multi-room-1` 產生 `player.html?room=codex-room-a`，`index.html?room=codex-room-b&test=multi-room-1` 產生 `player.html?room=codex-room-b`。
- Firebase REST 驗證兩個測試房間 meta 分開，buildVersion 都是 `multi-room-1`；測試用 `codex-room-a` / `codex-room-b` 已清理。
- 無 `room` 參數的正式網址仍回到 `soyingpang-guess-song-fellowship-room`，玩家 QR / 連結維持原本固定房。

後續：
- 可再加一個主持頁 UI 輸入房名，但目前 URL 參數已可支援多場同時玩。

---

## 2026-05-31 10:37 HKT

類型：規格 / 程式 / 四選一流程

摘要：
- 四選一改成所有在線玩家提交答案後自動開估。
- 自動開估後顯示答案，5 秒後自動播放下一題。
- 新增四選一自動下一題計時器；新題、停止、切模式和重置時會清走，避免舊計時器誤觸發。
- 將三個入口頁 cache version 更新到 `choice-auto-1`。

影響：
- 四選一環節可以連續自動跑題，主持不用每題手動開估和下一題。
- 離線玩家不會卡住「全員已選」判斷；目前只計算在線玩家。

測試：
- `node --check app.js`
- `node --check player.js`
- `node --check display.js`
- `node --check firebase-sync.js`
- `node --check local-qr.js`
- `git diff --check` 通過；只剩 Git 在 Windows 提示 LF 之後會轉 CRLF。
- GitHub Pages 正式網址 `index.html?test=choice-auto-1` 驗證通過：測試玩家提交四選一答案後約 0.3 秒顯示「全部已選，自動開估」，約 5.6 秒後自動播放下一題。
- Firebase 測試玩家和測試事件已清理；正式房間只保留原本的 `So Ying Pang` 離線玩家記錄。

後續：
- 用多部真手機試一次，確認有人臨時斷線時不會卡住全員完成。

---

## 2026-05-31 10:24 HKT

類型：規格 / 程式 / 手機玩法

摘要：
- 將第二模式由「搶答估歌」改為「快選估歌」。
- 玩家手機會顯示 8 個歌名大按鈕，不需要打字或開咪。
- 快選估歌改為自動判分：答中 +5 分；答錯 -1 分，該玩家 5 秒後才能再答。
- 只要有一位玩家答中，主持頁 / 玩家頁 / 投影會顯示「XXX 已估中」，並自動開估 / 全首播放。
- 將三個入口頁 cache version 更新到 `quick-pick-1`。

影響：
- 全球手機版不再依賴咪高峰搶答，遠距玩家用手機點選即可完成估歌。
- 主持在第二模式只需開放快選和控制播放，不需要逐個判定答中 / 未中。

測試：
- `node --check app.js`
- `node --check player.js`
- `node --check display.js`
- `node --check firebase-sync.js`
- `node --check local-qr.js`
- `git diff --check` 通過；只剩 Git 在 Windows 提示 LF 之後會轉 CRLF。
- GitHub Pages 正式網址確認 `index.html?test=quick-pick-1` 和 `player.html?...&test=quick-pick-1` 已載入新版資源。
- Browser 正式網址確認主持頁第二模式顯示「二：快選估歌」，切換後只保留「開放快選」，答中 / 未中人工判定按鈕會收起。
- Browser + Firebase 測試玩家 state 驗證手機頁：8 個快選按鈕正常顯示；冷卻時按鈕停用並顯示倒數；答中狀態會顯示「QuickUi 已估中」並露出歌名。測試玩家和測試 state 已清走。

後續：
- 第三模式「主題搶唱」仍是舊搶唱玩法，之後可再改成無咪玩法。

---

## 2026-05-31 09:55 HKT

類型：規格 / 手機版 / 介面

摘要：
- 手機版改成純遠距流程：玩家輸入名字後直接加入，不再顯示「在現場 / 不在現場」選擇。
- 主持頁玩家列表不再標示現場 / 不在現場，改為「手機版」。
- 手機頁加入前和加入後都套用主持頁同款暖色團契視覺，新增主視覺卡、紙卡質感、暖色題目/選項/收聽區。
- 將三個入口頁 cache version 更新到 `mobile-only-1`。

影響：
- 現在預設所有玩家都會收聽主持音訊廣播；主持不需要判斷玩家是否在現場。
- 手機畫面更接近主持頁的柔和客廳團契風格。

測試：
- `node --check app.js`
- `node --check player.js`
- `node --check display.js`
- `node --check firebase-sync.js`
- `node --check local-qr.js`
- `git diff --check` 通過；只剩 Git 在 Windows 提示 LF 之後會轉 CRLF。
- GitHub Pages 正式網址確認 `player.html?room=soyingpang-guess-song-fellowship-room&test=mobile-only-1` 載入新版資源；玩家頁只顯示名字加入，無「在現場 / 不在現場」選擇。
- Browser 正式網址填名加入一次，確認加入後為遠距手機玩家、收聽區顯示、暖色團契視覺正常。

後續：
- 用真手機掃 QR，確認輸入名字後直接加入、能收到主持音訊，並檢查小螢幕排版。

---

## 2026-05-31 09:32 HKT

類型：程式 / 音訊廣播 / 手機全球模式

摘要：
- 主持頁聲音廣播改成兩種模式：主按鈕「廣播電腦/分頁聲音」，後備按鈕「用咪高峰收聲」。
- 桌面 Chrome / Edge 可用 `getDisplayMedia` 分享播放 YouTube 的分頁音訊，再用 WebRTC / Firebase signaling 送到不在現場玩家手機。
- 開始分頁聲音廣播後，主持頁會嘗試把當前 YouTube iframe / 本地媒體取消靜音，停止廣播時再恢復靜音。
- 將三個入口頁 cache version 更新到 `tab-audio-1`。

影響：
- 解決「手機只聽到主持電腦前咪聲、聽不到電腦播歌」的問題；主持用桌面瀏覽器時應選播放 YouTube 的分頁並勾選分享分頁音訊。
- 咪高峰收聲仍保留，適合手機瀏覽器或不支援分頁音訊分享的環境。

測試：
- `node --check app.js`
- `node --check player.js`
- `node --check display.js`
- `node --check firebase-sync.js`
- `node --check local-qr.js`
- `git diff --check`
- Browser 本機確認主持頁顯示「廣播電腦/分頁聲音」和「用咪高峰收聲」，QR 和 Firebase 房間仍正常，入口頁資源已載入 `tab-audio-1`。

後續：
- 實機用桌面 Chrome / Edge 按「廣播電腦/分頁聲音」，選此 YouTube 分頁並勾選分享音訊，再用手機確認聽到音樂。

---

## 2026-05-31 00:44 HKT

類型：介面 / 手機全球模式 / QR

摘要：
- 主持頁右側玩家區新增「掃碼加入」QR code，玩家可以直接掃主持手機 / 主持電腦畫面入房。
- 主持頁載入本地 `local-qr.js` 產生 QR，不再需要先開可選投影畫面才有玩家 QR。
- 玩家連結移除額外 `v` 參數，避免 GitHub Pages 長網址超出本地 QR 產生器長度限制；HTML script 版本仍保留快取更新。
- 將三個入口頁 cache version 更新到 `host-qr-1`，避免部署後手機沿用舊 `app.js` / `styles.css`。

影響：
- 手機全球版主流程更簡單：主持開 `index.html`，玩家掃 QR 或用玩家連結即可；`display.html` 繼續只作可選投影畫面。

測試：
- `node --check app.js`
- `node --check player.js`
- `node --check display.js`
- `node --check firebase-sync.js`
- `node --check local-qr.js`
- `git diff --check`
- Browser 本機確認主持頁顯示 QR card，QR 是 `data:image/svg+xml`，玩家 URL 沒有 `v` 參數，Firebase 房間仍顯示可連線，入口頁資源已載入 `host-qr-1`。

後續：
- 用實體手機掃主持頁 QR，選「我不在現場」，測主持咪高峰廣播、玩家遠距收聽和搶答。

---

## 2026-05-31 00:38 HKT

類型：部署 / Firebase / 全球手機模式

摘要：
- 使用 Firebase CLI 建立專用 project：`guess-song-260531`。
- 建立 Web app：`Guess Song Web`，並將 config 寫入 `firebase-config.js`，開啟 `enabled: true`。
- 建立 Realtime Database default instance：`guess-song-260531-default-rtdb`，區域為 `asia-southeast1`。
- 新增 `.firebaserc`、`firebase.json` 和 `database.rules.json`，並部署測試 rules，只開放 `rooms/$roomId` 給 B1 全球房間同步使用。

影響：
- 本機和 GitHub Pages 版本會直接使用 Firebase 全球房間，不再只停留在 PeerJS fallback。
- Firebase rules 目前是私人測試用公開讀寫，公開大型活動前應再加房間 token / auth / App Check。

測試：
- `firebase deploy --only database --project guess-song-260531`
- Realtime Database REST smoke test：寫入、讀回、清除 `rooms/codex-smoke-test`。
- Browser 本機確認主持頁顯示「Firebase 全球房間：soyingpang-guess-song-fellowship-room · 可連線」。
- Browser 本機確認玩家頁可選「我不在現場」並加入 Firebase 全球房間；主持頁可讀到測試玩家記錄。

後續：
- 用兩部實體手機測主持咪高峰廣播聲音、玩家遠距收聽、搶答和斷線重入。
- 若聲音一對多上傳不穩，再評估 LiveKit / Agora。

---

## 2026-05-31 00:25 HKT

類型：規格 / 程式 / 介面 / 手機全球模式

摘要：
- 將手機全球版主流程改成「主持頁 + 玩家手機」，不再把「前台 / 後台」作為主要概念。
- 主控頁按鈕和狀態文案改用「投影畫面 / 投影連結 / 主持頁」，display 仍保留作可選大電視或投影用途。
- 玩家端錯誤提示、等待狀態和選項同步提示改用「主持頁」文案，避免玩家以為一定要再開前台。
- 更新 README 和 AI 交接摘要，明確記錄投影畫面只是 optional；B1 全球手機模式主要靠 Firebase + WebRTC + 主持咪高峰廣播。

影響：
- 使用者流程更簡單：主持開主持頁，玩家開手機連結即可；有投影需要時才額外開 `display.html`。
- 現有 `display.html` 同步邏輯未移除，仍支援現場大螢幕。

測試：
- `node --check app.js`
- `node --check player.js`
- `node --check display.js`
- `node --check firebase-sync.js`
- `git diff --check`
- Browser 本機確認主持頁載入 `mobile-flow-1`，主按鈕為「投影畫面」，玩家區為「複製玩家連結 / 複製投影連結」，頁面無前台 / 後台舊字眼。
- Browser 本機確認玩家頁加入後顯示「我在現場 / 我不在現場」，遠距說明是收主持聲音，頁面無前台 / 後台舊字眼。
- Browser 本機確認 `display.html` 標題為「估歌仔 · 投影畫面」，YouTube 登入提示和 reload 按鈕已改為投影文案。

後續：
- 填入 Firebase config 後，再做兩部手機實機測試主持收聲和玩家遠距收聽。

---

## 2026-05-30 22:44 HKT

類型：程式 / 規格 / Firebase / 全球手機模式

摘要：
- 新增 Firebase Realtime Database 支援，作為全球手機房間、玩家名單、題目狀態、搶答事件和 WebRTC signaling 層。
- 新增 `firebase-config.js` 設定樣板和 `firebase-sync.js` Firebase 包裝層；未填 Firebase config 時保持 `enabled: false`，不破壞原本 PeerJS / 本機玩法。
- 主持後台新增「開始現場聲音廣播」按鈕；B1 版本改用主持裝置咪高峰收 YouTube 聲音，再用 WebRTC 傳給選「我不在現場」的玩家手機。
- 玩家頁重新打開「我在現場 / 我不在現場」流程；不在現場手機只收主持聲音和同步題目 / 搶答 / 分數，不再自己播放 YouTube。
- 新增 `docs/FIREBASE_SETUP.md`，記錄 Firebase config、測試 rules、使用流程和限制。

影響：
- 這是「B1 全球手機版」原型：可避免每部玩家手機各自播 YouTube 而出現廣告不同步。
- 聲音質素取決於主持咪高峰收音；這不是擷取 YouTube 內部音訊。
- Firebase 只負責狀態和 signaling，不直接傳音訊。

測試：
- `node --check app.js`
- `node --check player.js`
- `node --check firebase-sync.js`
- `git diff --check`

後續：
- 需要填入真實 Firebase Web app config 和 Realtime Database URL 後，做兩部手機以上實機測試。
- 若穩定性不足或玩家超過約 10 人，下一步應評估 LiveKit / Agora 類音訊伺服器。

---

## 2026-05-21 13:27 HKT

類型：規格 / 修正 / 手機端 / YouTube 安全遮罩

摘要：
- 回應「可否不用手按自動開聲同步」和「畫面走光太多」：確認 YouTube 手機 embed 不能可靠做到不用手按自動有聲，且露出控制列會讓部分歌直接走光。
- `player.js` 移除不在現場 YouTube 的手動控制列模式；YouTube 播放中會顯示「YouTube 手機不能自動開聲」，並保留完整答案遮罩。
- `player.js` 將不在現場 YouTube iframe 改回 `controls=0`，避免控制列或縮圖文字走光。
- `styles.css` 追加安全覆蓋：即使舊狀態 class 出現，也會把 `.phone-remote-shield` 全面覆蓋到底，不再露出底部 YouTube 控制列。
- README / 玩法計劃 / AI 交接改清楚：若要求不手按而自動同步有聲，應改用本地 / 已授權音訊或影片檔；YouTube 手機端以安全遮罩為先。
- cache version 更新至 `phone-youtube-safe-1`。

影響：
- 不在現場手機不再因露出 YouTube 控制列而走光。
- YouTube 題目在手機端不能保證自動有聲；目前安全取向是同步狀態和遮住答案。真正自動有聲需要改用授權媒體檔。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 臨時測試頁載入正式 `player.js`，模擬不在現場 YouTube 播放：確認 cache `phone-youtube-safe-1`、iframe 使用 `autoplay=1` / `controls=0`、狀態顯示「YouTube 手機不能自動開聲」、按鈕 hidden、遮罩文字提示使用本地授權音訊、底部不再露控制列，無 console error；測完已刪除臨時測試頁。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-21 13:13 HKT

類型：修正 / 手機端 / 不在現場開聲 / YouTube 控制列

摘要：
- 再次回應「手機仍然沒有聲」問題，確認 YouTube 手機 embed 必須由玩家實際點中 YouTube iframe 內部控制列，單靠外層按鈕和 postMessage 不可靠。
- `player.js` 新增 `remoteYoutubeManualUnlock` 狀態：按「開聲並同步」後，重建同步 iframe 並進入手動開聲模式。
- `styles.css` 新增 `.phone-remote-media.is-youtube-manual-unlock`：保留主畫面答案遮罩，但露出底部一小條 YouTube 控制列，讓手機觸控可直接落到 YouTube 播放 / 聲音控制。
- 手機提示改為「請點下面 YouTube 控制列開聲」，按鈕文字改為「重新同步控制列」。
- cache version 更新至 `phone-youtube-control-1`。

影響：
- 不在現場手機不再要求玩家盲點遮罩；玩家按「開聲並同步」後，應直接點下面露出的 YouTube 控制列開聲。
- YouTube 廣告、地區限制、手機瀏覽器 autoplay 政策仍不能由程式完全繞過；若控制列仍不能開聲，唯一穩定方案仍是本地 / 已授權音訊或影片檔。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 臨時測試頁載入正式 `player.js`，模擬不在現場 YouTube 播放：初始顯示「請先開聲並同步」；按「開聲並同步」後確認 `#phoneRemoteMedia` 加上 `is-youtube-manual-unlock`、底部露出約 45px YouTube 控制列、提示改為「請點下面 YouTube 控制列開聲」、iframe 使用 `autoplay=1` / `controls=1` 和最新 start 秒數，無 console error；測完已刪除臨時測試頁。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-21 13:04 HKT

類型：修正 / 手機端 / 不在現場開聲 / YouTube

摘要：
- 回應「手機顯示播放中但聽不到聲」問題，調整不在現場手機的 YouTube 開聲流程。
- `player.js` 對 YouTube 同步播放器不再假設已成功開聲；播放中會顯示「請先開聲並同步」。
- `#phoneRemotePlayButton` 改為「開聲並同步 / 重新同步開聲」：玩家按下後會按目前倒數重建 YouTube iframe，並再次送 `seekTo` / `playVideo`。
- 手機遮罩文字改為「點一下開聲 / 再點一下開聲」，而遮罩仍保持不吃 pointer event，讓玩家點遮罩時觸控直接落到 YouTube iframe，同時遮住標題和答案。
- 手機 YouTube iframe 改用 `controls=1`，但仍在遮罩後面，增加手機瀏覽器接受點擊開聲的機會。
- cache version 更新至 `phone-sound-unlock-1`。

影響：
- 不在現場手機現在會更誠實顯示「未必已開聲」，並提供兩步補救：先按「開聲並同步」，仍無聲就點遮罩播放器區域。
- 仍然不能 100% 繞過 YouTube / 手機瀏覽器政策；若該手機或地區被 YouTube 廣告 / autoplay 擋住，玩家需要手動點一下。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認 `player.html` 載入 `phone-sound-unlock-1`，遮罩文字是「點一下開聲」，無 console error。
- Browser 臨時測試頁載入正式 `player.js`，模擬不在現場 YouTube 播放：初始顯示「請先開聲並同步」、iframe 使用 `autoplay=1` / `controls=1`；按「開聲並同步」後確認 iframe 以新 start 秒數重建，按鈕改為「重新同步開聲」，提示改為「如仍無聲，點一下上面遮罩」，無 console error；測完已刪除臨時測試頁。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-21 10:56 HKT

類型：程式 / 手機端 / 不在現場同步播放 / 交接

摘要：
- 回應「不在現場手機必定要同步播放歌」需求，將手機模式改成入房前選「在現場 / 不在現場」，入房後鎖定不可切換。
- `player.html` 將模式選擇移入加入表單，並新增 `#phoneRemoteMedia`、`#phoneRemotePlayerHost`、`#phoneRemotePlayButton`。
- `app.js` 的 player state 新增 `mediaPlaying`、`videoId`、`audioUrl`、`start`、`end`，讓不在現場手機知道同一題要播哪段。
- `player.js` 新增遮罩式同步播放器：不在現場模式會載入同一條 YouTube / 本地授權媒體，按主持播放狀態同步 play / pause，並用遮罩蓋住畫面避免露出歌名或答案。
- 手機瀏覽器如阻擋自動播放，可按「啟用手機播放 / 重新同步播放」，播放器會按主持倒數計算應播放位置並追返進度。
- cache version 更新至 `phone-sync-player-1`。

影響：
- 在現場玩家手機仍不發聲，避免現場多部手機一起播放。
- 不在現場玩家可只用手機加入、答題、看狀態並同步聽歌；YouTube 廣告和手機 autoplay 政策仍可能要玩家按同步按鈕補救。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認 `player.html` 載入 `phone-sync-player-1`，模式按鈕在加入表單內，預設未顯示同步 panel，無 console error。
- Browser 臨時測試頁載入正式 `player.js`，模擬「不在現場」玩家收到主持 state 後，確認入房後模式鎖定、`#phoneRemoteMedia` 顯示、遮罩 YouTube iframe 使用 `autoplay=1` / `controls=0` / 正確 start-end、`重新同步播放` 按鈕顯示，無 console error；測完已刪除臨時測試頁。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-21 10:27 HKT

類型：程式 / 手機端 / 只用手機模式 / 遠端玩家 / 交接

摘要：
- 回應「有些人只用手機端都同時玩到」需求，新增手機端「現場 / 只用手機」切換。
- `player.html` 新增模式切換按鈕和 `#phoneRemotePanel` 手機同步資訊板。
- `player.js` 新增 `PLAYER_REMOTE_MODE_KEY`，會記住玩家偏好；只用手機模式會顯示同步狀態、倒數、A/B 組分、正在開咪的人和玩家分數 / 離線狀態。
- 手機端新增 `updateLiveClock()`，倒數會在手機上自己每 0.7 秒更新，不再只等後台推送 state。
- `styles.css` 新增 `.phone-remote-*` 和 `.player-mode-*` 樣式，保持已加入後的手機畫面緊湊。
- cache version 更新至 `phone-remote-1`。

影響：
- 現場玩家可以保持「現場」模式，手機仍然簡潔作答。
- 外地 / 看不到前台的人可切到「只用手機」，用手機看到更多同步資訊，同時仍可答四選一、搶答 / 搶唱、開咪和看排行榜。
- 這版仍不在手機播放 YouTube / 詩歌聲音，避免每部手機各自出廣告和延遲；遠端聲音應由團契通話 / 直播 / 現場前台音訊處理。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認 `player.html` 載入 `phone-remote-1`，有「現場 / 只用手機」切換和 `#phoneRemotePanel`，無 console error。
- Browser 臨時測試頁載入正式 `player.js`，模擬主持 state 後確認只用手機 panel 顯示倒數、A/B 組分、開咪玩家、玩家分數和離線狀態，無 console error。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-21 10:03 HKT

類型：程式 / 前台玩家名單 / 分數 / 開咪狀態 / 交接

摘要：
- 回應「前台顯示已加入的人、每個人分數、誰開緊咪」需求，新增前台玩家狀態名單。
- `app.js` 的 display state 新增 `players`，並在 `stripPlayer()` 加入 `micActive`，讓前台知道玩家是否開咪。
- 玩家手機送出 `mic-start`、後台收到 mic stream、收咪 / mic call 關閉時，會即時 `publishDisplayState()` 同步前台。
- `display.html` 新增 `#stageRoster`，`display.js` 新增 `renderRoster()` 顯示已加入玩家、A/B 組、分數、離線和開咪狀態。
- `styles.css` 新增 `.stage-roster` 相關樣式，前台左下顯示玩家狀態，QR 仍保留右下；手機咪音訊浮層改為避開玩家名單。
- cache version 更新至 `stage-roster-1`。

影響：
- 前台現在可以即時看到誰已加入、分數是多少、屬於 A/B 哪一組，以及誰正在開咪。
- 前台排行榜仍維持原本「主持按排行榜才顯示結算」的用途；這次新增的是常駐簡潔玩家狀態，不取代完場排行榜。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認 `display.html` 載入 `stage-roster-1`，無 console error。
- Headless Chrome 臨時測試頁載入正式 `display.js` / `local-qr.js`，用模擬 display state 確認 `#stageRoster` 顯示玩家、分數、A/B 組、`開咪` 和 `離線` 狀態。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

---

## 2026-05-21 09:53 HKT

類型：程式 / 手機咪高峰 / 前台播放 / 交接

摘要：
- 回應「手機咪應該要前台聽到」需求，加入後台轉發手機咪到前台的流程。
- `app.js` 在收到玩家手機 `micStream` 後，會向每個已連接的前台 display peer 建立 media call，metadata type 為 `display-player-mic`。
- 前台 `display.js` 新增 `peer.on("call")` 接收 forwarded mic stream，並建立 `.stage-mic-layer` 音訊浮層播放手機咪。
- 如果前台瀏覽器阻擋自動播放，浮層會顯示音訊控制列和「點一下播放手機咪」，方便現場補救。
- display 斷線、玩家收咪或 mic call 關閉時，會清理對應的 forwarded media call / audio 元件。
- cache version 更新至 `stage-mic-1`。

影響：
- 玩家按「開咪對話」後，聲音不再只在後台聽到；已連接的前台也會收到並播放。
- 現場要留意手機和喇叭距離，避免回音 / 嘯叫。

測試：
- `node --check app.js`
- `node --check display.js`
- `node --check player.js`
- `node --check local-qr.js`
- `node --check server.js`
- `git diff --check`
- Browser 本機確認 `display.html` 載入 `stage-mic-1` 的 CSS / JS，無 console error。
- 真手機咪高峰需要在現場或實機瀏覽器再測音量、回音和自動播放是否被阻擋；若被阻擋，前台會顯示音訊控制列可點一下播放。

後續：
- 本次修正會即時 commit 並 push 到 GitHub。

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
