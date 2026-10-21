import { useState } from "react";
import { Pencil, Trash2, Dumbbell } from "lucide-react";
import { Card, Chip, EmptyState, Fab } from "../../components/ui/Controls";
import { t, tx } from "../../lib/i18n";
import { fmtDate, num } from "../../utils/format";
import type { Exercise } from "../../types";
import { useExercises } from "./useExercises";
import { exerciseIcon } from "./bodyUi";
import ExerciseForm from "./ExerciseForm";
import ExerciseScheduleTab from "./ExerciseScheduleTab";
import CoachingTab from "./CoachingTab";

type Sub = "riwayat" | "jadwal" | "program";

export default function WorkoutTab() {
  const { exercises, loading, addExercise, updateExercise, deleteExercise } = useExercises();
  const [sub, setSub] = useState<Sub>("riwayat");
  const [form, setForm] = useState<{ editing: Exercise | null } | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        <Chip active={sub === "riwayat"} onClick={() => setSub("riwayat")}>{t("Riwayat")}</Chip>
        <Chip active={sub === "jadwal"} onClick={() => setSub("jadwal")}>{t("Jadwal Mingguan")}</Chip>
        <Chip active={sub === "program"} onClick={() => setSub("program")}>{t("Program Latihan")}</Chip>
      </div>

      {sub === "jadwal" && <ExerciseScheduleTab />}
      {sub === "program" && <CoachingTab />}

      {sub === "riwayat" && (
        <>
          {loading ? (
            <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>
          ) : exercises.length === 0 ? (
            <EmptyState icon={Dumbbell} title={t("Belum ada latihan tercatat")} hint={t("Tekan + untuk mencatat latihan pertama.")} />
          ) : (
            <div className="space-y-2">
              {exercises.map((e) => {
                const Icon = exerciseIcon(e.tipe);
                const meta = [
                  fmtDate(e.tanggal, "d MMM yyyy"),
                  e.durasi ? t("{0} menit", [e.durasi]) : null,
                  e.jarak ? t("{0} km", [num(e.jarak, 1)]) : null,
                ].filter(Boolean).join(" · ");
                return (
                  <Card key={e.id} className="!py-3 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-100 truncate">
                        {tx(e.tipe)}{e.sub_kategori && e.sub_kategori !== e.tipe ? ` · ${tx(e.sub_kategori)}` : ""}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">{meta}</p>
                      {e.catatan && <p className="text-[11px] text-gray-500 truncate">{e.catatan}</p>}
                    </div>
                    <button aria-label={t("Edit")} className="text-gray-400 p-1" onClick={() => setForm({ editing: e })}>
                      <Pencil size={15} />
                    </button>
                    <button aria-label={t("Hapus")} className="text-gray-500 p-1" onClick={() => confirm(t("Yakin hapus data ini?")) && deleteExercise(e.id)}>
                      <Trash2 size={15} />
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
          <Fab onClick={() => setForm({ editing: null })} label={t("Tambah Latihan")} />
        </>
      )}

      {form && (
        <ExerciseForm
          editing={form.editing}
          onClose={() => setForm(null)}
          onSave={(input) => (form.editing ? updateExercise(form.editing.id, input) : addExercise(input))}
        />
      )}
    </div>
  );
}
