// Pintu masuk lapisan data lokal.
//
//   import { db } from "../lib/db";
//   const { data, error } = await db.from("expenses").select("*").order("tanggal", { ascending: false });
//
// `db` aman dipakai kapan saja: setiap query otomatis menunggu inisialisasi
// database (pembukaan koneksi + migrasi skema) selesai.

import { Database } from "./query";
import { migrate } from "./migrate";
import { createCapacitorDriver } from "./capacitorDriver";
import { withTimeout } from "../../utils/withTimeout";
import type { SqlDriver, SqlStatement, SqlValue } from "./types";

export { LOCAL_USER_ID } from "./schema";
export type { DbResult, DbError, Row, BackupFile } from "./query";

let ready: Promise<SqlDriver> | null = null;

/** Buka database dan terapkan migrasi. Dipanggil sekali saat aplikasi start. */
export function initDb(): Promise<SqlDriver> {
  if (!ready) {
    ready = (async () => {
      const driver = await withTimeout(createCapacitorDriver(), 20000, "Membuka database");
      await withTimeout(migrate(driver), 20000, "Migrasi database");
      return driver;
    })();
    // Jika gagal, izinkan percobaan ulang.
    ready.catch(() => {
      ready = null;
    });
  }
  return ready;
}

// Driver "malas": menunggu initDb() sebelum meneruskan query.
const lazyDriver: SqlDriver = {
  async all(sql: string, params?: SqlValue[]) {
    return (await initDb()).all(sql, params);
  },
  async batch(statements: SqlStatement[]) {
    return (await initDb()).batch(statements);
  },
};

export const db = new Database(lazyDriver);
