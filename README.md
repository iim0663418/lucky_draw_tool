# moda 幸運抽獎工具

專業的線上抽獎系統，採用 SHA-256 演算法確保公平性，提供震撼的 3D 視覺效果。

## 線上體驗

https://iim0663418.github.io/lucky_draw_tool/

## 核心功能

### 抽獎系統
- SHA-256 演算法確保公平性與可重現性
- 支援多人同時抽獎
- 可選擇是否允許重複中獎
- 完整的歷史記錄管理
- JSON 格式匯出功能

### 獎品佇列管理
- 多獎品批次管理與即時編輯
- 漸進式揭露 UI（新增/編輯模式切換）
- 即時 KPI 追蹤（總名額、已抽出、剩餘）
- 一鍵清空與個別刪除功能

### 視覺效果
- 3D 爆炸粒子系統（星星、火花、彩色碎片）
- 螢幕震動與閃光效果
- 物理擬真動畫（重力、拋物線軌跡）
- CSS3D + WebGL 混合渲染
- 響應式設計

### 使用者體驗
- Noto Sans TC 字體優化
- 載入狀態指示
- 友善的錯誤訊息
- 日夜間模式切換
- WCAG AA 無障礙標準

## 技術架構

### 前端技術
- Three.js (WebGL + CSS3DRenderer)
- TWEEN.js 動畫系統
- Bootstrap 5 UI 框架
- 自建粒子引擎

### 效能優化
- 持續渲染模式（60fps）
- 智慧資源管理
- 硬體加速
- 跨瀏覽器相容

## 專案結構

```
lucky_draw_tool/
├── index.html          # 主頁面
├── css/
│   └── style.css       # 樣式與動畫
├── js/
│   └── script.js       # 核心邏輯與 3D 引擎
├── README.md
├── CHANGELOG.md
└── PROJECT_STRUCTURE.md
```

## 使用說明

### 基本操作
1. 在文字框中每行輸入一位參與者姓名
2. 輸入抽獎品項名稱
3. 設定得獎人數
4. 點擊「開始抽獎」

### 佇列模式操作
1. 點擊「新增獎品」建立多個抽獎品項
2. 設定各品項名稱與得獎人數
3. 使用「編輯」修改或「刪除」移除品項
4. 依序點擊「抽獎」進行漸進式抽獎
5. 即時查看剩餘名額與抽獎進度

### 進階功能
- 使用亂數種子重現抽獎結果
- 依品項篩選歷史記錄
- 匯出 JSON 格式記錄
- 切換日夜間模式

## 部署

### GitHub Pages
1. Fork 此專案
2. Settings > Pages > 選擇 main 分支
3. 訪問 `https://username.github.io/lucky_draw_tool/`

### 本地開發
```bash
git clone https://github.com/iim0663418/lucky_draw_tool.git
cd lucky_draw_tool
python -m http.server 8000
```

## 最新更新

### v5.0 (2026-02-06)
- 新增獎品佇列管理系統（515 行核心代碼）
- 漸進式 UI 與即時 KPI 儀表板
- 批次獎品編輯與刪除功能
- 完整的佇列狀態管理

### v4.1 (2026-01-23)
- 引入 Noto Sans TC 字體
- 新增載入狀態 spinner
- 改善錯誤訊息顯示
- 增加完整 SEO metadata
- 修復暗色模式文字顏色

### v4.0
- 3D 爆炸粒子系統
- 螢幕震動效果
- 光點粒子動畫
- 物理模擬系統

## 自訂設定

### 爆炸粒子數量
```javascript
// js/script.js
const mainExplosion = createExplosionParticles(position, 40);
const secondWave = createExplosionParticles(position, 25);
```

### 震動強度
```javascript
triggerCameraShake(0.15, 0.8);  // 強度, 持續時間
```

## 瀏覽器支援

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

需要 WebGL 與 CSS3D 支援。

## 授權

Apache-2.0 License

## 致謝

- PDIS 抽籤工具 - 演算法靈感
- Three.js - 3D 引擎
- TWEEN.js - 動畫系統
- Bootstrap - UI 框架
