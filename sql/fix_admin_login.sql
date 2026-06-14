-- Perbaikan login admin untuk backend yang memakai tabel `users`
-- Copy script ini ke Supabase SQL editor atau gunakan di psql.

-- 1. Pastikan tabel users ada dengan struktur yang benar
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  role text not null default 'admin'
);

-- 2. Jika Anda memiliki data admin di tabel admins, salin ke tabel users
--    Ini akan memastikan backend yang menggunakan `users` bisa menemukan akun admin.
insert into users (email, password, role)
select email, password, 'admin'
from admins
where email is not null
on conflict (email) do update
set password = excluded.password,
    role = 'admin';

-- 3. Pastikan ada satu akun admin statis dengan password admin123
--    Ganti hash ini jika Anda ingin password lain.
insert into users (email, password, role)
values (
  'admin@example.com',
  '$2b$10$s1fY.LGDij.SZKFQz14Tcub0UdmtBOoPesk6pGBBKp635.hocWSle',
  'admin'
)
on conflict (email) do update
set password = excluded.password,
    role = 'admin';

-- 4. Cek hasilnya
select id, email, role from users order by email;
