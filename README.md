# 安可包裝智慧報價系統

安可包裝 PE 袋智慧報價系統的靜態前端版本。

## 專案內容

- `index.html`：系統主畫面
- `styles.css`：版面與品牌樣式
- `app.js`：報價計算、歷史儲存與互動邏輯
- `assets/`：Logo 與圖片資源
- `serve-static.ps1`：Windows 本機靜態伺服器啟動腳本

## 本機啟動

在 PowerShell 進入專案資料夾後執行：

```powershell
.\serve-static.ps1 -Port 8000
```

然後打開：

```text
http://localhost:8000/
```

## 備註

目前是純前端靜態專案，不需要 npm install 或 build。
