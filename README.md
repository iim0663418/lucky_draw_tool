1. **專案概述:**
   本專案為一個基於《Static Web Page》的《Lucky Draw》抽獎小程式，使用者可自訂參與者清單、抽獎品項、亂數種子與得獎人數，支援「允許重複中獎」選項，並提供「剩餘參與者列表」與「歷史紀錄分頁」功能。

2. **功能特性:**

   * 支援「輸入參與者名單」後每行一位的文字框，用於多筆名單匯入；
   * 可設定「抽獎品項」並顯示於中獎紀錄；
   * 使用者可輸入自訂「亂數種子」或留空以系統時間作為種子，確保結果可重現；
   * 可指定「得獎人數」，若未勾選「允許重複中獎」，則中獎者會從名單移除；
   * 顯示「剩餘參與者清單」，讓使用者即時查看尚未中獎的名單；
   * 中獎時自動顯示「3…2…1 倒數動畫」與《Canvas Confetti》慶祝效果；
   * 將每次抽獎結果（包含品項、時間、種子、得獎者與允許重複狀態）儲存在《localStorage》，並在「歷史紀錄」區塊以「分頁」方式呈現；
   * 可在「歷史紀錄」區塊使用下拉選單進行「品項篩選」，並支援「清除全部紀錄」功能；
   * 前端介面使用《Bootstrap 5》實現響應式佈局與按鈕樣式，適應桌面與行動裝置。

3. **檔案結構:**

   * `index.html`：主頁面，包含整體佈局與必要連結；
   * `css/style.css`：自訂樣式檔，涵蓋《倒數動畫》、《中獎卡片動畫》、《剩餘名單淡入效果》與版面配置；
   * `js/script.js`：前端邏輯檔，實現「亂數洗牌」、「倒數動畫」、「歷史紀錄分頁篩選」、「剩餘參與者渲染」等核心功能；
   * 其他資源皆引用 CDN，例如《Bootstrap 5》與《Canvas Confetti》函式庫。

4. **環境需求:**

   * 支援現代瀏覽器（Chrome、Firefox、Edge、Safari 等），必須啟用《JavaScript》與《Web Crypto API》；
   * 由於使用《localStorage》儲存歷史紀錄，需要使用者的瀏覽器允許本地儲存；
   * 本專案僅為靜態網站，不需伺服器端運算，可直接部署於「GitHub Pages」或任何靜態服務。

5. **安裝與部署:**

   * 於本機建立資料夾並將專案檔案放置於根目錄；
   * 若要在《GitHub Pages》上部署：

     1. 建立新的 Git 儲存庫（如 `username.github.io`）並切換至 `gh-pages` 分支；
     2. 將 `index.html`、`css/style.css`、`js/script.js` 推送至該分支根目錄；
     3. 於儲存庫「Settings → Pages」中選擇 `gh-pages` 分支與「/ (root)」資料夾作為來源；
     4. 等待數分鐘，訪問 `https://username.github.io/` 即可看到抽獎小程式；
   * 若使用其他靜態主機服務（如 Netlify、Vercel 等），只要將整個資料夾上傳並指向 `index.html` 即可。

6. **使用說明:**

   * 在「參與者清單」文字框中，每行輸入一個參加者姓名；
   * 在「抽獎品項」欄位輸入要抽出的禮品名稱，若留空顯示為「未命名品項」；
   * 可選擇「亂數種子」（如 `123456` 或 `luckyday2024`），若留空則由系統自動以當前時間作為種子；
   * 「得獎人數」預設為 5，可自行修改為所需數量；
   * 勾選「允許重複中獎」後，同一位參與者可重複中獎，否則每位中獎者在中獎後會從名單移除；
   * 按下「🎲 開始抽獎！」後，畫面中央會顯示「倒數 3…2…1」與《Canvas Confetti》動畫，接著顯示每位中獎者姓名卡片；
   * 如未勾選「允許重複中獎」，可在「剩餘參與者清單」區塊查看尚未中獎名單；
   * 每次抽獎結果會存於「歷史紀錄」區塊，可透過上方「品項篩選」與「分頁」功能快速查詢過往紀錄；
   * 若要清除所有歷史紀錄，點擊「清除全部紀錄」按鈕並確認即可。

7. **自訂與參數:**

   * 如需修改「單頁歷史紀錄顯示筆數」，可在 `js/script.js` 中調整 `PAGE_SIZE` 常數值；
   * 若想更改歷史紀錄保留筆數（預設最多 10 筆），可在 `js/script.js` 中修改 `historyList.splice(10)` 的數字；
   * 若要增加其他欄位（例如「抽獎地點」或「備註」），請在 `index.html` 中新增相應輸入欄位，並在 `script.js` 的 `newRecord` 物件中加入對應屬性；
   * 可替換《Bootstrap 5》與《Canvas Confetti》CDN 為本地檔案，請下載相應資源並修改 `index.html` 中的 `<link>`／`<script>` 標籤。

8. **注意事項:**

   * 本專案為前端純靜態程式，請勿放置伺服器端程式（如 Node.js、PHP），否則無法透過《GitHub Pages》正常顯示；
   * 若瀏覽器不支援《Web Crypto API》，亂數洗牌邏輯將無法正常執行，建議使用最新版本的 Chrome 或 Firefox；
   * 「允許重複中獎」與「剩餘參與者」功能須在使用者輸入名單後點擊一次抽獎，才能正確顯示；
   * 若「歷史紀錄分頁」無法顯示，請先確認 `localStorage` 中是否已有 `drawHistory` 記錄；
   * 若欲在 HTTPS 網域部署，請確保《Canvas Confetti》CDN 與《Bootstrap 5》CDN 皆可透過 HTTPS 存取。

9. **授權條款:**
   本專案採用【Apache-2.0 License】，詳細內容請參考 `LICENSE` 檔案，允許任何人自由使用、修改與再散布，惟須保留原始版權與授權聲明。

10. **更新說明：全頁倒數遮罩與自動滾動功能**

    1. **新增全頁倒數遮罩結構（`index.html`）**

       ```html
       <!-- 倒數遮罩 Start -->
       <div id="overlay" class="overlay">
         <div class="blur-bg"></div>
         <div id="countdownContainer" class="countdown-container"></div>
       </div>
       <!-- 倒數遮罩 End -->
       ```

       * `#overlay`：整個遮罩元素，初始隱藏，透過 `.show` 類別切換顯示。
       * `.blur-bg`：背景半透明模糊層，用於視覺上聚焦倒數數字。
       * `#countdownContainer`：顯示倒數數字的容器，動畫結束後會移除該子元素。

    2. **新增遮罩與倒數樣式（`css/style.css`）**

       ```css
       /* 全頁遮罩 */
       .overlay {
         display: none !important;
         position: fixed;
         top: 0; left: 0;
         width: 100%; height: 100%;
         background: rgba(0, 0, 0, 0.8);
         z-index: 9999;
         align-items: center;
         justify-content: center;
         flex-direction: column;
       }
       .overlay.show {
         display: flex !important;
       }
       .blur-bg {
         position: absolute;
         top: 0; left: 0;
         width: 100%; height: 100%;
         background: rgba(0, 0, 0, 0.4);
         backdrop-filter: blur(10px);
         -webkit-backdrop-filter: blur(10px);
         z-index: 1;
       }
       /* 倒數數字動畫 */
       .countdown-number {
         font-size: 6rem;
         color: #fff;
         animation: countdownFade 1s ease-in-out;
         position: relative;
         z-index: 2;
       }
       @keyframes countdownFade {
         0%   { opacity: 0; transform: scale(0.8); }
         50%  { opacity: 1; transform: scale(1.2); }
         100% { opacity: 0; transform: scale(0.8); }
       }
       /* 遮罩淡出動畫 */
       .overlay.fade-out {
         animation: overlayFade 1s forwards;
       }
       @keyframes overlayFade {
         0%   { background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(10px); }
         100% { background: rgba(0, 0, 0, 0); backdrop-filter: blur(0px); }
       }
       ```

       * `.overlay` / `.overlay.show`：控制遮罩的顯示與隱藏。
       * `.blur-bg`：實現背景模糊效果，增強倒數焦點。
       * `.countdown-number`：每個倒數數字淡入淡出動畫。
       * `.overlay.fade-out`：遮罩淡出過渡，倒數結束後先淡出效果再隱藏。

    3. **新增倒數與自動滾動邏輯（`js/script.js`）**

       ```js
       // 顯示倒數遮罩
       async function showCountdownOverlay() {
         const overlay = document.getElementById('overlay');
         const container = document.getElementById('countdownContainer');
         container.innerHTML = '';
         overlay.classList.add('show'); // 顯示遮罩

         for (let c = 3; c > 0; c--) {
           const div = document.createElement('div');
           div.className = 'countdown-number';
           div.textContent = c;
           container.appendChild(div);
           void div.offsetWidth; // 觸發動畫重播
           await new Promise(r => setTimeout(r, 1000));
           container.removeChild(div);
         }
         // 倒數結束後淡出遮罩
         overlay.classList.add('fade-out');
         setTimeout(() => {
           overlay.classList.remove('show', 'fade-out');
         }, 1000);
       }

       // 自動平滑滾動至中獎名單
       function scrollToWinners() {
         const container = document.getElementById('winnersContainer');
         if (container) {
           setTimeout(() => {
             container.scrollIntoView({ behavior: 'smooth', block: 'start' });
           }, 100); // 100ms 延遲以確保卡片已渲染
         }
       }

       document.getElementById('drawButton').addEventListener('click', async function () {
         this.disabled = true;
         this.textContent = '抽取中…';

         // 驗證參與者、種子與得獎人數
         // … 略 …

         // 1) 顯示全頁倒數遮罩
         await showCountdownOverlay();

         // 2) 進行抽獎並渲染中獎卡片
         const shuffled = await shuffleWithSHA256(participants, seed);
         const winners = shuffled.slice(0, winnerCount);
         winnersContainer.innerHTML = '';
         winners.forEach((name, index) => {
           const col = document.createElement('div');
           col.className = 'col-md-4';
           const card = document.createElement('div');
           card.className = 'card winner-card';
           card.style.animationDelay = `${index * 0.2}s`;
           const cardBody = document.createElement('div');
           cardBody.className = 'card-body text-center';
           const title = document.createElement('h5');
           title.className = 'card-title';
           title.textContent = `🎉 ${name}`;
           const subtitle = document.createElement('p');
           subtitle.className = 'card-text text-muted';
           subtitle.textContent = '恭喜中獎！';
           cardBody.appendChild(title);
           cardBody.appendChild(subtitle);
           card.appendChild(cardBody);
           col.appendChild(card);
           winnersContainer.appendChild(col);
         });

         // 3) 自動滾動至「中獎名單」
         scrollToWinners();

         // 4) 更新剩餘名單與歷史紀錄
         // … 略 …

         // 5) 恢復按鈕狀態
         setTimeout(() => {
           this.disabled = false;
           this.textContent = '🎲 開始抽獎！';
         }, 500);
       });
       ```

       * **`showCountdownOverlay()`**：觸發全頁遮罩、顯示「3、2、1」倒數，並在倒數結束後淡出遮罩；
       * **`scrollToWinners()`**：倒數結束並渲染完卡片後，自動將畫面平滑捲動至卡片區頂端；
       * **整合在 `drawButton` 點擊事件**：依序呼叫倒數、抽獎、渲染與自動滾動。

    4. **更新「歷史紀錄」渲染容器**

       * 原先使用 `#historyContainerContent`，改回使用 `#historyContainer`，以保持結構一致；
       * 若需保留內容分層，可透過新增內層容器並調整對應 ID 及 `renderHistoryPage()` 內寫入目標。

    5. **其他輔助邏輯與原有功能維持不變**

       * `shuffleWithSHA256(array, seed)`：維持原有 Web Crypto API 洗牌邏輯；
       * 「剩餘參與者渲染」、「歷史紀錄分頁」等功能保留，以確保核心體驗不受影響。

---

## 6. 測試與驗證

1. **功能測試**

   * 點擊「🎲 開始抽獎！」後，應顯示全頁倒數遮罩並播放「3…2…1」倒數動畫；
   * 倒數結束後，遮罩應平滑淡出並自動將畫面捲動至 「中獎名單」區塊頂端；
   * 中獎卡片應正確依序渲染，並顯示「恭喜中獎」提示；
   * 如果勾選「允許重複中獎」，則中獎者不會從名單移除；反之，應自動更新「剩餘參與者清單」；
   * 歷史紀錄可正確以「品項篩選」與「分頁」方式呈現，並可清除全部紀錄。

2. **相容性檢測**

   * 在桌面與行動裝置上分別測試，確保倒數遮罩與自動滾動在小螢幕亦能正常運作；
   * 若「blur (模糊)」效果在某些瀏覽器失效，應檢查 `backdrop-filter` 是否支援，並使用 CSS fallback（如純半透明背景）；
   * 確認 `scrollIntoView({ behavior: 'smooth' })` 在行動瀏覽器是否支援，若不支援可改用 `window.scrollTo({ top: ..., behavior: 'auto' })`。

3. **性能與流暢度**

   * 大量中獎卡片渲染後，會自動滾動至頂端，不會因卡片過多而卡頓；
   * 倒數遮罩與卡片動畫皆採 CSS 動畫，確保在不同裝置都能保持流暢；
   * 小螢幕上關閉卡片放大動畫與折疊「剩餘參與者清單」，減少不必要渲染成本。
