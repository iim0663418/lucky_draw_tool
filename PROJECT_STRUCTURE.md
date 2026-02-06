# 專案結構

```
lucky_draw_tool/
├── index.html              # 主頁面（17KB）
├── css/
│   └── style.css           # 樣式與動畫（41KB）
├── js/
│   └── script.js           # 核心邏輯與 3D 引擎（97KB）
├── docs/                   # 📚 文件目錄
│   ├── BDD_TEST_SCENARIOS.md           # BDD 測試場景
│   ├── IMPLEMENTATION_SUMMARY.md       # 技術實作摘要
│   ├── QUEUE_USAGE_GUIDE.md            # 禮物佇列使用指南
│   ├── MODA_USAGE_GUIDE.md             # Moda 使用指南
│   ├── MODA_DESIGN_SYSTEM.md           # Moda 設計系統
│   └── SAFARI_MATERIAL_TESTING.md      # Safari 相容性測試
├── .specify/               # 🧠 開發記憶（不提交）
│   └── memory/
│       ├── knowledge_graph.mem         # 長期知識圖譜
│       └── progress.md                 # 短期進度追蹤
├── README.md               # 專案說明
├── CHANGELOG.md            # 版本更新日誌
├── PROJECT_STRUCTURE.md    # 本文件
├── LICENSE                 # Apache-2.0 授權
└── .nojekyll               # GitHub Pages 設定
```

## 核心模組

### 1. HTML 結構 (index.html)
- Bootstrap 5 UI 框架
- 抽獎設定區（含禮物佇列管理）
- 歷史記錄區
- 3D 渲染容器
- 無障礙支援（ARIA）

### 2. 樣式系統 (css/style.css)
- Moda 品牌設計（白紫黑黃配色）
- 爆炸動畫與粒子效果
- 響應式佈局
- 日夜間模式完整支援
- 8px 基礎單位間距
- 流動排版（clamp()）

### 3. JavaScript 引擎 (js/script.js)
- Three.js 3D 引擎
- 粒子系統（爆炸、星星、火花）
- SHA-256 抽獎邏輯
- 禮物佇列管理
- 歷史記錄管理
- JSON 匯出功能

## 文件目錄 (docs/)

| 文件 | 用途 |
|------|------|
| `BDD_TEST_SCENARIOS.md` | BDD 測試場景與驗收標準 |
| `IMPLEMENTATION_SUMMARY.md` | 技術實作細節與架構說明 |
| `QUEUE_USAGE_GUIDE.md` | 禮物佇列功能使用指南 |
| `MODA_USAGE_GUIDE.md` | Moda 抽獎工具完整使用說明 |
| `MODA_DESIGN_SYSTEM.md` | Moda 設計系統規範 |
| `SAFARI_MATERIAL_TESTING.md` | Safari 瀏覽器相容性測試 |

## 開發記憶 (.specify/)

- `memory/knowledge_graph.mem` - 長期知識圖譜（三元組格式）
- `memory/progress.md` - 短期進度追蹤（任務狀態）

**注意**：`.specify/` 目錄不提交至 Git（已加入 .gitignore）

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
| index.html | 17 KB |
| css/style.css | 41 KB |
| js/script.js | 97 KB |
| 總計 | ~155 KB |

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
