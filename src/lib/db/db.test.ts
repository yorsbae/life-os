import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { Database } from "./query";
import { migrate } from "./migrate";
import { MIGRATIONS } from "./schema";
import type { SqlDriver, SqlStatement, SqlValue } from "./types";

// Driver uji: SQLite sungguhan di memori, perilakunya sama dengan driver Capacitor.
function memoryDriver(): SqlDriver {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");
  return {
    async all(sql: string, params: SqlValue[] = []) {
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
}

let driver: SqlDriver;
let db: Database;

beforeEach(async () => {
  driver = memoryDriver();
  await migrate(driver);
  db = new Database(driver);
});

describe("migrasi", () => {
  it("membuat skema dan mencatat versi, aman dijalankan ulang", async () => {
    const v = await migrate(driver);
    expect(v).toBe(MIGRATIONS.length);
    const t = await driver.all(
      "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );
    expect(Number(t[0].n)).toBe(29); // 27 tabel data + _meta + app_settings
  });

  it("menolak database yang lebih baru dari aplikasi", async () => {
    await driver.batch([{ sql: "UPDATE _meta SET value='99' WHERE key='schema_version'" }]);
    await expect(migrate(driver)).rejects.toThrow(/lebih baru/);
  });
});

describe("CRUD dasar", () => {
  it("insert membuat id + default created_at, select membaca kembali", async () => {
    const ins = await db.from("expenses").insert({
      user_id: "local", nominal: 15000, kategori: "Makan", tanggal: "2026-10-18",
    });
    expect(ins.error).toBeNull();
    const { data } = await db.from("expenses").select("*");
    expect(data).toHaveLength(1);
    expect(data[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(data[0].nominal).toBe(15000);
    expect(data[0].created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("update dan delete bekerja dengan .eq", async () => {
    await db.from("journals").insert({ user_id: "local", konten: "a", tanggal: "2026-10-18" });
    const { data } = await db.from("journals").select("*");
    const id = data[0].id;
    expect((await db.from("journals").update({ konten: "b" }).eq("id", id)).error).toBeNull();
    expect((await db.from("journals").select("*").eq("id", id).single()).data.konten).toBe("b");
    await db.from("journals").delete().eq("id", id);
    expect((await db.from("journals").select("*")).data).toHaveLength(0);
  });

  it("update/delete tanpa filter ditolak (pengaman)", async () => {
    await db.from("journals").insert({ user_id: "local", konten: "a", tanggal: "2026-10-18" });
    expect((await db.from("journals").delete()).error?.message).toMatch(/filter/);
    expect((await db.from("journals").update({ konten: "x" })).error?.message).toMatch(/filter/);
    expect((await db.from("journals").select("*")).data).toHaveLength(1);
  });

  it("insert array banyak baris sekaligus", async () => {
    const rows = [1, 2, 3].map((n) => ({
      user_id: "local", nominal: n, kategori: "Makan", tanggal: "2026-10-1" + n,
    }));
    await db.from("expenses").insert(rows);
    expect((await db.from("expenses").select("*")).data).toHaveLength(3);
  });

  it("insert gagal di tengah => seluruh batch dibatalkan (atomik)", async () => {
    const r = await db.from("expenses").insert([
      { user_id: "local", nominal: 1, kategori: "Makan", tanggal: "2026-10-18" },
      { user_id: "local", kategori: "Makan", tanggal: "2026-10-18" }, // nominal NOT NULL dilanggar
    ]);
    expect(r.error).not.toBeNull();
    expect((await db.from("expenses").select("*")).data).toHaveLength(0);
  });
});

describe("konversi tipe", () => {
  it("boolean dan array/JSON bolak-balik", async () => {
    await db.from("notes").insert({
      user_id: "local", judul: "t", kategori: "Umum", tags: ["a", "b"], is_pinned: true,
    });
    const { data } = await db.from("notes").select("*").single();
    expect(data.tags).toEqual(["a", "b"]);
    expect(data.is_pinned).toBe(true);

    await db.from("notes").update({ is_pinned: false }).eq("id", data.id);
    expect((await db.from("notes").select("is_pinned").single()).data.is_pinned).toBe(false);
  });

  it("default boolean/JSON dari skema terbaca benar", async () => {
    await db.from("recurring_expenses").insert({
      user_id: "local", nama: "Wifi", nominal: 300000, tanggal_jatuh_tempo: 5,
    });
    expect((await db.from("recurring_expenses").select("*").single()).data.aktif).toBe(true);

    await db.from("training_plans").insert({
      user_id: "local", judul: "5K", tipe: "5k", durasi_minggu: 8, tanggal_mulai: "2026-10-19",
    });
    expect((await db.from("training_plans").select("*").single()).data.hari_istirahat).toEqual([]);
  });

  it("objek jsonb (budget_kategori) bolak-balik", async () => {
    await db.from("budget_targets").insert({
      user_id: "local", bulan: "2026-10-01", target_saving: 1,
      budget_kategori: { Makan: 1500000, Transport: 500000 },
    });
    const { data } = await db.from("budget_targets").select("*").single();
    expect(data.budget_kategori).toEqual({ Makan: 1500000, Transport: 500000 });
  });
});

describe("insert().select().single() (pola useTrainingPlan)", () => {
  it("mengembalikan baris yang baru dibuat", async () => {
    const { data, error } = await db
      .from("training_plans")
      .insert({
        user_id: "local", judul: "Half", tipe: "21k", durasi_minggu: 12,
        tanggal_mulai: "2026-10-19", hari_istirahat: [0, 3], status: "Aktif",
      })
      .select()
      .single();
    expect(error).toBeNull();
    expect(data.judul).toBe("Half");
    expect(data.hari_istirahat).toEqual([0, 3]);
    expect(data.id).toBeTruthy();
  });
});

describe("upsert", () => {
  it("onConflict 'user_id,hari' memperbarui, tidak menggandakan", async () => {
    const row = { user_id: "local", hari: 1, tipe: "Running" };
    await db.from("exercise_schedules").upsert(row, { onConflict: "user_id,hari" });
    await db.from("exercise_schedules").upsert({ ...row, tipe: "Rest" }, { onConflict: "user_id,hari" });
    const { data } = await db.from("exercise_schedules").select("*");
    expect(data).toHaveLength(1);
    expect(data[0].tipe).toBe("Rest");
  });

  it("upsert profil (PK id) menggabungkan field tanpa menghapus yang lain", async () => {
    await db.from("profiles").upsert({ id: "local", nama: "Rowzak", umur: 25 });
    await db.from("profiles").upsert({ id: "local", onboarding_done: true });
    const { data } = await db.from("profiles").select("*").eq("id", "local").maybeSingle();
    expect(data.nama).toBe("Rowzak");
    expect(data.umur).toBe(25);
    expect(data.onboarding_done).toBe(true);
  });

  it("upsert weekly_reviews onConflict 'user_id,minggu_mulai'", async () => {
    const base = { user_id: "local", minggu_mulai: "2026-10-12" };
    await db.from("weekly_reviews").upsert({ ...base, apa_yang_berhasil: "x" }, { onConflict: "user_id,minggu_mulai" });
    await db.from("weekly_reviews").upsert({ ...base, apa_yang_gagal: "y" }, { onConflict: "user_id,minggu_mulai" });
    const { data } = await db.from("weekly_reviews").select("*");
    expect(data).toHaveLength(1);
    expect(data[0].apa_yang_berhasil).toBe("x");
    expect(data[0].apa_yang_gagal).toBe("y");
  });
});

describe("select: urutan, limit, single, maybeSingle", () => {
  it("order desc menaruh NULL di awal (seperti Postgres), asc di akhir", async () => {
    await db.from("exercises").insert([
      { user_id: "local", tipe: "a", sub_kategori: "x", tanggal: "2026-10-01", durasi: 10 },
      { user_id: "local", tipe: "b", sub_kategori: "x", tanggal: "2026-10-02", durasi: null },
      { user_id: "local", tipe: "c", sub_kategori: "x", tanggal: "2026-10-03", durasi: 30 },
    ]);
    const desc = (await db.from("exercises").select("*").order("durasi", { ascending: false })).data;
    expect(desc.map((r: { tipe: string }) => r.tipe)).toEqual(["b", "c", "a"]);
    const asc = (await db.from("exercises").select("*").order("durasi", { ascending: true })).data;
    expect(asc.map((r: { tipe: string }) => r.tipe)).toEqual(["a", "c", "b"]);
  });

  it("limit + maybeSingle", async () => {
    await db.from("exercises").insert([
      { user_id: "local", tipe: "a", sub_kategori: "x", tanggal: "2026-10-01" },
      { user_id: "local", tipe: "b", sub_kategori: "x", tanggal: "2026-10-02" },
    ]);
    const r = await db.from("exercises").select("*").order("tanggal", { ascending: false }).limit(1).maybeSingle();
    expect(r.data.tipe).toBe("b");
  });

  it("maybeSingle tanpa hasil => null, single tanpa hasil => error", async () => {
    expect((await db.from("goals").select("*").eq("id", "x").maybeSingle()).data).toBeNull();
    expect((await db.from("goals").select("*").eq("id", "x").single()).error).not.toBeNull();
  });

  it("pilih kolom tertentu dan filter eq null", async () => {
    await db.from("profiles").upsert({ id: "local", nama: "A" });
    const { data } = await db.from("profiles").select("id, nama").eq("umur", null);
    expect(data).toEqual([{ id: "local", nama: "A" }]);
  });
});

describe("relasi & keamanan", () => {
  it("hapus dev_project ikut menghapus todo/log/issue (ON DELETE CASCADE)", async () => {
    await db.from("dev_projects").insert({ id: "p1", user_id: "local", nama: "App" });
    await db.from("dev_project_todos").insert({ project_id: "p1", user_id: "local", judul: "t" });
    await db.from("dev_project_logs").insert({ project_id: "p1", user_id: "local", tanggal: "2026-10-18", catatan: "c" });
    await db.from("dev_projects").delete().eq("id", "p1");
    expect((await db.from("dev_project_todos").select("*")).data).toHaveLength(0);
    expect((await db.from("dev_project_logs").select("*")).data).toHaveLength(0);
  });

  it("foreign key menolak anak tanpa induk", async () => {
    const r = await db.from("dev_project_todos").insert({ project_id: "nope", user_id: "local", judul: "t" });
    expect(r.error).not.toBeNull();
  });

  it("menolak tabel/kolom tak dikenal dan upaya injeksi", async () => {
    expect((await db.from("sqlite_master").select("*")).error?.message).toMatch(/tidak dikenal/);
    expect((await db.from("expenses").select("*").eq("id; DROP TABLE expenses", 1)).error?.message).toMatch(/tidak valid/);
    expect((await db.from("expenses").select("*")).error).toBeNull(); // tabel masih ada
  });

  it("nilai berisi tanda kutip/SQL diperlakukan sebagai data biasa", async () => {
    const evil = "x'); DROP TABLE journals; --";
    await db.from("journals").insert({ user_id: "local", konten: evil, tanggal: "2026-10-18" });
    expect((await db.from("journals").select("*").single()).data.konten).toBe(evil);
  });
});

describe("backup & restore", () => {
  async function seed() {
    await db.from("profiles").upsert({ id: "local", nama: "Rowzak", umur: 25, onboarding_done: true });
    await db.from("expenses").insert({ user_id: "local", nominal: 20000, kategori: "Makan", tanggal: "2026-10-18" });
    await db.from("notes").insert({ user_id: "local", judul: "n", kategori: "Umum", tags: ["x", "y"], is_pinned: true });
    await db.from("dev_projects").insert({ id: "p1", user_id: "local", nama: "App" });
    await db.from("dev_project_todos").insert({ project_id: "p1", user_id: "local", judul: "t", is_done: true });
    await db.from("budget_targets").insert({ user_id: "local", bulan: "2026-10-01", budget_kategori: { Makan: 100 } });
  }

  it("snapshot -> restore ke database KOSONG mengembalikan data identik", async () => {
    await seed();
    const snap = await db.snapshot();
    // lewat JSON seperti file sungguhan
    const fromFile = JSON.parse(JSON.stringify(snap));

    const fresh = memoryDriver();
    await migrate(fresh);
    const db2 = new Database(fresh);
    const counts = await db2.restore(fromFile);
    expect(counts.expenses).toBe(1);
    expect(counts.dev_project_todos).toBe(1);

    const again = await db2.snapshot();
    expect(again.tables).toEqual(snap.tables);
    expect((await db2.from("notes").select("*").single()).data.tags).toEqual(["x", "y"]);
    expect((await db2.from("dev_project_todos").select("*").single()).data.is_done).toBe(true);
  });

  it("restore MENIMPA data yang ada (bukan menggabungkan)", async () => {
    await seed();
    const snap = await db.snapshot();
    await db.from("expenses").insert({ user_id: "local", nominal: 999, kategori: "Lainnya", tanggal: "2026-10-19" });
    expect((await db.from("expenses").select("*")).data).toHaveLength(2);
    await db.restore(snap);
    expect((await db.from("expenses").select("*")).data).toHaveLength(1);
  });

  it("restore yang gagal di tengah membatalkan SEMUANYA, data lama utuh", async () => {
    await seed();
    const snap = await db.snapshot();
    const broken = JSON.parse(JSON.stringify(snap));
    // anak yatim: todo menunjuk project yang tidak ada => melanggar foreign key
    broken.tables.dev_project_todos[0].project_id = "tidak-ada";
    await expect(db.restore(broken)).rejects.toThrow();
    expect((await db.from("expenses").select("*")).data).toHaveLength(1);
    expect((await db.from("dev_projects").select("*")).data).toHaveLength(1);
    expect((await db.from("profiles").select("*").single()).data.nama).toBe("Rowzak");
  });

  it("menolak file yang bukan backup / dari versi lebih baru / berisi tabel asing", async () => {
    expect(() => Database.validateBackup({ hello: 1 })).toThrow(/bukan file backup/i);
    expect(() => Database.validateBackup(null)).toThrow();
    expect(() => Database.validateBackup({ format: "lifeos-backup", version: 99, tables: {} })).toThrow(/lebih baru/);
    expect(() => Database.validateBackup({ format: "lifeos-backup", version: 1, tables: { sqlite_master: [] } })).toThrow(/tidak dikenal/);
    expect(() => Database.validateBackup({ format: "lifeos-backup", version: 1, tables: { expenses: [{ "x; DROP": 1 }] } })).toThrow(/tidak valid/);
    expect(() => Database.validateBackup({ format: "lifeos-backup", version: 1, tables: { expenses: "oops" } })).toThrow(/rusak/);
  });
});
