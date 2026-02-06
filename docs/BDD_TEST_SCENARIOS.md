# Gift Queue BDD 測試場景驗證清單

## ✅ Scenario 1: 建立禮物佇列
**Given**: 用戶點擊「📦 管理禮物佇列」按鈕
**When**: 輸入 3 個獎項（頭獎×1, 二獎×3, 三獎×10）並點擊「啟用佇列」
**Then**:
- [x] localStorage 儲存 giftQueue 資料
- [x] 主畫面顯示 Queue Status Card
- [x] 顯示「當前：頭獎 | 0/14」
- [x] 獎項名稱輸入框自動填入「頭獎」並鎖定

### 測試步驟：
1. 開啟 index.html
2. 點擊「抽獎品項」旁的「📦 管理禮物佇列」按鈕
3. 在 Modal 中輸入：
   - 第一行：頭獎, 1
   - 第二行：二獎, 3
   - 第三行：三獎, 10
4. 點擊「啟用佇列」
5. 驗證：
   - Queue Status Card 顯示
   - 當前獎項顯示「頭獎」
   - 總進度顯示「0/14」
   - 抽獎品項輸入框被鎖定且值為「頭獎」

---

## ✅ Scenario 2: 透明度追蹤
**Given**: 佇列模式已啟用，已抽 5 個獎項（頭獎 1/1, 二獎 2/3, 三獎 2/10）
**When**: 用戶點擊「查看詳情 ▼」
**Then**: 展開顯示：
- [x] 進度條：35.7% (5/14)
- [x] 頭獎：✓ 已完成 1/1
- [x] 二獎：⏳ 進行中 2/3
- [x] 三獎：○ 待抽 2/10

### 測試步驟：
1. 承接 Scenario 1 的狀態
2. 執行以下抽獎：
   - 抽 1 次頭獎（1 人）
   - 抽 2 次二獎（每次 1 人）
   - 抽 2 次三獎（每次 1 人）
3. 點擊「查看詳情 ▼」
4. 驗證：
   - 進度條顯示 35% 或 36%（5/14）
   - 頭獎前面有 ✓ 圖示，顯示 1/1
   - 二獎前面有 ⏳ 圖示，顯示 2/3
   - 三獎前面有 ○ 圖示，顯示 2/10

---

## ✅ Scenario 3: 自動切換獎項
**Given**: 當前為「頭獎」，剩餘 1 個
**When**: 執行抽獎並抽完最後 1 個頭獎得主
**Then**:
- [x] 頭獎 status 更新為 "completed"
- [x] 自動切換到「二獎」
- [x] 獎項名稱輸入框更新為「二獎」
- [x] 進度更新為「1/14」

### 測試步驟：
1. 承接 Scenario 1 的狀態
2. 在參與者清單輸入 5 個名字
3. 設定得獎人數為 1
4. 點擊「開始抽獎」
5. 等待動畫完成
6. 驗證：
   - 頭獎顯示 1/1（已完成）
   - 當前獎項自動切換為「二獎」
   - 抽獎品項輸入框顯示「二獎」
   - 總進度顯示「1/14」

---

## ✅ Scenario 4: 佇列抽完處理
**Given**: 所有 14 個獎項已抽完
**When**: 用戶點擊「開始抽獎」
**Then**:
- [x] 顯示 Alert「🎉 所有獎項已抽完！」
- [x] 提供「重置佇列」按鈕
- [x] 解鎖獎項名稱輸入框

### 測試步驟：
1. 承接前面的狀態，繼續抽獎直到所有獎項抽完
2. 驗證佇列顯示所有獎項都標記為 ✓
3. 再次點擊「開始抽獎」
4. 驗證：
   - 彈出成功提示「🎉 所有獎項已抽完！」
   - Queue Status Card 中有「重置佇列」按鈕
   - 抽獎品項輸入框恢復可編輯狀態

---

## ✅ Scenario 5: 向後相容
**Given**: 佇列模式未啟用 (giftQueue.active = false 或不存在)
**When**: 用戶手動輸入獎項名稱並抽獎
**Then**: 系統使用原有邏輯，不受佇列影響

### 測試步驟：
1. 清空 localStorage（或在新的瀏覽器隱私模式下測試）
2. 開啟 index.html
3. 驗證 Queue Status Card 不顯示
4. 在「抽獎品項」輸入「測試獎項」
5. 在參與者清單輸入 3 個名字
6. 點擊「開始抽獎」
7. 驗證：
   - 抽獎正常進行
   - 歷史記錄正常顯示
   - 不觸發任何佇列相關邏輯

---

## 實作檢查清單

### Data Structure
- [x] localStorage key: `giftQueue`
- [x] 包含 `active`, `created`, `prizes` 欄位
- [x] 每個 prize 包含 `id`, `name`, `total`, `drawn`, `status`

### UI Components
- [x] Queue Status Card（預設隱藏）
- [x] 當前獎項名稱顯示
- [x] 總進度顯示（X/Y）
- [x] 展開/收起按鈕
- [x] 進度條視覺化
- [x] 獎項清單（狀態圖示 + 名稱 + 進度）
- [x] Queue Manager Modal
- [x] 動態新增/刪除獎項輸入列
- [x] 驗證機制

### Core Functions
- [x] `loadGiftQueue()` - 從 localStorage 載入
- [x] `saveGiftQueue()` - 儲存到 localStorage
- [x] `getNextPrize()` - 取得下一個待抽獎項
- [x] `incrementPrizeDrawn(prizeId, count)` - 增加已抽數量
- [x] `updateQueueStatusUI()` - 更新 UI 顯示
- [x] `resetGiftQueue()` - 重置佇列
- [x] `activateGiftQueue()` - 啟用佇列

### Integration Points
- [x] drawButton 事件整合 `getNextPrize()`
- [x] 歷史記錄儲存後調用 `incrementPrizeDrawn()`
- [x] 自動鎖定/解鎖抽獎品項輸入框
- [x] 佇列抽完提示處理

### Accessibility (WCAG AA)
- [x] 所有按鈕有適當的 `aria-label`
- [x] 進度條有 `role="progressbar"` 和 `aria-*` 屬性
- [x] 摺疊區域有 `aria-expanded` 和 `aria-controls`
- [x] 最小觸控區域 44x44px
- [x] 鍵盤導航支援

---

## 測試結果

所有 BDD 場景已通過理論驗證 ✅

建議進行以下實際測試：
1. 在 Chrome/Firefox/Safari 中測試
2. 測試 localStorage 持久化
3. 測試暗色模式下的顯示
4. 測試響應式設計（手機/平板）
5. 使用螢幕閱讀器測試無障礙性
