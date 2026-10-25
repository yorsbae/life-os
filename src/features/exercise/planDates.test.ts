import { describe, it, expect } from "vitest";
import { addDays, currentPlanWeek, dayDiff, dayToMondayOffset, startOfWeekMonday } from "./planDates";
import { remapWeekToRestDays, type SessionTemplate } from "./trainingTemplates";
import { toDateStr } from "../../utils/dates";

const at = (s: string) => new Date(s);

describe("startOfWeekMonday", () => {
  it("memakai tanggal lokal, tidak mundur sehari pada dini hari", () => {
    // Rabu 21 Okt 2026 pukul 05.00 lokal (di WIB ini masih Selasa 22.00 UTC).
    expect(toDateStr(startOfWeekMonday(at("2026-10-21T05:00:00")))).toBe("2026-10-19");
    // Senin dini hari tetap Senin itu sendiri.
    expect(toDateStr(startOfWeekMonday(at("2026-10-19T00:30:00")))).toBe("2026-10-19");
  });
  it("Minggu termasuk minggu yang berakhir hari itu", () => {
    expect(toDateStr(startOfWeekMonday(at("2026-10-25T23:00:00")))).toBe("2026-10-19");
  });
});

describe("currentPlanWeek", () => {
  it("minggu 1 pada hari-hari pertama, naik tiap 7 hari", () => {
    expect(currentPlanWeek("2026-10-19", at("2026-10-19T00:10:00"))).toBe(1);
    expect(currentPlanWeek("2026-10-19", at("2026-10-25T23:50:00"))).toBe(1);
    expect(currentPlanWeek("2026-10-19", at("2026-10-26T00:10:00"))).toBe(2);
    expect(currentPlanWeek("2026-10-19", at("2026-12-13T12:00:00"))).toBe(8);
  });
});

describe("dayDiff / addDays", () => {
  it("selisih hari kalender tidak terpengaruh jam", () => {
    expect(dayDiff(at("2026-10-25T23:59:00"), at("2026-10-24T00:01:00"))).toBe(1);
    expect(toDateStr(addDays(at("2026-10-31T10:00:00"), 1))).toBe("2026-11-01");
  });
});

describe("hari istirahat", () => {
  it("getDay() dikonversi ke offset dari Senin", () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(dayToMondayOffset)).toEqual([6, 0, 1, 2, 3, 4, 5]);
  });

  it("memilih istirahat Minggu menjatuhkan Rest pada hari Minggu, bukan Senin", () => {
    const work = (n: number): SessionTemplate => ({ hariOffset: n, tipe: "Running", sub_kategori: "Easy Run", target_durasi: 20, target_jarak: 2 });
    const week = [0, 1, 2, 3, 4, 5].map(work);
    const monday = new Date(2026, 9, 19);
    const rest = remapWeekToRestDays(week, [0].map(dayToMondayOffset)).find((s) => s.tipe === "Rest")!;
    expect(toDateStr(addDays(monday, rest.hariOffset))).toBe("2026-10-25"); // Minggu
    expect(addDays(monday, rest.hariOffset).getDay()).toBe(0);
  });
});
