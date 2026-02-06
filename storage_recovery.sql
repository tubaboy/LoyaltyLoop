-- 此檔案用於災難復原時重建 Supabase Storage 設定
-- 由於 pg_dump (temp_db.sql) 通常不包含 storage schema 的特定設定，需手動執行此腳本。

-- 1. 建立 logos 儲存桶 (如果不存在)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 開放公開讀取權限 (Public Access)
-- 允許任何人讀取 logos 桶內的物件
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

-- 3. 開放已驗證商家的上傳權限 (Auth Upload)
-- 僅允許已登入的使用者 (authenticated role) 上傳檔案到 logos 桶
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'logos' );
