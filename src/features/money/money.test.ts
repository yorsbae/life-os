import { describe, it, expect } from "vitest";
import { computeBalances, groupAccounts } from "./accountMath";
import {
  allocatedTotal,
  checkRule,
  computePockets,
  daysUntilPayday,
  planByRules,
  utamaBalance,
  type PocketLike,
} from "./pocketMath";

const pocket = (over: Partial<PocketLike> & { id: string; nama: string }): PocketLike => ({
  ikon: "wallet",
  tipe: "tabungan",
  target: 0,
  mode_alokasi: "manual",
  nilai_alokasi: 0,
  ...over,
});

describe("computeBalances", () => {
  const accounts = [
    { nama: "Cash", tipe: "Tunai", saldo_awal: 100000 },
    { nama: "BCA", tipe: "Bank", saldo_awal: 1000000 },
    { nama: "BRI", tipe: "Bank", saldo_awal: 0 },
  ];

  it("saldo = saldo awal + pemasukan − pengeluaran ± transfer", () => {
    const r = computeBalances(
      accounts,
      [{ nominal: 500000, akun: "BCA" }],
      [{ nominal: 30000, metode_pembayaran: "Cash" }],
      [{ nominal: 200000, dari_akun: "BCA", ke_akun: "BRI" }],
    );
    expect(r.balances).toEqual({ Cash: 70000, BCA: 1300000, BRI: 200000 });
    expect(r.total).toBe(1570000);
    expect(r.unassigned).toBe(0);
  });

  it("transaksi tanpa akun yang dikenal tetap masuk total, tidak hilang", () => {
    const r = computeBalances(
      accounts,
      [{ nominal: 50000, akun: null }],
      [{ nominal: 10000, metode_pembayaran: null }, { nominal: 5000, metode_pembayaran: "Akun Terhapus" }],
      [],
    );
    expect(r.unassigned).toBe(50000 - 10000 - 5000);
    expect(r.total).toBe(1100000 + 35000);
  });

  it("mengelompokkan per jenis sesuai urutan, hanya yang berisi", () => {
    const g = groupAccounts(accounts, { Cash: 1, BCA: 2, BRI: 3 });
    expect(g.map((x) => x.tipe)).toEqual(["Tunai", "Bank"]);
    expect(g[1].total).toBe(5);
    expect(g[1].items.map((a) => a.nama)).toEqual(["BCA", "BRI"]);
  });
});

describe("kantong", () => {
  // Skenario sama dengan desain: total 1.541.826, kantong terisi 1.211.000 -> Saldo Utama 330.826.
  const pockets = [
    pocket({ id: "ortu", nama: "Orang Tua", tipe: "pemberian", target: 2100000 }),
    pocket({ id: "darurat", nama: "Dana Darurat", target: 300000 }),
    pocket({ id: "transport", nama: "Transport", target: 500000 }),
    pocket({ id: "tabungan", nama: "Tabungan", target: 2000000 }),
  ];
  const entries = [
    { pocket_id: "darurat", jenis: "isi", nominal: 110000 },
    { pocket_id: "transport", jenis: "isi", nominal: 101000 },
    { pocket_id: "tabungan", jenis: "isi", nominal: 1000000 },
  ];
  const expenses = [{ pocket_id: "ortu", nominal: 2450000 }, { pocket_id: null, nominal: 99 }];

  it("menghitung saldo, persen target, dan Saldo Utama", () => {
    const stats = computePockets(pockets, entries, expenses);
    const by = Object.fromEntries(stats.map((s) => [s.pocket.id, s]));
    expect(by.darurat.saldo).toBe(110000);
    expect(by.darurat.persen).toBe(37);
    expect(by.transport.persen).toBe(20);
    expect(by.tabungan.persen).toBe(50);
    expect(by.ortu.saldo).toBe(0);
    expect(by.ortu.nilai).toBe(2450000);
    expect(by.ortu.persen).toBe(117);
    expect(allocatedTotal(stats)).toBe(1211000);
    expect(utamaBalance(1541826, stats)).toBe(330826);
  });

  it("pengeluaran dari kantong mengurangi saldo kantong; 'keluar' mengembalikan ke Saldo Utama", () => {
    const stats = computePockets(
      pockets,
      [...entries, { pocket_id: "transport", jenis: "keluar", nominal: 1000 }],
      [...expenses, { pocket_id: "transport", nominal: 21000 }],
    );
    expect(stats.find((s) => s.pocket.id === "transport")!.saldo).toBe(101000 - 1000 - 21000);
  });

  it("tanpa target -> persen 0", () => {
    const [s] = computePockets([pocket({ id: "x", nama: "X" })], [{ pocket_id: "x", jenis: "isi", nominal: 5 }], []);
    expect(s.persen).toBe(0);
  });
});

describe("pembagian otomatis (planByRules)", () => {
  const ps = [
    pocket({ id: "a", nama: "A", mode_alokasi: "persen", nilai_alokasi: 50 }),
    pocket({ id: "b", nama: "B", mode_alokasi: "nominal", nilai_alokasi: 100000 }),
    pocket({ id: "c", nama: "C", mode_alokasi: "manual" }),
    pocket({ id: "d", nama: "D", tipe: "pemberian", mode_alokasi: "persen", nilai_alokasi: 10 }),
    pocket({ id: "e", nama: "E", mode_alokasi: "persen", nilai_alokasi: 20 }),
  ];

  it("persen dari nominal yang dibagi, nominal tetap, manual & pemberian dilewati", () => {
    expect(planByRules(1000000, ps)).toEqual([
      { pocketId: "a", nominal: 500000 },
      { pocketId: "b", nominal: 100000 },
      { pocketId: "e", nominal: 200000 },
    ]);
  });

  it("tidak pernah melebihi nominal yang dibagi", () => {
    const plan = planByRules(120000, ps);
    expect(plan.reduce((s, x) => s + x.nominal, 0)).toBeLessThanOrEqual(120000);
    expect(plan).toEqual([
      { pocketId: "a", nominal: 60000 },
      { pocketId: "b", nominal: 60000 },
    ]);
  });

  it("pembulatan ke bawah dan nominal nol/negatif menghasilkan rencana kosong", () => {
    expect(planByRules(999, [pocket({ id: "a", nama: "A", mode_alokasi: "persen", nilai_alokasi: 33.3 })])).toEqual([
      { pocketId: "a", nominal: 332 },
    ]);
    expect(planByRules(0, ps)).toEqual([]);
    expect(planByRules(-5, ps)).toEqual([]);
  });
});

describe("validasi aturan", () => {
  const ps = [
    pocket({ id: "a", nama: "A", mode_alokasi: "persen", nilai_alokasi: 60 }),
    pocket({ id: "b", nama: "B", mode_alokasi: "persen", nilai_alokasi: 30 }),
  ];
  it("total persen tidak boleh melebihi 100, kecuali mengedit kantong itu sendiri", () => {
    expect(checkRule(ps, { tipe: "tabungan", mode: "persen", nilai: 20 })).toMatch(/100%/);
    expect(checkRule(ps, { tipe: "tabungan", mode: "persen", nilai: 10 })).toBeNull();
    expect(checkRule(ps, { id: "a", tipe: "tabungan", mode: "persen", nilai: 70 })).toBeNull();
    expect(checkRule(ps, { id: "a", tipe: "tabungan", mode: "persen", nilai: 71 })).toMatch(/100%/);
  });
  it("persen/nominal harus > 0; manual dan pemberian selalu valid", () => {
    expect(checkRule([], { tipe: "tabungan", mode: "nominal", nilai: 0 })).toMatch(/0/);
    expect(checkRule([], { tipe: "tabungan", mode: "persen", nilai: 101 })).toMatch(/100/);
    expect(checkRule([], { tipe: "tabungan", mode: "manual", nilai: 0 })).toBeNull();
    expect(checkRule([], { tipe: "pemberian", mode: "persen", nilai: 0 })).toBeNull();
  });
});

describe("daysUntilPayday", () => {
  const d = (s: string) => new Date(s + "T10:00:00");
  it("menghitung hari ke tanggal gajian berikutnya", () => {
    expect(daysUntilPayday(29, d("2026-10-24"))).toBe(5); // "5 hari lagi gajian"
    expect(daysUntilPayday(24, d("2026-10-24"))).toBe(0);
    expect(daysUntilPayday(10, d("2026-10-24"))).toBe(17); // 10 Nov
  });
  it("bulan pendek memakai hari terakhir bulan itu", () => {
    expect(daysUntilPayday(31, d("2026-02-10"))).toBe(18); // 28 Feb
    expect(daysUntilPayday(30, d("2026-01-31"))).toBe(28); // 28 Feb
  });
  it("tahun baru", () => {
    expect(daysUntilPayday(5, d("2026-12-30"))).toBe(6); // 5 Jan 2027
  });
});
