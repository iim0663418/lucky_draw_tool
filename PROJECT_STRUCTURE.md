# 專案目錄結構

```
lucky_draw_tool/
├── index.html              # 主頁面
├── css/
│   └── style.css          # 主樣式表（32KB）
├── js/
│   └── script.js          # 核心邏輯（88KB）
├── .gitignore             # Git 忽略規則
├── .nojekyll              # GitHub Pages 設定
├── LICENSE                # Apache-2.0 授權
├── README.md              # 專案說明
├── MODA_DESIGN_SYSTEM.md  # Moda 設計系統文件
├── MODA_USAGE_GUIDE.md    # 使用指南
└── SAFARI_MATERIAL_TESTING.md  # Safari 相容性測試

開發記憶（已加入 .gitignore）：
.specify/
├── memory/
│   ├── knowledge_graph.mem  # 知識圖譜（開發歷程）
│   └── progress.md          # 當前進度
├── specs/                   # BDD 規格文件（臨時）
└── logs/                    # 實作日誌（臨時）
```

## 核心文件說明

### 前端文件
- **index.html** (12.6KB)
  - Bootstrap 5 響應式佈局
  - 語意化 HTML5 結構
  - 無障礙支援（ARIA, skip-link）
  - Modal 組件（確認對話框）

- **css/style.css** (32KB)
  - Moda 4 色系統（白/紫/黑/黃）
  - 8px 基礎單位間距系統
  - 流動排版（clamp()）
  - 深色模式支援
  - 60fps 動畫優化

- **js/script.js** (88KB)
  - Three.js 3D 引擎
  - 粒子系統（爆炸效果）
  - SHA-256 抽獎演算法
  - 歷史記錄管理
  - 匯出功能（JSON）

### 文件檔案
- **README.md** - 專案介紹、功能說明、部署指南
- **MODA_DESIGN_SYSTEM.md** - 設計系統規範
- **MODA_USAGE_GUIDE.md** - 使用者操作指南
- **SAFARI_MATERIAL_TESTING.md** - Safari 瀏覽器測試記錄

### 開發記憶（不提交）
- **.specify/** - 開發過程記憶系統
  - `memory/knowledge_graph.mem` - 知識圖譜（三元組格式）
  - `specs/` - BDD 規格文件（臨時）
  - `logs/` - Claude 實作日誌（臨時）

## 技術棧

### 前端框架
- **Bootstrap 5.3** - UI 框架
- **Three.js** - 3D 渲染引擎
- **TWEEN.js** - 動畫補間庫

### 核心技術
- **WebGL** - 3D 圖形渲染
- **CSS3DRenderer** - CSS3D 混合渲染
- **SHA-256** - 加密雜湊演算法
- **LocalStorage** - 本地資料儲存

### 設計系統
- **Moda 4 色系統** - 白/紫/黑/黃
- **8px 基礎單位** - 間距系統
- **WCAG AA** - 無障礙標準
- **60fps** - 動畫效能目標

## 檔案大小

| 文件 | 大小 | 說明 |
|:---|:---:|:---|
| index.html | 12.6 KB | 主頁面結構 |
| css/style.css | 32 KB | 完整樣式系統 |
| js/script.js | 88 KB | 核心邏輯與 3D 引擎 |
| **總計** | **~133 KB** | 未壓縮大小 |

## 瀏覽器支援

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 部署

### GitHub Pages
1. 推送到 `main` 分支
2. Settings > Pages > 選擇 `main` 分支
3. 訪問 `https://username.github.io/lucky_draw_tool/`

### 本地開發
```bash
# 使用任何 HTTP 伺服器
python -m http.server 8000
# 或
npx serve .
```

## 授權

Apache-2.0 License - 詳見 [LICENSE](LICENSE)
