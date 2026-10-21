import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, Plus, Search, Trash2 } from "lucide-react";
import { addDays, format } from "date-fns";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import Field from "../../components/ui/Field";
import CurrencyInput from "../../components/ui/CurrencyInput";
import { Card, Chip, EmptyState, Fab, PrimaryButton, SectionTitle, Sheet } from "../../components/ui/Controls";
import { ProgressBar } from "../../components/ui/Progress";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useTransfers } from "./useTransfers";
import { ACCOUNT_TYPES, useAccounts } from "./useAccounts";
import { ACCOUNT_ICON, expenseMeta, incomeMeta } from "./categories";
import CatBadge from "./CatBadge";
import MoneyRingkasanTab from "./MoneyRingkasanTab";
import WishlistTab from "./WishlistTab";
import RecurringExpenseTab from "./RecurringExpenseTab";
import { t, tx } from "../../lib/i18n";
import { fmtDate, rupiah } from "../../utils/format";
import { toDateStr } from "../../utils/dates";

type Tab = "ringkasan" | "transaksi" | "anggaran" | "rutin" | "wishlist";
type Filter = "all" | "out" | "in" | "transfer";

const monthKey = (d: Date) => format(d, "yyyy-MM");

function AccountsSheet({ onClose }: { onClose: () => void }) {
  const { accounts, balances, addAccount, deleteAccount } = useAccounts();
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState<string>(ACCOUNT_TYPES[0]);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [error, setError] = useState("");

  const add = async () => {
    const res = await addAccount(nama, tipe, saldo ?? 0);
    if (res.error) return setError(t(res.error));
    setNama("");
    setSaldo(null);
    setError("");
  };

  return (
    <Sheet title={t("Kelola Akun")} onClose={onClose}>
      <div className="space-y-2">
        {accounts.map((a) => {
          const Icon = ACCOUNT_ICON[a.tipe] ?? ACCOUNT_ICON.Tunai;
          return (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl bg-bg border border-surface-light">
              <span className="w-9 h-9 rounded-full bg-surface-light text-primary flex items-center justify-center shrink-0"><Icon size={16} /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-50 truncate">{a.nama}</p>
                <p className="text-[11px] text-gray-400">{tx(a.tipe)} · {rupiah(balances[a.nama] ?? 0)}</p>
              </div>
              <button
                aria-label={t("Hapus")}
                className="text-gray-500 p-1"
                onClick={() => confirm(t("Hapus akun \"{0}\"? Transaksi tidak ikut terhapus.", [a.nama])) && deleteAccount(a.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="space-y-3 pt-2 border-t border-surface-light">
        <p className="text-xs text-gray-400">{t("Akun baru")}</p>
        <input className="input-field" placeholder={t("Nama akun")} value={nama} onChange={(e) => setNama(e.target.value)} />
        <div className="flex gap-2 flex-wrap">
          {ACCOUNT_TYPES.map((x) => <Chip key={x} active={tipe === x} onClick={() => setTipe(x)}>{tx(x)}</Chip>)}
        </div>
        <Field label={t("Saldo awal")}>
          <CurrencyInput value={saldo} onChange={setSaldo} placeholder="0" className="input-field" />
        </Field>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <PrimaryButton onClick={add} disabled={!nama.trim()}>{t("Tambah Akun")}</PrimaryButton>
      </div>
    </Sheet>
  );
}

function Overview() {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { accounts, balances, total } = useAccounts();
  const [manage, setManage] = useState(false);
  const now = new Date();

  const income = incomes.filter((i) => i.tanggal.startsWith(monthKey(now))).reduce((s, i) => s + i.nominal, 0);
  const expense = expenses.filter((e) => e.tanggal.startsWith(monthKey(now))).reduce((s, e) => s + e.nominal, 0);

  const trend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6));
    const vals = days.map((d) => expenses.filter((e) => e.tanggal === toDateStr(d)).reduce((s, e) => s + e.nominal, 0));
    return { days, vals, max: Math.max(...vals, 1) };
  }, [expenses]);

  const perKategori = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of expenses) if (e.tanggal.startsWith(monthKey(now))) m[e.kategori] = (m[e.kategori] ?? 0) + e.nominal;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);
  const totalKat = perKategori.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs text-gray-400">{t("Total Saldo")}</p>
        <p className="text-3xl font-bold text-primary mt-1 break-words">{rupiah(total)}</p>
        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <div className="min-w-0"><p className="text-gray-400">{t("Pemasukan")}</p><p className="text-sm font-semibold text-gray-100 truncate">{rupiah(income)}</p></div>
          <div className="min-w-0"><p className="text-gray-400">{t("Pengeluaran")}</p><p className="text-sm font-semibold text-gray-100 truncate">{rupiah(expense)}</p></div>
        </div>
      </Card>

      <div className="space-y-2">
        <SectionTitle action={<button onClick={() => setManage(true)} className="text-xs text-primary">{t("Kelola")}</button>}>{t("Akun")}</SectionTitle>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          {accounts.map((a) => {
            const Icon = ACCOUNT_ICON[a.tipe] ?? ACCOUNT_ICON.Tunai;
            return (
              <div key={a.id} className="card shrink-0 w-36 p-3 space-y-1">
                <Icon size={16} className="text-primary" />
                <p className="text-xs text-gray-400 truncate">{a.nama}</p>
                <p className="text-sm font-semibold text-gray-50 truncate">{rupiah(balances[a.nama] ?? 0)}</p>
              </div>
            );
          })}
          <button onClick={() => setManage(true)} aria-label={t("Tambah Akun")} className="card shrink-0 w-12 flex items-center justify-center text-primary"><Plus size={18} /></button>
        </div>
      </div>

      <Card>
        <SectionTitle>{t("Tren 7 Hari Terakhir")}</SectionTitle>
        <div className="flex items-end gap-2 h-28 mt-4">
          {trend.vals.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0">
              <div className="w-full rounded-t bg-primary/80 min-h-[3px]" style={{ height: `${(v / trend.max) * 100}%` }} title={rupiah(v)} />
              <span className="text-[9px] text-gray-500">{format(trend.days[i], "d/M")}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        <SectionTitle>{t("Kategori Pengeluaran")}</SectionTitle>
        {perKategori.length === 0 ? (
          <EmptyState title={t("Belum ada pengeluaran bulan ini")} />
        ) : (
          perKategori.map(([kat, v]) => {
            const meta = expenseMeta(kat);
            return (
              <Card key={kat} className="!py-3 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <CatBadge meta={meta} size={32} />
                  <span className="flex-1 min-w-0 truncate text-gray-100">{t(meta.label)}</span>
                  <span className="text-gray-400 text-xs shrink-0">{Math.round((v / totalKat) * 100)}%</span>
                  <span className="text-gray-200 text-xs shrink-0">{rupiah(v)}</span>
                </div>
                <ProgressBar value={v} max={totalKat} />
              </Card>
            );
          })
        )}
      </div>
      {manage && <AccountsSheet onClose={() => setManage(false)} />}
    </div>
  );
}

function Transactions() {
  const navigate = useNavigate();
  const { expenses, deleteExpense } = useExpenses();
  const { incomes, deleteIncome } = useIncomes();
  const { transfers, deleteTransfer } = useTransfers();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const all = [
      ...expenses.map((e) => ({ id: e.id, kind: "out" as const, title: e.catatan || t(expenseMeta(e.kategori).label), sub: `${t(expenseMeta(e.kategori).label)}${e.metode_pembayaran ? " · " + e.metode_pembayaran : ""}`, meta: expenseMeta(e.kategori), nominal: e.nominal, tanggal: e.tanggal })),
      ...incomes.map((i) => ({ id: i.id, kind: "in" as const, title: i.catatan || t(incomeMeta(i.kategori ?? i.sumber).label), sub: `${t(incomeMeta(i.kategori ?? i.sumber).label)}${i.akun ? " · " + i.akun : ""}`, meta: incomeMeta(i.kategori ?? i.sumber), nominal: i.nominal, tanggal: i.tanggal })),
      ...transfers.map((x) => ({ id: x.id, kind: "transfer" as const, title: x.catatan || t("Transfer"), sub: `${x.dari_akun} → ${x.ke_akun}`, meta: { icon: ArrowRightLeft, color: "#6aa8e8" }, nominal: x.nominal, tanggal: x.tanggal })),
    ];
    const s = q.trim().toLowerCase();
    return all
      .filter((r) => (filter === "all" || r.kind === filter) && (!s || r.title.toLowerCase().includes(s) || r.sub.toLowerCase().includes(s)))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [expenses, incomes, transfers, filter, q]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof rows>();
    for (const r of rows.slice(0, 150)) m.set(r.tanggal, [...(m.get(r.tanggal) ?? []), r]);
    return [...m.entries()];
  }, [rows]);

  const remove = (r: (typeof rows)[number]) => {
    if (!confirm(t("Hapus transaksi ini?"))) return;
    if (r.kind === "in") deleteIncome(r.id);
    else if (r.kind === "out") deleteExpense(r.id);
    else deleteTransfer(r.id);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("Semua") }, { key: "out", label: t("Pengeluaran") }, { key: "in", label: t("Pemasukan") }, { key: "transfer", label: t("Transfer") },
  ];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input className="input-field !pl-10" placeholder={t("Cari transaksi...")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
        {filters.map((f) => <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</Chip>)}
      </div>
      {groups.length === 0 ? (
        <EmptyState title={t("Belum ada transaksi")} hint={t("Tekan + untuk menambah transaksi pertama.")} />
      ) : (
        groups.map(([date, list]) => (
          <div key={date} className="space-y-2">
            <p className="text-xs text-gray-400 px-1">{fmtDate(date, "EEE, d MMM yyyy")}</p>
            {list.map((r) => (
              <Card key={r.kind + r.id} className="!py-3 flex items-center gap-3">
                <CatBadge meta={r.meta} />
                <button className="flex-1 min-w-0 text-left" onClick={() => navigate(`/money/add?kind=${r.kind}&id=${r.id}`)}>
                  <p className="text-sm text-gray-100 truncate">{r.title}</p>
                  <p className="text-[11px] text-gray-400 truncate">{r.sub}</p>
                </button>
                <span className={`text-sm font-semibold shrink-0 ${r.kind === "in" ? "text-primary" : r.kind === "out" ? "text-red-400" : "text-gray-200"}`}>
                  {r.kind === "in" ? "+" : r.kind === "out" ? "-" : ""}{rupiah(r.nominal)}
                </span>
                <button aria-label={t("Hapus")} className="text-gray-600 shrink-0" onClick={() => remove(r)}><Trash2 size={15} /></button>
              </Card>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default function MoneyPage() {
  const [tab, setTab] = useState<Tab>("ringkasan");
  const navigate = useNavigate();
  const TABS: { key: Tab; label: string }[] = [
    { key: "ringkasan", label: t("Ringkasan") },
    { key: "transaksi", label: t("Transaksi") },
    { key: "anggaran", label: t("Anggaran") },
    { key: "rutin", label: t("Rutin") },
    { key: "wishlist", label: t("Wishlist") },
  ];

  return (
    <div className="pb-28">
      <PageHeader title={t("Uang")} />
      <div className="px-4 space-y-4">
        <Segmented options={TABS} value={tab} onChange={setTab} />
        {tab === "ringkasan" && <Overview />}
        {tab === "transaksi" && <Transactions />}
        {tab === "anggaran" && <MoneyRingkasanTab />}
        {tab === "rutin" && <RecurringExpenseTab />}
        {tab === "wishlist" && <WishlistTab />}
      </div>
      <Fab onClick={() => navigate("/money/add")} label={t("Tambah transaksi")} />
    </div>
  );
}
