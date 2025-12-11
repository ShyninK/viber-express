-- Modifikasi tabel notifications agar user_id bisa null
-- Ini memungkinkan notifikasi untuk user tanpa akun (guest/anonymous)

-- 1. Ubah kolom user_id menjadi nullable
ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;

-- 2. Tambah comment untuk dokumentasi
COMMENT ON COLUMN notifications.user_id IS 'User ID (nullable untuk guest reporters)';

-- 3. Verifikasi perubahan
SELECT 
    column_name, 
    is_nullable, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND column_name = 'user_id';
