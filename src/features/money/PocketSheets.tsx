import { useId, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Pencil, ShoppingCart } from "lucide-react";
import { Card, Chip, GhostButton, PrimaryButton, Sheet } from "../../components/ui/Controls";
import Field from "../../components/ui/Field";
import CurrencyInput from "../../components/ui/CurrencyInput";
import Segmented from "../../components/ui/Segmented";
import Select from "../../components/ui/Select";
import { ProgressBar } from "../../components/ui/Progress";
import { DangerButton, DeleteButton } from "../../components/ui/DeleteButton";
import { t, tx } from "../../lib/i18n";
import { fmtDate } from "../../utils/format";
import { rupiah } from "../../utils/format";
import { toDateStr } from "../../utils/dates";
import type { Expense } from "../../types";
import { EXPENSE_CATS } from "./categories";
import { pocketIcon, POCKET_ICONS, POCKET_ICON_KEYS } from "./pockets";
import {
  checkRule, isGiving, percentUsed, planByRules,
  type AllocMode, type PocketStat, type PocketType,
} from "./pocketMath";
import type { Pocket } from "./usePocketData";
import type { Money } from "./useMoney";
import { useDefaultAccount } from "./useDefaultAccount";
import { guessCategory, type PocketPreset } from "./pocketPresets";

const Err = ({ msg }: { msg: string }) => (msg ? <p className="text-xs text-red-400 break-words">{tx(msg)}</p> : null);

// ---------------------------------------------------------------------------------------------
// Toples + kartu kantong
// ---------------------------------------------------------------------------------------------

export function Jar({ ratio, color }: { ratio: number; color: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const r = Math.min(1, Math.max(0, ratio));
  return (
    <svg width="30" height="48" viewBox="0 0 36 58" aria-hidden className="shrink-0">
      <defs>
        <clipPath id={id}>
          <rect x="3" y="12" width="30" height="44" rx="9" />
        </clipPath>
      </defs>
      <rect x="3" y="12" width="30" height="44" rx="9" fill="var(--color-bg)" stroke="var(--color-surface-light)" strokeWidth="1.5" />
      <rect x="3" y={12 + 44 * (1 - r)} width="30" height={44 * r + 0.5} fill={color} opacity="0.9" clipPath={`url(#${id})`} />
      <rect x="9" y="3" width="18" height="8" rx="3" fill={color} opacity="0.9" />
    </svg>
  );
}

export function PocketCard({
  stat, onOpen, onFill, onSpend, onGive,
}: {
  stat: PocketStat<Pocket>;
  onOpen: () => void;
  onFill: () => void;
  onSpend: () => void;
  onGive: () => void;
}) {
  const p = stat.pocket;
  const { icon: Icon, color } = pocketIcon(p.ikon);
  const giving = isGiving(p);
  const over = p.target > 0 && stat.nilai > p.target;
  const ratio = p.target > 0 ? stat.nilai / p.target : 0;
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen()}
      className="card p-3.5 text-left space-y-2.5 active:opacity-90 cursor-pointer min-w-0"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
        >
          <Icon size={17} />
        </span>
        <span className="text-sm font-semibold text-gray-50 truncate">{tx(p.nama)}</span>
      </div>
      <div className="flex items-center gap-2.5 min-w-0">
        <Jar ratio={ratio} color={giving ? "#f0a35e" : color} />
        <div className="min-w-0">
          {giving && <p className="text-[10px] text-gray-400">{t("Total Diberikan")}</p>}
          <p className={`text-[13px] font-bold break-words ${stat.nilai < 0 ? "text-red-400" : "text-gray-50"}`}>{rupiah(stat.nilai)}</p>
          <p className={`text-[10px] break-words ${over && !giving ? "text-primary" : "text-gray-400"}`}>
            {p.target > 0 ? t("{0}% dari {1}", [stat.persen, rupiah(p.target)]) : t("Tanpa target")}
          </p>
        </div>
      </div>
      {giving ? (
        <button onClick={stop(onGive)} className="w-full min-h-9 rounded-lg bg-primary/15 text-primary text-[11px] font-semibold">
          + {t("Catat Pemberian")}
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={stop(onFill)} className="min-h-9 rounded-lg bg-primary/15 text-primary text-[11px] font-semibold">
            + {t("Isi")}
          </button>
          <button onClick={stop(onSpend)} className="min-h-9 rounded-lg bg-red-500/15 text-red-400 text-[11px] font-semibold">
            − {t("Keluar")}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// + Isi
// ---------------------------------------------------------------------------------------------

export function FillSheet({ money, stat, onClose }: { money: Money; stat: PocketStat<Pocket>; onClose: () => void }) {
  const [nominal, setNominal] = useState<number | null>(null);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const p = stat.pocket;
  const sisaTarget = p.target > 0 ? Math.min(Math.max(p.target - stat.saldo, 0), Math.max(money.utama, 0)) : 0;

  const save = async () => {
    setBusy(true);
    const r = await money.fillPocket(p.id, nominal ?? 0, catatan.trim() || null);
    setBusy(false);
    if (r.error) return setError(r.error);
    onClose();
  };

  return (
    <Sheet title={t("Isi Kantong {0}", [p.nama])} onClose={onClose}>
      <p className="text-xs text-gray-400">{t("Diambil dari Saldo Utama: {0}", [rupiah(Math.max(money.utama, 0))])}</p>
      <Field label={t("Nominal")}>
        <CurrencyInput value={nominal} onChange={(v) => { setNominal(v); setError(""); }} placeholder="0" className="input-field" autoFocus />
      </Field>
      <div className="flex gap-2 flex-wrap">
        {sisaTarget > 0 && <Chip onClick={() => setNominal(sisaTarget)}>{t("Sisa target")} · {rupiah(sisaTarget)}</Chip>}
        {money.utama > 0 && <Chip onClick={() => setNominal(Math.floor(money.utama))}>{t("Semua Saldo Utama")}</Chip>}
      </div>
      <Field label={t("Catatan (opsional)")}>
        <input className="input-field" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
      </Field>
      <Err msg={error} />
      <PrimaryButton onClick={save} disabled={busy || !nominal}>{busy ? t("Menyimpan...") : t("Simpan")}</PrimaryButton>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------------------------
// − Keluar (belanja dari kantong, atau kembalikan ke Saldo Utama)
// ---------------------------------------------------------------------------------------------

function AccountSelect({ money, value, onChange }: { money: Money; value: string; onChange: (v: string) => void }) {
  return (
    <Select className="input-field" value={value} onChange={(e) => onChange(e.target.value)} title={t("Sumber dana")}>
      {money.accounts.map((a) => (
        <option key={a.id} value={a.nama}>{a.nama} · {rupiah(money.balances[a.nama] ?? 0)}</option>
      ))}
    </Select>
  );
}

export function SpendSheet({ money, stat, onClose }: { money: Money; stat: PocketStat<Pocket>; onClose: () => void }) {
  const p = stat.pocket;
  const def = useDefaultAccount();
  const [mode, setMode] = useState<"belanja" | "kembali">("belanja");
  const [nominal, setNominal] = useState<number | null>(null);
  const [kategori, setKategori] = useState<Expense["kategori"]>(guessCategory(p.nama));
  const [akunPick, setAkunPick] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const akun = akunPick ?? def ?? money.accounts[0]?.nama ?? "";

  const save = async () => {
    setBusy(true);
    const r =
      mode === "belanja"
        ? await money.spendFromPocket({ pocketId: p.id, nominal: nominal ?? 0, kategori, akun, catatan: catatan.trim() || null })
        : await money.returnFromPocket(p.id, nominal ?? 0, catatan.trim() || null);
    setBusy(false);
    if (r.error) return setError(r.error);
    onClose();
  };

  return (
    <Sheet title={t("Keluar dari {0}", [p.nama])} onClose={onClose}>
      <Segmented
        options={[{ key: "belanja", label: t("Belanja") }, { key: "kembali", label: t("Kembalikan") }]}
        value={mode}
        onChange={(m) => { setMode(m); setError(""); }}
      />
      <p className="text-xs text-gray-400">{t("Saldo kantong: {0}", [rupiah(Math.max(stat.saldo, 0))])}</p>
      <Field label={t("Nominal")}>
        <CurrencyInput value={nominal} onChange={(v) => { setNominal(v); setError(""); }} placeholder="0" className="input-field" autoFocus />
      </Field>
      {mode === "belanja" ? (
        <>
          <div className="space-y-1.5">
            <span className="text-xs text-gray-400">{t("Kategori")}</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(EXPENSE_CATS).map(([k, m]) => (
                <Chip key={k} active={kategori === k} onClick={() => setKategori(k as Expense["kategori"])}>{t(m.label)}</Chip>
              ))}
            </div>
          </div>
          <Field label={t("Bayar dari sumber dana")}>
            <AccountSelect money={money} value={akun} onChange={setAkunPick} />
          </Field>
          <Field label={t("Catatan (opsional)")}>
            <input className="input-field" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder={t("Contoh: makan siang dengan teman")} />
          </Field>
          <p className="text-[11px] text-gray-400">{t("Tercatat sebagai pengeluaran dan memotong saldo kantong serta sumber dana.")}</p>
        </>
      ) : (
        <p className="text-[11px] text-gray-400">{t("Uang kembali ke Saldo Utama. Tidak dicatat sebagai pengeluaran.")}</p>
      )}
      <Err msg={error} />
      <PrimaryButton onClick={save} disabled={busy || !nominal || (mode === "belanja" && !akun)}>
        {busy ? t("Menyimpan...") : mode === "belanja" ? t("Catat Pengeluaran") : t("Kembalikan ke Saldo Utama")}
      </PrimaryButton>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------------------------
// + Catat Pemberian (kantong tipe pemberian, mis. Orang Tua)
// ---------------------------------------------------------------------------------------------

export function GiveSheet({ money, stat, onClose }: { money: Money; stat: PocketStat<Pocket>; onClose: () => void }) {
  const p = stat.pocket;
  const def = useDefaultAccount();
  const [nominal, setNominal] = useState<number | null>(null);
  const [akunPick, setAkunPick] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState(toDateStr());
  const [catatan, setCatatan] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const akun = akunPick ?? def ?? money.accounts[0]?.nama ?? "";

  const save = async () => {
    setBusy(true);
    const r = await money.spendFromPocket({
      pocketId: p.id, nominal: nominal ?? 0, kategori: "Keluarga", akun, tanggal,
      catatan: catatan.trim() || t("Pemberian untuk {0}", [p.nama]),
    });
    setBusy(false);
    if (r.error) return setError(r.error);
    onClose();
  };

  return (
    <Sheet title={t("Catat Pemberian — {0}", [p.nama])} onClose={onClose}>
      <p className="text-xs text-gray-400">
        {p.target > 0 ? t("Sudah diberikan {0} dari {1}", [rupiah(stat.nilai), rupiah(p.target)]) : t("Sudah diberikan {0}", [rupiah(stat.nilai)])}
      </p>
      <Field label={t("Nominal")}>
        <CurrencyInput value={nominal} onChange={(v) => { setNominal(v); setError(""); }} placeholder="0" className="input-field" autoFocus />
      </Field>
      <Field label={t("Bayar dari sumber dana")}>
        <AccountSelect money={money} value={akun} onChange={setAkunPick} />
      </Field>
      <Field label={t("Tanggal")}>
        <input type="date" className="input-field" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </Field>
      <Field label={t("Catatan (opsional)")}>
        <input className="input-field" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
      </Field>
      <Err msg={error} />
      <PrimaryButton onClick={save} disabled={busy || !nominal || !akun}>{busy ? t("Menyimpan...") : t("Simpan")}</PrimaryButton>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------------------------
// Tambah / ubah / hapus kantong (termasuk aturan pembagian: persen atau nominal)
// ---------------------------------------------------------------------------------------------

export function PocketFormSheet({
  money, stat, preset, onClose,
}: { money: Money; stat?: PocketStat<Pocket>; preset?: PocketPreset; onClose: () => void }) {
  const editing = stat?.pocket;
  const [nama, setNama] = useState(editing?.nama ?? preset?.nama ?? "");
  const [ikon, setIkon] = useState(editing?.ikon ?? preset?.ikon ?? "wallet");
  const [tipe, setTipe] = useState<PocketType>(editing?.tipe ?? preset?.tipe ?? "tabungan");
  const [target, setTarget] = useState<number | null>(editing && editing.target > 0 ? editing.target : null);
  const [mode, setMode] = useState<AllocMode>(editing?.mode_alokasi ?? "manual");
  const [nilaiPersen, setNilaiPersen] = useState(editing?.mode_alokasi === "persen" ? String(editing.nilai_alokasi) : "");
  const [nilaiNominal, setNilaiNominal] = useState<number | null>(editing?.mode_alokasi === "nominal" ? editing.nilai_alokasi : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const giving = tipe === "pemberian";
  const persenNum = Number(nilaiPersen.replace(",", "."));
  const nilai = mode === "persen" ? persenNum : mode === "nominal" ? (nilaiNominal ?? 0) : 0;
  const sisaPersen = Math.max(0, 100 - percentUsed(money.pockets, editing?.id));

  const save = async () => {
    const name = nama.trim();
    if (!name) return setError(t("Nama kantong wajib diisi"));
    if (money.pockets.some((x) => x.id !== editing?.id && x.nama.toLowerCase() === name.toLowerCase()))
      return setError(t("Nama kantong sudah dipakai"));
    const rule = checkRule(money.pockets, { id: editing?.id, tipe, mode, nilai });
    if (rule) return setError(rule);
    const input = {
      nama: name, ikon, tipe,
      target: target ?? 0,
      mode_alokasi: giving ? ("manual" as const) : mode,
      nilai_alokasi: giving || mode === "manual" ? 0 : nilai,
    };
    setBusy(true);
    const r = editing ? await money.updatePocket(editing.id, input) : await money.addPocket(input);
    setBusy(false);
    if (r.error) return setError(r.error);
    onClose();
  };

  const remove = async () => {
    if (!editing) return;
    const r = await money.deletePocket(editing.id);
    if (r.error) return setError(r.error);
    onClose();
  };

  return (
    <Sheet title={editing ? t("Ubah Kantong") : t("Kantong Baru")} onClose={onClose}>
      <Field label={t("Nama kantong")}>
        <input className="input-field" value={nama} onChange={(e) => { setNama(e.target.value); setError(""); }} placeholder={t("Contoh: Dana Darurat")} autoFocus={!editing} />
      </Field>

      <div className="space-y-1.5">
        <span className="text-xs text-gray-400">{t("Ikon")}</span>
        <div className="grid grid-cols-8 gap-2">
          {POCKET_ICON_KEYS.map((k) => {
            const { icon: Icon, color } = POCKET_ICONS[k];
            const active = ikon === k;
            return (
              <button
                key={k}
                type="button"
                aria-label={k}
                aria-pressed={active}
                onClick={() => setIkon(k)}
                className={`aspect-square rounded-xl flex items-center justify-center border ${active ? "border-primary bg-primary/15" : "border-surface-light bg-bg"}`}
                style={{ color }}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs text-gray-400">{t("Jenis kantong")}</span>
        <Segmented
          options={[{ key: "tabungan", label: t("Tabungan") }, { key: "pemberian", label: t("Pemberian") }]}
          value={tipe}
          onChange={(v) => setTipe(v as PocketType)}
        />
        <p className="text-[11px] text-gray-400">
          {giving
            ? t("Mencatat total uang yang diberikan (mis. untuk orang tua) terhadap target. Tidak punya saldo.")
            : t("Menyimpan sebagian saldo untuk tujuan tertentu. Bisa diisi dan dipakai belanja.")}
        </p>
      </div>

      <Field label={giving ? t("Target pemberian") : t("Target saldo")}>
        <CurrencyInput value={target} onChange={setTarget} placeholder="0" className="input-field" />
      </Field>

      {!giving && (
        <div className="space-y-2">
          <span className="text-xs text-gray-400">{t("Aturan pembagian")}</span>
          <Segmented
            options={[{ key: "manual", label: t("Manual") }, { key: "persen", label: t("Persen") }, { key: "nominal", label: t("Nominal") }]}
            value={mode}
            onChange={(m) => { setMode(m as AllocMode); setError(""); }}
          />
          {mode === "persen" && (
            <>
              <div className="relative">
                <input
                  className="input-field !pr-8"
                  inputMode="decimal"
                  value={nilaiPersen}
                  onChange={(e) => { setNilaiPersen(e.target.value.replace(/[^0-9.,]/g, "")); setError(""); }}
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
              <p className="text-[11px] text-gray-400">{t("Sisa persen yang belum dipakai kantong lain: {0}%", [sisaPersen])}</p>
            </>
          )}
          {mode === "nominal" && <CurrencyInput value={nilaiNominal} onChange={(v) => { setNilaiNominal(v); setError(""); }} placeholder="0" className="input-field" />}
          <p className="text-[11px] text-gray-400">
            {mode === "manual"
              ? t("Diisi manual kapan saja lewat tombol + Isi.")
              : t("Dipakai saat menekan Bagi ke Kantong, atau otomatis saat mencatat pemasukan.")}
          </p>
        </div>
      )}

      <Err msg={error} />
      <PrimaryButton onClick={save} disabled={busy || !nama.trim()}>{busy ? t("Menyimpan...") : t("Simpan")}</PrimaryButton>
      {editing && (
        <DangerButton
          label={t("Hapus Kantong")}
          confirmMessage={t("Hapus kantong \"{0}\"? Saldonya kembali ke Saldo Utama. Pengeluaran yang pernah dicatat tetap ada.", [editing.nama])}
          onConfirm={remove}
        />
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------------------------
// Detail kantong + riwayat
// ---------------------------------------------------------------------------------------------

export function PocketDetailSheet({
  money, stat, onClose, onFill, onSpend, onGive, onEdit,
}: {
  money: Money;
  stat: PocketStat<Pocket>;
  onClose: () => void;
  onFill: () => void;
  onSpend: () => void;
  onGive: () => void;
  onEdit: () => void;
}) {
  const p = stat.pocket;
  const giving = isGiving(p);
  const { icon: Icon, color } = pocketIcon(p.ikon);
  const [error, setError] = useState("");

  const rows = useMemo(() => {
    type Row = { key: string; kind: "isi" | "keluar" | "belanja"; nominal: number; tanggal: string; created: string; title: string; sub: string; remove: () => Promise<{ error: string | null }> };
    const list: Row[] = [
      ...money.entries.filter((e) => e.pocket_id === p.id).map((e): Row => ({
        key: "e" + e.id, kind: e.jenis, nominal: e.nominal, tanggal: e.tanggal, created: e.created_at ?? "",
        title: e.jenis === "isi" ? t("Isi kantong") : t("Dikembalikan ke Saldo Utama"),
        sub: e.catatan ?? "",
        remove: () => money.deleteEntry(e.id),
      })),
      ...money.expenses.filter((x) => x.pocket_id === p.id).map((x): Row => ({
        key: "x" + x.id, kind: "belanja", nominal: x.nominal, tanggal: x.tanggal, created: x.created_at ?? "",
        title: x.catatan || t(EXPENSE_CATS[x.kategori]?.label ?? x.kategori),
        sub: x.metode_pembayaran ?? "",
        remove: () => money.deleteExpense(x.id),
      })),
    ];
    return list.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || b.created.localeCompare(a.created)).slice(0, 60);
  }, [money, p.id]);

  return (
    <Sheet title={p.nama} onClose={onClose}>
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
          <Icon size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-gray-400">{giving ? t("Total Diberikan") : t("Saldo kantong")}</p>
          <p className={`text-xl font-bold break-words ${stat.nilai < 0 ? "text-red-400" : "text-gray-50"}`}>{rupiah(stat.nilai)}</p>
        </div>
        <button onClick={onEdit} aria-label={t("Ubah Kantong")} className="p-2 text-gray-300 rounded-xl active:bg-surface-light"><Pencil size={17} /></button>
      </div>

      {p.target > 0 ? (
        <div className="space-y-1.5">
          <ProgressBar value={Math.max(stat.nilai, 0)} max={p.target} />
          <p className="text-[11px] text-gray-400">{t("{0}% dari {1}", [stat.persen, rupiah(p.target)])}</p>
        </div>
      ) : (
        <p className="text-[11px] text-gray-400">{t("Tanpa target")}</p>
      )}

      {!giving && p.mode_alokasi !== "manual" && (
        <p className="text-[11px] text-gray-400">
          {p.mode_alokasi === "persen" ? t("Aturan pembagian: {0}%", [p.nilai_alokasi]) : t("Aturan pembagian: {0}", [rupiah(p.nilai_alokasi)])}
        </p>
      )}

      {giving ? (
        <PrimaryButton onClick={onGive}>+ {t("Catat Pemberian")}</PrimaryButton>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <PrimaryButton onClick={onFill}>+ {t("Isi")}</PrimaryButton>
          <GhostButton onClick={onSpend} className="!border-red-400/50 !text-red-400">− {t("Keluar")}</GhostButton>
        </div>
      )}

      <Err msg={error} />
      <div className="space-y-2">
        <p className="text-xs text-gray-400">{t("Riwayat")}</p>
        {rows.length === 0 ? (
          <p className="text-xs text-gray-500 py-3 text-center">{t("Belum ada riwayat")}</p>
        ) : (
          rows.map((r) => {
            const plus = r.kind === "isi";
            const RowIcon = r.kind === "isi" ? ArrowDownLeft : r.kind === "keluar" ? ArrowUpRight : ShoppingCart;
            return (
              <Card key={r.key} className="!py-2.5 flex items-center gap-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${plus ? "bg-primary/15 text-primary" : "bg-red-500/15 text-red-400"}`}><RowIcon size={15} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-100 truncate">{tx(r.title)}</p>
                  <p className="text-[11px] text-gray-400 truncate">{fmtDate(r.tanggal, "d MMM yyyy")}{r.sub ? ` · ${r.sub}` : ""}</p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${plus ? "text-primary" : "text-red-400"}`}>{plus ? "+" : "−"}{rupiah(r.nominal)}</span>
                <DeleteButton
                  size={15}
                  confirmMessage={t("Hapus riwayat ini?")}
                  onConfirm={async () => {
                    const res = await r.remove();
                    setError(res.error ?? "");
                  }}
                />
              </Card>
            );
          })
        )}
      </div>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------------------------
// Bagi Saldo Utama ke kantong (persen / nominal sesuai aturan, bisa diubah manual per kantong)
// ---------------------------------------------------------------------------------------------

export function AllocateSheet({ money, onClose }: { money: Money; onClose: () => void }) {
  const tabungan = useMemo(() => money.stats.filter((s) => !isGiving(s.pocket)), [money.stats]);
  const pockets = useMemo(() => tabungan.map((s) => s.pocket), [tabungan]);
  const [base, setBase] = useState<number | null>(Math.max(0, Math.floor(money.utama)));
  const [amounts, setAmounts] = useState<Record<string, number | null>>(() => {
    const plan = planByRules(Math.max(0, Math.floor(money.utama)), pockets);
    return Object.fromEntries(plan.map((a) => [a.pocketId, a.nominal]));
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const apply = (b: number | null) => {
    const plan = planByRules(b ?? 0, pockets);
    setAmounts(Object.fromEntries(plan.map((a) => [a.pocketId, a.nominal])));
    setError("");
  };

  const total = Object.values(amounts).reduce<number>((s, v) => s + (v ?? 0), 0);
  const sisa = money.utama - total;
  const hasRules = pockets.some((p) => p.mode_alokasi !== "manual");

  const save = async () => {
    setBusy(true);
    const r = await money.allocate(
      Object.entries(amounts).map(([pocketId, nominal]) => ({ pocketId, nominal: nominal ?? 0 })),
      t("Pembagian saldo"),
    );
    setBusy(false);
    if (r.error) return setError(r.error);
    onClose();
  };

  return (
    <Sheet title={t("Bagi ke Kantong")} onClose={onClose}>
      <p className="text-xs text-gray-400">{t("Saldo Utama tersedia: {0}", [rupiah(Math.max(money.utama, 0))])}</p>
      <Field label={t("Nominal yang dibagi")}>
        <CurrencyInput value={base} onChange={(v) => { setBase(v); apply(v); }} placeholder="0" className="input-field" />
      </Field>
      {!hasRules && <p className="text-[11px] text-gray-400">{t("Atur persen atau nominal di tiap kantong (ketuk kantong lalu ikon pensil) agar terisi otomatis. Atau isi angkanya langsung di bawah.")}</p>}
      <div className="space-y-2">
        {tabungan.map((s) => {
          const { icon: Icon, color } = pocketIcon(s.pocket.ikon);
          const v = amounts[s.pocket.id] ?? null;
          const pct = base && v ? Math.round((v / base) * 100) : 0;
          return (
            <div key={s.pocket.id} className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}><Icon size={16} /></span>
              <div className="min-w-0 w-24 shrink-0">
                <p className="text-sm text-gray-100 truncate">{tx(s.pocket.nama)}</p>
                <p className="text-[10px] text-gray-400">{pct}%</p>
              </div>
              <CurrencyInput
                value={v}
                onChange={(n) => { setAmounts((a) => ({ ...a, [s.pocket.id]: n })); setError(""); }}
                placeholder="0"
                className="input-field"
              />
            </div>
          );
        })}
      </div>
      {hasRules && <GhostButton onClick={() => apply(base)}>{t("Terapkan aturan")}</GhostButton>}
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{t("Total dibagi")}</span>
        <span className="text-gray-100 font-medium">{rupiah(total)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{t("Sisa di Saldo Utama")}</span>
        <span className={`font-medium ${sisa < 0 ? "text-red-400" : "text-gray-100"}`}>{rupiah(sisa)}</span>
      </div>
      <Err msg={error} />
      <PrimaryButton onClick={save} disabled={busy || total <= 0 || sisa < 0}>{busy ? t("Menyimpan...") : t("Bagikan")}</PrimaryButton>
    </Sheet>
  );
}
