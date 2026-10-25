import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { Database } from "./query";
import { migrate } from "./migrate";
import { coalesceReads } from "./coalesce";
import type { SqlDriver, SqlStatement, SqlValue } from "./types";

function memoryDriver(): SqlDriver & { reads: number } {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  const d = {
    reads: 0,
    async all(sql: string, params: SqlValue[] = []) {
      d.reads++;
      await Promise.resolve(); // beri kesempatan pemanggil lain masuk (seperti jembatan async)
      return sqlite.prepare(sql).all(...params) as Record<string, unknown>[];
    },
    async batch(statements: SqlStatement[]) {
      sqlite.exec("BEGIN");
      try {
        for (const s of statements) sqlite.prepare(s.sql).run(...(s.params ?? []));
        sqlite.exec("COMMIT");
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return d;
}

let raw: ReturnType<typeof memoryDriver>;
let db: Database;
beforeEach(async () => {
  raw = memoryDriver();
  await migrate(raw);
  db = new Database(raw);
});

const U = "local";

describe("skema kantong (v4)", () => {
  it("menyimpan kantong, riwayat isi/keluar, dan expenses.pocket_id", async () => {
    const p = await db
      .from("pockets")
      .insert({ user_id: U, nama: "Transport", ikon: "car", target: 500000, mode_alokasi: "persen", nilai_alokasi: 20 })
      .select()
      .single();
    expect(p.error).toBeNull();
    expect(p.data).toMatchObject({ tipe: "tabungan", target: 500000, mode_alokasi: "persen", nilai_alokasi: 20 });

    await db.from("pocket_entries").insert([
      { user_id: U, pocket_id: p.data.id, jenis: "isi", nominal: 100000, tanggal: "2026-10-24" },
      { user_id: U, pocket_id: p.data.id, jenis: "keluar", nominal: 1000, tanggal: "2026-10-24" },
    ]);
    await db.from("expenses").insert({
      user_id: U, nominal: 21000, kategori: "Transport", tanggal: "2026-10-24", pocket_id: p.data.id, metode_pembayaran: "Cash",
    });
    expect((await db.from("pocket_entries").select("*")).data).toHaveLength(2);
    expect((await db.from("expenses").select("*").eq("pocket_id", p.data.id)).data).toHaveLength(1);
  });

  it("menghapus kantong ikut menghapus riwayatnya (cascade); pengeluaran dilepas lewat transaction()", async () => {
    const p = (await db.from("pockets").insert({ user_id: U, nama: "X" }).select().single()).data;
    await db.from("pocket_entries").insert({ user_id: U, pocket_id: p.id, jenis: "isi", nominal: 5, tanggal: "2026-10-24" });
    await db.from("expenses").insert({ user_id: U, nominal: 3, kategori: "Makan", tanggal: "2026-10-24", pocket_id: p.id });

    const res = await db.transaction([
      { sql: "UPDATE expenses SET pocket_id = NULL WHERE pocket_id = ?", params: [p.id] },
      { sql: "DELETE FROM pockets WHERE id = ?", params: [p.id] },
    ]);
    expect(res.error).toBeNull();
    expect((await db.from("pocket_entries").select("*")).data).toHaveLength(0);
    const ex = (await db.from("expenses").select("*")).data;
    expect(ex).toHaveLength(1);
    expect(ex[0].pocket_id).toBeNull();
  });

  it("transaction() atomik: satu statement gagal membatalkan semuanya", async () => {
    await db.from("accounts").insert({ user_id: U, nama: "Cash", tipe: "Tunai", saldo_awal: 0 });
    const res = await db.transaction([
      { sql: "UPDATE accounts SET nama = ? WHERE nama = ?", params: ["Dompet", "Cash"] },
      { sql: "UPDATE tabel_tidak_ada SET x = 1" },
    ]);
    expect(res.error).not.toBeNull();
    expect((await db.from("accounts").select("nama")).data[0].nama).toBe("Cash");
  });

  it("ganti nama akun di semua transaksi dalam satu transaksi", async () => {
    await db.from("accounts").insert({ user_id: U, nama: "BCA", tipe: "Bank", saldo_awal: 0 });
    await db.from("expenses").insert({ user_id: U, nominal: 1, kategori: "Makan", tanggal: "2026-10-24", metode_pembayaran: "BCA" });
    await db.from("incomes").insert({ user_id: U, nominal: 2, sumber: "Gaji", tanggal: "2026-10-24", akun: "BCA" });
    await db.from("transfers").insert({ user_id: U, dari_akun: "BCA", ke_akun: "BCA2", nominal: 3, tanggal: "2026-10-24" });
    const res = await db.transaction([
      { sql: "UPDATE accounts SET nama = ? WHERE nama = ?", params: ["BCA Utama", "BCA"] },
      { sql: "UPDATE expenses SET metode_pembayaran = ? WHERE metode_pembayaran = ?", params: ["BCA Utama", "BCA"] },
      { sql: "UPDATE incomes SET akun = ? WHERE akun = ?", params: ["BCA Utama", "BCA"] },
      { sql: "UPDATE transfers SET dari_akun = ? WHERE dari_akun = ?", params: ["BCA Utama", "BCA"] },
      { sql: "UPDATE transfers SET ke_akun = ? WHERE ke_akun = ?", params: ["BCA Utama", "BCA"] },
    ]);
    expect(res.error).toBeNull();
    expect((await db.from("expenses").select("metode_pembayaran")).data[0].metode_pembayaran).toBe("BCA Utama");
    expect((await db.from("incomes").select("akun")).data[0].akun).toBe("BCA Utama");
    expect((await db.from("transfers").select("dari_akun")).data[0].dari_akun).toBe("BCA Utama");
  });

  it("backup & restore membawa kantong; backup lama tanpa kantong tetap bisa dipulihkan", async () => {
    const p = (await db.from("pockets").insert({ user_id: U, nama: "Tabungan", target: 10 }).select().single()).data;
    await db.from("pocket_entries").insert({ user_id: U, pocket_id: p.id, jenis: "isi", nominal: 7, tanggal: "2026-10-24" });
    await db.from("expenses").insert({ user_id: U, nominal: 1, kategori: "Makan", tanggal: "2026-10-24", pocket_id: p.id });
    const snap = await db.snapshot();
    expect(snap.tables.pockets).toHaveLength(1);

    const otherDriver = memoryDriver();
    await migrate(otherDriver);
    const other = new Database(otherDriver);
    await other.restore(snap);
    expect((await other.from("pockets").select("*")).data).toHaveLength(1);
    expect((await other.from("pocket_entries").select("*")).data).toHaveLength(1);
    expect((await other.from("expenses").select("*")).data[0].pocket_id).toBe(p.id);

    // Backup versi lama: tidak punya tabel pockets / kolom pocket_id.
    const legacy = JSON.parse(JSON.stringify(snap));
    delete legacy.tables.pockets;
    delete legacy.tables.pocket_entries;
    legacy.tables.expenses = legacy.tables.expenses.map((r: Record<string, unknown>) => {
      const { pocket_id: _drop, ...rest } = r;
      void _drop;
      return rest;
    });
    await expect(other.restore(legacy)).resolves.toBeDefined();
    expect((await other.from("pockets").select("*")).data).toHaveLength(0);
  });
});

describe("coalesceReads", () => {
  it("menggabungkan SELECT identik yang berjalan bersamaan menjadi satu eksekusi", async () => {
    const d = memoryDriver();
    await migrate(d);
    const c = coalesceReads(d);
    d.reads = 0;
    const [a, b, e] = await Promise.all([
      c.all("SELECT 1 AS x"),
      c.all("SELECT 1 AS x"),
      c.all("SELECT 2 AS x"),
    ]);
    expect(d.reads).toBe(2);
    expect(a).toEqual(b);
    expect(e).toEqual([{ x: 2 }]);
  });

  it("pembacaan setelah penulisan selalu data baru (tidak ikut query lama)", async () => {
    const d = memoryDriver();
    await migrate(d);
    const c = coalesceReads(d);
    const before = c.all("SELECT count(*) AS n FROM notes"); // mulai sebelum tulis, belum selesai
    await c.batch([
      { sql: "INSERT INTO notes (id, user_id, judul, kategori) VALUES ('1','local','a','x')" },
    ]);
    const after = await c.all("SELECT count(*) AS n FROM notes");
    expect(Number(after[0].n)).toBe(1);
    await before;
  });

  it("query yang sudah selesai tidak di-cache", async () => {
    const d = memoryDriver();
    await migrate(d);
    const c = coalesceReads(d);
    d.reads = 0;
    await c.all("SELECT 1");
    await c.all("SELECT 1");
    expect(d.reads).toBe(2);
  });

  it("galat tidak tersangkut dan percobaan berikutnya jalan lagi", async () => {
    const d = memoryDriver();
    await migrate(d);
    const c = coalesceReads(d);
    await expect(c.all("SELECT * FROM tabel_tidak_ada")).rejects.toThrow();
    await expect(c.all("SELECT * FROM tabel_tidak_ada")).rejects.toThrow();
    expect(await c.all("SELECT 7 AS x")).toEqual([{ x: 7 }]);
  });
});
