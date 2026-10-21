import { useState } from "react";
import { NotebookPen } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Field from "../../components/ui/Field";
import { Card, EmptyState, GhostButton, PrimaryButton, Sheet } from "../../components/ui/Controls";
import { useLearnings } from "./useLearnings";
import type { Learning, LearningInput } from "../../types";
import { t } from "../../lib/i18n";
import { fmtDate } from "../../utils/format";
import { toDateStr } from "../../utils/dates";

const blank = (): LearningInput => ({ topik: "", materi: "", catatan: "", durasi: null, tanggal: toDateStr() });

function LogSheet({ editing, onClose }: { editing: Learning | null; onClose: () => void }) {
  const { addLearning, updateLearning, deleteLearning } = useLearnings();
  const [form, setForm] = useState<LearningInput>(
    editing ? { topik: editing.topik, materi: editing.materi, catatan: editing.catatan, durasi: editing.durasi, tanggal: editing.tanggal } : blank(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!form.topik.trim()) return setError(t("Topik wajib diisi"));
    setSaving(true);
    setError("");
    const res = editing ? await updateLearning(editing.id, form) : await addLearning(form);
    setSaving(false);
    if (res.error) return setError(res.error);
    onClose();
  };

  return (
    <Sheet title={editing ? t("Edit Catatan Belajar") : t("Tambah Catatan Belajar")} onClose={onClose}>
      <Field label={t("Topik")}>
        <input className="input-field" value={form.topik} onChange={(e) => setForm({ ...form, topik: e.target.value })} placeholder={t("Misal: React Hooks")} autoFocus />
      </Field>
      <Field label={t("Materi")}>
        <textarea className="input-field min-h-20" value={form.materi ?? ""} onChange={(e) => setForm({ ...form, materi: e.target.value })} placeholder={t("Ringkasan apa yang dipelajari...")} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("Tanggal")}>
          <input type="date" className="input-field" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} />
        </Field>
        <Field label={t("Durasi (menit)")}>
          <input className="input-field" inputMode="numeric" value={form.durasi ?? ""} onChange={(e) => setForm({ ...form, durasi: e.target.value ? Number(e.target.value) || null : null })} placeholder="45" />
        </Field>
      </div>
      <Field label={t("Catatan")}>
        <textarea className="input-field min-h-16" value={form.catatan ?? ""} onChange={(e) => setForm({ ...form, catatan: e.target.value })} placeholder={t("Opsional...")} />
      </Field>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <PrimaryButton onClick={submit} disabled={saving}>
        {saving ? t("Menyimpan...") : t("Simpan")}
      </PrimaryButton>
      {editing && (
        <GhostButton
          className="!border-red-500/40 !text-red-400"
          onClick={async () => {
            if (!confirm(t("Yakin hapus data ini?"))) return;
            await deleteLearning(editing.id);
            onClose();
          }}
        >
          {t("Hapus")}
        </GhostButton>
      )}
    </Sheet>
  );
}

/** Log catatan belajar (tabel learnings). Tab "Catatan" pada halaman Learning. */
export default function LearningPage({ embedded = false }: { embedded?: boolean }) {
  const { learnings, loading } = useLearnings();
  const [sheet, setSheet] = useState<{ editing: Learning | null } | null>(null);

  const body = (
    <div className="space-y-3">
      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat data...")}</p>
      ) : learnings.length === 0 ? (
        <EmptyState icon={NotebookPen} title={t("Belum ada catatan belajar.")} />
      ) : (
        learnings.map((l) => (
          <Card key={l.id} onClick={() => setSheet({ editing: l })} className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-gray-50 truncate">{l.topik}</span>
              <span className="text-[11px] text-gray-400 shrink-0">{fmtDate(l.tanggal, "d MMM")}</span>
            </div>
            {l.materi && <p className="text-xs text-gray-300 line-clamp-2">{l.materi}</p>}
            {l.durasi ? <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-surface-light text-gray-300">{t("{0} menit", [l.durasi])}</span> : null}
          </Card>
        ))
      )}
      <PrimaryButton onClick={() => setSheet({ editing: null })}>{t("Tambah Catatan")}</PrimaryButton>
      {sheet && <LogSheet editing={sheet.editing} onClose={() => setSheet(null)} />}
    </div>
  );

  if (embedded) return body;
  return (
    <div>
      <PageHeader title={t("Catatan Belajar")} />
      <div className="px-4">{body}</div>
    </div>
  );
}
