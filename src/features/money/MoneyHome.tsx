import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hourglass, Plus } from "lucide-react";
import { addDays, format } from "date-fns";
import { Card, EmptyState, SectionTitle } from "../../components/ui/Controls";
import { ProgressBar } from "../../components/ui/Progress";
import { t, tx } from "../../lib/i18n";
import { rupiah } from "../../utils/format";
import { toDateStr } from "../../utils/dates";
import { ACCOUNT_ICON, expenseMeta } from "./categories";
import CatBadge from "./CatBadge";
import { daysUntilPayday } from "./pocketMath";
import { useMoney, type Money } from "./useMoney";
import { usePayday } from "./usePayday";
import { ManageAccountsSheet, PaydaySheet } from "./AccountSheets";
import { groupLabel } from "./accountLabels";
import { AllocateSheet, FillSheet, GiveSheet, PocketCard, PocketDetailSheet, PocketFormSheet, SpendSheet } from "./PocketSheets";
import { POCKET_PRESETS, type PocketPreset } from "./pocketPresets";

type SheetState =
  | null
  | { type: "fill" | "spend" | "give" | "detail" | "edit"; id: string }
  | { type: "new"; preset?: PocketPreset }
  | { type: "allocate" | "accounts" | "payday" };

const monthKey = (d: Date) => format(d, "yyyy-MM");

function Insights({ money }: { money: Money }) {
  const { expenses, incomes } = money;
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
    const key = monthKey(new Date());
    for (const e of expenses) if (e.tanggal.startsWith(key)) m[e.kategori] = (m[e.kategori] ?? 0) + e.nominal;
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [expenses]);
  const totalKat = perKategori.reduce((s, [, v]) => s + v, 0);

  return (
    <>
      <Card>
        <SectionTitle>{t("Bulan Ini")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
          <div className="min-w-0"><p className="text-gray-400">{t("Pemasukan")}</p><p className="text-sm font-semibold text-primary truncate">{rupiah(income)}</p></div>
          <div className="min-w-0"><p className="text-gray-400">{t("Pengeluaran")}</p><p className="text-sm font-semibold text-gray-100 truncate">{rupiah(expense)}</p></div>
        </div>
      </Card>

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
    </>
  );
}

/** Beranda Uang: Total Saldo, Saldo Utama, Kantong Saya, Sumber Dana — lalu ringkasan bulan ini. */
export default function MoneyHome() {
  const navigate = useNavigate();
  const money = useMoney();
  const payday = usePayday();
  const [sheet, setSheet] = useState<SheetState>(null);
  const close = () => setSheet(null);

  if (money.loading) return <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>;

  const statOf = (id: string) => money.stats.find((s) => s.pocket.id === id);
  const sel = sheet && "id" in sheet ? statOf(sheet.id) : undefined;
  const paydayText =
    payday.day === null
      ? t("Atur tanggal gajian")
      : (() => {
          const d = daysUntilPayday(payday.day);
          return d === 0 ? t("Hari ini gajian") : t("{0} hari lagi gajian", [d]);
        })();
  const chip = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-[11px] font-semibold";

  return (
    <div className="space-y-5">
      {/* Total Saldo */}
      <div
        className="rounded-3xl p-5 text-white shadow-lg shadow-black/20"
        style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 60%, #0a1628) 0%, color-mix(in srgb, var(--color-primary) 32%, #0a1628) 100%)" }}
      >
        <p className="text-[11px] tracking-[0.18em] font-semibold text-white/70 uppercase">{t("Total Saldo")}</p>
        <p className="text-3xl font-extrabold mt-1 break-words">{rupiah(money.total)}</p>
        <p className="text-xs text-white/75 mt-1">{t("Saldo Utama + Kantong + Investasi")}</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className={chip}><span className="w-1.5 h-1.5 rounded-full bg-white" />{t("{0} kantong aktif", [money.pockets.length])}</span>
          <button onClick={() => setSheet({ type: "payday" })} className={chip}><Hourglass size={12} />{paydayText}</button>
        </div>
      </div>

      {/* Saldo Utama */}
      <Card className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">{t("Saldo Utama (belum dialokasikan)")}</p>
          <p className={`text-xl font-bold break-words ${money.utama < 0 ? "text-red-400" : "text-gray-50"}`}>{rupiah(money.utama)}</p>
          {money.utama < 0 && <p className="text-[11px] text-red-400 mt-0.5">{t("Alokasi kantong melebihi saldo")}</p>}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button onClick={() => navigate("/money/add?kind=in")} className="min-h-10 px-4 rounded-full bg-primary text-on-primary text-xs font-semibold">
            + {t("Pemasukan")}
          </button>
          {money.stats.some((s) => s.pocket.tipe !== "pemberian") && (
            <button onClick={() => setSheet({ type: "allocate" })} className="min-h-10 px-4 rounded-full border border-primary/50 text-primary text-xs font-semibold">
              {t("Bagi ke Kantong")}
            </button>
          )}
        </div>
      </Card>

      {/* Kantong Saya */}
      <div className="space-y-2">
        <SectionTitle action={<span className="text-[11px] text-gray-400">{t("tap kartu untuk detail")}</span>}>{t("Kantong Saya")}</SectionTitle>
        {money.stats.length === 0 && (
          <Card className="space-y-3">
            <p className="text-sm text-gray-100 font-medium">{t("Pisahkan uangmu ke kantong")}</p>
            <p className="text-xs text-gray-400">{t("Bagi saldo untuk tujuan tertentu, mis. dana darurat, transport, atau pemberian untuk orang tua. Atur persen atau nominalnya sendiri.")}</p>
            <div className="flex flex-wrap gap-2">
              {POCKET_PRESETS.map((p) => (
                <button key={p.nama} onClick={() => setSheet({ type: "new", preset: p })} className="px-3 py-1.5 rounded-full text-xs font-medium border border-primary/40 text-primary">
                  + {tx(p.nama)}
                </button>
              ))}
            </div>
          </Card>
        )}
        <div className="grid grid-cols-2 gap-3">
          {money.stats.map((s) => (
            <PocketCard
              key={s.pocket.id}
              stat={s}
              onOpen={() => setSheet({ type: "detail", id: s.pocket.id })}
              onFill={() => setSheet({ type: "fill", id: s.pocket.id })}
              onSpend={() => setSheet({ type: "spend", id: s.pocket.id })}
              onGive={() => setSheet({ type: "give", id: s.pocket.id })}
            />
          ))}
          <button
            onClick={() => setSheet({ type: "new" })}
            className="rounded-2xl border border-dashed border-primary/40 text-primary min-h-[8.5rem] flex flex-col items-center justify-center gap-1.5 text-xs font-medium"
          >
            <Plus size={20} />
            {t("Kantong Baru")}
          </button>
        </div>
      </div>

      {/* Sumber Dana */}
      <div className="space-y-2">
        <SectionTitle action={<button onClick={() => setSheet({ type: "accounts" })} className="text-xs text-primary">{t("Kelola")}</button>}>
          {t("Sumber Dana")}
        </SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {money.groups.map((g) => {
            const Icon = ACCOUNT_ICON[g.tipe] ?? ACCOUNT_ICON.Tunai;
            return (
              <button key={g.tipe} onClick={() => setSheet({ type: "accounts" })} className="card p-3.5 text-left space-y-2 min-w-0">
                <span className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><Icon size={17} /></span>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 truncate">
                    {groupLabel(g.tipe)}
                    {g.items.length > 1 ? ` · ${t("{0} akun", [g.items.length])}` : g.items.length === 1 && g.items[0].nama !== groupLabel(g.tipe) ? ` · ${g.items[0].nama}` : ""}
                  </p>
                  <p className={`text-base font-bold break-words ${g.total < 0 ? "text-red-400" : "text-gray-50"}`}>{rupiah(g.total)}</p>
                </div>
              </button>
            );
          })}
          <button
            onClick={() => setSheet({ type: "accounts" })}
            className="rounded-2xl border border-dashed border-primary/40 text-primary min-h-[6.5rem] flex flex-col items-center justify-center gap-1.5 text-xs font-medium"
          >
            <Plus size={20} />
            {t("Tambah Sumber Dana")}
          </button>
        </div>
        <p className="text-[11px] text-gray-500 px-1">{t("Ketuk Kelola untuk rincian per rekening bank, e-wallet, dan investasi.")}</p>
        {money.unassigned !== 0 && (
          <p className="text-[11px] text-gray-500 px-1">
            {t("Termasuk {0} dari transaksi lama tanpa sumber dana.", [rupiah(money.unassigned)])}
          </p>
        )}
      </div>

      <Insights money={money} />

      {sheet?.type === "fill" && sel && <FillSheet money={money} stat={sel} onClose={close} />}
      {sheet?.type === "spend" && sel && <SpendSheet money={money} stat={sel} onClose={close} />}
      {sheet?.type === "give" && sel && <GiveSheet money={money} stat={sel} onClose={close} />}
      {sheet?.type === "detail" && sel && (
        <PocketDetailSheet
          money={money}
          stat={sel}
          onClose={close}
          onFill={() => setSheet({ type: "fill", id: sel.pocket.id })}
          onSpend={() => setSheet({ type: "spend", id: sel.pocket.id })}
          onGive={() => setSheet({ type: "give", id: sel.pocket.id })}
          onEdit={() => setSheet({ type: "edit", id: sel.pocket.id })}
        />
      )}
      {sheet?.type === "edit" && sel && <PocketFormSheet money={money} stat={sel} onClose={close} />}
      {sheet?.type === "new" && <PocketFormSheet money={money} preset={sheet.preset} onClose={close} />}
      {sheet?.type === "allocate" && <AllocateSheet money={money} onClose={close} />}
      {sheet?.type === "accounts" && <ManageAccountsSheet money={money} onClose={close} />}
      {sheet?.type === "payday" && <PaydaySheet day={payday.day} onSave={payday.save} onClose={close} />}
    </div>
  );
}
