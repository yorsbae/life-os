import { describe, it, expect, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { addDays, startOfWeek } from "date-fns";
import { Database } from "../../lib/db/query";
import { migrate } from "../../lib/db/migrate";
import { toDateStr } from "../../utils/dates";
import type { SqlDriver, SqlStatement, SqlValue } from "../../lib/db/types";

const sqlite = new DatabaseSync(":memory:");
sqlite.exec("PRAGMA foreign_keys = ON;");
const driver: SqlDriver = {
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
const testDb = new Database(driver);
vi.mock("../../lib/db", () => ({ db: testDb, LOCAL_USER_ID: "local" }));

describe("load() Hari Ini", () => {
  it("menggabungkan data hari ini dan skor pekan dari SQLite sungguhan", async () => {
    await migrate(driver);
    const { load } = await import("./useToday");
    const now = new Date();
    const today = toDateStr(now);
    const monday = toDateStr(startOfWeek(now, { weekStartsOn: 1 }));
    const U = "local";

    await testDb.from("tasks").insert([
      { user_id: U, judul: "A", status: "Selesai", prioritas: "P1", tanggal_mulai: today },
      { user_id: U, judul: "B", status: "Todo", prioritas: "P2", tanggal_mulai: monday },
    ]);
    await testDb.from("habits").insert({ id: "h1", user_id: U, nama: "Air", target_harian: 2, satuan: "gelas", aktif: true });
    await testDb.from("habit_logs").insert({ habit_id: "h1", user_id: U, tanggal: today, nilai: 1 });
    await testDb.from("events").insert([
      { user_id: U, judul: "Rapat", tipe: "Lainnya", tanggal_mulai: today + "T09:00" },
      { user_id: U, judul: "Besok", tipe: "Lainnya", tanggal_mulai: toDateStr(addDays(now, 1)) },
    ]);
    await testDb.from("expenses").insert([
      { user_id: U, nominal: 25000, kategori: "Makan", tanggal: today },
      { user_id: U, nominal: 5000, kategori: "Lainnya", tanggal: today },
    ]);
    await testDb.from("focus_sessions").insert({ user_id: U, durasi_target: 25, durasi_aktual: 75, selesai: true, tanggal: today });
    await testDb.from("journals").insert({ user_id: U, konten: "x", tanggal: today });

    const d = await load();
    expect(d.tasks.map((x) => x.judul)).toEqual(["A"]);
    expect(d.events.map((x) => x.judul)).toEqual(["Rapat"]);
    expect(d.habits).toEqual([{ id: "h1", nama: "Air", target: 2, nilai: 1 }]);
    expect(d.spentToday).toBe(30000);
    const get = (k: string) => d.score.items.find((x) => x.key === k)?.score;
    expect(get("tasks")).toBe(50);
    expect(get("habits")).toBe(Math.round((0.5 / 7) * 100));
    expect(get("focus")).toBe(50);
    expect(get("reflection")).toBe(25);
  });
});
