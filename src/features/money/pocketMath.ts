// Perhitungan kantong (pockets). Murni (tanpa React/DB) agar mudah diuji.
//
// Konsep:
//   Total Saldo  = jumlah seluruh sumber dana (cash, bank, e-wallet, investasi).
//   Kantong      = bagian dari Total Saldo yang "dipisahkan" untuk tujuan tertentu.
//   Saldo Utama  = Total Saldo − jumlah saldo seluruh kantong tabungan (belum dialokasikan).
//
// Saldo kantong tabungan = Σ isi − Σ keluar(kembali ke Saldo Utama) − Σ pengeluaran yang diambil dari kantong.
// Kantong "pemberian" (mis. Orang Tua) tidak punya saldo; ia hanya menjumlah pengeluaran yang dikaitkan
// kepadanya (Total Diberikan) terhadap targetnya.

export const POCKET_TYPES = ["tabungan", "pemberian"] as const;
export type PocketType = (typeof POCKET_TYPES)[number];
export const ALLOC_MODES = ["manual", "persen", "nominal"] as const;
export type AllocMode = (typeof ALLOC_MODES)[number];

export interface PocketLike {
  id: string;
  nama: string;
  ikon: string;
  tipe: PocketType | string;
  target: number;
  mode_alokasi: AllocMode | string;
  nilai_alokasi: number;
}
export interface EntryLike {
  pocket_id: string;
  jenis: "isi" | "keluar" | string;
  nominal: number;
}
export interface PocketExpenseLike {
  pocket_id?: string | null;
  nominal: number;
}

export interface PocketStat<P extends PocketLike = PocketLike> {
  pocket: P;
  /** Saldo kantong (tabungan). Selalu 0 untuk kantong pemberian. */
  saldo: number;
  /** Total pengeluaran yang diambil dari / diberikan lewat kantong ini. */
  terpakai: number;
  /** Nilai yang dibandingkan dengan target: saldo (tabungan) atau total diberikan (pemberian). */
  nilai: number;
  /** Persentase terhadap target, dibulatkan. 0 bila tanpa target. */
  persen: number;
}

export const isGiving = (p: Pick<PocketLike, "tipe">) => p.tipe === "pemberian";

export function computePockets<P extends PocketLike>(
  pockets: P[],
  entries: EntryLike[],
  expenses: PocketExpenseLike[],
): PocketStat<P>[] {
  const isi = new Map<string, number>();
  const keluar = new Map<string, number>();
  for (const e of entries) {
    const m = e.jenis === "isi" ? isi : e.jenis === "keluar" ? keluar : null;
    if (m) m.set(e.pocket_id, (m.get(e.pocket_id) ?? 0) + e.nominal);
  }
  const spent = new Map<string, number>();
  for (const x of expenses) {
    if (x.pocket_id) spent.set(x.pocket_id, (spent.get(x.pocket_id) ?? 0) + x.nominal);
  }
  return pockets.map((pocket) => {
    const terpakai = spent.get(pocket.id) ?? 0;
    const giving = isGiving(pocket);
    const saldo = giving ? 0 : (isi.get(pocket.id) ?? 0) - (keluar.get(pocket.id) ?? 0) - terpakai;
    const nilai = giving ? terpakai : saldo;
    const persen = pocket.target > 0 ? Math.round((nilai / pocket.target) * 100) : 0;
    return { pocket, saldo, terpakai, nilai, persen };
  });
}

/** Jumlah saldo seluruh kantong tabungan = bagian Total Saldo yang sudah dialokasikan. */
export function allocatedTotal(stats: PocketStat[]): number {
  return stats.reduce((s, x) => s + (isGiving(x.pocket) ? 0 : x.saldo), 0);
}

/** Saldo Utama = Total Saldo − yang sudah dialokasikan ke kantong. */
export function utamaBalance(total: number, stats: PocketStat[]): number {
  return total - allocatedTotal(stats);
}

export interface Allocation {
  pocketId: string;
  nominal: number;
}

/**
 * Bagi `base` ke kantong tabungan sesuai aturannya (urut seperti `pockets`):
 *   persen  -> floor(base × nilai / 100)
 *   nominal -> nilai tetap
 *   manual  -> dilewati
 * Setiap bagian dibatasi sisa yang masih ada, jadi jumlahnya tidak pernah melebihi `base`.
 */
export function planByRules(base: number, pockets: PocketLike[]): Allocation[] {
  let remaining = Math.max(0, Math.floor(base));
  const out: Allocation[] = [];
  for (const p of pockets) {
    if (remaining <= 0) break;
    if (isGiving(p)) continue;
    let want = 0;
    if (p.mode_alokasi === "persen") want = Math.floor((Math.max(0, base) * p.nilai_alokasi) / 100);
    else if (p.mode_alokasi === "nominal") want = Math.floor(p.nilai_alokasi);
    want = Math.min(Math.max(0, want), remaining);
    if (want > 0) {
      out.push({ pocketId: p.id, nominal: want });
      remaining -= want;
    }
  }
  return out;
}

/** Total persen yang sudah dipakai kantong lain (tabungan, mode persen), tidak termasuk `exceptId`. */
export function percentUsed(pockets: PocketLike[], exceptId?: string): number {
  return pockets
    .filter((p) => p.id !== exceptId && !isGiving(p) && p.mode_alokasi === "persen")
    .reduce((s, p) => s + (p.nilai_alokasi || 0), 0);
}

/** Pesan galat (teks sumber untuk t()) bila aturan pembagian tidak valid; null bila valid. */
export function checkRule(
  pockets: PocketLike[],
  draft: { id?: string; tipe: string; mode: string; nilai: number },
): string | null {
  if (isGiving(draft) || draft.mode === "manual") return null;
  if (!Number.isFinite(draft.nilai) || draft.nilai <= 0) return "Isi nilai pembagian lebih dari 0";
  if (draft.mode === "persen") {
    if (draft.nilai > 100) return "Persen tidak boleh lebih dari 100";
    if (percentUsed(pockets, draft.id) + draft.nilai > 100.0001) return "Total persen semua kantong melebihi 100%";
  }
  return null;
}

/** Hari menuju tanggal gajian berikutnya (0 = hari ini). `day` 1–31, bulan pendek memakai hari terakhir. */
export function daysUntilPayday(day: number, now: Date = new Date()): number {
  const d = Math.min(31, Math.max(1, Math.floor(day)));
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = new Date(y, m, now.getDate());
  const thisMonth = new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate()));
  const target =
    thisMonth >= today
      ? thisMonth
      : new Date(y, m + 1, Math.min(d, new Date(y, m + 2, 0).getDate()));
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
