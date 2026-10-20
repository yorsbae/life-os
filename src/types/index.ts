// Tipe data ini HARUS sama persis dengan kolom di tabel Supabase
// supaya TypeScript bisa "menjaga" konsistensi antara kode dan database

export interface Expense {
  id: string;
  user_id: string;
  nominal: number;
  kategori:
    | "Makan"
    | "Transport"
    | "Belanja"
    | "Hiburan"
    | "Tagihan"
    | "Lainnya";
  metode_pembayaran: string | null;
  catatan: string | null;
  tanggal: string; // format 'YYYY-MM-DD'
  created_at: string;
}

// Tipe untuk data yang dikirim SAAT membuat expense baru
// (tanpa id, user_id, created_at karena itu di-generate otomatis oleh Supabase)
export type ExpenseInput = Omit<Expense, "id" | "user_id" | "created_at">;

export const KATEGORI_EXPENSE = [
  "Makan",
  "Transport",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Lainnya",
] as const;

export interface Income {
  id: string;
  user_id: string;
  nominal: number;
  sumber: string;
  kategori: string | null;
  catatan: string | null;
  tanggal: string;
  created_at: string;
}

export type IncomeInput = Omit<Income, "id" | "user_id" | "created_at">;

export const KATEGORI_INCOME = [
  "Gaji",
  "Freelance",
  "Bonus",
  "Investasi",
  "Hadiah",
  "Lainnya",
] as const;

// ============ ACTIVITY ============
export interface Activity {
  id: string;
  user_id: string;
  judul: string;
  kategori:
    | "Bekerja"
    | "Belajar"
    | "Membaca"
    | "Coding"
    | "Meeting"
    | "Istirahat";
  durasi: number | null; // dalam menit
  catatan: string | null;
  tanggal: string;
  created_at: string;
}

export type ActivityInput = Omit<Activity, "id" | "user_id" | "created_at">;

export const KATEGORI_ACTIVITY = [
  "Bekerja",
  "Belajar",
  "Membaca",
  "Coding",
  "Meeting",
  "Istirahat",
] as const;

// ============ EXERCISE ============
// Tipe sekarang bebas (string), tidak dikunci ke 'running'|'strength' saja.
// Preset di bawah cuma dipakai sebagai pilihan cepat di dropdown UI,
// user tetap bisa mengetik tipe baru sendiri (misal "Swimming", "Yoga", "Cycling").
export type ExerciseTipe = string;

export const EXERCISE_TIPE_PRESETS = [
  "Running",
  "Strength",
  "Swimming",
  "Cycling",
  "Yoga",
] as const;

// Cuma tipe ini yang butuh field "jarak" - Badminton/Yoga/Strength/dst tidak relevan
export const DISTANCE_BASED_TYPES = ["Running", "Swimming", "Cycling"] as const;

export const SUB_KATEGORI_RUNNING = [
  "Easy Run",
  "Recovery Run",
  "Long Run",
  "Tempo Run",
  "Interval",
  "Hill Run",
] as const;

export const SUB_KATEGORI_STRENGTH = [
  "Push",
  "Pull",
  "Legs",
  "Upper",
  "Lower",
  "Full Body",
] as const;

export interface Exercise {
  id: string;
  user_id: string;
  tipe: ExerciseTipe;
  sub_kategori: string;
  durasi: number | null; // menit
  jarak: number | null; // km, khusus tipe berbasis jarak (misal Running)
  catatan: string | null;
  tanggal: string;
  created_at: string;
}

export type ExerciseInput = Omit<Exercise, "id" | "user_id" | "created_at">;

// ============ LEARNING ============
export interface Learning {
  id: string;
  user_id: string;
  topik: string;
  materi: string | null;
  catatan: string | null;
  durasi: number | null; // menit, opsional - hasil peleburan dari Activity Tracker lama
  tanggal: string;
  created_at: string;
}

export type LearningInput = Omit<Learning, "id" | "user_id" | "created_at">;

// ============ JOURNAL ============
export interface Journal {
  id: string;
  user_id: string;
  konten: string;
  mood: string | null;
  tanggal: string;
  created_at: string;
}

export type JournalInput = Omit<Journal, "id" | "user_id" | "created_at">;

export const MOOD_OPTIONS = [
  "Senang",
  "Biasa",
  "Semangat",
  "Lelah",
  "Sedih",
  "Cemas",
] as const;

// ============ CREATIVE BRAIN ============
export type CreativeStatus =
  | "idea"
  | "planning"
  | "shooting"
  | "editing"
  | "uploaded"
  | "analisa";

// Urutan tahap - dipakai untuk validasi "maju harus urut, mundur bebas"
export const CREATIVE_STAGES: {
  key: CreativeStatus;
  label: string;
  icon: string;
}[] = [
  { key: "idea", label: "Idea", icon: "💡" },
  { key: "planning", label: "Planning", icon: "📋" },
  { key: "shooting", label: "Shooting", icon: "🎥" },
  { key: "editing", label: "Editing", icon: "✂️" },
  { key: "uploaded", label: "Uploaded", icon: "✅" },
  { key: "analisa", label: "Analisa", icon: "📈" },
];

export const CREATIVE_KATEGORI = [
  "Daily Life",
  "Travel",
  "Food",
  "Workout",
  "Work",
  "Bisnis",
  "Family",
  "Belajar",
] as const;

export interface CreativeProject {
  id: string;
  user_id: string;
  judul: string;
  kategori: string | null;
  status: CreativeStatus;
  is_archived: boolean;

  catatan_ide: string | null;

  shot_list: string | null;
  lokasi: string | null;
  props: string | null;
  referensi_url: string | null;

  tanggal_shooting: string | null;
  catatan_shooting: string | null;

  software_edit: string | null;
  progress_edit: number | null;
  catatan_editing: string | null;

  tanggal_upload: string | null;
  platform: string | null;
  link_hasil: string | null;
  target_upload: string | null;

  views: number | null;
  likes: number | null;
  catatan_analisa: string | null;

  created_at: string;
}

export type CreativeProjectInput = Omit<
  CreativeProject,
  "id" | "user_id" | "created_at"
>;

// ============ NOTES ============
export interface Note {
  id: string;
  user_id: string;
  judul: string;
  kategori: string;
  konten: string | null;
  tags: string[] | null;
  is_pinned: boolean;
  created_at: string;
}

export type NoteInput = Omit<Note, "id" | "user_id" | "created_at">;

export const NOTE_KATEGORI_DEFAULT = [
  "Tips Camera/Video",
  "Tips Exercise",
  "Tips Learning",
  "Tips Finance",
  "Ide Random",
  "Lainnya",
] as const;

// ============ CALENDAR EVENT ============
export type EventTipe =
  | "latihan"
  | "belajar"
  | "kerja"
  | "pengingat"
  | "pribadi";

export interface CalendarEvent {
  id: string;
  user_id: string;
  judul: string;
  tipe: EventTipe;
  tanggal_mulai: string; // ISO timestamp
  tanggal_selesai: string | null;
  catatan: string | null;
  created_at: string;
}

export type CalendarEventInput = Omit<
  CalendarEvent,
  "id" | "user_id" | "created_at"
>;

export const EVENT_TIPE_LABEL: Record<EventTipe, string> = {
  latihan: "Latihan",
  belajar: "Belajar",
  kerja: "Kerja",
  pengingat: "Pengingat",
  pribadi: "Pribadi",
};

export const EVENT_TIPE_COLOR: Record<EventTipe, string> = {
  latihan: "#f97316", // orange
  belajar: "#3b82f6", // blue
  kerja: "#8b5cf6", // purple
  pengingat: "#ef4444", // red
  pribadi: "#10b981", // green
};

// ============ MONEY: BUDGET TARGET ============
export interface BudgetTarget {
  id: string;
  user_id: string;
  bulan: string; // format 'YYYY-MM-01', mewakili 1 bulan
  target_saving: number | null;
  budget_kategori: Record<string, number> | null; // { "Makan": 1500000, ... }
  created_at: string;
}

export type BudgetTargetInput = Omit<
  BudgetTarget,
  "id" | "user_id" | "created_at"
>;

// ============ MONEY: WISHLIST ============
export type WishlistStatus =
  | "Diinginkan"
  | "Sedang Ditabung"
  | "Tercapai"
  | "Dibatalkan";
export type WishlistPrioritas = "Low" | "Medium" | "High";

export interface Wishlist {
  id: string;
  user_id: string;
  judul: string;
  kategori: string;
  estimasi_biaya: number | null;
  terkumpul: number;
  prioritas: WishlistPrioritas;
  target_tanggal: string | null;
  status: WishlistStatus;
  catatan: string | null;
  created_at: string;
}

export type WishlistInput = Omit<Wishlist, "id" | "user_id" | "created_at">;

export const WISHLIST_KATEGORI = [
  "Beli Barang",
  "Travel",
  "Pengalaman",
  "Lainnya",
] as const;
export const WISHLIST_STATUS: WishlistStatus[] = [
  "Diinginkan",
  "Sedang Ditabung",
  "Tercapai",
  "Dibatalkan",
];
export const WISHLIST_PRIORITAS: WishlistPrioritas[] = [
  "Low",
  "Medium",
  "High",
];
