// Driver SQLite berbasis @capacitor-community/sqlite.
//  - Android: SQLite native, file DB ada di penyimpanan privat aplikasi.
//  - Web (npm run dev): jeep-sqlite (sql.js) yang disimpan ke IndexedDB, hanya untuk development.

import { Capacitor } from "@capacitor/core";
import {
  CapacitorSQLite,
  SQLiteConnection,
  type SQLiteDBConnection,
} from "@capacitor-community/sqlite";
import type { SqlDriver, SqlStatement, SqlValue } from "./types";

const DB_NAME = "lifeos";

async function prepareWebStore(sqlite: SQLiteConnection) {
  const { defineCustomElements } = await import("jeep-sqlite/loader");
  defineCustomElements(window);
  if (!document.querySelector("jeep-sqlite")) {
    const el = document.createElement("jeep-sqlite");
    el.setAttribute("wasmpath", "/assets");
    document.body.appendChild(el);
  }
  await customElements.whenDefined("jeep-sqlite");
  await sqlite.initWebStore();
}

export async function createCapacitorDriver(): Promise<SqlDriver> {
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const isWeb = Capacitor.getPlatform() === "web";
  if (isWeb) await prepareWebStore(sqlite);

  const consistent = (await sqlite.checkConnectionsConsistency()).result;
  const exists = (await sqlite.isConnection(DB_NAME, false)).result;
  let conn: SQLiteDBConnection;
  if (consistent && exists) {
    conn = await sqlite.retrieveConnection(DB_NAME, false);
  } else {
    conn = await sqlite.createConnection(
      DB_NAME,
      false,
      "no-encryption",
      1,
      false,
    );
  }
  await conn.open();

  // Plugin TIDAK mengaktifkan foreign key sendiri. Tanpa ini ON DELETE CASCADE mati
  // diam-diam dan data anak yatim menumpuk, jadi diverifikasi & gagal dengan jelas.
  await conn.execute("PRAGMA foreign_keys = ON;", false);
  const fk = await conn.query("PRAGMA foreign_keys;");
  const fkOn = Number(Object.values(fk.values?.[0] ?? {})[0]) === 1;
  if (!fkOn) {
    throw new Error(
      "Foreign key SQLite tidak aktif; database tidak aman dipakai (relasi tidak terjaga).",
    );
  }

  const persistWeb = async () => {
    if (isWeb) await sqlite.saveToStore(DB_NAME);
  };

  return {
    async all(sql: string, params: SqlValue[] = []) {
      const res = await conn.query(sql, params);
      return (res.values ?? []) as Record<string, unknown>[];
    },
    async batch(statements: SqlStatement[]) {
      await conn.executeSet(
        statements.map((s) => ({ statement: s.sql, values: s.params ?? [] })),
        true,
      );
      await persistWeb();
    },
  };
}
