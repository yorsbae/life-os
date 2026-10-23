import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Database, type BackupFile } from "../lib/db/query";
import { db } from "../lib/db";
import { resyncRemindersFromDb } from "./reminders";
import { buildTransactionsCsv, type TxExpense, type TxIncome, type TxTransfer } from "./csv";
import {
  decryptBackup,
  encryptBackup,
  isEncryptedBackup,
  PasswordRequiredError,
} from "./backupCrypto";

import { t } from "../lib/i18n";
// Backup manual ke file JSON berversi. Tidak ada cloud: file dibagikan lewat
// menu Share Android (simpan ke Files, kirim ke diri sendiri, Drive, dll — pilihan pengguna).

/** Simpan/bagikan file teks: menu Share di Android, unduhan biasa di web. */
async function deliverFile(filename: string, content: string, mime: string, title: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    await Share.share({ title, url: written.uri, dialogTitle: title });
  } else {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/** Bila `password` diisi, file backup dienkripsi (AES-256-GCM). */
export async function exportAllData(password?: string): Promise<{ error: string | null }> {
  try {
    const snapshot = await db.snapshot();
    const json = password
      ? await encryptBackup(JSON.stringify(snapshot), password)
      : JSON.stringify(snapshot, null, 2);
    const filename = `lifeos-backup-${new Date().toISOString().split("T")[0]}${password ? ".enc" : ""}.json`;

    await deliverFile(filename, json, "application/json", "Backup Life OS");
    return { error: null };
  } catch (err) {
    // Pengguna menutup dialog Share bukan kesalahan.
    if (err instanceof Error && /cancel/i.test(err.message)) return { error: null };
    return { error: err instanceof Error ? err.message : t("Gagal export data") };
  }
}

export interface ImportPreview {
  backup: BackupFile;
  totalRows: number;
  exportedAt: string;
}

/** Baca & validasi file backup tanpa mengubah database. */
export async function readBackupFile(file: File, password?: string): Promise<ImportPreview> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("File bukan JSON yang valid.");
  }
  if (isEncryptedBackup(parsed)) {
    if (!password) throw new PasswordRequiredError();
    const plain = await decryptBackup(parsed, password);
    try {
      parsed = JSON.parse(plain);
    } catch {
      throw new Error("File bukan JSON yang valid.");
    }
  }
  const backup = Database.validateBackup(parsed);
  const totalRows = Object.values(backup.tables).reduce((n, r) => n + r.length, 0);
  return { backup, totalRows, exportedAt: backup.exported_at };
}

/** Timpa seluruh data dengan isi backup (atomik: gagal = data lama tetap utuh). */
export async function restoreBackup(
  backup: BackupFile,
): Promise<{ error: string | null }> {
  try {
    await db.restore(backup);
    await resyncRemindersFromDb().catch(() => {});
    return { error: null };
  } catch (err) {
    return {
      error:
        (err instanceof Error ? err.message : "Gagal memulihkan data") +
        " — data kamu yang sekarang tidak diubah.",
    };
  }
}

/** Ekspor semua transaksi (pemasukan, pengeluaran, transfer) ke CSV untuk dibuka di Excel/Sheets. */
export async function exportTransactionsCsv(): Promise<{ error: string | null }> {
  try {
    const [inc, exp, tr] = await Promise.all([
      db.from("incomes").select("tanggal, nominal, sumber, kategori, catatan"),
      db.from("expenses").select("tanggal, nominal, kategori, metode_pembayaran, catatan"),
      db.from("transfers").select("tanggal, nominal, dari_akun, ke_akun, catatan"),
    ]);
    const failed = inc.error ?? exp.error ?? tr.error;
    if (failed) return { error: failed.message };

    const csv = buildTransactionsCsv(
      {
        incomes: inc.data as TxIncome[],
        expenses: exp.data as TxExpense[],
        transfers: tr.data as TxTransfer[],
      },
      {
        columns: [t("Tanggal"), t("Jenis"), t("Nominal"), t("Kategori"), t("Sumber/Akun"), t("Catatan")],
        income: t("Pemasukan"),
        expense: t("Pengeluaran"),
        transfer: t("Transfer"),
      },
    );
    const filename = `lifeos-transaksi-${new Date().toISOString().split("T")[0]}.csv`;
    await deliverFile(filename, csv, "text/csv;charset=utf-8", "Transaksi Life OS");
    return { error: null };
  } catch (err) {
    if (err instanceof Error && /cancel/i.test(err.message)) return { error: null };
    return { error: err instanceof Error ? err.message : t("Gagal export data") };
  }
}
