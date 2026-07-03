# 安可報價系統交接紀錄

最後整理時間：2026-07-03  
專案路徑：`C:\Users\Ken Tseng\OneDrive\文件\安可報價系統`  
GitHub：`https://github.com/kenTseng0428/test`

## 目前版本狀態

已上傳 GitHub 的最新正式版本：

- 版本：`V1.06AB`
- Branch：`main`
- Commit：`ec853ac Update quote system to v1.06AB`

目前本機狀態：

- `index.html`、`app.js`、`styles.css` 已 commit / push
- `PROJECT_HANDOFF.md` 本檔也納入 GitHub，供換電腦或開新對話時交接使用
- 後續以原本 `V1.06AB` 版面為 base 繼續，不套用陳維正資料夾的 HTML 框架

## 色彩代號

之後設計討論使用以下代號：

- `安可藍`：Logo 內藍色，CSS 變數已先設為 `--encore-blue`
- `安可紅`：Logo 內紅色，CSS 變數已先設為 `--encore-red`

## V1.06 已完成內容

V1.06 已經 commit 並 push 到 GitHub。

功能與規則：

- 袋型放在製袋條件第一順位
- 袋型順序：平口袋、破壞袋、自黏袋、吊卡袋、腰只袋、背心袋、軟條手提袋、硬提把手提袋
- 材料順序：PE、PP、OPP、HDPE
- 袋身顏色：透明/原色、白色、黑色、特殊色
- PP / OPP 鎖定透明
- OPP 固定側封
- 腰只袋可選普封 / 側封
- 自黏袋新增舌蓋尺寸，預設 `4cm`，並納入重量計算
- 破壞袋新增亮面/霧面、有無手提、手提尺寸，手提尺寸預設 `6cm`
- 階梯數量與損耗率移到報價分析
- 修正階梯數量輸入會卡住的問題
- 印刷最低基本費公式：`max(實際重量, 125KG) × 印刷費 × 色數`
- 移除印刷基本重量欄位
- 版費選項：無版費、版費獨立報、版費含內報

## V1.06AB 已上傳內容

目的：只調整 A/B 區版面，不改公式、不改輸入邏輯。

### A 區 Header

已修改：

- Header 高度加高，預留第二排功能列
- `Version 1.06AB` 移到 `Smart Quotation System` 後方
- 第二排先放占位按鈕：
  - 客戶資訊
  - 成本參數
  - 歷史報價
- 第二排目前只是版面預留，尚未加入功能

### B 區 KPI

已修改：

- KPI 從全寬改成只放在 Middle + Right 上方
- Left 區從 Header 下方開始，不再被 KPI 壓下去
- KPI 改成 5 張卡片：
  - 總重量
  - 袋子成本
  - 建議售價
  - 毛利
  - 毛利率

尺寸變化：

- 修改前 KPI 卡片高度：`66px`
- 修改後 KPI 卡片高度：`72px`
- Icon：`46px → 34px`
- 左右 padding：`24px → 14px`
- 標題字級：`14px → 12px`
- 數字字級：`27px → 24px`

## 區塊代號

後續討論使用以下代號：

- `A`：Header
- `B`：KPI
- `Left`：左欄
- `Middle`：中欄
- `Right`：右欄

使用者希望之後採取逐區修改方式：

1. 先修 A Header
2. 確認 OK 後鎖定
3. 再修 B KPI
4. 確認 OK 後鎖定
5. 再修 Left
6. 再修 Middle
7. 再修 Right

鎖定後的區塊，除非使用者明確指定，不要再改：

- 寬高比例
- 字級
- padding
- 欄位順序
- grid 位置

## 參考圖資訊

使用者提供 GPT 生成圖作為視覺方向。

圖片尺寸：

- `1536 × 1024`
- 比例：`3:2` 橫式

注意：

- 該圖只能作為視覺參考
- 不強求 100% 複製
- 不確定 GPT 原始 CSS 數據，例如欄寬、padding、字級
- 建議以目前系統建立穩定版面規格

## 已驗證項目

目前本機 V1.06AB：

- `app.js` 語法檢查通過
- `http://127.0.0.1:8001/` 正常回應
- 本機服務可用
- 已用 Chrome 驗證頁面可載入，版本顯示 `Version 1.06AB`
- 袋型清單正常包含：平口袋、破壞袋、自黏袋、吊卡袋、腰只袋、背心袋、軟條手提袋、硬提把手提袋

## 下一步建議

下次開新對話後，先讀本檔：

`PROJECT_HANDOFF.md`

然後確認目前是否要繼續調整：

1. A Header 是否接受目前 V1.06AB 版面
2. B KPI 是否接受目前 V1.06AB 版面
3. 如果 A/B OK，就鎖定 A/B
4. 接著開始修改 Left 區

目前 V1.06AB 已上傳 GitHub。若使用者確認 A/B 版面 OK，後續不要再改 A/B 的寬高比例、字級、padding、欄位順序與 grid 位置，直接開始修改 Left 區。
