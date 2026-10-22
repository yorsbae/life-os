import { useMemo, useState } from "react";
import { Smile, Meh, Zap, BatteryLow, Frown, CloudRain, Flame, Trash2, X, type LucideIcon } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Field from "../../components/ui/Field";
import { Card, Chip, EmptyState, PrimaryButton, GhostButton, SectionTitle } from "../../components/ui/Controls";
import { useJournals } from "./useJournals";
import { MOOD_OPTIONS, type Journal, type JournalInput } from "../../types";
import { t, tx } from "../../lib/i18n";
import { fmtDate } from "../../utils/format";
import { toDateStr } from "../../utils/dates";

const MOOD_ICON: Record<string, LucideIcon> = {
  Senang: Smile,
  Biasa: Meh,
  Semangat: Zap,
  Lelah: BatteryLow,
  Sedih: Frown,
  Cemas: CloudRain,
};
const PRESET_TAGS = ["Syukur", "Lelah", "Produktif"];

const emptyForm = (): JournalInput => ({ judul: "", konten: "", mood: null, tags: [], tanggal: toDateStr() });

function calculateStreak(journals: Journal[]): number {
  const dates = Array.from(new Set(journals.map((j) => j.tanggal))).sort().reverse();
  if (dates.length === 0) return 0;
  const today = toDateStr();
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const diff = Math.round((new Date(dates[i]).getTime() - new Date(dates[i + 1]).getTime()) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export default function JournalPage() {
  const { journals, addJournal, updateJournal, deleteJournal } = useJournals();
  const [editing, setEditing] = useState<Journal | null>(null);
  const [form, setForm] = useState<JournalInput>(emptyForm);
  const [customTag, setCustomTag] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const streak = useMemo(() => calculateStreak(journals), [journals]);
  const tags = form.tags ?? [];
  const allTags = [...PRESET_TAGS, ...tags.filter((x) => !PRESET_TAGS.includes(x))];

  const toggleTag = (x: string) =>
    setForm((f) => ({ ...f, tags: (f.tags ?? []).includes(x) ? (f.tags ?? []).filter((y) => y !== x) : [...(f.tags ?? []), x] }));

  const startEdit = (j: Journal) => {
    setEditing(j);
    setForm({ judul: j.judul ?? "", konten: j.konten, mood: j.mood, tags: j.tags ?? [], tanggal: j.tanggal });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const reset = () => {
    setEditing(null);
    setForm(emptyForm());
    setError("");
  };

  const submit = async () => {
    if (!form.konten.trim()) return setError(t("Isi jurnal tidak boleh kosong"));
    setSaving(true);
    setError("");
    const payload = { ...form, judul: form.judul?.trim() || null, konten: form.konten.trim() };
    const res = editing ? await updateJournal(editing.id, payload) : await addJournal(payload);
    setSaving(false);
    if (res.error) setError(res.error);
    else reset();
  };

  return (
    <div className="pb-28">
      <PageHeader title={t("Jurnal")} />
      <div className="px-4 space-y-5">
        {streak > 0 && (
          <div className="flex items-center gap-2 text-xs text-orange-300 px-1">
            <Flame size={14} /> {t("{0} hari berturut-turut menulis jurnal", [streak])}
          </div>
        )}

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <input
              type="date"
              className="input-field !w-auto"
              value={form.tanggal}
              onChange={(e) => e.target.value && setForm({ ...form, tanggal: e.target.value })}
              aria-label={t("Tanggal")}
            />
            {editing && (
              <button onClick={reset} className="text-xs text-gray-400 flex items-center gap-1">
                <X size={14} /> {t("Batal")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {MOOD_OPTIONS.map((m) => {
              const Icon = MOOD_ICON[m] ?? Meh;
              const active = form.mood === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, mood: active ? null : m })}
                  aria-label={tx(m) as string}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[9px] ${
                    active ? "border-primary bg-primary/15 text-primary" : "border-surface-light text-gray-400"
                  }`}
                >
                  <Icon size={20} />
                  <span className="truncate max-w-full px-0.5">{tx(m)}</span>
                </button>
              );
            })}
          </div>

          <Field label={t("Judul")}>
            <input className="input-field" placeholder={t("Hari ini cukup baik")} value={form.judul ?? ""} onChange={(e) => setForm({ ...form, judul: e.target.value })} />
          </Field>
          <Field label={t("Refleksi")}>
            <textarea className="input-field min-h-32" placeholder={t("Bagaimana harimu? Apa yang kamu pelajari atau rasakan?")} value={form.konten} onChange={(e) => setForm({ ...form, konten: e.target.value })} />
          </Field>

          <div className="space-y-2">
            <span className="text-xs text-gray-400">{t("Tag")}</span>
            <div className="flex flex-wrap gap-2">
              {allTags.map((x) => (
                <Chip key={x} active={tags.includes(x)} onClick={() => toggleTag(x)}>
                  {tx(x)}
                </Chip>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = customTag.trim();
                if (v && !tags.includes(v)) toggleTag(v);
                setCustomTag("");
              }}
            >
              <input className="input-field min-w-0 flex-1" placeholder={t("Tag baru")} value={customTag} onChange={(e) => setCustomTag(e.target.value)} />
              <GhostButton type="submit" className="!w-auto px-4 shrink-0 whitespace-nowrap">{t("Tambah")}</GhostButton>
            </form>
          </div>

          {error && <p className="text-sm text-red-400">{tx(error)}</p>}
          <PrimaryButton onClick={submit} disabled={saving}>{saving ? t("Menyimpan...") : t("Simpan")}</PrimaryButton>
        </Card>

        <div className="space-y-2">
          <SectionTitle>{t("Riwayat")}</SectionTitle>
          {journals.length === 0 ? (
            <EmptyState title={t("Belum ada entri jurnal")} />
          ) : (
            journals.map((j) => {
              const Icon = MOOD_ICON[j.mood ?? ""] ?? Meh;
              return (
                <Card key={j.id} className="space-y-1.5">
                  <div className="flex items-start gap-3">
                    <button className="flex-1 min-w-0 text-left" onClick={() => startEdit(j)}>
                      <p className="text-[11px] text-gray-400">{fmtDate(j.tanggal, "EEE, d MMM yyyy")}</p>
                      <p className="text-sm font-medium text-gray-50 truncate">{tx(j.judul) || j.konten.slice(0, 40)}</p>
                      <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{tx(j.konten)}</p>
                    </button>
                    <Icon size={18} className="text-primary shrink-0 mt-1" />
                    <button
                      aria-label={t("Hapus")}
                      className="text-gray-600 shrink-0 mt-1"
                      onClick={() => confirm(t("Hapus entri ini?")) && deleteJournal(j.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {(j.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(j.tags ?? []).map((x) => <Chip key={x} tone="primary">{tx(x)}</Chip>)}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
