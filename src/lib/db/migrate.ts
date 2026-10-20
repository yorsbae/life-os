import { MIGRATIONS, migrationStatements } from "./schema";
import type { SqlDriver } from "./types";

/** Versi skema yang tersimpan di database (0 = database baru/kosong). */
async function currentVersion(driver: SqlDriver): Promise<number> {
  const t = await driver.all(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='_meta'",
  );
  if (t.length === 0) return 0;
  const rows = await driver.all(
    "SELECT value FROM _meta WHERE key='schema_version'",
  );
  return rows.length ? Number(rows[0].value) : 0;
}

/** Jalankan semua migrasi yang belum diterapkan, satu transaksi per versi. */
export async function migrate(driver: SqlDriver): Promise<number> {
  let version = await currentVersion(driver);
  if (version > MIGRATIONS.length) {
    throw new Error(
      `Database (v${version}) lebih baru dari aplikasi (v${MIGRATIONS.length}). Perbarui aplikasi.`,
    );
  }
  while (version < MIGRATIONS.length) {
    await driver.batch(migrationStatements(version));
    version++;
  }
  return version;
}
