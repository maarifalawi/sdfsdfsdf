-- disable_rls_and_insert_admin.sql
-- Jalankan script ini di Supabase SQL Editor dengan role postgres/admin

-- 1. Disable RLS pada tabel users agar anon key bisa insert
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Buat tabel jika belum ada
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'admin'
);

-- 3. Insert admin user
-- Password: admin123 (hash bcrypt dengan 10 rounds)
INSERT INTO users (email, password, role)
VALUES (
  'admin@example.com',
  '$2b$10$s1fY.LGDij.SZKFQz14Tcub0UdmtBOoPesk6pGBBKp635.hocWSle',
  'admin'
)
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password, role = EXCLUDED.role;

-- 4. Verifikasi
SELECT id, email, role FROM users WHERE email = 'admin@example.com';

-- CATATAN:
-- Untuk production, sebaiknya:
-- 1. Enable kembali RLS
-- 2. Buat RLS policies yang lebih ketat
-- 3. Gunakan service_role key untuk backend (jika key yang valid tersedia)
