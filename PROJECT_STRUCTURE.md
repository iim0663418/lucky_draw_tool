# 專案結構

```
lucky_draw_tool/
├── index.html          # 主頁面（12.6KB）
├── css/
│   └── style.css      # 樣式表（32KB）
├── js/
│   └── script.js      # 核心邏輯（88KB）
├── README.md
├── CHANGELOG.md
└── PROJECT_STRUCTURE.md
```

## 核心文件

### index.html
- Bootstrap 5 響應式佈局
- 語意化 HTML5 結構
- 無障礙支援（ARIA）
- Modal 組件

### css/style.css
- Moda 四色系統（白/紫/黑/黃）
- 8px 基礎單位間距
- 流動排版（clamp()）
- 深色模式支援
- 動畫優化（60fps）

### js/script.js
- Three.js 3D 引擎
- 粒子系統
- SHA-256 演算法
- 歷史記錄管理
- JSON 匯出功能

## 技術棧

### 前端框架
- Bootstrap 5.3
- Three.js
- TWEEN.js

### 核心技術
- WebGL
- CSS3DRenderer
- SHA-256
- LocalStorage

### 設計系統
- Moda 四色系統
- 8px 基礎單位
- WCAG AA 標準
- 60fps 目標

## 檔案大小

| 文件 | 大小 |
|:---|:---:|
| index.html | 12.6 KB |
| css/style.css | 32 KB |
| js/script.js | 88 KB |
| 總計 | ~133 KB |

## 瀏覽器支援

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 部署

### GitHub Pages
1. 推送到 main 分支
2. Settings > Pages > 選擇 main 分支
3. 訪問 `https://username.github.io/lucky_draw_tool/`

### 本地開發
```bash
python -m http.server 8000
```

## 授權

Apache-2.0 License
