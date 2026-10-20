// Query builder bergaya Supabase di atas SQLite.
//
// Tujuan: hook lama (`db.from("expenses").select("*").eq(...).order(...)`) tetap
// jalan tanpa ditulis ulang. Yang didukung hanya yang benar-benar dipakai aplikasi:
//   select, insert, update, delete, upsert (+ onConflict),
//   eq/neq/gt/gte/lt/lte/in, order, limit, single, maybeSingle,
//   dan .select() setelah insert/update/upsert untuk mengambil baris hasil tulis.
//
// Keamanan: nama tabel divalidasi terhadap skema, nama kolom divalidasi regex,
// dan semua nilai selalu lewat parameter (?), tidak pernah disambung ke SQL.

import {
  BACKUP_FORMAT,
  BACKUP_TABLES,
  BACKUP_VERSION,
  MIGRATIONS,
  PK,
  TABLE_META,
} from "./schema";
import type { SqlDriver, SqlStatement, SqlValue } from "./types";

// Data hasil query bertipe longgar, sama seperti perilaku Supabase client sebelumnya.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export interface DbError {
  message: string;
}
export interface DbResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  error: DbError | null;
}

type Op = "select" | "insert" | "update" | "delete" | "upsert";
type FilterOp = "=" | "!=" | ">" | ">=" | "<" | "<=" | "IN";
interface Filter {
  col: string;
  op: FilterOp;
  val: unknown;
}

const IDENT = /^[a-z_][a-z0-9_]*$/;

function ident(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Nama kolom tidak valid: ${name}`);
  return `"${name}"`;
}

function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // Cadangan untuk konteks tidak aman (mis. dev lewat http://IP-LAN): UUID v4 dari getRandomValues.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Konversi nilai JS ke nilai yang bisa disimpan SQLite (boolean -> 0/1, objek/array -> JSON). */
function toSqlValue(v: unknown): SqlValue {
  if (v === null || v === undefined) return null;
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number" || typeof v === "string") return v;
  return JSON.stringify(v);
}

export class QueryBuilder implements PromiseLike<DbResult> {
  private op: Op = "select";
  private cols = "*";
  private returning = false; // .select() dipanggil setelah mutasi
  private rows: Row[] = [];
  private patch: Row = {};
  private conflict: string[] | null = null;
  private filters: Filter[] = [];
  private orders: { col: string; asc: boolean }[] = [];
  private limitN: number | null = null;
  private mode: "many" | "single" | "maybeSingle" = "many";

  private driver: SqlDriver;
  private table: string;

  constructor(driver: SqlDriver, table: string) {
    this.driver = driver;
    this.table = table;
  }

  // ---------- operasi ----------
  select(columns = "*") {
    if (this.op === "select") this.cols = columns;
    else {
      this.returning = true;
      this.cols = columns;
    }
    return this;
  }
  insert(values: Row | Row[]) {
    this.op = "insert";
    this.rows = Array.isArray(values) ? values : [values];
    return this;
  }
  upsert(values: Row | Row[], opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.rows = Array.isArray(values) ? values : [values];
    this.conflict = opts?.onConflict
      ? opts.onConflict.split(",").map((s) => s.trim())
      : null;
    return this;
  }
  update(values: Row) {
    this.op = "update";
    this.patch = values;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }

  // ---------- filter, urutan ----------
  eq(col: string, val: unknown) {
    return this.addFilter(col, "=", val);
  }
  neq(col: string, val: unknown) {
    return this.addFilter(col, "!=", val);
  }
  gt(col: string, val: unknown) {
    return this.addFilter(col, ">", val);
  }
  gte(col: string, val: unknown) {
    return this.addFilter(col, ">=", val);
  }
  lt(col: string, val: unknown) {
    return this.addFilter(col, "<", val);
  }
  lte(col: string, val: unknown) {
    return this.addFilter(col, "<=", val);
  }
  in(col: string, vals: unknown[]) {
    return this.addFilter(col, "IN", vals);
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending ?? true });
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.mode = "single";
    return this;
  }
  maybeSingle() {
    this.mode = "maybeSingle";
    return this;
  }

  private addFilter(col: string, op: FilterOp, val: unknown) {
    this.filters.push({ col, op, val });
    return this;
  }

  // ---------- eksekusi ----------
  then<R1 = DbResult, R2 = never>(
    onfulfilled?: ((value: DbResult) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): PromiseLike<R1 | R2> {
    return this.run().then(onfulfilled, onrejected);
  }

  private async run(): Promise<DbResult> {
    try {
      if (!TABLE_META[this.table]) {
        throw new Error(`Tabel tidak dikenal: ${this.table}`);
      }
      const data = await this.execute();
      return { data: this.shape(data), error: null };
    } catch (e) {
      return {
        data: null,
        error: { message: e instanceof Error ? e.message : String(e) },
      };
    }
  }

  private shape(rows: Row[] | null): unknown {
    const wantsRows = this.op === "select" || this.returning;
    if (!wantsRows || rows === null) return null;

    if (this.mode === "many") return rows;
    if (this.mode === "single") {
      if (rows.length !== 1)
        throw new Error("Diharapkan tepat 1 baris, ditemukan " + rows.length);
      return rows[0];
    }
    if (rows.length > 1)
      throw new Error("Diharapkan maksimal 1 baris, ditemukan " + rows.length);
    return rows[0] ?? null;
  }

  private async execute(): Promise<Row[] | null> {
    switch (this.op) {
      case "select":
        return this.runSelect();
      case "insert":
        return this.runInsert();
      case "upsert":
        return this.runUpsert();
      case "update":
        return this.runUpdate();
      case "delete":
        return this.runDelete();
    }
  }

  // ---------- SELECT ----------
  private columnList(): string {
    if (this.cols.trim() === "*") return "*";
    return this.cols
      .split(",")
      .map((c) => ident(c.trim()))
      .join(", ");
  }

  private whereClause(): { sql: string; params: SqlValue[] } {
    if (this.filters.length === 0) return { sql: "", params: [] };
    const params: SqlValue[] = [];
    const parts = this.filters.map((f) => {
      if (f.op === "IN") {
        const vals = (f.val as unknown[]).map((v) => toSqlValue(v));
        if (vals.length === 0) return "0"; // IN () kosong => tidak ada hasil
        params.push(...vals);
        return `${ident(f.col)} IN (${vals.map(() => "?").join(",")})`;
      }
      if (f.val === null && (f.op === "=" || f.op === "!=")) {
        return `${ident(f.col)} IS ${f.op === "=" ? "" : "NOT "}NULL`;
      }
      params.push(toSqlValue(f.val));
      return `${ident(f.col)} ${f.op} ?`;
    });
    return { sql: " WHERE " + parts.join(" AND "), params };
  }

  private orderClause(): string {
    if (this.orders.length === 0) return "";
    // Samakan dengan Postgres: ASC => NULL di akhir, DESC => NULL di awal.
    const parts = this.orders.map(
      (o) =>
        `${ident(o.col)} ${o.asc ? "ASC NULLS LAST" : "DESC NULLS FIRST"}`,
    );
    return " ORDER BY " + parts.join(", ");
  }

  private async runSelect(): Promise<Row[]> {
    const { sql: where, params } = this.whereClause();
    let sql = `SELECT ${this.columnList()} FROM ${ident(this.table)}${where}${this.orderClause()}`;
    if (this.limitN !== null) sql += ` LIMIT ${Math.max(0, Math.floor(this.limitN))}`;
    const rows = await this.driver.all(sql, params);
    return rows.map((r) => this.fromSql(r));
  }

  // ---------- INSERT ----------
  private pk(): string {
    return PK[this.table] ?? "id";
  }

  private prepareRow(row: Row, autoId: boolean): Row {
    const out: Row = {};
    for (const [k, v] of Object.entries(row)) {
      if (v !== undefined) out[k] = v;
    }
    if (autoId && this.pk() === "id" && out.id == null) out.id = newId();
    return out;
  }

  private async runInsert(): Promise<Row[] | null> {
    const prepared = this.rows.map((r) => this.prepareRow(r, true));
    const statements: SqlStatement[] = prepared.map((row) => {
      const keys = Object.keys(row);
      return {
        sql: `INSERT INTO ${ident(this.table)} (${keys.map(ident).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
        params: keys.map((k) => toSqlValue(row[k])),
      };
    });
    if (statements.length > 0) await this.driver.batch(statements);
    if (!this.returning) return null;
    return this.fetchBack(prepared, [this.pk()]);
  }

  private async runUpsert(): Promise<Row[] | null> {
    const target = this.conflict ?? [this.pk()];
    const prepared = this.rows.map((r) =>
      this.prepareRow(r, !this.conflict || !target.includes(this.pk())),
    );
    const statements: SqlStatement[] = prepared.map((row) => {
      const keys = Object.keys(row);
      const updatable = keys.filter(
        (k) => !target.includes(k) && k !== this.pk(),
      );
      const onConflict =
        updatable.length > 0
          ? `DO UPDATE SET ${updatable.map((k) => `${ident(k)} = excluded.${ident(k)}`).join(", ")}`
          : "DO NOTHING";
      return {
        sql: `INSERT INTO ${ident(this.table)} (${keys.map(ident).join(", ")}) VALUES (${keys.map(() => "?").join(", ")}) ON CONFLICT (${target.map(ident).join(", ")}) ${onConflict}`,
        params: keys.map((k) => toSqlValue(row[k])),
      };
    });
    if (statements.length > 0) await this.driver.batch(statements);
    if (!this.returning) return null;
    return this.fetchBack(prepared, target);
  }

  /** Ambil kembali baris yang baru ditulis, dicari lewat kolom kunci. */
  private async fetchBack(written: Row[], keyCols: string[]): Promise<Row[]> {
    const out: Row[] = [];
    for (const row of written) {
      const params = keyCols.map((k) => toSqlValue(row[k]));
      const where = keyCols.map((k) => `${ident(k)} = ?`).join(" AND ");
      const found = await this.driver.all(
        `SELECT ${this.columnList()} FROM ${ident(this.table)} WHERE ${where}`,
        params,
      );
      out.push(...found.map((r) => this.fromSql(r)));
    }
    return out;
  }

  // ---------- UPDATE / DELETE ----------
  private requireFilter() {
    // Pengaman: cegah UPDATE/DELETE tanpa syarat yang bisa menghapus seluruh tabel.
    if (this.filters.length === 0) {
      throw new Error(
        `${this.op.toUpperCase()} pada "${this.table}" harus punya filter (mis. .eq)`,
      );
    }
  }

  private async matchingKeys(): Promise<SqlValue[]> {
    const { sql: where, params } = this.whereClause();
    const rows = await this.driver.all(
      `SELECT ${ident(this.pk())} AS k FROM ${ident(this.table)}${where}`,
      params,
    );
    return rows.map((r) => r.k as SqlValue);
  }

  private async runUpdate(): Promise<Row[] | null> {
    this.requireFilter();
    const entries = Object.entries(this.patch).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return this.returning ? [] : null;

    // Simpan kunci baris yang cocok SEBELUM update, karena nilai filter bisa ikut berubah.
    const keys = this.returning ? await this.matchingKeys() : [];
    const { sql: where, params: whereParams } = this.whereClause();
    await this.driver.batch([
      {
        sql: `UPDATE ${ident(this.table)} SET ${entries.map(([k]) => `${ident(k)} = ?`).join(", ")}${where}`,
        params: [
          ...entries.map(([, v]) => toSqlValue(v)),
          ...whereParams,
        ],
      },
    ]);
    if (!this.returning || keys.length === 0) return this.returning ? [] : null;
    const rows = await this.driver.all(
      `SELECT ${this.columnList()} FROM ${ident(this.table)} WHERE ${ident(this.pk())} IN (${keys.map(() => "?").join(",")})`,
      keys,
    );
    return rows.map((r) => this.fromSql(r));
  }

  private async runDelete(): Promise<Row[] | null> {
    this.requireFilter();
    const { sql: where, params } = this.whereClause();
    await this.driver.batch([
      { sql: `DELETE FROM ${ident(this.table)}${where}`, params },
    ]);
    return null;
  }

  // ---------- konversi nilai JS <-> SQLite ----------
  private fromSql(row: Row): Row {
    const meta = TABLE_META[this.table];
    const out: Row = { ...row };
    for (const c of meta.bool) {
      if (c in out && out[c] !== null) out[c] = out[c] === 1 || out[c] === true;
    }
    for (const c of meta.json) {
      if (c in out && typeof out[c] === "string") {
        try {
          out[c] = JSON.parse(out[c]);
        } catch {
          /* biarkan apa adanya kalau bukan JSON valid */
        }
      }
    }
    return out;
  }
}

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  schema_version: number;
  exported_at: string;
  tables: Record<string, Row[]>;
}

export class Database {
  private driver: SqlDriver;

  constructor(driver: SqlDriver) {
    this.driver = driver;
  }

  from(table: string) {
    return new QueryBuilder(this.driver, table);
  }

  /** Ambil seluruh data pengguna sebagai objek backup berversi. */
  async snapshot(): Promise<BackupFile> {
    const tables: Record<string, Row[]> = {};
    for (const t of BACKUP_TABLES) {
      const { data, error } = await this.from(t).select("*");
      if (error) throw new Error(`Gagal membaca tabel ${t}: ${error.message}`);
      tables[t] = data as Row[];
    }
    return {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      schema_version: MIGRATIONS.length,
      exported_at: new Date().toISOString(),
      tables,
    };
  }

  /** Periksa isi file backup SEBELUM menyentuh database. Melempar Error berpesan jelas. */
  static validateBackup(raw: unknown): BackupFile {
    const b = raw as Partial<BackupFile> | null;
    if (!b || typeof b !== "object" || b.format !== BACKUP_FORMAT) {
      throw new Error("Bukan file backup Life OS.");
    }
    if (typeof b.version !== "number" || b.version > BACKUP_VERSION) {
      throw new Error("Backup dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi dulu.");
    }
    if (typeof b.schema_version === "number" && b.schema_version > MIGRATIONS.length) {
      throw new Error("Backup berasal dari skema database yang lebih baru. Perbarui aplikasi dulu.");
    }
    if (!b.tables || typeof b.tables !== "object") {
      throw new Error("File backup rusak: tidak ada data tabel.");
    }
    const allowed = new Set<string>(BACKUP_TABLES);
    for (const [name, rows] of Object.entries(b.tables)) {
      if (!allowed.has(name)) throw new Error(`Tabel tidak dikenal di backup: ${name}`);
      if (!Array.isArray(rows)) throw new Error(`Data tabel ${name} rusak.`);
      for (const r of rows) {
        if (!r || typeof r !== "object" || Array.isArray(r)) {
          throw new Error(`Baris pada tabel ${name} rusak.`);
        }
        for (const k of Object.keys(r)) {
          if (!IDENT.test(k)) throw new Error(`Nama kolom tidak valid di ${name}: ${k}`);
        }
      }
    }
    return b as BackupFile;
  }

  /**
   * Ganti SELURUH data pengguna dengan isi backup, dalam SATU transaksi.
   * Jika ada satu baris saja yang gagal (mis. relasi rusak), semuanya dibatalkan
   * dan data yang ada tetap utuh.
   */
  async restore(raw: unknown): Promise<Record<string, number>> {
    const backup = Database.validateBackup(raw);
    const statements: SqlStatement[] = [];
    // Hapus anak dulu, lalu induk.
    for (const t of [...BACKUP_TABLES].reverse()) {
      statements.push({ sql: `DELETE FROM ${ident(t)}` });
    }
    const counts: Record<string, number> = {};
    for (const t of BACKUP_TABLES) {
      const rows = backup.tables[t] ?? [];
      counts[t] = rows.length;
      for (const row of rows) {
        const keys = Object.keys(row).filter((k) => row[k] !== undefined);
        statements.push({
          sql: `INSERT INTO ${ident(t)} (${keys.map(ident).join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
          params: keys.map((k) => toSqlValue(row[k])),
        });
      }
    }
    await this.driver.batch(statements);
    return counts;
  }
}
