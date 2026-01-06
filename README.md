# 🛹 Board School - 滑板課程預約管理系統

完整的滑板課程預約和管理系統，整合 LINE Bot、網頁後台和 Google Sheets。

## 📋 系統功能

### LINE Bot 功能
- ✅ 學生預約 1對1 課程
- ✅ 查詢剩餘堂數和已預約課程
- ✅ 互動式選單和 Flex Message
- ✅ 自動扣除課程堂數

### 網頁後台功能
- 📊 即時儀表板（今日課程、學生統計）
- 📅 教練時段管理（週曆視圖、批次新增）
- 📚 課程安排查看（篩選、搜尋）
- 👥 學生資料管理（新增、搜尋）
- 📦 課程管理（堂數追蹤、到期提醒）

### Google Sheets 整合
- 💾 學生資料表
- 📖 課程記錄表
- 📅 預約記錄表
- ⏰ 教練時段表
- ⚙️ 系統設定表

## 🚀 安裝步驟

### 1. 前置需求

- Node.js 18+ 
- Google Cloud 帳號
- LINE Developers 帳號
- ngrok（用於本地開發）

### 2. Google Sheets API 設定

#### 2.1 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案
3. 啟用 **Google Sheets API**：
   - 在左側選單選擇「API 和服務」>「資料庫」
   - 搜尋「Google Sheets API」並啟用

#### 2.2 建立 Service Account

1. 在 Google Cloud Console，選擇「API 和服務」>「憑證」
2. 點擊「建立憑證」>「服務帳戶」
3. 填寫服務帳戶名稱（例如：board-school-bot）
4. 建立後，進入該服務帳戶
5. 點擊「金鑰」標籤 >「新增金鑰」>「JSON」
6. 下載 JSON 金鑰檔案
7. **重要**：記下服務帳戶的 email（格式：xxxxx@xxxxx.iam.gserviceaccount.com）

#### 2.3 建立 Google Sheet

1. 建立新的 Google Sheet
2. 記下 Sheet ID（在 URL 中：`https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`）
3. **分享此 Sheet 給服務帳戶的 email**（設定為「編輯者」權限）

#### 2.4 設定金鑰檔案

將下載的 JSON 金鑰檔案重新命名為 `google-credentials.json` 並放在專案根目錄：

```
board-school/
├── google-credentials.json  ← 放在這裡
├── server/
├── frontend/
└── ...
```

### 3. 安裝依賴

```bash
# 安裝後端依賴
npm install

# 安裝前端依賴
cd frontend
npm install
cd ..
```

### 4. 環境變數設定

在專案根目錄建立 `.env` 檔案（已有 `.env.example` 範本）：

```env
# LINE Bot Configuration
LINE_CHANNEL_ID=你的Channel ID
LINE_CHANNEL_SECRET=你的Channel Secret
LINE_CHANNEL_ACCESS_TOKEN=你的Access Token

# Google Sheets Configuration  
GOOGLE_SHEET_ID=你的Google Sheet ID
GOOGLE_SERVICE_ACCOUNT_EMAIL=你的服務帳戶email

# Server Configuration
PORT=3000
```

**你的 LINE Bot 資訊已經設定好了！**

### 5. 設定 LINE Bot Webhook

#### 5.1 啟動 ngrok

```bash
ngrok http 3000
```

複製 ngrok 產生的 HTTPS URL（例如：`https://abc123.ngrok.io`）

#### 5.2 設定 LINE Webhook

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇你的 Channel
3. 在「Messaging API」標籤找到「Webhook URL」
4. 填入：`https://你的ngrok網址/webhook`（例如：`https://abc123.ngrok.io/webhook`）
5. 點擊「Verify」確認連線正常
6. 啟用「Use webhook」

## 🎯 啟動系統

### 方法一：同時啟動前後端（推薦）

```bash
npm run dev
```

這會同時啟動：
- 後端伺服器：http://localhost:3000
- 前端介面：http://localhost:5173

### 方法二：分別啟動

```bash
# Terminal 1 - 啟動後端
npm run server

# Terminal 2 - 啟動前端
npm run client
```

### 檢查啟動狀態

- 後端 API：http://localhost:3000（應顯示系統資訊）
- 前端介面：http://localhost:5173（應顯示管理後台）
- LINE Bot Webhook：https://你的ngrok網址/webhook

## 📖 使用說明

### 首次使用流程

1. **新增學生資料**
   - 開啟網頁後台：http://localhost:5173
   - 進入「學生管理」
   - 點擊「新增學生」
   - 填寫學生資訊（LINE User ID 可暫時填寫任意值，實際使用時從 LINE 取得）

2. **建立課程**
   - 進入「課程管理」
   - 點擊「新增課程」
   - 選擇學生、課程類型、教練和總堂數
   - 1對1課程會自動設定 100 天到期日

3. **設定教練時段**
   - 進入「時段管理」
   - 點擊「新增時段」
   - 選擇教練、日期和時段
   - 支援批次新增多個時段

4. **學生使用 LINE Bot 預約**
   - 加入 LINE Bot 為好友
   - 傳送任意訊息開啟主選單
   - 點擊「預約課程」選擇時段
   - 點擊「查詢課程」查看剩餘堂數

### 取得 LINE User ID

學生首次使用 LINE Bot 時，可以在伺服器 log 中看到他們的 User ID，然後在後台建立對應的學生資料。

或使用 LINE Messaging API 的方式取得。

## 🎨 系統特色

### 設計亮點
- 🌙 現代暗色主題設計
- 🎯 直覺的使用者介面
- 📱 響應式設計（支援手機/平板/桌面）
- ✨ 流暢的動畫效果
- 🎨 精心設計的配色方案

### 技術亮點
- ⚡️ Vite 極速開發體驗
- ⚛️ React 18 最新特性
- 🔄 即時資料同步
- 📦 模組化架構
- 🛡️ 完整錯誤處理

## 📁 專案結構

```
board-school/
├── server/                      # 後端服務
│   ├── index.js                # 伺服器進入點
│   ├── routes/
│   │   └── api.js              # API 路由
│   └── services/
│       ├── googleSheets.js     # Google Sheets 服務
│       └── lineBot.js          # LINE Bot 服務
├── frontend/                    # 前端應用
│   ├── src/
│   │   ├── App.jsx             # 主應用組件
│   │   ├── main.jsx            # React 進入點
│   │   ├── components/         # React 組件
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ScheduleManager.jsx
│   │   │   ├── BookingManager.jsx
│   │   │   ├── StudentManager.jsx
│   │   │   └── CourseManager.jsx
│   │   └── styles/
│   │       └── index.css       # 全域樣式
│   ├── index.html
│   └── vite.config.js
├── google-credentials.json      # Google API 金鑰（需自行新增）
├── .env                         # 環境變數（需自行新增）
├── .env.example                # 環境變數範本
├── package.json
└── README.md
```

## 🔧 常見問題

### 1. Google Sheets API 認證失敗

**錯誤訊息**：`google-credentials.json not found`

**解決方法**：
- 確認 `google-credentials.json` 在專案根目錄
- 檢查檔案權限是否正確

### 2. LINE Bot 無法接收訊息

**可能原因**：
- ngrok 沒有啟動或 URL 過期
- LINE Webhook URL 設定錯誤
- 後端伺服器沒有啟動

**解決方法**：
- 確認 ngrok 運行中：`ngrok http 3000`
- 更新 LINE Webhook URL 為最新的 ngrok URL
- 檢查後端伺服器運行狀態

### 3. 無法寫入 Google Sheet

**可能原因**：
- Sheet 沒有分享給服務帳戶
- Sheet ID 錯誤

**解決方法**：
- 在 Google Sheet 點擊「分享」，加入服務帳戶 email 並設為「編輯者」
- 檢查 `.env` 中的 `GOOGLE_SHEET_ID` 是否正確

### 4. 前端無法連接後端 API

**解決方法**：
- 確認後端在 port 3000 運行
- 檢查 `frontend/vite.config.js` 的 proxy 設定
- 清除瀏覽器快取並重新整理

## 📝 待辦事項

- [ ] 新增課程完成/取消功能
- [ ] 實作團體課程的排課規則
- [ ] 加入通知提醒功能
- [ ] 匯出報表功能
- [ ] 多教練權限管理

## 🙏 技術支援

如有問題，請檢查：
1. Google Sheets 權限設定
2. LINE Bot Webhook 連線狀態
3. 環境變數設定
4. 伺服器 log 訊息

## 📄 授權

MIT License

---

**開發完成！** 🎉 

現在您可以開始使用這個系統管理您的滑板課程了！
