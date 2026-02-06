# 災難復原手冊 (Disaster Recovery Manual)

本手冊說明當線上服務 (Zeabur) 發生嚴重故障或資料遺失，需要重新部署網站與還原資料庫時的標準作業程序。

## 前置準備
1. **GitHub 帳號**：需擁有存取 `LoyaltyLoop` 專案原始碼的權限。
2. **Zeabur 帳號**：用於託管網站與資料庫。
3. **資料庫備份檔**：`temp_db.sql` (每日自動備份)。
4. **Storage 還原腳本**：`storage_recovery.sql` (用於重建圖片儲存桶設定)。
5. **資料庫管理工具**：建議使用 [TablePlus](https://tableplus.com/) 或 [DBeaver](https://dbeaver.io/) 連線資料庫以執行還原腳本。

---

## 步驟一：部署 Supabase 資料庫 (Zeabur)

如果原本的資料庫服務已移除，請重新建立：

1. 登入 **Zeabur Dashboard**。
2. 進入你的專案 (Project)。
3. 點擊 **Create Service** -> **Prebuilt** -> 搜尋並選擇 **Supabase (PostgreSQL)**。
4. 等待部署完成 (約需數分鐘)。
5. 點擊剛建立的 Supabase 服務，進入 **Instruction** 或 **Connection** 分頁，取得以下資訊：
    - `Host` (主機位置)
    - `Port` (埠號)
    - `Username` (通常為 postgres)
    - `Password` (密碼)
    - `Database` (通常為 postgres)
    - **API URL** (例如 `https://xxx.zeabur.app`)
    - **Anon Key** (JWT Token)

---

## 步驟二：還原資料庫內容

使用 SQL 用戶端工具 (以 TablePlus 為例) 還原資料與結構。

### 1. 連線資料庫
使用步驟一取得的 `Host`, `Port`, `User`, `Password` 建立連線。

### 2. 執行備份檔 (`temp_db.sql`)
> **備註來源**：`temp_db.sql` 來源為 [LoyaltyLoop-Database-backups](https://github.com/tubaboy/LoyaltyLoop-Database-backups) 的每日備份檔案。

1. 開啟 SQL 編輯器。
2. 載入或貼上 `temp_db.sql` 的完整內容。
3. **全選並執行 (Run All)**。
    - 此步驟將恢復所有資料表 (Tables)、函數 (Functions) 與既有的業務數據 (Branches, Customers, Transactions)。

### 3. 重建 Storage 設定 (重要)
由於 `temp_db.sql` (每日備份) 僅包含業務資料，**預設不包含** Storage 的儲存桶設定。請執行獨立的還原腳本：

1. 在 SQL 編輯器中開啟 `storage_recovery.sql`。
2. **全選並執行 (Run All)**。
    - 此步驟將建立 `logos` 儲存桶並設定公開讀取與上傳權限。

> **注意**：原本上傳的 Logo 圖片檔案已遺失 (不在備份檔中)。還原後，商家需要在「後台設定」重新上傳 Logo。

---

## 步驟三-A：部署後端服務 (Backend Service)
此服務 (位於 `/server` 目錄) 負責處理 LINE Bot 與其他背景任務。

1. 在 Zeabur 專案中，點擊 **Create Service** -> **Git**。
2. 選擇 **LoyaltyLoop** 儲存庫。
3. 點擊剛建立的服務，進入 **Settings**。
4. **設定 Root Directory**：
   - 找到 **Watch Paths** 或 **Build & Run** (視介面而定) 中的 **Root Directory** 設定。
   - 將其改為 `/server` (預設為 `/`)。
   - *注意：若介面無直接設定，可透過 environment variable `ZEABUR_ROOT_DIR` = `server` 來指定。*
5. **設定環境變數 (Environment Variables)**：
   - 點擊 **Service** -> **Settings** -> **Environment Variables**。
   - 新增以下變數 (需從 Supabase 服務取得)：
     - `SUPABASE_URL`: 填入 **API URL**。
     - `SUPABASE_SERVICE_ROLE_KEY`: 填入 **Service Role Key** (*注意：不是 Anon Key*)。
     - `PORT`: `3001` (或是讓 Zeabur 自動分配，但建議設定)。
6. 進入 **Networking** 分頁：
   - 若此服務需要對外 (如 LINE Webhook)，請建立一個 Domain (例如 `loyalty-api.zeabur.app`)。
7. **Redeploy** 重新部署以套用設定。

---

## 步驟三-B：部署前端網站 (Frontend)

1. 在 Zeabur 專案中，點擊 **Create Service** -> **Git**。
2. 選擇 **LoyaltyLoop** 儲存庫 (Repository)。
3. 點擊剛建立的網站服務，進入 **Settings** -> **Environment Variables**。
4. 新增/更新以下環境變數：
    - `VITE_SUPABASE_URL`: 填入步驟一取得的 **API URL**。
    - `VITE_SUPABASE_ANON_KEY`: 填入步驟一取得的 **Anon Key**。
5. 進入 **Builds** 分頁，確認設定：
    - Build Command: `npm run build`
    - Output Directory: `dist`
6. 若變數有更動，請點擊 **Redeploy** 重新部署。

---

## 步驟四：驗證還原結果

1. **開啟網站**：前往 Zeabur 提供的網站網址。
2. **測試登入**：使用既有的商家帳號密碼登入後台。
3. **檢查資料**：確認「顧客列表」、「交易紀錄」等資料是否已恢復。
4. **檢查圖片**：
    - 前往 `/dashboard/settings`。
    - 由於圖片實體檔已遺失，原本有上傳 Logo 的分店可能會顯示破圖或預設圖。
    - **請重新上傳 Logo** 並儲存，確認新圖片可正常顯示於終端機頁面。

---

## 常見問題

**Q: 執行 `temp_db.sql` 時出現 "role postgres does not exist" 錯誤？**
A: Zeabur 的預設使用者名稱可能不同。請將 SQL 腳本中涉及權限的部分 (如果有) 修改為當前連線的使用者，或忽略該非致命錯誤。`temp_db.sql` 主要包含 Schema 建立與 COPY data，通常不會涉及 Owner 指定問題。

**Q: 為什麼 Logo 都不見了？**
A: SQL 備份檔 (`temp_db.sql`) 僅包含文字資料與資料庫結構。圖片、影片等二進位檔案儲存在 Supabase Storage (S3 相容儲存)，不會隨 SQL 匯出。災難復原後需重新上傳。
