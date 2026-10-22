import { useState } from "react";
import { Flame, Trash2, Droplets, BookOpen, Moon, Dumbbell, Check, Plus, Minus, type LucideIcon } from "lucide-react";
import { addDays, startOfWeek } from "date-fns";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { Card, EmptyState, Fab, Sheet, PrimaryButton, CheckCircle } from "../../components/ui/Controls";
import { ProgressBar } from "../../components/ui/Progress";
import { toDateStr } from "../../utils/dates";
import { fmtDate, num } from "../../utils/format";
import { t, tx } from "../../lib/i18n";
import { useHabits, type Habit } from "./useHabits";

type View = "hari" | "mingguan" | "bulan";

const ICONS: Record<string, LucideIcon> = { water: Droplets, book: BookOpen, sleep: Moon, sport: Dumbbell, check: Check };
const ICON_KEYS = Object.keys(ICONS);
// Warna progres per kebiasaan (urutan tetap berdasarkan indeks)
const TONES = ["#5aa9e6", "#7dc7a0", "#9b8cf0", "#f2a65a", "#e57373", "#e6c85a"];

function HabitForm({
  onSave,
  onClose,
}: {
  onSave: (h: { nama: string; ikon: string; target_harian: number; satuan: string }) => void;
  onClose: () => void;
}) {
  const [nama, setNama] = useState("");
  const [ikon, setIkon] = useState("check");
  const [target, setTarget] = useState("1");
  const [satuan, setSatuan] = useState(t("kali"));
  return (
    <Sheet title={t("Kebiasaan Baru")} onClose={onClose}>
      <input className="input-field" placeholder={t("Nama (mis. Minum Air Putih)")} value={nama} onChange={(e) => setNama(e.target.value)} autoFocus />
      <div className="flex gap-2 flex-wrap">
        {ICON_KEYS.map((k) => {
          const Icon = ICONS[k];
          return (
            <button
              key={k}
              type="button"
              aria-pressed={ikon === k}
              onClick={() => setIkon(k)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center border ${ikon === k ? "border-primary bg-primary/15 text-primary" : "border-surface-light text-gray-400"}`}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 min-w-0">
          <span className="text-xs text-gray-400">{t("Target harian")}</span>
          <input className="input-field" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
        </label>
        <label className="space-y-1 min-w-0">
          <span className="text-xs text-gray-400">{t("Satuan (gelas, jam, menit)")}</span>
          <input className="input-field" value={satuan} onChange={(e) => setSatuan(e.target.value)} />
        </label>
      </div>
      <PrimaryButton
        disabled={!nama.trim() || !(Number(target) > 0)}
        onClick={() => {
          onSave({ nama: nama.trim(), ikon, target_harian: Number(target), satuan: satuan.trim() || t("kali") });
          onClose();
        }}
      >
        {t("Simpan")}
      </PrimaryButton>
    </Sheet>
  );
}

function ValueSheet({ habit, value, onSave, onDelete, onClose }: { habit: Habit; value: number; onSave: (v: number) => void; onDelete: () => void; onClose: () => void }) {
  const [v, setV] = useState(String(value));
  const step = habit.target_harian >= 20 ? 5 : 1;
  const n = Number(v) || 0;
  return (
    <Sheet title={habit.nama} onClose={onClose}>
      <p className="text-xs text-gray-400 -mt-2">{t("Target {0} {1} per hari", [num(habit.target_harian), tx(habit.satuan)])}</p>
      {habit.target_harian > 1 && (
        <>
          <div className="flex items-center gap-3">
            <button className="w-11 h-11 rounded-xl bg-surface-light text-gray-100 flex items-center justify-center shrink-0" aria-label="−" onClick={() => setV(String(Math.max(0, n - step)))}>
              <Minus size={18} />
            </button>
            <input className="input-field text-center text-lg font-semibold min-w-0" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} />
            <button className="w-11 h-11 rounded-xl bg-surface-light text-gray-100 flex items-center justify-center shrink-0" aria-label="+" onClick={() => setV(String(n + step))}>
              <Plus size={18} />
            </button>
          </div>
          <PrimaryButton
            onClick={() => {
              onSave(n);
              onClose();
            }}
          >
            {t("Simpan")}
          </PrimaryButton>
        </>
      )}
      <button
        className="w-full py-3 rounded-xl border border-red-500/40 text-red-400 text-sm font-medium flex items-center justify-center gap-2"
        onClick={() => {
          if (confirm(t('Hapus "{0}" beserta riwayatnya?', [habit.nama]))) {
            onDelete();
            onClose();
          }
        }}
      >
        <Trash2 size={15} /> {t("Hapus kebiasaan")}
      </button>
    </Sheet>
  );
}

export default function HabitPage() {
  const { habits, valueOn, isDone, setValue, toggle, addHabit, deleteHabit, streakOf } = useHabits();
  const [view, setView] = useState<View>("hari");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const today = toDateStr();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i));
  const monthDays = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i - 29));
  const doneCount = habits.filter((h) => isDone(h)).length;

  const todayCard = (h: Habit, i: number) => {
    const Icon = ICONS[h.ikon] ?? Check;
    const v = valueOn(h.id, today);
    const streak = streakOf(h);
    const countable = h.target_harian > 1;
    const tone = TONES[i % TONES.length];
    const done = v >= h.target_harian;
    return (
      <Card key={h.id} className="space-y-2.5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: tone + "26", color: tone }}>
            <Icon size={18} />
          </span>
          <button className="flex-1 min-w-0 text-left" onClick={() => setEditing(h)}>
            <p className="text-sm font-medium text-gray-100 truncate">{tx(h.nama)}</p>
            <p className="text-[11px] text-gray-400 truncate">
              {num(v)}/{num(h.target_harian)} {tx(h.satuan)}
            </p>
          </button>
          {streak > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-orange-300 shrink-0">
              <Flame size={13} />
              {streak}
            </span>
          )}
          {countable ? (
            <button
              onClick={() => (done ? setValue(h, 0) : setValue(h, h.target_harian))}
              aria-label={t("Tandai selesai")}
              aria-pressed={done}
              className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${done ? "bg-primary border-primary text-on-primary" : "border-gray-600 text-transparent"}`}
            >
              <Check size={14} strokeWidth={3} />
            </button>
          ) : (
            <CheckCircle checked={isDone(h)} onClick={() => toggle(h)} />
          )}
        </div>
        {countable && (
          <div className="h-1.5 rounded-full bg-surface-light overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (v / h.target_harian) * 100)}%`, background: tone }} />
          </div>
        )}
      </Card>
    );
  };

  const gridCard = (h: Habit, i: number, days: Date[], labels: boolean) => {
    const tone = TONES[i % TONES.length];
    const doneDays = days.filter((d) => isDone(h, toDateStr(d))).length;
    return (
      <Card key={h.id} className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-100 truncate min-w-0">{tx(h.nama)}</p>
          <span className="text-[11px] text-gray-400 shrink-0">{t("{0}/{1} hari", [doneDays, days.length])}</span>
        </div>
        <ProgressBar value={doneDays} max={days.length} />
        <div className={labels ? "grid grid-cols-7 gap-1.5" : "grid gap-1"} style={labels ? undefined : { gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
          {days.map((d) => {
            const key = toDateStr(d);
            const ok = isDone(h, key);
            const part = !ok && valueOn(h.id, key) > 0;
            const bg = ok ? tone : part ? tone + "55" : "var(--color-surface-light)";
            return labels ? (
              <div key={key} className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-gray-500">{fmtDate(d, "EEEEE")}</span>
                <button
                  onClick={() => toggle(h, key)}
                  aria-label={fmtDate(d, "d MMM")}
                  className={`w-full aspect-square max-w-9 rounded-lg flex items-center justify-center text-[10px] ${ok ? "text-on-primary" : "text-gray-400"}`}
                  style={{ background: bg }}
                >
                  {d.getDate()}
                </button>
              </div>
            ) : (
              <button key={key} title={fmtDate(d, "d MMM")} aria-label={fmtDate(d, "d MMM")} onClick={() => toggle(h, key)} className="aspect-square w-full rounded" style={{ background: bg }} />
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div className="pb-28">
      <PageHeader title={t("Kebiasaan")} />
      <div className="px-4 space-y-4">
        <Segmented
          options={[
            { key: "hari", label: t("Hari Ini") },
            { key: "mingguan", label: t("Mingguan") },
            { key: "bulan", label: t("Bulan") },
          ]}
          value={view}
          onChange={setView}
        />
        {habits.length > 0 && view === "hari" && (
          <p className="text-xs text-gray-400 px-1">{t("{0} dari {1} kebiasaan selesai hari ini", [doneCount, habits.length])}</p>
        )}
        {habits.length === 0 ? (
          <EmptyState title={t("Belum ada kebiasaan")} hint={t("Mulai dari langkah kecil. Tekan + untuk menambah.")} />
        ) : (
          <div className="space-y-3">
            {view === "hari" && habits.map(todayCard)}
            {view === "mingguan" && habits.map((h, i) => gridCard(h, i, weekDays, true))}
            {view === "bulan" && habits.map((h, i) => gridCard(h, i, monthDays, false))}
          </div>
        )}
      </div>
      <Fab onClick={() => setShowForm(true)} label={t("Tambah kebiasaan")} />
      {showForm && <HabitForm onClose={() => setShowForm(false)} onSave={(h) => addHabit(h)} />}
      {editing && <ValueSheet habit={editing} value={valueOn(editing.id, today)} onSave={(v) => setValue(editing, v)} onDelete={() => deleteHabit(editing.id)} onClose={() => setEditing(null)} />}
    </div>
  );
}
