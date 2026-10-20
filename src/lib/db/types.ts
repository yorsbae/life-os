// Kontrak minimal antara query builder dan mesin SQLite.
// Implementasi: capacitorDriver.ts (Android & web dev) dan, di test, node:sqlite.

export type SqlValue = string | number | null;

export interface SqlStatement {
  sql: string;
  params?: SqlValue[];
}

export interface SqlDriver {
  /** Jalankan SELECT dan kembalikan baris. */
  all(sql: string, params?: SqlValue[]): Promise<Record<string, unknown>[]>;
  /** Jalankan banyak statement dalam SATU transaksi (semua berhasil atau semua batal). */
  batch(statements: SqlStatement[]): Promise<void>;
}
