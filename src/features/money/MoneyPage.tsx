import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { addDays, format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { Card, Fab, SectionTitle, EmptyState } from "../../components/ui/Controls";
import { ProgressBar } from "../../components/ui/Progress";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { rupiah } from "../../utils/format";
import { toDateStr } from "../../utils/dates";
import MoneyRingkasanTab from "./MoneyRingkasanTab";
import WishlistTab from "./WishlistTab";
import RecurringExpenseTab from "./RecurringExpenseTab";

type Tab = "ringkasan" | "transaksi" | "anggaran" | "rutin" | "wishlist";
const TABS: { key: Tab; label: string }[] = [
  { key: "ringkasan", label: "Ringkasan" },
  { key: "transaksi", label: "Transaksi" },
  { key: "anggaran", label: "Anggaran" },
  { key: "rutin", label: "Rutin" },
  { key: "wishlist", label: "Wishlist" },
];

function inMonth(tanggal: string, d: Date) {
  return tanggal.slice(0, 7) === format(d, "yyyy-MM");
}

function Overview() {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const now = new Date();

  const income = incomes.filter((i) => inMonth(i.tanggal, now)).reduce((s, i) => s + i.nominal, 0);
  const expense = expenses.filter((e) => inMonth(e.tanggal, now)).reduce((s, e) => s + e.nominal, 0);
  const saldo = incomes.reduce((s, i) => s + i.nominal, 0) - expenses.reduce((s, e) => s + e.nominal, 0);

  // Tren 7 hari terakhir
  const trend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6));
    const vals = days.map((d) => {
      const key = toDateStr(d);
      return expenses.filter((e) => e.tanggal === key).reduce((s, e) => s + e.nominal, 0);
    });
    return { days, vals, max: Math.max(...vals, 1) };
  }, [expenses]);

  const perKategori = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) if (inMonth(e.tanggal, now)) map[e.kategori] = (map[e.kategori] ?? 0) + e.nominal;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);
  const totalKat = perKategori.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs text-gray-400">Total Saldo</p>
        <p className="text-3xl font-bold text-primary mt-1">{rupiah(saldo)}</p>
        <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
          <div>
            <p className="text-gray-400">Pemasukan</p>
            <p className="text-sm font-semibold text-gray-100">{rupiah(income)}</p>
          </div>
          <div>
            <p className="text-gray-400">Pengeluaran</p>
            <p className="text-sm font-semibold text-gray-100">{rupiah(expense)}</p>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Tren 7 Hari Terakhir</SectionTitle>
        <div className="flex items-end gap-2 h-28 mt-4">
          {trend.vals.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div
                className="w-full rounded-t bg-primary/80 min-h-[3px]"
                style={{ height: `${(v / trend.max) * 100}%` }}
                title={rupiah(v)}
              />
              <span className="text-[9px] text-gray-500">{format(trend.days[i], "d/M")}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-2">
        <SectionTitle>Kategori Pengeluaran</SectionTitle>
        {perKategori.length === 0 ? (
          <EmptyState title="Belum ada pengeluaran bulan ini" />
        ) : (
          perKategori.map(([kat, v]) => (
            <Card key={kat} className="!py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-100">{kat}</span>
                <span className="text-gray-300">
                  {Math.round((v / totalKat) * 100)}% · {rupiah(v)}
                </span>
              </div>
              <ProgressBar value={v} max={totalKat} className="mt-2" />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function Transactions() {
  const { expenses, deleteExpense } = useExpenses();
  const { incomes, deleteIncome } = useIncomes();

  const rows = useMemo(
    () =>
      [
        ...expenses.map((e) => ({ id: e.id, kind: "out" as const, title: e.catatan || e.kategori, sub: e.kategori, nominal: e.nominal, tanggal: e.tanggal })),
        ...incomes.map((i) => ({ id: i.id, kind: "in" as const, title: i.catatan || i.sumber, sub: i.sumber, nominal: i.nominal, tanggal: i.tanggal })),
      ].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
    [expenses, incomes],
  );

  if (rows.length === 0)
    return <EmptyState title="Belum ada transaksi" hint="Tekan + untuk menambah transaksi pertama." />;

  return (
    <div className="space-y-2">
      {rows.slice(0, 100).map((r) => (
        <Card key={r.kind + r.id} className="!py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-100 truncate">{r.title}</p>
            <p className="text-[11px] text-gray-400">
              {r.sub} · {format(new Date(r.tanggal), "d MMM yyyy", { locale: idLocale })}
            </p>
          </div>
          <span className={`text-sm font-semibold ${r.kind === "in" ? "text-primary" : "text-red-400"}`}>
            {r.kind === "in" ? "+" : "-"}
            {rupiah(r.nominal)}
          </span>
          <button
            aria-label="Hapus"
            className="text-gray-500"
            onClick={() => {
              if (!confirm("Hapus transaksi ini?")) return;
              if (r.kind === "in") deleteIncome(r.id);
              else deleteExpense(r.id);
            }}
          >
            <Trash2 size={16} />
          </button>
        </Card>
      ))}
    </div>
  );
}

export default function MoneyPage() {
  const [tab, setTab] = useState<Tab>("ringkasan");
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Money" />
      <div className="px-4 space-y-4">
        <Segmented options={TABS} value={tab} onChange={setTab} />
        {tab === "ringkasan" && <Overview />}
        {tab === "transaksi" && <Transactions />}
        {tab === "anggaran" && <MoneyRingkasanTab />}
        {tab === "rutin" && <RecurringExpenseTab />}
        {tab === "wishlist" && <WishlistTab />}
      </div>
      <Fab onClick={() => navigate("/money/add")} label="Tambah transaksi" />
    </div>
  );
}
