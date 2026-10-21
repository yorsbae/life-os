import { useState } from "react";
import { Sheet, PrimaryButton, Chip } from "../../components/ui/Controls";
import { PRIORITIES, priorityLabel, type Task, type TaskInput, type TaskPriority } from "./useTasks";
import { toDateStr } from "../../utils/dates";
import { t } from "../../lib/i18n";

/** Form tambah/edit kegiatan dalam bottom sheet. */
export default function TaskForm({
  initial,
  defaultDate,
  onSave,
  onClose,
}: {
  initial?: Task;
  defaultDate?: string;
  onSave: (task: TaskInput) => Promise<void>;
  onClose: () => void;
}) {
  const [judul, setJudul] = useState(initial?.judul ?? "");
  const [deskripsi, setDeskripsi] = useState(initial?.deskripsi ?? "");
  const [kategori, setKategori] = useState(initial?.kategori ?? "");
  const [prioritas, setPrioritas] = useState<TaskPriority>(initial?.prioritas ?? "P2");
  const [mulai, setMulai] = useState(initial?.tanggal_mulai ?? defaultDate ?? toDateStr());
  const [selesai, setSelesai] = useState(initial?.tanggal_selesai ?? initial?.tanggal_mulai ?? defaultDate ?? toDateStr());
  const [jamMulai, setJamMulai] = useState(initial?.jam_mulai ?? "");
  const [jamSelesai, setJamSelesai] = useState(initial?.jam_selesai ?? "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!judul.trim()) return;
    setSaving(true);
    await onSave({
      judul: judul.trim(),
      deskripsi: deskripsi.trim() || null,
      kategori: kategori.trim() || null,
      prioritas,
      tanggal_mulai: mulai,
      tanggal_selesai: selesai < mulai ? mulai : selesai,
      jam_mulai: jamMulai || null,
      jam_selesai: jamSelesai || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Sheet title={initial ? t("Edit Kegiatan") : t("Kegiatan Baru")} onClose={onClose}>
      <input className="input-field" placeholder={t("Judul kegiatan")} value={judul} onChange={(e) => setJudul(e.target.value)} autoFocus={!initial} />
      <textarea className="input-field min-h-20" placeholder={t("Deskripsi (opsional)")} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
      <input className="input-field" placeholder={t("Kategori (mis. Kerja)")} value={kategori} onChange={(e) => setKategori(e.target.value)} />
      <div className="flex gap-2 flex-wrap">
        {PRIORITIES.map((p) => (
          <Chip key={p} active={prioritas === p} onClick={() => setPrioritas(p)}>
            {priorityLabel(p)}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1 min-w-0">
          <span className="text-xs text-gray-400">{t("Tanggal mulai")}</span>
          <input type="date" className="input-field" value={mulai} onChange={(e) => setMulai(e.target.value)} />
        </label>
        <label className="space-y-1 min-w-0">
          <span className="text-xs text-gray-400">{t("Tanggal selesai")}</span>
          <input type="date" className="input-field" value={selesai} min={mulai} onChange={(e) => setSelesai(e.target.value)} />
        </label>
        <label className="space-y-1 min-w-0">
          <span className="text-xs text-gray-400">{t("Jam mulai")}</span>
          <input type="time" className="input-field" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} />
        </label>
        <label className="space-y-1 min-w-0">
          <span className="text-xs text-gray-400">{t("Jam selesai")}</span>
          <input type="time" className="input-field" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} />
        </label>
      </div>
      <PrimaryButton onClick={submit} disabled={saving || !judul.trim()}>
        {t("Simpan")}
      </PrimaryButton>
    </Sheet>
  );
}
