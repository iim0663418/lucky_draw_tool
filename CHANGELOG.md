# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-23

### ✨ Added
- **時間戳功能**: 每次抽獎自動記錄 ISO 8601 格式時間戳
- **匯出功能**: 一鍵匯出完整歷史記錄為 JSON 格式
- **進階設定摺疊**: 使用漸進式揭露隱藏進階選項
- **確認 Modal**: 清除歷史記錄前顯示確認對話框（良性摩擦）
- **GPU 加速**: 為動畫添加 `will-change` 屬性優化效能

### 🎨 Changed
- **色彩系統重設計**: 簡化為白/紫/黑/黃四色系統（變數從 80+ 減至 15）
- **樣式系統**: 建立 8px 基礎單位間距系統
- **排版系統**: 實作流動排版（clamp() 響應式縮放）
- **圓角系統**: 定義 4 層級圓角（8/12/18/40px）
- **按鈕重設計**: 6 種按鈕類型，現代漸層與陰影
- **Alert 重設計**: 4 種 Alert 類型，品牌色一致
- **動畫優化**: popIn 速度提升 33%（0.9s → 0.6s）
- **卡片簡化**: 移除漸層背景，改用純色提升清晰度

### 🐛 Fixed
- **參與者計數錯誤**: 修復 TypeError（Element.prototype → Node.prototype）
- **Modal 未關閉**: 移除衝突的事件處理器
- **深色模式對比度**: 增強表單與卡片可見度
- **焦點邊框一致性**: 統一使用紫色系（移除黃色焦點）
- **文字可讀性**: 修復 .text-muted 和連結顏色

### ⚡ Improved
- **動畫效能**: 移除複雜旋轉，減少陰影層數（5 → 3）
- **觸控目標**: 確保所有按鈕/輸入框 ≥44px
- **對比度**: 所有文字元素達到 WCAG AA 標準
- **視覺噪音**: 減少 30% 說明文字
- **過渡效果**: 統一使用 0.2s cubic-bezier

### 📚 Documentation
- 新增 `PROJECT_STRUCTURE.md` - 專案結構說明
- 新增 `CHANGELOG.md` - 變更日誌
- 更新 `README.md` - 反映最新功能

### 🔧 Technical
- 色彩變數簡化 81%
- 動畫速度提升 33%
- 陰影層數減少 40%
- WCAG AA 合規 100%
- 目標 FPS: 60

---

## [1.0.0] - 2025-01-22

### Initial Release
- 3D 爆炸粒子系統
- SHA-256 抽獎演算法
- 歷史記錄管理
- 深色模式支援
- Bootstrap 5 響應式設計
- Three.js 3D 渲染
