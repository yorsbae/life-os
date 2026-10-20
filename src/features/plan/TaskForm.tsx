import { useState } from "react";
import { Sheet, PrimaryButton, Chip } from "../../components/ui/Controls";
import { PRIORITY_LABEL, type TaskInput, type TaskPriority } from "./useTasks";
import { toDateStr } from "../../utils/dates";

export default function TaskForm({
  onSave,
  onClose,
}: {
  onSave: (t: TaskInput) => Promise<void>;
  onClose: () => void;
}) {
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [prioritas, setPrioritas] = useState<TaskPriority>("P2");
  const [tanggal, setTanggal] = useState(toDateStr());
  const [jamMulai, setJamMulai] = useState("");
  const [jamSelesai, setJamSelesai] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!judul.trim()) return;
    setSaving(true);
    await onSave({
      judul: judul.trim(),
      deskripsi: deskripsi.trim() || null,
      prioritas,
      tanggal_mulai: tanggal,
      tanggal_selesai: tanggal,
      jam_mulai: jamMulai || null,
      jam_selesai: jamSelesai || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <Sheet title="Kegiatan Baru" onClose={onClose}>
      <input className="input-field" placeholder="Judul kegiatan" value={judul} onChange={(e) => setJudul(e.target.value)} autoFocus />
      <textarea className="input-field min-h-20" placeholder="Deskripsi (opsional)" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} />
      <div className="flex gap-2 flex-wrap">
        {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((p) => (
          <Chip key={p} active={prioritas === p} onClick={() => setPrioritas(p)}>
            {PRIORITY_LABEL[p]}
          </Chip>
        ))}
      </div>
      <input type="date" className="input-field" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-xs text-gray-400">Mulai</span>
          <input type="time" className="input-field" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-xs text-gray-400">Selesai</span>
          <input type="time" className="input-field" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} />
        </label>
      </div>
      <PrimaryButton onClick={submit} disabled={saving || !judul.trim()}>
        Simpan
      </PrimaryButton>
    </Sheet>
  );
}
