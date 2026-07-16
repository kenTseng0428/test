# 安可包裝智慧報價系統

安可包裝袋類報價系統的純前端靜態版本，目前最新畫面版本為 `V1.09`。

## 下載專案

```powershell
git clone https://github.com/kenTseng0428/test.git
cd test
```

## 本機啟動

在 PowerShell 執行：

```powershell
.\serve-static.ps1 -Port 8001
```

然後打開：

```text
http://localhost:8001/
```

如果 `8001` 被占用，可以改用：

```powershell
.\serve-static.ps1 -Port 8000
```

並打開：

```text
http://localhost:8000/
```

## 專案內容

- `index.html`：系統主畫面
- `styles.css`：版面、比例、品牌樣式
- `app.js`：報價計算、資料狀態、歷史資料與互動邏輯
- `assets/`：Logo 與圖片資源
- `serve-static.ps1`：Windows 本機靜態伺服器啟動腳本
- `PROJECT_HANDOFF.md`：目前進度、設計共識與交接紀錄

## 使用備註

- 不需要 `npm install`
- 不需要 build
- Chrome 瀏覽器縮放維持 `100%`
- 系統畫面內建 UI 縮放為 `85%`
- 若換電腦或開新 Codex 對話，請先閱讀 `PROJECT_HANDOFF.md`
