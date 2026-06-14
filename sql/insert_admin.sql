-- insert_admin_user.sql
-- Skrip untuk menambahkan akun admin dengan password yang sudah di-hash dengan bcrypt
-- Hash: admin123 dengan bcrypt (10 rounds)

-- Jika tabel users belum ada, buatnya dulu
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'admin'
);

-- Hapus admin lama jika ada (opsional, uncomment jika perlu)
-- DELETE FROM users WHERE email = 'admin@example.com';

-- Tambah akun admin baru dengan password admin123
INSERT INTO users (email, password, role)
VALUES (
  'admin@example.com',
  '$2b$10$s1fY.LGDij.SZKFQz14Tcub0UdmtBOoPesk6pGBBKp635.hocWSle',
  'admin'
)
ON CONFLICT (email) DO UPDATE
SET password = EXCLUDED.password,
    role = EXCLUDED.role;

-- Cek hasilnya
SELECT id, email, role, password FROM users WHERE email = 'admin@example.com';
