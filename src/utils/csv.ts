// Pembuat CSV yang aman untuk dibuka di Excel/Google Sheets.

export type CsvCell = string | number | null | undefined;

/**
 * Sel teks yang diawali = + - @ (atau tab/CR) dibaca spreadsheet sebagai RUMUS, sehingga catatan seperti
 * `=HYPERLINK(...)` dari data atau backup yang dimanipulasi bisa menjalankan perintah ("CSV injection").
 * Awali dengan apostrof agar dibaca sebagai teks biasa. Angka sungguhan tidak disentuh.
 */
function neutralize(s: string): string {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
}

export function csvCell(v: CsvCell): string {
  if (v === null || v === undefined) return "";
  const raw = typeof v === "number" ? (Number.isFinite(v) ? String(v) : "") : neutralize(v);
  return /[",\r\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

/** Baris dipisah CRLF (standar RFC 4180). BOM UTF-8 di depan supaya Excel membaca huruf non-Latin dengan benar. */
export function toCsv(rows: CsvCell[][]): string {
  return "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export interface TxIncome {
  tanggal: string;
  nominal: number;
  sumber: string;
  kategori: string | null;
  catatan: string | null;
}
export interface TxExpense {
  tanggal: string;
  nominal: number;
  kategori: string;
  metode_pembayaran: string | null;
  catatan: string | null;
}
export interface TxTransfer {
  tanggal: string;
  nominal: number;
  dari_akun: string;
  ke_akun: string;
  catatan: string | null;
}

export interface TxHeaders {
  columns: [string, string, string, string, string, string];
  income: string;
  expense: string;
  transfer: string;
}

/** Semua transaksi dalam satu tabel, terbaru di atas. Nominal selalu positif; arah ada di kolom jenis. */
export function buildTransactionsCsv(
  data: { incomes: TxIncome[]; expenses: TxExpense[]; transfers: TxTransfer[] },
  h: TxHeaders,
): string {
  type Row = { tanggal: string; cells: CsvCell[] };
  const rows: Row[] = [
    ...data.incomes.map((r) => ({
      tanggal: r.tanggal,
      cells: [r.tanggal, h.income, r.nominal, r.kategori ?? "", r.sumber, r.catatan ?? ""] as CsvCell[],
    })),
    ...data.expenses.map((r) => ({
      tanggal: r.tanggal,
      cells: [r.tanggal, h.expense, r.nominal, r.kategori, r.metode_pembayaran ?? "", r.catatan ?? ""] as CsvCell[],
    })),
    ...data.transfers.map((r) => ({
      tanggal: r.tanggal,
      cells: [r.tanggal, h.transfer, r.nominal, "", `${r.dari_akun} → ${r.ke_akun}`, r.catatan ?? ""] as CsvCell[],
    })),
  ];
  rows.sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  return toCsv([h.columns, ...rows.map((r) => r.cells)]);
}
