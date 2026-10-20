import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Utensils, Car, ShoppingBag, HeartPulse, Receipt, Gamepad2, MoreHorizontal,
  Briefcase, Laptop, Gift, TrendingUp, type LucideIcon,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import CurrencyInput from "../../components/ui/CurrencyInput";
import { PrimaryButton, Toggle } from "../../components/ui/Controls";
import { useExpenses } from "../expense/useExpenses";
import { useIncomes } from "../income/useIncomes";
import { useRecurringExpenses } from "./useRecurringExpenses";
import { toDateStr } from "../../utils/dates";
import type { Expense } from "../../types";

type Kind = "out" | "in";

// Kategori pengeluaran mengikuti tipe Expense yang sudah ada di database.
const OUT_CATS: { key: Expense["kategori"]; label: string; icon: LucideIcon }[] = [
  { key: "Makan", label: "Makanan", icon: Utensils },
  { key: "Transport", label: "Transportasi", icon: Car },
  { key: "Belanja", label: "Belanja", icon: ShoppingBag },
  { key: "Tagihan", label: "Tagihan", icon: Receipt },
  { key: "Hiburan", label: "Hiburan", icon: Gamepad2 },
  { key: "Lainnya", label: "Lainnya", icon: MoreHorizontal },
];
const IN_CATS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "Gaji", label: "Gaji", icon: Briefcase },
  { key: "Freelance", label: "Freelance", icon: Laptop },
  { key: "Bonus", label: "Bonus", icon: Gift },
  { key: "Investasi", label: "Investasi", icon: TrendingUp },
  { key: "Hadiah", label: "Hadiah", icon: HeartPulse },
  { key: "Lainnya", label: "Lainnya", icon: MoreHorizontal },
];
const AKUN = ["Dompet", "Bank", "E-Wallet"];

export default function AddTransactionPage() {
  const navigate = useNavigate();
  const { addExpense } = useExpenses();
  const { addIncome } = useIncomes();
  const { addItem: addRecurring } = useRecurringExpenses();

  const [kind, setKind] = useState<Kind>("out");
  const [nominal, setNominal] = useState<number | null>(null);
  const [kategori, setKategori] = useState<string>("Makan");
  const [akun, setAkun] = useState(AKUN[0]);
  const [tanggal, setTanggal] = useState(toDateStr());
  const [catatan, setCatatan] = useState("");
  const [berulang, setBerulang] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cats = kind === "out" ? OUT_CATS : IN_CATS;

  const switchKind = (k: Kind) => {
    setKind(k);
    setKategori(k === "out" ? "Makan" : "Gaji");
    setBerulang(false);
  };

  const save = async () => {
    if (!nominal || nominal <= 0) return setError("Nominal harus diisi");
    setSaving(true);
    setError("");
    let res: { error: string | null };
    if (kind === "out") {
      res = await addExpense({
        nominal,
        kategori: kategori as Expense["kategori"],
        metode_pembayaran: akun,
        catatan: catatan.trim() || null,
        tanggal,
      });
      if (!res.error && berulang)
        await addRecurring({
          nama: catatan.trim() || kategori,
          nominal,
          kategori,
          tanggal_jatuh_tempo: new Date(tanggal).getDate(),
          aktif: true,
        });
    } else {
      res = await addIncome({
        nominal,
        sumber: kategori,
        kategori,
        catatan: catatan.trim() || null,
        tanggal,
      });
    }
    setSaving(false);
    if (res.error) return setError(res.error);
    navigate("/money", { replace: true });
  };

  return (
    <div className="min-h-screen bg-bg pb-10">
      <PageHeader title="Tambah Transaksi" left="back" search={false} />
      <div className="px-4 space-y-5 max-w-2xl mx-auto">
        <Segmented
          options={[
            { key: "out", label: "Pengeluaran" },
            { key: "in", label: "Pemasukan" },
          ]}
          value={kind}
          onChange={switchKind}
        />

        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">Nominal</span>
          <CurrencyInput value={nominal} onChange={setNominal} placeholder="0" className="input-field" autoFocus />
        </label>

        <div className="space-y-2">
          <span className="text-xs text-gray-400">Kategori</span>
          <div className="grid grid-cols-3 gap-2">
            {cats.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setKategori(key)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-[11px] ${
                  kategori === key
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-surface-light bg-surface text-gray-300"
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">Akun</span>
          <select className="input-field" value={akun} onChange={(e) => setAkun(e.target.value)}>
            {AKUN.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">Tanggal</span>
          <input type="date" className="input-field" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">Catatan (opsional)</span>
          <textarea
            className="input-field min-h-20"
            placeholder="Contoh: makan siang dengan teman"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
          />
        </label>

        {kind === "out" && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-200">Berulang (tiap bulan)</span>
            <Toggle checked={berulang} onChange={setBerulang} />
          </div>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}
        <PrimaryButton onClick={save} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan"}
        </PrimaryButton>
      </div>
    </div>
  );
}
