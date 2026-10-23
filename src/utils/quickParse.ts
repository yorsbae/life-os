// Parser "catat cepat": "kopi 25rb" -> { nominal: 25000, catatan: "kopi", kategori: "Makan" }.

const UNIT: Record<string, number> = { rb: 1e3, ribu: 1e3, k: 1e3, jt: 1e6, juta: 1e6, m: 1e6 };

/** Ubah "25rb", "1,5jt", "1.500.000", "25000" menjadi angka; null bila bukan nominal. */
export function parseAmount(token: string): number | null {
  const m = token.toLowerCase().replace(/^rp\.?/, "").match(/^(\d[\d.,]*)(rb|ribu|k|jt|juta|m)?$/);
  if (!m) return null;
  let num = m[1];
  const unit = m[2];
  if (unit) {
    // "1,5jt" / "1.5jt" -> desimal
    num = num.replace(",", ".");
    if ((num.match(/\./g) ?? []).length > 1) return null;
    const v = parseFloat(num) * UNIT[unit];
    return Number.isFinite(v) && v > 0 ? Math.round(v) : null;
  }
  // tanpa satuan: titik/koma adalah pemisah ribuan ("1.500.000", "25,000")
  const digits = num.replace(/[.,]/g, "");
  const v = Number(digits);
  return Number.isFinite(v) && v > 0 ? v : null;
}

const CATEGORY_WORDS: Record<string, string[]> = {
  Makan: ["makan", "kopi", "bakso", "nasi", "mie", "ayam", "snack", "jajan", "minum", "sarapan", "lunch", "dinner", "cafe"],
  Transport: ["bensin", "parkir", "ojek", "grab", "gojek", "tol", "bus", "kereta", "angkot", "transport"],
  Belanja: ["belanja", "baju", "sepatu", "shopee", "tokopedia", "indomaret", "alfamart"],
  Kesehatan: ["obat", "dokter", "apotek", "vitamin", "klinik"],
  Tagihan: ["listrik", "pulsa", "internet", "wifi", "kos", "sewa", "tagihan", "token", "air"],
  Hiburan: ["nonton", "bioskop", "game", "netflix", "spotify", "film"],
};

export function guessCategory(text: string): string {
  const words = text.toLowerCase().split(/[^a-z]+/);
  for (const [cat, list] of Object.entries(CATEGORY_WORDS)) {
    if (words.some((w) => list.includes(w))) return cat;
  }
  return "Lainnya";
}

export interface QuickExpense {
  nominal: number;
  catatan: string;
  kategori: string;
}

/** Ambil nominal dari kata mana pun dalam teks; sisanya jadi catatan. */
export function parseQuickExpense(input: string): QuickExpense | null {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  let idx = -1;
  let nominal: number | null = null;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const v = parseAmount(tokens[i]);
    if (v !== null) {
      nominal = v;
      idx = i;
      break;
    }
  }
  if (nominal === null) return null;
  const catatan = tokens.filter((_, i) => i !== idx).join(" ").trim();
  return { nominal, catatan, kategori: guessCategory(catatan) };
}

/** "65,5" / "65.5" -> 65.5 (berat badan). */
export function parseWeight(input: string): number | null {
  const v = parseFloat(input.trim().replace(",", "."));
  return Number.isFinite(v) && v >= 20 && v <= 400 ? v : null;
}
