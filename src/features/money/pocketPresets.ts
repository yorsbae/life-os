import type { Expense } from "../../types";
import type { PocketType } from "./pocketMath";

export interface PocketPreset {
  nama: string;
  ikon: string;
  tipe: PocketType;
}

export const POCKET_PRESETS: PocketPreset[] = [
  { nama: "Dana Darurat", ikon: "shield", tipe: "tabungan" },
  { nama: "Tabungan", ikon: "landmark", tipe: "tabungan" },
  { nama: "Transport", ikon: "car", tipe: "tabungan" },
  { nama: "Orang Tua", ikon: "heart", tipe: "pemberian" },
];

/** Tebakan kategori pengeluaran dari nama kantong, supaya pengisian form lebih cepat. */
export function guessCategory(nama: string): Expense["kategori"] {
  const n = nama.toLowerCase();
  if (/transport|bensin|ojek|angkot|parkir/.test(n)) return "Transport";
  if (/makan|food|jajan/.test(n)) return "Makan";
  if (/belanja|shop/.test(n)) return "Belanja";
  if (/sehat|health|obat/.test(n)) return "Kesehatan";
  if (/tagihan|listrik|internet|bill/.test(n)) return "Tagihan";
  if (/hibur|game|nonton/.test(n)) return "Hiburan";
  if (/ortu|orang tua|keluarga|family/.test(n)) return "Keluarga";
  return "Lainnya";
}
