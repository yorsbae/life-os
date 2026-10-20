-- ============================================================
-- LIFE OS — SKEMA DATABASE FINAL (GABUNGAN SEMUA FITUR)
-- Jalankan file ini SEKALI SAJA di Supabase SQL Editor project baru.
-- Urutan di dalam file ini sudah benar (tabel dasar dulu, baru yang
-- punya foreign key ke tabel lain).
-- ============================================================

-- ============================================================
-- 1. PROFILES (tabel inti, terhubung ke auth.users bawaan Supabase)
-- ============================================================
create table profiles (
  id uuid references auth.users primary key,
  nama text,
  username text unique,
  umur integer,
  jenis_kelamin text,               -- 'Pria' | 'Wanita'
  tinggi_badan numeric,               -- cm
  berat_badan numeric,                 -- kg (nilai terakhir, histori lengkap di body_weight_logs)
  target_berat_badan numeric,
  aktivitas_level text default 'Sedang', -- 'Rendah'|'Ringan'|'Sedang'|'Aktif'|'Sangat Aktif'
  pin_lock_enabled boolean default false,
  pin_lock_hash text,                  -- hash PIN App Lock (SHA-256), bukan PIN asli
  encryption_salt text,                 -- salt buat enkripsi password Social Account Tracker
  onboarding_done boolean default false,
  created_at timestamp default now()
);
alter table profiles enable row level security;
create policy "Users manage own profile" on profiles for all using (auth.uid() = id);

-- Fungsi login pakai username (dipanggil sebelum login, jadi butuh SECURITY DEFINER
-- untuk "meminjam" akses baca auth.users HANYA demi ambil email yang cocok)
create or replace function get_email_by_username(input_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select au.email
  from auth.users au
  join profiles p on p.id = au.id
  where lower(p.username) = lower(input_username)
  limit 1;
$$;
grant execute on function get_email_by_username(text) to anon, authenticated;


-- ============================================================
-- 2. MONEY: Expense, Income, Budget Target, Wishlist, Recurring
-- ============================================================
create table expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  nominal numeric not null,
  kategori text not null,           -- 'Makan'|'Transport'|'Belanja'|'Hiburan'|'Tagihan'|'Lainnya'
  metode_pembayaran text,
  catatan text,
  tanggal date not null,
  created_at timestamp default now()
);
alter table expenses enable row level security;
create policy "Users manage own expenses" on expenses for all using (auth.uid() = user_id);

create table incomes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  nominal numeric not null,
  sumber text not null,
  kategori text,
  catatan text,
  tanggal date not null,
  created_at timestamp default now()
);
alter table incomes enable row level security;
create policy "Users manage own incomes" on incomes for all using (auth.uid() = user_id);

create table budget_targets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  bulan date not null,               -- tanggal 1 di bulan itu, mis '2026-07-01'
  target_saving numeric,
  budget_kategori jsonb,               -- {"Makan": 1500000, ...}
  created_at timestamp default now(),
  unique(user_id, bulan)
);
alter table budget_targets enable row level security;
create policy "Users manage own budget_targets" on budget_targets for all using (auth.uid() = user_id);

create table wishlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  judul text not null,
  kategori text not null,             -- 'Beli Barang'|'Travel'|'Pengalaman'|'Lainnya'
  estimasi_biaya numeric,
  terkumpul numeric default 0,
  prioritas text default 'Medium',     -- 'Low'|'Medium'|'High'
  target_tanggal date,
  status text default 'Diinginkan',   -- 'Diinginkan'|'Sedang Ditabung'|'Tercapai'|'Dibatalkan'
  catatan text,
  created_at timestamp default now()
);
alter table wishlists enable row level security;
create policy "Users manage own wishlists" on wishlists for all using (auth.uid() = user_id);

create table recurring_expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  nama text not null,
  nominal numeric not null,
  kategori text,
  tanggal_jatuh_tempo integer not null, -- 1-31
  aktif boolean default true,
  created_at timestamp default now()
);
alter table recurring_expenses enable row level security;
create policy "Users manage own recurring_expenses" on recurring_expenses for all using (auth.uid() = user_id);


-- ============================================================
-- 3. BODY: Exercise, Jadwal Mingguan, Coaching, Histori Berat Badan
-- ============================================================
create table exercises (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  tipe text not null,               -- bebas: 'Running'|'Strength'|'Swimming'|dst (termasuk custom)
  sub_kategori text not null,
  durasi integer,                     -- menit
  jarak numeric,                       -- km, cuma relevan buat tipe berbasis jarak
  catatan text,
  tanggal date not null,
  created_at timestamp default now()
);
alter table exercises enable row level security;
create policy "Users manage own exercises" on exercises for all using (auth.uid() = user_id);

create table exercise_schedules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  hari integer not null,             -- 0=Minggu ... 6=Sabtu
  tipe text not null,                  -- 'Rest' atau tipe olahraga
  sub_kategori text,
  catatan text,
  created_at timestamp default now(),
  unique(user_id, hari)
);
alter table exercise_schedules enable row level security;
create policy "Users manage own exercise_schedules" on exercise_schedules for all using (auth.uid() = user_id);

create table training_plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  judul text not null,
  tipe text not null,                 -- '5k'|'21k'|'fat_burner'|'hiking'|'plyometric'|'general_fitness'
  durasi_minggu integer not null,
  tanggal_mulai date not null,
  status text default 'Aktif',        -- 'Aktif'|'Selesai'|'Dibatalkan'
  created_at timestamp default now()
);
alter table training_plans enable row level security;
create policy "Users manage own training_plans" on training_plans for all using (auth.uid() = user_id);

create table training_plan_sessions (
  id uuid default gen_random_uuid() primary key,
  plan_id uuid references training_plans on delete cascade not null,
  user_id uuid references auth.users not null,
  minggu_ke integer not null,
  tanggal date not null,
  tipe text not null,
  sub_kategori text,
  target_durasi integer,
  target_jarak numeric,
  intensity_multiplier numeric default 1.0,
  gerakan text,                        -- nama gerakan spesifik, khusus tipe Strength
  created_at timestamp default now()
);
alter table training_plan_sessions enable row level security;
create policy "Users manage own training_plan_sessions" on training_plan_sessions for all using (auth.uid() = user_id);

create table body_weight_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  berat numeric not null,
  tanggal date not null,
  created_at timestamp default now()
);
alter table body_weight_logs enable row level security;
create policy "Users manage own body_weight_logs" on body_weight_logs for all using (auth.uid() = user_id);


-- ============================================================
-- 4. MIND & GROWTH: Learning, Journal, Reading, Weekly Review
-- ============================================================
create table learnings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  topik text not null,
  materi text,
  catatan text,
  durasi integer,                     -- menit, opsional
  tanggal date not null,
  created_at timestamp default now()
);
alter table learnings enable row level security;
create policy "Users manage own learnings" on learnings for all using (auth.uid() = user_id);

create table journals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  konten text not null,
  mood text,
  tanggal date not null,
  created_at timestamp default now()
);
alter table journals enable row level security;
create policy "Users manage own journals" on journals for all using (auth.uid() = user_id);

create table readings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  judul_buku text not null,
  penulis text,
  halaman_sekarang integer default 0,
  total_halaman integer,
  status text default 'Dibaca',        -- 'Dibaca'|'Selesai'|'Berhenti'
  insight text,
  tanggal date not null,
  created_at timestamp default now()
);
alter table readings enable row level security;
create policy "Users manage own readings" on readings for all using (auth.uid() = user_id);

create table weekly_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  minggu_mulai date not null,          -- tanggal Senin minggu itu
  apa_yang_berhasil text,
  apa_yang_gagal text,
  yang_mau_diubah text,
  created_at timestamp default now(),
  unique(user_id, minggu_mulai)
);
alter table weekly_reviews enable row level security;
create policy "Users manage own weekly_reviews" on weekly_reviews for all using (auth.uid() = user_id);


-- ============================================================
-- 5. CREATIVE BRAIN: Pipeline Konten
-- ============================================================
create table creative_projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  judul text not null,
  kategori text,
  status text not null default 'idea', -- 'idea'|'planning'|'shooting'|'editing'|'uploaded'|'analisa'
  is_archived boolean default false,

  catatan_ide text,

  shot_list text,
  lokasi text,
  props text,
  referensi_url text,

  tanggal_shooting date,
  catatan_shooting text,

  software_edit text,
  progress_edit integer default 0,
  catatan_editing text,

  tanggal_upload date,
  platform text,
  link_hasil text,
  target_upload date,

  views integer,
  likes integer,
  catatan_analisa text,

  created_at timestamp default now()
);
alter table creative_projects enable row level security;
create policy "Users manage own creative_projects" on creative_projects for all using (auth.uid() = user_id);


-- ============================================================
-- 6. NOTES
-- ============================================================
create table notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  judul text not null,
  kategori text not null,
  konten text,
  tags text[],
  is_pinned boolean default false,
  created_at timestamp default now()
);
alter table notes enable row level security;
create policy "Users manage own notes" on notes for all using (auth.uid() = user_id);


-- ============================================================
-- 7. PROJECT TRACKER (dev/app project)
-- ============================================================
create table dev_projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  nama text not null,
  riset_kebutuhan text,
  status text default 'Aktif',         -- 'Aktif'|'Selesai'|'Ditunda'
  created_at timestamp default now()
);
alter table dev_projects enable row level security;
create policy "Users manage own dev_projects" on dev_projects for all using (auth.uid() = user_id);

create table dev_project_logs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references dev_projects on delete cascade not null,
  user_id uuid references auth.users not null,
  tanggal date not null,
  catatan text not null,
  created_at timestamp default now()
);
alter table dev_project_logs enable row level security;
create policy "Users manage own dev_project_logs" on dev_project_logs for all using (auth.uid() = user_id);

create table dev_project_todos (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references dev_projects on delete cascade not null,
  user_id uuid references auth.users not null,
  judul text not null,
  is_done boolean default false,
  created_at timestamp default now()
);
alter table dev_project_todos enable row level security;
create policy "Users manage own dev_project_todos" on dev_project_todos for all using (auth.uid() = user_id);

create table dev_project_issues (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references dev_projects on delete cascade not null,
  user_id uuid references auth.users not null,
  masalah text not null,
  solusi text,
  status text default 'Open',          -- 'Open'|'Resolved'
  created_at timestamp default now()
);
alter table dev_project_issues enable row level security;
create policy "Users manage own dev_project_issues" on dev_project_issues for all using (auth.uid() = user_id);


-- ============================================================
-- 8. GOALS
-- ============================================================
create table goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  judul text not null,
  tipe text not null,                  -- 'reading_count'|'exercise_count'|'creative_upload_count'|'custom'
  target_value numeric not null,
  current_value_manual numeric default 0,
  tanggal_mulai date not null,
  tanggal_target date,
  status text default 'Aktif',          -- 'Aktif'|'Tercapai'|'Dibatalkan'
  created_at timestamp default now()
);
alter table goals enable row level security;
create policy "Users manage own goals" on goals for all using (auth.uid() = user_id);


-- ============================================================
-- 9. CALENDAR
-- ============================================================
create table events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  judul text not null,
  tipe text not null,                   -- 'latihan'|'belajar'|'kerja'|'pengingat'|'pribadi'
  tanggal_mulai timestamp not null,
  tanggal_selesai timestamp,
  catatan text,
  created_at timestamp default now()
);
alter table events enable row level security;
create policy "Users manage own events" on events for all using (auth.uid() = user_id);


-- ============================================================
-- 10. SOCIAL ACCOUNT TRACKER
-- ============================================================
create table social_accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  platform text not null,
  username text not null,
  password_encrypted text,              -- terenkripsi pakai PIN App Lock (AES-GCM), boleh NULL
  niche text,
  tujuan text,
  status text default 'Aktif',           -- 'Aktif'|'Nonaktif'
  created_at timestamp default now()
);
alter table social_accounts enable row level security;
create policy "Users manage own social_accounts" on social_accounts for all using (auth.uid() = user_id);

create table social_account_metrics (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references social_accounts on delete cascade not null,
  user_id uuid references auth.users not null,
  tanggal date not null,
  followers integer,
  insight_note text,
  created_at timestamp default now()
);
alter table social_account_metrics enable row level security;
create policy "Users manage own social_account_metrics" on social_account_metrics for all using (auth.uid() = user_id);

create table social_account_earnings (
  id uuid default gen_random_uuid() primary key,
  account_id uuid references social_accounts on delete cascade not null,
  user_id uuid references auth.users not null,
  tanggal date not null,
  sumber text not null,
  nominal numeric not null,
  tipe text default 'Brand Deal',         -- 'Brand Deal'|'Ad Revenue'|'Salary'|'Lainnya'
  catatan text,
  created_at timestamp default now()
);
alter table social_account_earnings enable row level security;
create policy "Users manage own social_account_earnings" on social_account_earnings for all using (auth.uid() = user_id);


-- ============================================================
-- 11. PUSH NOTIFICATION
-- ============================================================
create table push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamp default now()
);
alter table push_subscriptions enable row level security;
create policy "Users manage own push_subscriptions" on push_subscriptions for all using (auth.uid() = user_id);


-- ============================================================
-- SELESAI. Cek Table Editor - harusnya ada 24 tabel + 1 fungsi (get_email_by_username)
-- ============================================================


create table activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  judul text not null,
  kategori text not null,
  durasi integer,
  catatan text,
  tanggal date not null,
  created_at timestamp default now()
);

alter table activities enable row level security;

create policy "Users manage own activities"
on activities for all
using (auth.uid() = user_id);


-- Jalankan ini di Supabase SQL Editor (aman dijalankan berkali-kali)
alter table training_plans add column if not exists hari_istirahat integer[] default '{}';
