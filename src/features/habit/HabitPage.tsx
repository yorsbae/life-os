import { useState } from "react";
import { Flame, Trash2, Droplets, BookOpen, Moon, Dumbbell, Check, type LucideIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { Card, EmptyState, Fab, Sheet, PrimaryButton, CheckCircle } from "../../components/ui/Controls";
import { ProgressBar } from "../../components/ui/Progress";
import { useHabits, type Habit } from "./useHabits";
import { toDateStr } from "../../utils/dates";

type View = "hari" | "mingguan" | "bulan";

const ICONS: Record<string, LucideIcon> = { water: Droplets, book: BookOpen, sleep: Moon, sport: Dumbbell, check: Check };
const ICON_KEYS = Object.keys(ICONS);

function HabitForm({ onSave, onClose }: { onSave: (h: { nama: string; ikon: string; target_harian: number; satuan: string }) => void; onClose: () => void }) {
  const [nama, setNama] = useState("");
  const [ikon, setIkon] = useState("check");
  const [target, setTarget] = useState("1");
  const [satuan, setSatuan] = useState("kali");
  return (
    <Sheet title="Kebiasaan Baru" onClose={onClose}>
      <input className="input-field" placeholder="Nama (mis. Minum Air Putih)" value={nama} onChange={(e) => setNama(e.target.value)} autoFocus />
      <div className="flex gap-2">
        {ICON_KEYS.map((k) => {
          const Icon = ICONS[k];
          return (
            <button key={k} type="button" onClick={() => setIkon(k)} className={`w-11 h-11 rounded-xl flex items-center justify-center border ${ikon === k ? "border-primary bg-primary/15 text-primary" : "border-surface-light text-gray-400"}`}>
              <Icon size={18} />
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className="input-field" inputMode="decimal" placeholder="Target harian" value={target} onChange={(e) => setTarget(e.target.value)} />
        <input className="input-field" placeholder="Satuan (gelas, jam, menit)" value={satuan} onChange={(e) => setSatuan(e.target.value)} />
      </div>
      <PrimaryButton
        disabled={!nama.trim() || !(Number(target) > 0)}
        onClick={() => {
          onSave({ nama: nama.trim(), ikon, target_harian: Number(target), satuan: satuan.trim() || "kali" });
          onClose();
        }}
      >
        Simpan
      </PrimaryButton>
    </Sheet>
  );
}

export default function HabitPage() {
  const { habits, valueOn, isDone, setValue, toggle, addHabit, deleteHabit, streakOf } = useHabits();
  const [view, setView] = useState<View>("hari");
  const [showForm, setShowForm] = useState(false);

  const days = Array.from({ length: view === "bulan" ? 30 : 7 }, (_, i) => subDays(new Date(), (view === "bulan" ? 29 : 6) - i));

  const card = (h: Habit) => {
    const Icon = ICONS[h.ikon] ?? Check;
    const v = valueOn(h.id, toDateStr());
    const streak = streakOf(h);
    const countable = h.target_harian > 1;
    return (
      <Card key={h.id} className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><Icon size={18} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-100 truncate">{h.nama}</p>
            <p className="text-[11px] text-gray-400">{v}/{h.target_harian} {h.satuan}</p>
          </div>
          {streak > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-orange-400"><Flame size={13} />{streak}</span>
          )}
          {countable ? (
            <button onClick={() => setValue(h, v + 1)} className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium">+1</button>
          ) : (
            <CheckCircle checked={isDone(h)} onClick={() => toggle(h)} />
          )}
          <button aria-label="Hapus kebiasaan" className="text-gray-600" onClick={() => confirm(`Hapus "${h.nama}" beserta riwayatnya?`) && deleteHabit(h.id)}>
            <Trash2 size={14} />
          </button>
        </div>
        {countable && <ProgressBar value={v} max={h.target_harian} />}
        {view !== "hari" && (
          <div className="flex gap-1 flex-wrap pt-1">
            {days.map((d) => (
              <span key={d.toISOString()} title={format(d, "d MMM")} className={`w-3.5 h-3.5 rounded-sm ${isDone(h, toDateStr(d)) ? "bg-primary" : "bg-surface-light"}`} />
            ))}
          </div>
        )}
      </Card>
    );
  };

  const doneCount = habits.filter((h) => isDone(h)).length;

  return (
    <div>
      <PageHeader title="Habit" />
      <div className="px-4 space-y-4">
        <Segmented options={[{ key: "hari", label: "Hari Ini" }, { key: "mingguan", label: "Mingguan" }, { key: "bulan", label: "Bulan" }]} value={view} onChange={setView} />
        {habits.length > 0 && <p className="text-xs text-gray-400 px-1">{doneCount} dari {habits.length} kebiasaan selesai hari ini</p>}
        {habits.length === 0 ? <EmptyState title="Belum ada kebiasaan" hint="Mulai dari langkah kecil. Tekan + untuk menambah." /> : <div className="space-y-3">{habits.map(card)}</div>}
      </div>
      <Fab onClick={() => setShowForm(true)} label="Tambah kebiasaan" />
      {showForm && <HabitForm onClose={() => setShowForm(false)} onSave={(h) => addHabit(h)} />}
    </div>
  );
}
