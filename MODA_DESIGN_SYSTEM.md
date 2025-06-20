# Moda 設計系統整合指南

## 🎨 設計系統概覽

本專案已完全整合 Moda 官網的設計系統，包含色彩、字體、組件風格等，確保視覺一致性和品牌統一性。

## 📋 色彩系統

### 主要品牌色彩
```css
--brand: #6968ac          /* 主要品牌色 */
--brand-strong: #03429c   /* 強調品牌色 */
--brand-flat: #d8e2ff     /* 淺色品牌色 */
--brand-flat-strong: #afc6ff /* 強調淺色品牌色 */
```

### 輔助色彩
```css
--accent: #705d00         /* 金黃色輔助色 */
--accent-flat: #ffe25b    /* 淺金黃色 */
--accent-flat-strong: #e7c400 /* 強調金黃色 */
```

### 語義色彩
```css
--positive: #286b2a       /* 成功/正面 */
--negative: #ba1b1b       /* 錯誤/負面 */
--warning: #a53d00        /* 警告 */
--information: #006687    /* 資訊 */
```

### 中性色彩
```css
--surface: #fdfbff        /* 主要表面色 */
--background: #FAFDF9     /* 背景色 */
--on-surface: #191C1B     /* 表面文字色 */
--on-background: #191C1B  /* 背景文字色 */
--outline: #d0d1d3        /* 邊框線色 */
```

## 🖋️ 字體系統

### 字體族
```css
--font-body: 'Noto Sans', 'Noto Sans TC', sans-serif
--font-heading: 'Noto Sans', 'Noto Sans TC', sans-serif
```

### 字重規範
- **300**: 正文內容 (Light)
- **400**: 標題副標 (Regular) 
- **500**: 重要按鈕 (Medium)
- **700**: 特殊強調 (Bold) - 僅用於特殊情況

## 🎯 組件更新內容

### 1. 應用標題 (.app-header)
- **背景**: 漸變設計 `linear-gradient(135deg, brand → brand-strong)`
- **圓角**: 底部圓角 `border-radius-lg`
- **陰影**: 品牌色陰影 `rgba(105, 104, 172, 0.3)`
- **字重**: 從 700 調整為 400，更符合現代設計

### 2. 主要按鈕 (.btn-draw)
- **背景**: 金色漸變 `linear-gradient(135deg, accent-flat-strong → accent)`
- **圓角**: 增大至 12px
- **陰影**: 金色光暈效果
- **懸停**: 反向漸變 + 縮放效果

### 3. 卡片系統 (.card)
- **圓角**: 統一使用 16px
- **陰影**: 多層次軟陰影設計
- **邊框**: 細邊框設計
- **過渡**: 使用 cubic-bezier 緩動函數

### 4. 表單控件 (.form-control, .form-select)
- **圓角**: 8px
- **內邊距**: 0.75rem 1rem
- **焦點**: 3px 品牌色外框
- **字重**: 300 (Light)

### 5. 分頁組件 (.pagination)
- **活躍狀態**: 品牌色漸變背景
- **圓角**: 8px
- **字重**: 400 (Regular)

### 6. 主題切換按鈕 (.theme-toggle-button)
- **尺寸**: 56x56px (增大)
- **背景**: 品牌色漸變
- **邊框**: 2px 白色邊框
- **懸停**: 180度旋轉 + 縮放效果

### 7. 中獎卡片 (.highlight-winner)
- **背景**: 三色漸變設計
- **圓角**: 24px
- **背景模糊**: backdrop-filter
- **陰影**: 品牌色光暈

## 🎭 主題系統

### 日間模式映射
```css
primary-color-light: var(--brand)
secondary-color-light: var(--background)  
accent-color-light: var(--accent-flat-strong)
text-dark-light: var(--on-background)
```

### 夜間模式映射
```css
primary-color-dark: var(--brand-flat)
secondary-color-dark: var(--md-neutral-1)
accent-color-dark: var(--accent-flat)
text-dark-dark: var(--md-white-1)
```

## 🎨 視覺改進

### 1. 字體渲染優化
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### 2. 動畫過渡
- 使用 `cubic-bezier(0.4, 0, 0.2, 1)` 實現流暢過渡
- 統一過渡時間為 0.2s-0.3s

### 3. 陰影系統
- 多層次陰影設計
- 品牌色光暈效果
- 軟陰影提升層次感

### 4. 圓角設計
- 小組件: 8px
- 卡片: 12-16px  
- 特殊卡片: 24px
- 按鈕: 8-12px

## 📱 響應式設計

維持原有的響應式斷點，並在各尺寸下保持設計系統的一致性：

- **桌面**: 完整設計效果
- **平板**: 適度縮放，保持視覺層次
- **手機**: 簡化動效，優化觸控體驗

## 🔧 實作細節

### CSS 變數組織
```css
:root {
  /* Moda 原始設計變數 */
  --md-primary-1: #6868ac;
  --brand: #6968ac;
  
  /* 映射至應用變數 */
  --primary-color-light: var(--brand);
  
  /* 當前主題變數 */
  --current-primary: var(--primary-color-light);
}
```

### 主題切換機制
透過 JavaScript 動態切換 `body.dark` 類別來實現主題變換，所有組件會自動適應新主題。

## 🎯 品牌一致性檢查清單

- [x] 色彩符合 Moda 品牌規範
- [x] 字體使用 Noto Sans 系列
- [x] 圓角設計統一規範  
- [x] 陰影效果品牌化
- [x] 按鈕樣式現代化
- [x] 卡片設計系統化
- [x] 響應式設計優化
- [x] 動畫過渡流暢化
- [x] 主題切換完整性

## 📊 性能優化

- 使用 CSS 變數減少重複代碼
- 優化動畫使用 transform 和 opacity
- 合理使用 backdrop-filter
- 字體渲染優化設定

---

*此設計系統確保抽獎工具與 Moda 官網保持視覺一致性，提升整體品牌體驗。*