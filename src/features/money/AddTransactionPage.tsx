import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import Field from "../../components/ui/Field";
import CurrencyInput from "../../components/ui/CurrencyInput";
import { PrimaryButton, Toggle } from "../../components/ui/Controls";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useRecurringExpenses } from "./useRecurringExpenses";
import { useTransfers } from "./useTransfers";
import { useAccounts } from "./useAccounts";
import { EXPENSE_CATS, INCOME_CATS } from "./categories";
import type { Expense } from "../../types";
import { t } from "../../lib/i18n";
import { rupiah } from "../../utils/format";
import { toDateStr } from "../../utils/dates";

type Kind = "out" | "in" | "transfer";

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const editKind = (params.get("kind") as Kind | null) ?? null;

  const { expenses, addExpense, updateExpense } = useExpenses();
  const { incomes, addIncome, updateIncome } = useIncomes();
  const { transfers, addTransfer, updateTransfer } = useTransfers();
  const { addItem: addRecurring } = useRecurringExpenses();
  const { accounts, balances } = useAccounts();

  // Nilai awal dari transaksi yang diedit (dihitung sekali dari data yang sudah dimuat).
  const initial = useMemo(() => {
    if (!editId || !editKind) return null;
    if (editKind === "out") {
      const e = expenses.find((x) => x.id === editId);
      return e ? { kind: "out" as Kind, nominal: e.nominal, kategori: e.kategori as string, akun: e.metode_pembayaran ?? "", tanggal: e.tanggal, catatan: e.catatan ?? "", ke: "" } : null;
    }
    if (editKind === "in") {
      const i = incomes.find((x) => x.id === editId);
      return i ? { kind: "in" as Kind, nominal: i.nominal, kategori: i.kategori ?? i.sumber, akun: i.akun ?? "", tanggal: i.tanggal, catatan: i.catatan ?? "", ke: "" } : null;
    }
    const x = transfers.find((r) => r.id === editId);
    return x ? { kind: "transfer" as Kind, nominal: x.nominal, kategori: "", akun: x.dari_akun, tanggal: x.tanggal, catatan: x.catatan ?? "", ke: x.ke_akun } : null;
  }, [editId, editKind, expenses, incomes, transfers]);

  // Form di-remount saat data edit selesai dimuat (key) sehingga state awalnya benar.
  return <Form key={initial ? editId : "new"} initial={initial} editId={editId} accounts={accounts} balances={balances}
    onSave={{ addExpense, updateExpense, addIncome, updateIncome, addTransfer, updateTransfer, addRecurring }} navigate={navigate} />;
}

interface Initial { kind: Kind; nominal: number; kategori: string; akun: string; tanggal: string; catatan: string; ke: string }

function Form({ initial, editId, accounts, balances, onSave, navigate }: {
  initial: Initial | null;
  editId: string | null;
  accounts: { id: string; nama: string }[];
  balances: Record<string, number>;
  onSave: {
    addExpense: ReturnType<typeof useExpenses>["addExpense"]; updateExpense: ReturnType<typeof useExpenses>["updateExpense"];
    addIncome: ReturnType<typeof useIncomes>["addIncome"]; updateIncome: ReturnType<typeof useIncomes>["updateIncome"];
    addTransfer: ReturnType<typeof useTransfers>["addTransfer"]; updateTransfer: ReturnType<typeof useTransfers>["updateTransfer"];
    addRecurring: ReturnType<typeof useRecurringExpenses>["addItem"];
  };
  navigate: ReturnType<typeof useNavigate>;
}) {
  const editing = !!editId && !!initial;
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "out");
  const [nominal, setNominal] = useState<number | null>(initial?.nominal ?? null);
  const [kategori, setKategori] = useState(initial?.kategori || "Makan");
  const [akun, setAkun] = useState(initial?.akun || "");
  const [ke, setKe] = useState(initial?.ke || "");
  const [tanggal, setTanggal] = useState(initial?.tanggal ?? toDateStr());
  const [catatan, setCatatan] = useState(initial?.catatan ?? "");
  const [berulang, setBerulang] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const names = accounts.map((a) => a.nama);
  const from = akun || names[0] || "";
  const to = ke && ke !== from ? ke : names.find((n) => n !== from) ?? "";
  const cats = kind === "out" ? EXPENSE_CATS : INCOME_CATS;

  const switchKind = (k: Kind) => {
    setKind(k);
    setKategori(k === "out" ? "Makan" : "Gaji");
    setBerulang(false);
    setError("");
  };

  const save = async () => {
    if (!nominal || nominal <= 0) return setError(t("Nominal harus diisi"));
    if (kind === "transfer") {
      if (!from || !to || from === to) return setError(t("Pilih dua akun yang berbeda"));
      if (!editing && (balances[from] ?? 0) < nominal) return setError(t("Saldo {0} tidak cukup ({1})", [from, rupiah(balances[from] ?? 0)]));
    }
    setSaving(true);
    setError("");
    let res: { error: string | null } = { error: null };
    const note = catatan.trim() || null;
    if (kind === "out") {
      const input = { nominal, kategori: kategori as Expense["kategori"], metode_pembayaran: from || null, catatan: note, tanggal };
      res = editing ? await onSave.updateExpense(editId!, input) : await onSave.addExpense(input);
      if (!res.error && berulang)
        await onSave.addRecurring({ nama: note ?? kategori, nominal, kategori, tanggal_jatuh_tempo: new Date(tanggal + "T00:00:00").getDate(), aktif: true });
    } else if (kind === "in") {
      const input = { nominal, sumber: kategori, kategori, catatan: note, tanggal, akun: from || null };
      res = editing ? await onSave.updateIncome(editId!, input) : await onSave.addIncome(input);
    } else {
      const input = { dari_akun: from, ke_akun: to, nominal, tanggal, catatan: note };
      res = editing ? await onSave.updateTransfer(editId!, input) : await onSave.addTransfer(input);
    }
    setSaving(false);
    if (res.error) return setError(res.error);
    navigate("/money", { replace: true });
  };

  const accountSelect = (value: string, onChange: (v: string) => void) => (
    <select className="input-field" value={value} onChange={(e) => onChange(e.target.value)}>
      {names.map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  );

  return (
    <div className="min-h-screen bg-bg pb-10">
      <PageHeader title={editing ? t("Ubah Transaksi") : t("Tambah Transaksi")} left="back" search={false} />
      <div className="px-4 space-y-5 max-w-2xl mx-auto">
        {!editing && (
          <Segmented
            options={[{ key: "out", label: t("Pengeluaran") }, { key: "in", label: t("Pemasukan") }, { key: "transfer", label: t("Transfer") }]}
            value={kind}
            onChange={switchKind}
          />
        )}

        <Field label={t("Nominal")}>
          <CurrencyInput value={nominal} onChange={setNominal} placeholder="0" className="input-field" autoFocus />
        </Field>

        {kind !== "transfer" && (
          <div className="space-y-2">
            <span className="text-xs text-gray-400">{t("Kategori")}</span>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(cats).map(([key, m]) => {
                const Icon = m.icon;
                const active = kategori === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setKategori(key)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-[10px] min-w-0 ${active ? "border-primary bg-primary/15 text-primary" : "border-surface-light bg-surface text-gray-300"}`}
                  >
                    <Icon size={20} style={active ? undefined : { color: m.color }} />
                    <span className="truncate max-w-full px-1">{t(m.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {kind === "transfer" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Dari akun")}>{accountSelect(from, setAkun)}</Field>
            <Field label={t("Ke akun")}>{accountSelect(to, setKe)}</Field>
          </div>
        ) : (
          <Field label={t("Akun")}>{accountSelect(from, setAkun)}</Field>
        )}

        <Field label={t("Tanggal")}>
          <input type="date" className="input-field" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </Field>

        <Field label={t("Catatan (opsional)")}>
          <textarea className="input-field min-h-20" placeholder={t("Contoh: makan siang dengan teman")} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </Field>

        {kind === "out" && !editing && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-200">{t("Berulang (tiap bulan)")}</span>
            <Toggle checked={berulang} onChange={setBerulang} />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        <PrimaryButton onClick={save} disabled={saving}>{saving ? t("Menyimpan...") : t("Simpan")}</PrimaryButton>
      </div>
    </div>
  );
}
