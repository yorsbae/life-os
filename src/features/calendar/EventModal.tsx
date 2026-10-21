import { useState, type FormEvent } from "react";
import { Sheet, PrimaryButton, Chip } from "../../components/ui/Controls";
import { EVENT_TIPE_LABEL, type CalendarEvent, type CalendarEventInput, type EventTipe } from "../../types";
import { t, tx } from "../../lib/i18n";

interface EventModalProps {
  onClose: () => void;
  onSubmit: (input: CalendarEventInput) => Promise<{ error: string | null }>;
  onDelete?: () => void;
  editingEvent?: CalendarEvent | null;
  /** Tanggal awal (YYYY-MM-DD) saat menambah jadwal baru */
  defaultDate: string;
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/** Form tambah/edit jadwal dalam bottom sheet. Dipasang hanya saat dibuka (mount = buka). */
export default function EventModal({ onClose, onSubmit, onDelete, editingEvent, defaultDate }: EventModalProps) {
  const [judul, setJudul] = useState(editingEvent?.judul ?? "");
  const [tipe, setTipe] = useState<EventTipe>(editingEvent?.tipe ?? "pribadi");
  const [mulai, setMulai] = useState(
    editingEvent ? toLocalInputValue(new Date(editingEvent.tanggal_mulai)) : `${defaultDate}T09:00`,
  );
  const [selesai, setSelesai] = useState(
    editingEvent?.tanggal_selesai ? toLocalInputValue(new Date(editingEvent.tanggal_selesai)) : "",
  );
  const [catatan, setCatatan] = useState(editingEvent?.catatan ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (selesai && selesai < mulai) {
      setError(t("Waktu selesai harus setelah waktu mulai"));
      return;
    }
    setSaving(true);
    const result = await onSubmit({
      judul: judul.trim(),
      tipe,
      tanggal_mulai: new Date(mulai).toISOString(),
      tanggal_selesai: selesai ? new Date(selesai).toISOString() : null,
      catatan: catatan.trim() || null,
    });
    setSaving(false);
    if (result.error) return setError(result.error);
    onClose();
  };

  return (
    <Sheet title={editingEvent ? t("Edit Jadwal") : t("Tambah Jadwal")} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">{error}</div>}
        <input
          className="input-field"
          required
          value={judul}
          onChange={(e) => setJudul(e.target.value)}
          placeholder={t("Judul jadwal")}
          autoFocus={!editingEvent}
        />
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(EVENT_TIPE_LABEL) as EventTipe[]).map((k) => (
            <Chip key={k} active={tipe === k} onClick={() => setTipe(k)}>
              {tx(EVENT_TIPE_LABEL[k])}
            </Chip>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3">
          <label className="space-y-1 block min-w-0">
            <span className="text-xs text-gray-400">{t("Mulai")}</span>
            <input type="datetime-local" required className="input-field" value={mulai} onChange={(e) => setMulai(e.target.value)} />
          </label>
          <label className="space-y-1 block min-w-0">
            <span className="text-xs text-gray-400">{t("Selesai (opsional)")}</span>
            <input type="datetime-local" className="input-field" value={selesai} onChange={(e) => setSelesai(e.target.value)} />
          </label>
        </div>
        <textarea className="input-field min-h-16" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder={t("Catatan (opsional)")} />
        <PrimaryButton type="submit" disabled={saving || !judul.trim()}>
          {saving ? t("Menyimpan...") : editingEvent ? t("Perbarui") : t("Simpan")}
        </PrimaryButton>
        {editingEvent && onDelete && (
          <button type="button" onClick={onDelete} className="w-full py-3 rounded-xl border border-red-500/40 text-red-400 text-sm font-medium">
            {t("Hapus")}
          </button>
        )}
      </form>
    </Sheet>
  );
}
