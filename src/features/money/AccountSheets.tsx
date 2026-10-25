import { useState } from "react";
import { Pencil } from "lucide-react";
import { Chip, GhostButton, PrimaryButton, Sheet } from "../../components/ui/Controls";
import Field from "../../components/ui/Field";
import CurrencyInput from "../../components/ui/CurrencyInput";
import { DangerButton } from "../../components/ui/DeleteButton";
import { t, tx } from "../../lib/i18n";
import { rupiah } from "../../utils/format";
import { ACCOUNT_ICON } from "./categories";
import { groupLabel } from "./accountLabels";
import { ACCOUNT_TYPES } from "./accountMath";
import type { Account } from "./useAccounts";
import type { Money } from "./useMoney";

const Err = ({ msg }: { msg: string }) => (msg ? <p className="text-xs text-red-400 break-words">{tx(msg)}</p> : null);

function AccountRow({ money, account }: { money: Money; account: Account }) {
  const Icon = ACCOUNT_ICON[account.tipe] ?? ACCOUNT_ICON.Tunai;
  const saldo = money.balances[account.nama] ?? 0;
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState(account.nama);
  const [tipe, setTipe] = useState<string>(account.tipe);
  const [actual, setActual] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setBusy(true);
    setError("");
    let r = await money.updateAccount(account.id, { nama, tipe });
    // Koreksi saldo dilakukan setelah nama/jenis tersimpan, memakai saldo yang sama dengan yang ditampilkan.
    if (!r.error && actual !== null && actual !== saldo) r = await money.reconcileAccount(account.id, actual);
    setBusy(false);
    if (r.error) return setError(r.error);
    setActual(null);
    setOpen(false);
  };

  const remove = async () => {
    const r = await money.deleteAccount(account.id);
    if (r.error) setError(r.error);
  };

  return (
    <div className="rounded-2xl bg-bg border border-surface-light">
      <div className="flex items-center gap-3 p-3">
        <span className="w-9 h-9 rounded-full bg-surface-light text-primary flex items-center justify-center shrink-0"><Icon size={16} /></span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-50 truncate">{tx(account.nama)}</p>
          <p className="text-[11px] text-gray-400">{groupLabel(account.tipe)}</p>
        </div>
        <span className={`text-sm font-semibold shrink-0 ${saldo < 0 ? "text-red-400" : "text-gray-50"}`}>{rupiah(saldo)}</span>
        <button onClick={() => setOpen((o) => !o)} aria-label={t("Ubah Akun")} aria-expanded={open} className="p-2 text-gray-300 rounded-xl active:bg-surface-light">
          <Pencil size={15} />
        </button>
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-surface-light pt-3">
          <Field label={t("Nama akun")}>
            <input className="input-field" value={nama} onChange={(e) => { setNama(e.target.value); setError(""); }} />
          </Field>
          <div className="flex gap-2 flex-wrap">
            {ACCOUNT_TYPES.map((x) => <Chip key={x} active={tipe === x} onClick={() => setTipe(x)}>{groupLabel(x)}</Chip>)}
          </div>
          <Field label={t("Koreksi saldo (isi saldo sebenarnya)")}>
            <CurrencyInput value={actual} onChange={setActual} placeholder={String(Math.round(saldo))} className="input-field" />
          </Field>
          <p className="text-[11px] text-gray-400">{t("Untuk menyamakan dengan saldo asli (mis. nilai investasi berubah) tanpa membuat transaksi.")}</p>
          <Err msg={error} />
          <PrimaryButton onClick={save} disabled={busy || !nama.trim()}>{busy ? t("Menyimpan...") : t("Simpan")}</PrimaryButton>
          <DangerButton
            label={t("Hapus Akun")}
            confirmMessage={t("Hapus akun \"{0}\"? Transaksi tidak ikut terhapus, tetapi saldo akun ini tidak lagi dihitung.", [account.nama])}
            onConfirm={remove}
          />
        </div>
      )}
      {!open && error && <div className="px-3 pb-3"><Err msg={error} /></div>}
    </div>
  );
}

/** Kelola sumber dana: cash, banyak rekening bank, e-wallet, investasi. */
export function ManageAccountsSheet({ money, onClose }: { money: Money; onClose: () => void }) {
  const [nama, setNama] = useState("");
  const [tipe, setTipe] = useState<string>(ACCOUNT_TYPES[1]);
  const [saldo, setSaldo] = useState<number | null>(null);
  const [error, setError] = useState("");

  const add = async () => {
    const res = await money.addAccount(nama, tipe, saldo ?? 0);
    if (res.error) return setError(res.error);
    setNama("");
    setSaldo(null);
    setError("");
  };

  return (
    <Sheet title={t("Kelola Sumber Dana")} onClose={onClose}>
      {money.groups.map((g) => (
        <div key={g.tipe} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-medium text-gray-300">{groupLabel(g.tipe)}</p>
            <p className="text-xs text-gray-400">{rupiah(g.total)}</p>
          </div>
          {g.items.map((a) => <AccountRow key={a.id} money={money} account={a} />)}
        </div>
      ))}
      <div className="space-y-3 pt-3 border-t border-surface-light">
        <p className="text-xs text-gray-400">{t("Sumber dana baru")}</p>
        <input className="input-field" placeholder={t("Nama akun (mis. BCA, Dana, Bibit)")} value={nama} onChange={(e) => { setNama(e.target.value); setError(""); }} />
        <div className="flex gap-2 flex-wrap">
          {ACCOUNT_TYPES.map((x) => <Chip key={x} active={tipe === x} onClick={() => setTipe(x)}>{groupLabel(x)}</Chip>)}
        </div>
        <Field label={t("Saldo awal")}>
          <CurrencyInput value={saldo} onChange={setSaldo} placeholder="0" className="input-field" />
        </Field>
        <Err msg={error} />
        <PrimaryButton onClick={add} disabled={!nama.trim()}>{t("Tambah Akun")}</PrimaryButton>
      </div>
    </Sheet>
  );
}

/** Atur tanggal gajian untuk penghitung "x hari lagi gajian". */
export function PaydaySheet({ day, onSave, onClose }: { day: number | null; onSave: (n: number | null) => Promise<void>; onClose: () => void }) {
  const [value, setValue] = useState(day ? String(day) : "");
  const n = Number(value);
  const valid = Number.isInteger(n) && n >= 1 && n <= 31;
  return (
    <Sheet title={t("Tanggal Gajian")} onClose={onClose}>
      <p className="text-xs text-gray-400">{t("Pilih tanggal gajian tiap bulan. Bulan yang lebih pendek memakai hari terakhirnya.")}</p>
      <Field label={t("Tanggal (1-31)")}>
        <input className="input-field" inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 2))} autoFocus />
      </Field>
      <PrimaryButton disabled={!valid} onClick={async () => { await onSave(n); onClose(); }}>{t("Simpan")}</PrimaryButton>
      {day !== null && <GhostButton onClick={async () => { await onSave(null); onClose(); }}>{t("Hapus pengaturan")}</GhostButton>}
    </Sheet>
  );
}
