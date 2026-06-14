-- reset_supabase_schema.sql
-- Skrip ini akan menghapus tabel yang ada lalu membuat kembali tabel yang diperlukan
-- Jalankan di Supabase SQL editor atau psql dengan akses service_role.

-- 1. Hapus semua tabel yang kemungkinan ada di schema public
--    Tambahkan tabel lain jika Anda punya tambahan tabel custom.

DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS batik_predictions CASCADE;
DROP TABLE IF EXISTS datasets CASCADE;
DROP TABLE IF EXISTS model_metrics CASCADE;

-- 2. Buat ulang tabel yang dibutuhkan oleh aplikasi

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'admin'
);

CREATE TABLE IF NOT EXISTS batik_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  prediction_label text NOT NULL,
  confidence_score double precision NOT NULL,
  model_version text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  label text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS model_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accuracy double precision,
  loss double precision,
  created_at timestamp with time zone DEFAULT now()
);

 3. Optional: Tambahkan akun admin contoh
Ganti hash password sesuai kebutuhan.
INSERT INTO users (email, password, role)
VALUES (
'admin@example.com',
'$2b$10$s1fY.LGDij.SZKFQz14Tcub0UdmtBOoPesk6pGBBKp635.hocWSle',
'admin');

-- 4. Pastikan hasilnya
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
