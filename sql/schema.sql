-- Supabase SQL schema for Batik Sumatera Selatan classification app

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  role text not null default 'admin'
);

create table if not exists batik_predictions (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  prediction_label text not null,
  confidence_score double precision not null,
  model_version text,
  created_at timestamp with time zone default now()
);

create table if not exists datasets (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  label text not null,
  created_at timestamp with time zone default now()
);

create table if not exists model_metrics (
  id uuid primary key default gen_random_uuid(),
  accuracy double precision,
  loss double precision,
  created_at timestamp with time zone default now()
);

-- Optional admin sample user. Update password hash jika diperlukan.
-- insert into users (email, password, role) values ('admin@example.com', '<bcrypt-hash-here>', 'admin');
