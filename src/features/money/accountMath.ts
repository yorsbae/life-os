// Perhitungan saldo sumber dana (akun). Murni (tanpa React/DB) agar mudah diuji.
//
// saldo akun = saldo awal + pemasukan(akun) − pengeluaran(metode_pembayaran) ± transfer
// Transaksi yang namanya tidak cocok dengan akun mana pun (data lama / akun terhapus)
// tetap masuk ke total lewat `unassigned`, supaya Total Saldo tidak "hilang" diam-diam.

export const ACCOUNT_TYPES = ["Tunai", "Bank", "E-Wallet", "Investasi"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface AccountLike {
  nama: string;
  tipe: string;
  saldo_awal: number;
}
export interface FlowLike {
  nominal: number;
}
export interface ExpenseFlow extends FlowLike {
  metode_pembayaran: string | null;
}
export interface IncomeFlow extends FlowLike {
  akun?: string | null;
}
export interface TransferFlow extends FlowLike {
  dari_akun: string;
  ke_akun: string;
}

export interface Balances {
  balances: Record<string, number>;
  /** Total semua sumber dana + transaksi tanpa akun yang dikenal. */
  total: number;
  /** Selisih transaksi yang tidak punya akun yang dikenal. */
  unassigned: number;
}

export function computeBalances(
  accounts: AccountLike[],
  incomes: IncomeFlow[],
  expenses: ExpenseFlow[],
  transfers: TransferFlow[],
): Balances {
  const bal: Record<string, number> = {};
  for (const a of accounts) bal[a.nama] = a.saldo_awal ?? 0;
  let untracked = 0;
  const add = (name: string | null | undefined, v: number) => {
    if (name && name in bal) bal[name] += v;
    else untracked += v;
  };
  for (const i of incomes) add(i.akun, i.nominal);
  for (const e of expenses) add(e.metode_pembayaran, -e.nominal);
  for (const tr of transfers) {
    if (tr.dari_akun in bal) bal[tr.dari_akun] -= tr.nominal;
    if (tr.ke_akun in bal) bal[tr.ke_akun] += tr.nominal;
  }
  const sumAccounts = Object.values(bal).reduce((s, v) => s + v, 0);
  return { balances: bal, total: sumAccounts + untracked, unassigned: untracked };
}

export interface AccountGroup<A extends AccountLike> {
  tipe: string;
  items: A[];
  total: number;
}

/** Kelompokkan akun per jenis (urut ACCOUNT_TYPES, jenis tak dikenal di akhir), hanya yang berisi. */
export function groupAccounts<A extends AccountLike>(
  accounts: A[],
  balances: Record<string, number>,
): AccountGroup<A>[] {
  const order = [...ACCOUNT_TYPES] as string[];
  const types = [...new Set(accounts.map((a) => a.tipe))].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
  return types.map((tipe) => {
    const items = accounts.filter((a) => a.tipe === tipe);
    return { tipe, items, total: items.reduce((s, a) => s + (balances[a.nama] ?? 0), 0) };
  });
}
