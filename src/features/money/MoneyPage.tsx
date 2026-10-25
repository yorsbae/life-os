import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeft, Search } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { Card, Chip, EmptyState, Fab } from "../../components/ui/Controls";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useTransfers } from "./useTransfers";
import { usePocketData } from "./usePocketData";
import { expenseMeta, incomeMeta } from "./categories";
import CatBadge from "./CatBadge";
import MoneyHome from "./MoneyHome";
import MoneyRingkasanTab from "./MoneyRingkasanTab";
import WishlistTab from "./WishlistTab";
import RecurringExpenseTab from "./RecurringExpenseTab";
import { t, tx } from "../../lib/i18n";
import { fmtDate, rupiah } from "../../utils/format";
import { DeleteButton } from "../../components/ui/DeleteButton";

type Tab = "ringkasan" | "transaksi" | "anggaran" | "rutin" | "wishlist";
type Filter = "all" | "out" | "in" | "transfer";

function Transactions() {
  const navigate = useNavigate();
  const { expenses, deleteExpense } = useExpenses();
  const { incomes, deleteIncome } = useIncomes();
  const { transfers, deleteTransfer } = useTransfers();
  const { pockets } = usePocketData();
  const pocketName = useMemo(() => new Map(pockets.map((p) => [p.id, p.nama])), [pockets]);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const all = [
      ...expenses.map((e) => ({ id: e.id, kind: "out" as const, title: e.catatan || t(expenseMeta(e.kategori).label), sub: `${t(expenseMeta(e.kategori).label)}${e.metode_pembayaran ? " · " + e.metode_pembayaran : ""}${e.pocket_id ? " · " + (pocketName.get(e.pocket_id) ?? t("Kantong")) : ""}`, meta: expenseMeta(e.kategori), nominal: e.nominal, tanggal: e.tanggal })),
      ...incomes.map((i) => ({ id: i.id, kind: "in" as const, title: i.catatan || t(incomeMeta(i.kategori ?? i.sumber).label), sub: `${t(incomeMeta(i.kategori ?? i.sumber).label)}${i.akun ? " · " + i.akun : ""}`, meta: incomeMeta(i.kategori ?? i.sumber), nominal: i.nominal, tanggal: i.tanggal })),
      ...transfers.map((x) => ({ id: x.id, kind: "transfer" as const, title: x.catatan || t("Transfer"), sub: `${x.dari_akun} → ${x.ke_akun}`, meta: { icon: ArrowRightLeft, color: "#6aa8e8" }, nominal: x.nominal, tanggal: x.tanggal })),
    ];
    const s = q.trim().toLowerCase();
    return all
      .filter((r) => (filter === "all" || r.kind === filter) && (!s || r.title.toLowerCase().includes(s) || r.sub.toLowerCase().includes(s)))
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [expenses, incomes, transfers, pocketName, filter, q]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof rows>();
    for (const r of rows.slice(0, 150)) m.set(r.tanggal, [...(m.get(r.tanggal) ?? []), r]);
    return [...m.entries()];
  }, [rows]);

  const remove = (r: (typeof rows)[number]) => {
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
        {filters.map((f) => <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>{tx(f.label)}</Chip>)}
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
                  <p className="text-sm text-gray-100 truncate">{tx(r.title)}</p>
                  <p className="text-[11px] text-gray-400 truncate">{tx(r.sub)}</p>
                </button>
                <span className={`text-sm font-semibold shrink-0 ${r.kind === "in" ? "text-primary" : r.kind === "out" ? "text-red-400" : "text-gray-200"}`}>
                  {r.kind === "in" ? "+" : r.kind === "out" ? "-" : ""}{rupiah(r.nominal)}
                </span>
                <DeleteButton size={15} confirmMessage={t("Hapus transaksi ini?")} onConfirm={() => remove(r)} />
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
    { key: "ringkasan", label: t("Beranda") },
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
        {tab === "ringkasan" && <MoneyHome />}
        {tab === "transaksi" && <Transactions />}
        {tab === "anggaran" && <MoneyRingkasanTab />}
        {tab === "rutin" && <RecurringExpenseTab />}
        {tab === "wishlist" && <WishlistTab />}
      </div>
      <Fab onClick={() => navigate("/money/add")} label={t("Tambah transaksi")} />
    </div>
  );
}
