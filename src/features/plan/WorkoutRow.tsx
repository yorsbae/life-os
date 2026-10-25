import { createElement } from "react";
import { useNavigate } from "react-router-dom";
import { Moon } from "lucide-react";
import { Card, CheckCircle } from "../../components/ui/Controls";
import { t, tx } from "../../lib/i18n";
import { num } from "../../utils/format";
import { exerciseIcon } from "../exercise/bodyUi";
import type { WorkoutItem } from "../exercise/useWorkoutAgenda";

/** Baris latihan pada halaman Plan: ketuk lingkaran untuk mencatat selesai, ketuk teks untuk membuka program. */
export default function WorkoutRow({ item, onDone }: { item: WorkoutItem; onDone: (i: WorkoutItem) => void }) {
  const navigate = useNavigate();

  if (item.rest)
    return (
      <Card className="!py-3 flex items-center gap-3 opacity-80">
        <Moon size={18} className="text-gray-400 shrink-0" />
        <p className="text-sm text-gray-300">{t("Hari istirahat")}</p>
      </Card>
    );

  const title =
    item.sub_kategori && item.sub_kategori !== item.tipe ? `${tx(item.tipe)} · ${tx(item.sub_kategori)}` : String(tx(item.tipe));
  const meta = [
    item.programTitle ? String(tx(item.programTitle)) : t("Jadwal mingguan"),
    item.target_durasi ? t("{0} menit", [item.target_durasi]) : null,
    item.target_jarak ? t("{0} km", [num(item.target_jarak, 1)]) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card className={`!py-3 flex items-start gap-3 ${item.done ? "!border-primary/40" : ""}`}>
      <div className="mt-0.5">
        <CheckCircle
          checked={item.done}
          onClick={item.done ? undefined : () => onDone(item)}
        />
      </div>
      <button
        className="flex-1 min-w-0 text-left"
        onClick={() => navigate(`/exercises?tab=latihan&sub=${item.source === "program" ? "program" : "jadwal"}`)}
      >
        <p className={`text-sm truncate ${item.done ? "text-gray-500 line-through" : "text-gray-100"}`}>{title}</p>
        <p className="text-[11px] text-gray-400 truncate">{meta}</p>
        {item.gerakan && !item.done && <p className="text-[11px] text-primary mt-1 break-words">{tx(item.gerakan)}</p>}
      </button>
      <span className="w-8 h-8 shrink-0 rounded-lg bg-primary/15 text-primary flex items-center justify-center" aria-hidden>
        {createElement(exerciseIcon(item.tipe), { size: 15 })}
      </span>
    </Card>
  );
}
