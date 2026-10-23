import { describe, it, expect } from "vitest";
import { computeScorecard } from "./scorecard";

const base = { tasksTotal: 0, tasksDone: 0, habitCount: 0, habitPoints: 0, focusMinutes: 0, reflectionDays: 0 };

describe("computeScorecard", () => {
  it("area tanpa data bernilai null dan tidak ikut rata-rata", () => {
    const s = computeScorecard({ ...base, focusMinutes: 75, reflectionDays: 4 });
    expect(s.items.find((x) => x.key === "tasks")?.score).toBeNull();
    expect(s.items.find((x) => x.key === "habits")?.score).toBeNull();
    expect(s.overall).toBe(75); // (50 + 100) / 2
  });
  it("menghitung persentase dan membatasi di 100", () => {
    const s = computeScorecard({ tasksTotal: 4, tasksDone: 3, habitCount: 2, habitPoints: 7, focusMinutes: 999, reflectionDays: 1 });
    const get = (k: string) => s.items.find((x) => x.key === k)?.score;
    expect(get("tasks")).toBe(75);
    expect(get("habits")).toBe(50);
    expect(get("focus")).toBe(100);
    expect(get("reflection")).toBe(25);
    expect(s.overall).toBe(63);
  });
  it("pekan kosong tetap menghasilkan angka (fokus & refleksi 0)", () => {
    expect(computeScorecard(base).overall).toBe(0);
  });
});
