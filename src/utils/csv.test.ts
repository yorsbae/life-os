import { describe, it, expect } from "vitest";
import { buildTransactionsCsv, csvCell, toCsv, type TxHeaders } from "./csv";

const H: TxHeaders = {
  columns: ["Tanggal", "Jenis", "Nominal", "Kategori", "Sumber/Akun", "Catatan"],
  income: "Pemasukan",
  expense: "Pengeluaran",
  transfer: "Transfer",
};

describe("csvCell", () => {
  it("meng-quote koma, kutip, dan baris baru; kutip digandakan", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('dia bilang "hai"')).toBe('"dia bilang ""hai"""');
    expect(csvCell("baris1\nbaris2")).toBe('"baris1\nbaris2"');
    expect(csvCell("biasa")).toBe("biasa");
  });

  it("null/undefined/NaN menjadi kosong; angka apa adanya (termasuk negatif)", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(NaN)).toBe("");
    expect(csvCell(1500000)).toBe("1500000");
    expect(csvCell(-25.5)).toBe("-25.5");
  });

  it("menetralkan injeksi rumus pada teks", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+62812")).toBe("'+62812");
    expect(csvCell("-cmd")).toBe("'-cmd");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell('=HYPERLINK("http://x","klik")')).toBe(`"'=HYPERLINK(""http://x"",""klik"")"`);
    expect(csvCell("\t=x")).toBe("'\t=x");
    expect(csvCell("tidak=aman? ya")).toBe("tidak=aman? ya"); // hanya karakter pertama yang berbahaya
  });
});

describe("toCsv", () => {
  it("memakai CRLF dan BOM UTF-8", () => {
    const out = toCsv([["a", "b"], ["1", "2"]]);
    expect(out.startsWith("﻿")).toBe(true);
    expect(out).toBe("﻿a,b\r\n1,2\r\n");
  });
});

describe("buildTransactionsCsv", () => {
  const data = {
    incomes: [{ tanggal: "2026-10-01", nominal: 5000000, sumber: "Gaji", kategori: "Gaji", catatan: null }],
    expenses: [
      { tanggal: "2026-10-20", nominal: 45000, kategori: "Makan", metode_pembayaran: "QRIS", catatan: "Siang, bareng tim" },
      { tanggal: "2026-10-05", nominal: 20000, kategori: "Transport", metode_pembayaran: null, catatan: "=EVIL()" },
    ],
    transfers: [{ tanggal: "2026-10-10", nominal: 100000, dari_akun: "BCA", ke_akun: "Tunai", catatan: null }],
  };

  it("header lalu semua baris, terbaru di atas, nominal positif", () => {
    const lines = buildTransactionsCsv(data, H).replace("﻿", "").trim().split("\r\n");
    expect(lines[0]).toBe("Tanggal,Jenis,Nominal,Kategori,Sumber/Akun,Catatan");
    expect(lines.slice(1).map((l) => l.slice(0, 10))).toEqual(["2026-10-20", "2026-10-10", "2026-10-05", "2026-10-01"]);
    expect(lines[1]).toBe('2026-10-20,Pengeluaran,45000,Makan,QRIS,"Siang, bareng tim"');
    expect(lines[2]).toBe("2026-10-10,Transfer,100000,,BCA → Tunai,");
    expect(lines[4]).toBe("2026-10-01,Pemasukan,5000000,Gaji,Gaji,");
  });

  it("catatan berbahaya dinetralkan", () => {
    expect(buildTransactionsCsv(data, H)).toContain("'=EVIL()");
    expect(buildTransactionsCsv(data, H)).not.toMatch(/,=EVIL/);
  });

  it("tanpa data hanya berisi header", () => {
    const out = buildTransactionsCsv({ incomes: [], expenses: [], transfers: [] }, H);
    expect(out.replace("﻿", "").trim().split("\r\n")).toHaveLength(1);
  });
});
