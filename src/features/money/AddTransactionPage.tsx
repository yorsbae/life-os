import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import Field from "../../components/ui/Field";
import CurrencyInput from "../../components/ui/CurrencyInput";
import { PrimaryButton, Toggle } from "../../components/ui/Controls";
import { useRecurringExpenses } from "./useRecurringExpenses";
import { useMoney, type Money } from "./useMoney";
import { EXPENSE_CATS, INCOME_CATS } from "./categories";
import { isGiving, planByRules } from "./pocketMath";
import { rememberAccount } from "./defaultAccount";
import { useDefaultAccount } from "./useDefaultAccount";
import type { Expense } from "../../types";
import { t, tx } from "../../lib/i18n";
import { rupiah } from "../../utils/format";
import { toDateStr } from "../../utils/dates";
import Select from "../../components/ui/Select";

type Kind = "out" | "in" | "transfer";
const isKind = (v: string | null): v is Kind => v === "out" || v === "in" || v === "transfer";

interface Initial {
  kind: Kind;
  nominal: number;
  kategori: string;
  akun: string;
  tanggal: string;
  catatan: string;
  ke: string;
  pocketId: string;
}

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
  const kindParam = params.get("kind");
  const editKind = isKind(kindParam) ? kindParam : null;

  const money = useMoney();
  const { addItem: addRecurring } = useRecurringExpenses();
  const defaultAkun = useDefaultAccount();

  // Nilai awal dari transaksi yang diedit (dihitung sekali dari data yang sudah dimuat).
  const initial = useMemo<Initial | null>(() => {
    if (!editId || !editKind) return null;
    if (editKind === "out") {
      const e = money.expenses.find((x) => x.id === editId);
      return e ? { kind: "out", nominal: e.nominal, kategori: e.kategori as string, akun: e.metode_pembayaran ?? "", tanggal: e.tanggal, catatan: e.catatan ?? "", ke: "", pocketId: e.pocket_id ?? "" } : null;
    }
    if (editKind === "in") {
      const i = money.incomes.find((x) => x.id === editId);
      return i ? { kind: "in", nominal: i.nominal, kategori: i.kategori ?? i.sumber, akun: i.akun ?? "", tanggal: i.tanggal, catatan: i.catatan ?? "", ke: "", pocketId: "" } : null;
    }
    const x = money.transfers.find((r) => r.id === editId);
    return x ? { kind: "transfer", nominal: x.nominal, kategori: "", akun: x.dari_akun, tanggal: x.tanggal, catatan: x.catatan ?? "", ke: x.ke_akun, pocketId: "" } : null;
  }, [editId, editKind, money.expenses, money.incomes, money.transfers]);

  // Tunggu data (mode edit) dan sumber dana bawaan siap supaya nilai awal form benar.
  if (money.loading || defaultAkun === null) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><p className="text-gray-400 text-sm">{t("Memuat...")}</p></div>;
  }

  // Form di-remount saat data edit selesai dimuat (key) sehingga state awalnya benar.
  return (
    <Form
      key={initial ? editId : "new"}
      initial={initial}
      startKind={editId ? undefined : editKind ?? undefined}
      editId={editId}
      money={money}
      defaultAkun={defaultAkun}
      addRecurring={addRecurring}
      navigate={navigate}
    />
  );
}

function Form({ initial, startKind, editId, money, defaultAkun, addRecurring, navigate }: {
  initial: Initial | null;
  startKind?: Kind;
  editId: string | null;
  money: Money;
  defaultAkun: string;
  addRecurring: ReturnType<typeof useRecurringExpenses>["addItem"];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const editing = !!editId && !!initial;
  const [kind, setKind] = useState<Kind>(initial?.kind ?? startKind ?? "out");
  const [nominal, setNominal] = useState<number | null>(initial?.nominal ?? null);
  const [kategori, setKategori] = useState(initial?.kategori || (startKind === "in" ? "Gaji" : "Makan"));
  const [akun, setAkun] = useState(initial?.akun || "");
  const [ke, setKe] = useState(initial?.ke || "");
  const [tanggal, setTanggal] = useState(initial?.tanggal ?? toDateStr());
  const [catatan, setCatatan] = useState(initial?.catatan ?? "");
  const [pocketId, setPocketId] = useState(initial?.pocketId ?? "");
  const [berulang, setBerulang] = useState(false);
  const [bagi, setBagi] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const names = money.accounts.map((a) => a.nama);
  // Transaksi lama bisa menyimpan nama akun yang sudah dihapus: tetap tampil agar tidak diganti diam-diam.
  const options = akun && !names.includes(akun) ? [akun, ...names] : names;
  const from = akun || (names.includes(defaultAkun) ? defaultAkun : names[0] ?? "");
  const to = ke && ke !== from ? ke : names.find((n) => n !== from) ?? "";
  const cats = kind === "out" ? EXPENSE_CATS : INCOME_CATS;

  const spendable = money.stats;
  const pocketStat = pocketId ? money.stats.find((s) => s.pocket.id === pocketId) : undefined;
  // Saat mengedit pengeluaran dari kantong yang sama, nominal lamanya dikembalikan dulu ke saldo kantong.
  const ownBack = editing && initial?.kind === "out" && initial.pocketId === pocketId ? initial.nominal : 0;
  const pocketAvail = pocketStat ? pocketStat.saldo + ownBack : 0;
  const akunBal = money.balances[from] ?? 0;
  const akunBack = editing && initial?.kind === "out" && initial.akun === from ? initial.nominal : 0;
  const akunAfter = akunBal + akunBack - (nominal ?? 0);

  const autoPlan = useMemo(
    () => (kind === "in" && !editing && nominal ? planByRules(nominal, money.pockets.filter((p) => p.mode_alokasi !== "manual")) : []),
    [kind, editing, nominal, money.pockets],
  );
  const autoTotal = autoPlan.reduce((s, a) => s + a.nominal, 0);

  const switchKind = (k: Kind) => {
    setKind(k);
    setKategori(k === "out" ? "Makan" : "Gaji");
    setBerulang(false);
    setPocketId("");
    setError("");
  };

  const save = async () => {
    if (!nominal || nominal <= 0) return setError(t("Nominal harus diisi"));
    if (!from) return setError(t("Pilih sumber dana"));
    if (kind === "transfer") {
      if (!from || !to || from === to) return setError(t("Pilih dua akun yang berbeda"));
      const back = editing && initial?.kind === "transfer" && initial.akun === from ? initial.nominal : 0;
      if ((money.balances[from] ?? 0) + back < nominal) return setError(t("Saldo {0} tidak cukup ({1})", [from, rupiah(money.balances[from] ?? 0)]));
    }
    if (kind === "out" && pocketStat && !isGiving(pocketStat.pocket) && nominal > pocketAvail)
      return setError(t("Saldo kantong tidak cukup ({0})", [rupiah(Math.max(pocketAvail, 0))]));

    setSaving(true);
    setError("");
    let res: { error: string | null };
    const note = catatan.trim() || null;
    if (kind === "out") {
      const input = { nominal, kategori: kategori as Expense["kategori"], metode_pembayaran: from, catatan: note, tanggal, pocket_id: pocketId || null };
      res = editing ? await money.updateExpense(editId!, input) : await money.addExpense(input);
      if (!res.error && berulang)
        await addRecurring({ nama: note ?? kategori, nominal, kategori, tanggal_jatuh_tempo: new Date(tanggal + "T00:00:00").getDate(), aktif: true });
    } else if (kind === "in") {
      const input = { nominal, sumber: kategori, kategori, catatan: note, tanggal, akun: from };
      if (editing) res = await money.updateIncome(editId!, input);
      else if (bagi && autoPlan.length > 0) res = await money.addIncomeAndAllocate(input, autoPlan);
      else res = await money.addIncome(input);
    } else {
      const input = { dari_akun: from, ke_akun: to, nominal, tanggal, catatan: note };
      res = editing ? await money.updateTransfer(editId!, input) : await money.addTransfer(input);
    }
    setSaving(false);
    if (res.error) return setError(res.error);
    await rememberAccount(kind === "transfer" ? to : from);
    navigate("/money", { replace: true });
  };

  const accountSelect = (value: string, onChange: (v: string) => void, title: string) => (
    <Select className="input-field" value={value} onChange={(e) => onChange(e.target.value)} title={title}>
      {options.map((n) => <option key={n} value={n}>{n} · {rupiah(money.balances[n] ?? 0)}</option>)}
    </Select>
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
            <Field label={t("Dari akun")}>{accountSelect(from, setAkun, t("Dari akun"))}</Field>
            <Field label={t("Ke akun")}>{accountSelect(to, setKe, t("Ke akun"))}</Field>
          </div>
        ) : (
          <Field label={kind === "out" ? t("Bayar dari sumber dana") : t("Masuk ke sumber dana")}>
            {accountSelect(from, setAkun, t("Sumber dana"))}
          </Field>
        )}
        {kind === "out" && nominal && akunAfter < 0 && (
          <p className="text-xs text-amber-400 -mt-3">{t("Saldo {0} akan menjadi minus ({1}).", [from, rupiah(akunAfter)])}</p>
        )}

        {kind === "out" && spendable.length > 0 && (
          <Field label={t("Ambil dari kantong (opsional)")}>
            <Select className="input-field" value={pocketId} onChange={(e) => setPocketId(e.target.value)} title={t("Kantong")}>
              <option value="">{t("Tanpa kantong (Saldo Utama)")}</option>
              {spendable.map((s) => (
                <option key={s.pocket.id} value={s.pocket.id}>
                  {s.pocket.nama}{isGiving(s.pocket) ? "" : ` · ${rupiah(s.saldo)}`}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label={t("Tanggal")}>
          <input type="date" className="input-field" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </Field>

        <Field label={t("Catatan (opsional)")}>
          <textarea className="input-field min-h-20" placeholder={t("Contoh: makan siang dengan teman")} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </Field>

        {kind === "in" && !editing && autoPlan.length > 0 && (
          <div className="rounded-2xl border border-surface-light bg-surface p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-200">{t("Bagi otomatis ke kantong")}</span>
              <Toggle checked={bagi} onChange={setBagi} />
            </div>
            {bagi && (
              <div className="space-y-1">
                {autoPlan.map((a) => (
                  <div key={a.pocketId} className="flex justify-between text-xs">
                    <span className="text-gray-400 truncate">{tx(money.pockets.find((p) => p.id === a.pocketId)?.nama ?? "")}</span>
                    <span className="text-gray-100">{rupiah(a.nominal)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs pt-1 border-t border-surface-light">
                  <span className="text-gray-400">{t("Sisa ke Saldo Utama")}</span>
                  <span className="text-gray-100">{rupiah((nominal ?? 0) - autoTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {kind === "out" && !editing && (
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-200">{t("Berulang (tiap bulan)")}</span>
            <Toggle checked={berulang} onChange={setBerulang} />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{tx(error)}</p>}
        <PrimaryButton onClick={save} disabled={saving}>{saving ? t("Menyimpan...") : t("Simpan")}</PrimaryButton>
      </div>
    </div>
  );
}
