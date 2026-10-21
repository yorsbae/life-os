// Skema SQLite Life OS + daftar migrasi berversi.
//
// Aturan menambah perubahan skema di rilis berikutnya:
//   1. JANGAN edit migrasi yang sudah dirilis. Tambahkan entri baru di akhir MIGRATIONS.
//   2. Tiap migrasi dijalankan dalam satu transaksi bersama pembaruan nomor versi.
//
// Konvensi tipe:
//   - uuid      -> TEXT (dibuat di JS lewat crypto.randomUUID())
//   - date      -> TEXT 'YYYY-MM-DD'
//   - timestamp -> TEXT ISO 8601
//   - boolean   -> INTEGER 0/1 (dikonversi otomatis, lihat TABLE_META)
//   - jsonb/array -> TEXT berisi JSON (dikonversi otomatis, lihat TABLE_META)
//
// Catatan: kolom user_id dipertahankan (nilai tetap "local") supaya kode hook lama
// tidak perlu dirombak. Aplikasi ini single-user dan tanpa login.

import type { SqlStatement } from "./types";

export const LOCAL_USER_ID = "local";

const NOW = "(strftime('%Y-%m-%dT%H:%M:%f','now'))";
const ID = "id TEXT PRIMARY KEY";
const UID = "user_id TEXT NOT NULL";
const CREATED = `created_at TEXT DEFAULT ${NOW}`;

const v1: string[] = [
  `CREATE TABLE _meta (key TEXT PRIMARY KEY, value TEXT)`,

  // Pengaturan lokal aplikasi (mis. status pengingat). Pengganti push_subscriptions.
  `CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT)`,

  `CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    nama TEXT, username TEXT UNIQUE, umur INTEGER, jenis_kelamin TEXT,
    tinggi_badan REAL, berat_badan REAL, target_berat_badan REAL,
    aktivitas_level TEXT DEFAULT 'Sedang',
    encryption_salt TEXT,
    onboarding_done INTEGER DEFAULT 0,
    ${CREATED}
  )`,

  `CREATE TABLE expenses (
    ${ID}, ${UID}, nominal REAL NOT NULL, kategori TEXT NOT NULL,
    metode_pembayaran TEXT, catatan TEXT, tanggal TEXT NOT NULL, ${CREATED}
  )`,
  `CREATE TABLE incomes (
    ${ID}, ${UID}, nominal REAL NOT NULL, sumber TEXT NOT NULL,
    kategori TEXT, catatan TEXT, tanggal TEXT NOT NULL, ${CREATED}
  )`,
  `CREATE TABLE budget_targets (
    ${ID}, ${UID}, bulan TEXT NOT NULL, target_saving REAL, budget_kategori TEXT,
    ${CREATED}, UNIQUE (user_id, bulan)
  )`,
  `CREATE TABLE wishlists (
    ${ID}, ${UID}, judul TEXT NOT NULL, kategori TEXT NOT NULL,
    estimasi_biaya REAL, terkumpul REAL DEFAULT 0, prioritas TEXT DEFAULT 'Medium',
    target_tanggal TEXT, status TEXT DEFAULT 'Diinginkan', catatan TEXT, ${CREATED}
  )`,
  `CREATE TABLE recurring_expenses (
    ${ID}, ${UID}, nama TEXT NOT NULL, nominal REAL NOT NULL, kategori TEXT,
    tanggal_jatuh_tempo INTEGER NOT NULL, aktif INTEGER DEFAULT 1, ${CREATED}
  )`,

  `CREATE TABLE exercises (
    ${ID}, ${UID}, tipe TEXT NOT NULL, sub_kategori TEXT NOT NULL,
    durasi INTEGER, jarak REAL, catatan TEXT, tanggal TEXT NOT NULL, ${CREATED}
  )`,
  `CREATE TABLE exercise_schedules (
    ${ID}, ${UID}, hari INTEGER NOT NULL, tipe TEXT NOT NULL,
    sub_kategori TEXT, catatan TEXT, ${CREATED}, UNIQUE (user_id, hari)
  )`,
  `CREATE TABLE training_plans (
    ${ID}, ${UID}, judul TEXT NOT NULL, tipe TEXT NOT NULL,
    durasi_minggu INTEGER NOT NULL, tanggal_mulai TEXT NOT NULL,
    status TEXT DEFAULT 'Aktif', hari_istirahat TEXT DEFAULT '[]', ${CREATED}
  )`,
  `CREATE TABLE training_plan_sessions (
    ${ID}, plan_id TEXT NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    ${UID}, minggu_ke INTEGER NOT NULL, tanggal TEXT NOT NULL, tipe TEXT NOT NULL,
    sub_kategori TEXT, target_durasi INTEGER, target_jarak REAL,
    intensity_multiplier REAL DEFAULT 1.0, gerakan TEXT, ${CREATED}
  )`,
  `CREATE TABLE body_weight_logs (
    ${ID}, ${UID}, berat REAL NOT NULL, tanggal TEXT NOT NULL, ${CREATED}
  )`,

  `CREATE TABLE learnings (
    ${ID}, ${UID}, topik TEXT NOT NULL, materi TEXT, catatan TEXT,
    durasi INTEGER, tanggal TEXT NOT NULL, ${CREATED}
  )`,
  `CREATE TABLE journals (
    ${ID}, ${UID}, konten TEXT NOT NULL, mood TEXT, tanggal TEXT NOT NULL, ${CREATED}
  )`,
  `CREATE TABLE readings (
    ${ID}, ${UID}, judul_buku TEXT NOT NULL, penulis TEXT,
    halaman_sekarang INTEGER DEFAULT 0, total_halaman INTEGER,
    status TEXT DEFAULT 'Dibaca', insight TEXT, tanggal TEXT NOT NULL, ${CREATED}
  )`,
  `CREATE TABLE weekly_reviews (
    ${ID}, ${UID}, minggu_mulai TEXT NOT NULL, apa_yang_berhasil TEXT,
    apa_yang_gagal TEXT, yang_mau_diubah TEXT, ${CREATED},
    UNIQUE (user_id, minggu_mulai)
  )`,

  `CREATE TABLE creative_projects (
    ${ID}, ${UID}, judul TEXT NOT NULL, kategori TEXT,
    status TEXT NOT NULL DEFAULT 'idea', is_archived INTEGER DEFAULT 0,
    catatan_ide TEXT, shot_list TEXT, lokasi TEXT, props TEXT, referensi_url TEXT,
    tanggal_shooting TEXT, catatan_shooting TEXT,
    software_edit TEXT, progress_edit INTEGER DEFAULT 0, catatan_editing TEXT,
    tanggal_upload TEXT, platform TEXT, link_hasil TEXT, target_upload TEXT,
    views INTEGER, likes INTEGER, catatan_analisa TEXT, ${CREATED}
  )`,
  `CREATE TABLE notes (
    ${ID}, ${UID}, judul TEXT NOT NULL, kategori TEXT NOT NULL, konten TEXT,
    tags TEXT, is_pinned INTEGER DEFAULT 0, ${CREATED}
  )`,

  `CREATE TABLE dev_projects (
    ${ID}, ${UID}, nama TEXT NOT NULL, riset_kebutuhan TEXT,
    status TEXT DEFAULT 'Aktif', ${CREATED}
  )`,
  `CREATE TABLE dev_project_logs (
    ${ID}, project_id TEXT NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
    ${UID}, tanggal TEXT NOT NULL, catatan TEXT NOT NULL, ${CREATED}
  )`,
  `CREATE TABLE dev_project_todos (
    ${ID}, project_id TEXT NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
    ${UID}, judul TEXT NOT NULL, is_done INTEGER DEFAULT 0, ${CREATED}
  )`,
  `CREATE TABLE dev_project_issues (
    ${ID}, project_id TEXT NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
    ${UID}, masalah TEXT NOT NULL, solusi TEXT, status TEXT DEFAULT 'Open', ${CREATED}
  )`,

  `CREATE TABLE goals (
    ${ID}, ${UID}, judul TEXT NOT NULL, tipe TEXT NOT NULL,
    target_value REAL NOT NULL, current_value_manual REAL DEFAULT 0,
    tanggal_mulai TEXT NOT NULL, tanggal_target TEXT, status TEXT DEFAULT 'Aktif',
    ${CREATED}
  )`,
  `CREATE TABLE events (
    ${ID}, ${UID}, judul TEXT NOT NULL, tipe TEXT NOT NULL,
    tanggal_mulai TEXT NOT NULL, tanggal_selesai TEXT, catatan TEXT, ${CREATED}
  )`,

  `CREATE TABLE social_accounts (
    ${ID}, ${UID}, platform TEXT NOT NULL, username TEXT NOT NULL,
    password_encrypted TEXT, niche TEXT, tujuan TEXT, status TEXT DEFAULT 'Aktif',
    ${CREATED}
  )`,
  `CREATE TABLE social_account_metrics (
    ${ID}, account_id TEXT NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    ${UID}, tanggal TEXT NOT NULL, followers INTEGER, insight_note TEXT, ${CREATED}
  )`,
  `CREATE TABLE social_account_earnings (
    ${ID}, account_id TEXT NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    ${UID}, tanggal TEXT NOT NULL, sumber TEXT NOT NULL, nominal REAL NOT NULL,
    tipe TEXT DEFAULT 'Brand Deal', catatan TEXT, ${CREATED}
  )`,

  `CREATE TABLE activities (
    ${ID}, ${UID}, judul TEXT NOT NULL, kategori TEXT NOT NULL,
    durasi INTEGER, catatan TEXT, tanggal TEXT NOT NULL, ${CREATED}
  )`,

  // Indeks untuk kolom yang sering difilter/diurutkan
  `CREATE INDEX idx_expenses_tanggal ON expenses(tanggal)`,
  `CREATE INDEX idx_incomes_tanggal ON incomes(tanggal)`,
  `CREATE INDEX idx_exercises_tanggal ON exercises(tanggal)`,
  `CREATE INDEX idx_journals_tanggal ON journals(tanggal)`,
  `CREATE INDEX idx_events_mulai ON events(tanggal_mulai)`,
  `CREATE INDEX idx_sessions_plan ON training_plan_sessions(plan_id)`,
  `CREATE INDEX idx_dev_logs_project ON dev_project_logs(project_id)`,
  `CREATE INDEX idx_dev_todos_project ON dev_project_todos(project_id)`,
  `CREATE INDEX idx_dev_issues_project ON dev_project_issues(project_id)`,
  `CREATE INDEX idx_sa_metrics_account ON social_account_metrics(account_id)`,
  `CREATE INDEX idx_sa_earnings_account ON social_account_earnings(account_id)`,
];

// v2 — Revamp UI: modul Plan (kegiatan/tugas), Habit, dan riwayat Focus.
const v2: string[] = [
  `CREATE TABLE tasks (
    ${ID}, ${UID}, judul TEXT NOT NULL, deskripsi TEXT,
    prioritas TEXT NOT NULL DEFAULT 'P2',
    status TEXT NOT NULL DEFAULT 'Todo',
    tanggal_mulai TEXT, tanggal_selesai TEXT,
    jam_mulai TEXT, jam_selesai TEXT,
    kategori TEXT, selesai_pada TEXT, ${CREATED}
  )`,
  `CREATE TABLE task_subtasks (
    ${ID}, task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    ${UID}, judul TEXT NOT NULL, is_done INTEGER DEFAULT 0, urutan INTEGER DEFAULT 0,
    ${CREATED}
  )`,
  `CREATE TABLE habits (
    ${ID}, ${UID}, nama TEXT NOT NULL, ikon TEXT DEFAULT 'check',
    target_harian REAL NOT NULL DEFAULT 1, satuan TEXT DEFAULT 'kali',
    aktif INTEGER DEFAULT 1, ${CREATED}
  )`,
  `CREATE TABLE habit_logs (
    ${ID}, habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    ${UID}, tanggal TEXT NOT NULL, nilai REAL NOT NULL DEFAULT 0, ${CREATED},
    UNIQUE (habit_id, tanggal)
  )`,
  `CREATE TABLE focus_sessions (
    ${ID}, ${UID}, task_id TEXT, mode TEXT NOT NULL DEFAULT 'Pomodoro',
    durasi_target INTEGER NOT NULL, durasi_aktual INTEGER NOT NULL DEFAULT 0,
    selesai INTEGER DEFAULT 0, tanggal TEXT NOT NULL, ${CREATED}
  )`,
  `CREATE INDEX idx_tasks_tanggal ON tasks(tanggal_mulai)`,
  `CREATE INDEX idx_subtasks_task ON task_subtasks(task_id)`,
  `CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id)`,
  `CREATE INDEX idx_focus_tanggal ON focus_sessions(tanggal)`,
];

// v3 — Revamp UI tahap 2: akun & transfer, tidur, materi belajar, referensi kreatif,
// serta kolom tambahan untuk journal (judul, tag) dan goals (satuan).
const v3: string[] = [
  `CREATE TABLE accounts (
    ${ID}, ${UID}, nama TEXT NOT NULL, tipe TEXT NOT NULL DEFAULT 'Tunai',
    saldo_awal REAL NOT NULL DEFAULT 0, ${CREATED}
  )`,
  `CREATE TABLE transfers (
    ${ID}, ${UID}, dari_akun TEXT NOT NULL, ke_akun TEXT NOT NULL,
    nominal REAL NOT NULL, tanggal TEXT NOT NULL, catatan TEXT, ${CREATED}
  )`,
  `CREATE TABLE sleep_logs (
    ${ID}, ${UID}, tanggal TEXT NOT NULL, jam REAL NOT NULL, ${CREATED},
    UNIQUE (user_id, tanggal)
  )`,
  `CREATE TABLE study_items (
    ${ID}, ${UID}, judul TEXT NOT NULL, tipe TEXT NOT NULL DEFAULT 'Kursus',
    selesai REAL NOT NULL DEFAULT 0, total REAL, satuan TEXT DEFAULT 'materi',
    catatan TEXT, ${CREATED}
  )`,
  `CREATE TABLE creative_refs (
    ${ID}, ${UID}, judul TEXT NOT NULL, url TEXT, catatan TEXT, ${CREATED}
  )`,
  `ALTER TABLE incomes ADD COLUMN akun TEXT`,
  `ALTER TABLE journals ADD COLUMN judul TEXT`,
  `ALTER TABLE journals ADD COLUMN tags TEXT`,
  `ALTER TABLE goals ADD COLUMN satuan TEXT`,
  `CREATE INDEX idx_transfers_tanggal ON transfers(tanggal)`,
  `CREATE INDEX idx_sleep_tanggal ON sleep_logs(tanggal)`,
];

export const MIGRATIONS: string[][] = [v1, v2, v3];

export function migrationStatements(index: number): SqlStatement[] {
  return [
    ...MIGRATIONS[index].map((sql) => ({ sql })),
    {
      sql: "INSERT INTO _meta(key, value) VALUES ('schema_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      params: [String(index + 1)],
    },
  ];
}

// Kolom yang butuh konversi antara tipe SQLite dan tipe JS.
export interface TableMeta {
  bool: string[];
  json: string[];
}

export const TABLE_META: Record<string, TableMeta> = {
  app_settings: { bool: [], json: [] },
  profiles: { bool: ["onboarding_done"], json: [] },
  expenses: { bool: [], json: [] },
  incomes: { bool: [], json: [] },
  budget_targets: { bool: [], json: ["budget_kategori"] },
  wishlists: { bool: [], json: [] },
  recurring_expenses: { bool: ["aktif"], json: [] },
  exercises: { bool: [], json: [] },
  exercise_schedules: { bool: [], json: [] },
  training_plans: { bool: [], json: ["hari_istirahat"] },
  training_plan_sessions: { bool: [], json: [] },
  body_weight_logs: { bool: [], json: [] },
  learnings: { bool: [], json: [] },
  journals: { bool: [], json: ["tags"] },
  readings: { bool: [], json: [] },
  weekly_reviews: { bool: [], json: [] },
  creative_projects: { bool: ["is_archived"], json: [] },
  notes: { bool: ["is_pinned"], json: ["tags"] },
  dev_projects: { bool: [], json: [] },
  dev_project_logs: { bool: [], json: [] },
  dev_project_todos: { bool: ["is_done"], json: [] },
  dev_project_issues: { bool: [], json: [] },
  goals: { bool: [], json: [] },
  events: { bool: [], json: [] },
  social_accounts: { bool: [], json: [] },
  social_account_metrics: { bool: [], json: [] },
  social_account_earnings: { bool: [], json: [] },
  activities: { bool: [], json: [] },
  tasks: { bool: [], json: [] },
  task_subtasks: { bool: ["is_done"], json: [] },
  habits: { bool: ["aktif"], json: [] },
  habit_logs: { bool: [], json: [] },
  focus_sessions: { bool: ["selesai"], json: [] },
  accounts: { bool: [], json: [] },
  transfers: { bool: [], json: [] },
  sleep_logs: { bool: [], json: [] },
  study_items: { bool: [], json: [] },
  creative_refs: { bool: [], json: [] },
};

// Tabel dengan primary key bernama "id" yang dibuatkan UUID otomatis saat insert.
// app_settings memakai "key" sebagai primary key.
export const PK: Record<string, string> = { app_settings: "key" };

// Tabel data yang ikut backup, URUT dari induk ke anak (penting untuk foreign key saat restore).
// app_settings dan _meta sengaja tidak ikut: itu pengaturan perangkat, bukan data pengguna.
export const BACKUP_TABLES = [
  "profiles",
  "expenses",
  "incomes",
  "budget_targets",
  "wishlists",
  "recurring_expenses",
  "exercises",
  "exercise_schedules",
  "training_plans",
  "training_plan_sessions",
  "body_weight_logs",
  "learnings",
  "journals",
  "readings",
  "weekly_reviews",
  "creative_projects",
  "notes",
  "dev_projects",
  "dev_project_logs",
  "dev_project_todos",
  "dev_project_issues",
  "goals",
  "events",
  "social_accounts",
  "social_account_metrics",
  "social_account_earnings",
  "activities",
  "tasks",
  "task_subtasks",
  "habits",
  "habit_logs",
  "focus_sessions",
  "accounts",
  "transfers",
  "sleep_logs",
  "study_items",
  "creative_refs",
] as const;

export const BACKUP_FORMAT = "lifeos-backup";
export const BACKUP_VERSION = 1;
