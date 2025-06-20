# Safari 材質測試指南

## 問題描述

Safari 瀏覽器在處理 Three.js BoxGeometry 多材質貼圖時會發生材質錯位問題，主要表現為：
- 材質貼圖在錯誤的面上顯示
- CanvasTexture 更新時機問題導致舊畫面殘留
- flipY 屬性在不同瀏覽器間行為不一致
- 混合 WebGL/CSS3D 渲染可能導致相容性問題

## 修復方案概覽

### 1. Safari 檢測與動態調整
- 新增 `isSafari()` 函數進行用戶代理檢測
- Safari 環境下自動調整 `flipY` 屬性
- 強化 `needsUpdate` 機制避免快取問題

### 2. 材質渲染優化
- 改用 `THREE.DoubleSide` 避免單面渲染問題
- 統一同步材質生成流程
- 優化材質更新時機

### 3. 除錯測試工具
- 6色材質對應測試
- 渲染器分離測試
- 詳細日誌輸出

## 測試方法

### A. 基本功能測試

#### 1. 正常模式測試
```
URL: index.html
用途: 檢查修復後的正常運作
預期結果: 
- 文字正確顯示在卡片正面
- Logo 正確顯示在卡片背面
- 無材質錯位現象
```

#### 2. Safari 環境測試
```
瀏覽器: Safari (macOS/iOS)
URL: index.html
檢查項目:
- 開啟開發者工具查看 Console 日誌
- 確認 isSafari: true
- 確認 flipY 設定正確
- 驗證材質更新正常
```

### B. 除錯模式測試

#### 1. 六色材質對應測試
```
URL: index.html?debug=materials
用途: 驗證 BoxGeometry 六面材質映射
測試步驟:
1. 開啟除錯模式 URL
2. 執行抽獎動畫
3. 觀察 3D 卡片六面顏色

預期結果:
- 右面 (+X): 紅色 (0xFF0000)
- 左面 (-X): 綠色 (0x00FF00)  
- 上面 (+Y): 藍色 (0x0000FF)
- 下面 (-Y): 黃色 (0xFFFF00)
- 前面 (+Z): 洋紅 (0xFF00FF) - 應該是文字面
- 後面 (-Z): 青色 (0x00FFFF) - 應該是 Logo 面

異常判斷:
- 如果顏色對應錯誤，表示材質映射有問題
- 如果前後面顏色交換，可能是 flipY 設定問題
```

#### 2. 渲染器分離測試

##### WebGL 單獨測試
```
URL: index.html?render=webgl
用途: 隔離測試 WebGL 渲染器
預期結果:
- 只有 WebGL 3D 效果顯示
- CSS3D 文字層被禁用
- 背景粒子效果正常
```

##### CSS3D 單獨測試
```
URL: index.html?render=css3d
用途: 隔離測試 CSS3D 渲染器
預期結果:
- 只有 CSS3D 文字層顯示
- WebGL 3D 背景被禁用
- 文字渲染清晰
```

##### 混合模式測試
```
URL: index.html
用途: 預設混合渲染模式
預期結果:
- WebGL 和 CSS3D 同時運作
- 無渲染衝突
- 性能穩定
```

### C. 跨瀏覽器對比測試

#### 測試瀏覽器清單
```
✓ Chrome (Windows/macOS)
✓ Firefox (Windows/macOS)
✓ Safari (macOS)
✓ Safari (iOS)
✓ Edge (Windows)
```

#### 對比測試項目
```
1. 材質顯示正確性
   - 文字是否在正確面上
   - Logo 是否在正確面上
   - 顏色是否正確

2. 動畫流暢度
   - 卡片翻轉動畫
   - 材質切換效果
   - 整體性能表現

3. 特殊情況處理
   - 長文字處理
   - 特殊字符顯示
   - 圖片載入失敗處理
```

## 除錯日誌解讀

### 正常日誌示例
```javascript
Created materials for card: 張三 {
  frontMaterial: "with texture",
  backMaterial: "with texture", 
  isSafari: true,
  debugMode: false
}
CSS3DRenderer loaded successfully {
  renderTestMode: false,
  webglOnly: false,
  css3dOnly: false
}
```

### 除錯模式日誌
```javascript
Debug mode: Using 6-color test materials for Safari compatibility verification
Safari 渲染測試模式: Mixed Mode
```

### 異常日誌警示
```javascript
// 材質創建失敗
Material creation failed for card: 張三

// Logo 載入失敗
Failed to create logo material, using fallback

// 渲染器初始化失敗
CSS3DRenderer not available or disabled, using enhanced WebGL-only mode
```

## 常見問題排查

### 1. 材質錯位問題
```
症狀: 文字顯示在背面，Logo 顯示在正面
檢查: flipY 設定是否正確
解決: 確認 isSafari() 檢測正常運作
```

### 2. 材質模糊問題
```
症狀: 文字或圖片顯示模糊
檢查: devicePixelRatio 和解析度設定
解決: 調整 superRes 或 pixelRatio 參數
```

### 3. 材質更新延遲
```
症狀: 材質內容未即時更新
檢查: needsUpdate 是否正確設置
解決: 確認所有 texture.needsUpdate = true 呼叫
```

### 4. 性能問題
```
症狀: 動畫卡頓或記憶體占用過高
檢查: 材質解析度設定
解決: 適當降低 superRes 或啟用材質快取
```

## 測試檢查清單

### 功能測試
- [ ] 正常抽獎流程完整
- [ ] 文字正確顯示在卡片正面
- [ ] Logo 正確顯示在卡片背面
- [ ] 動畫流暢無卡頓
- [ ] 支援長文字和特殊字符

### 相容性測試
- [ ] Chrome 顯示正常
- [ ] Firefox 顯示正常
- [ ] Safari macOS 顯示正常
- [ ] Safari iOS 顯示正常
- [ ] Edge 顯示正常

### 除錯工具測試
- [ ] 六色測試模式正常運作
- [ ] WebGL 單獨模式正常
- [ ] CSS3D 單獨模式正常
- [ ] 日誌輸出完整正確

### 錯誤處理測試
- [ ] 圖片載入失敗有後備方案
- [ ] 材質創建失敗有錯誤處理
- [ ] 渲染器初始化失敗有降級處理

## 版本更新記錄

### v1.0 (2025-06-20)
- 實作 Safari 用戶代理檢測
- 新增動態 flipY 調整機制
- 強化 CanvasTexture 更新機制
- 實作 DoubleSide 材質渲染
- 新增六色除錯測試模式
- 新增渲染器分離測試功能
- 統一同步材質生成流程

## 相關文件連結

- [Three.js BoxGeometry 文檔](https://threejs.org/docs/#api/en/geometries/BoxGeometry)
- [Three.js CanvasTexture 文檔](https://threejs.org/docs/#api/en/textures/CanvasTexture)
- [Safari WebGL 相容性資訊](https://webkit.org/blog/8482/web-high-level-shading-language/)

---

*此文件記錄了 Safari 材質測試的完整流程，請在修改相關代碼後務必按此指南進行測試驗證。*