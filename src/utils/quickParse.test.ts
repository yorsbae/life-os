import { describe, it, expect } from "vitest";
import { parseAmount, parseQuickExpense, parseWeight, guessCategory } from "./quickParse";

describe("parseAmount", () => {
  it("memahami satuan Indonesia", () => {
    expect(parseAmount("25rb")).toBe(25000);
    expect(parseAmount("25k")).toBe(25000);
    expect(parseAmount("1,5jt")).toBe(1500000);
    expect(parseAmount("2jt")).toBe(2000000);
  });
  it("memahami pemisah ribuan tanpa satuan", () => {
    expect(parseAmount("25000")).toBe(25000);
    expect(parseAmount("1.500.000")).toBe(1500000);
    expect(parseAmount("Rp25000")).toBe(25000);
  });
  it("menolak yang bukan nominal", () => {
    expect(parseAmount("kopi")).toBeNull();
    expect(parseAmount("0")).toBeNull();
    expect(parseAmount("1.2.3jt")).toBeNull();
  });
});

describe("parseQuickExpense", () => {
  it("memisahkan catatan, nominal, dan menebak kategori", () => {
    expect(parseQuickExpense("kopi 25rb")).toEqual({ nominal: 25000, catatan: "kopi", kategori: "Makan" });
    expect(parseQuickExpense("15000 bensin motor")).toEqual({ nominal: 15000, catatan: "bensin motor", kategori: "Transport" });
  });
  it("kategori Lainnya bila tak dikenal, null bila tanpa nominal", () => {
    expect(parseQuickExpense("hadiah teman 50rb")?.kategori).toBe("Lainnya");
    expect(parseQuickExpense("kopi")).toBeNull();
    expect(guessCategory("")).toBe("Lainnya");
  });
});

describe("parseWeight", () => {
  it("menerima koma dan titik, menolak nilai tak masuk akal", () => {
    expect(parseWeight("65,5")).toBe(65.5);
    expect(parseWeight("70")).toBe(70);
    expect(parseWeight("5")).toBeNull();
    expect(parseWeight("abc")).toBeNull();
  });
});
