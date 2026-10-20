import { Capacitor } from "@capacitor/core";
import { Directory, Filesystem, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { Database, type BackupFile } from "../lib/db/query";
import { db } from "../lib/db";
import { resyncRemindersFromDb } from "./reminders";

// Backup manual ke file JSON berversi. Tidak ada cloud: file dibagikan lewat
// menu Share Android (simpan ke Files, kirim ke diri sendiri, Drive, dll — pilihan pengguna).

export async function exportAllData(): Promise<{ error: string | null }> {
  try {
    const snapshot = await db.snapshot();
    const json = JSON.stringify(snapshot, null, 2);
    const filename = `lifeos-backup-${new Date().toISOString().split("T")[0]}.json`;

    if (Capacitor.isNativePlatform()) {
      const written = await Filesystem.writeFile({
        path: filename,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({
        title: "Backup Life OS",
        url: written.uri,
        dialogTitle: "Simpan backup Life OS",
      });
    } else {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
    return { error: null };
  } catch (err) {
    // Pengguna menutup dialog Share bukan kesalahan.
    if (err instanceof Error && /cancel/i.test(err.message)) return { error: null };
    return { error: err instanceof Error ? err.message : "Gagal export data" };
  }
}

export interface ImportPreview {
  backup: BackupFile;
  totalRows: number;
  exportedAt: string;
}

/** Baca & validasi file backup tanpa mengubah database. */
export async function readBackupFile(file: File): Promise<ImportPreview> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("File bukan JSON yang valid.");
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
