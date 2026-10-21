import { useMemo, useState } from "react";
import { ChevronRight, Pin, PinOff, Search, Trash2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Field from "../../components/ui/Field";
import { Card, Chip, EmptyState, Fab, PrimaryButton, Sheet } from "../../components/ui/Controls";
import { useNotes } from "./useNotes";
import { NOTE_KATEGORI_DEFAULT, type Note, type NoteInput } from "../../types";
import { t, tx } from "../../lib/i18n";
import { fmtDate } from "../../utils/format";

const emptyForm = (): NoteInput => ({ judul: "", kategori: NOTE_KATEGORI_DEFAULT[0], konten: "", tags: [], is_pinned: false });

export default function NotesPage() {
  const { notes, addNote, updateNote, deleteNote, togglePin } = useNotes();
  const [search, setSearch] = useState("");
  const [activeKat, setActiveKat] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ note: Note | null } | null>(null);
  const [form, setForm] = useState<NoteInput>(emptyForm);
  const [tagsText, setTagsText] = useState("");
  const [saving, setSaving] = useState(false);

  const kategori = useMemo(() => Array.from(new Set([...NOTE_KATEGORI_DEFAULT, ...notes.map((n) => n.kategori)])), [notes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter(
      (n) =>
        (!activeKat || n.kategori === activeKat) &&
        (!q || n.judul.toLowerCase().includes(q) || (n.konten ?? "").toLowerCase().includes(q) || (n.tags ?? []).some((x) => x.toLowerCase().includes(q))),
    );
  }, [notes, search, activeKat]);

  const open = (note: Note | null) => {
    setForm(note ? { judul: note.judul, kategori: note.kategori, konten: note.konten, tags: note.tags, is_pinned: note.is_pinned } : emptyForm());
    setTagsText(note ? (note.tags ?? []).join(", ") : "");
    setSheet({ note });
  };

  const save = async () => {
    if (!form.judul.trim()) return;
    setSaving(true);
    const payload = { ...form, judul: form.judul.trim(), tags: tagsText.split(",").map((x) => x.trim()).filter(Boolean) };
    if (sheet?.note) await updateNote(sheet.note.id, payload);
    else await addNote(payload);
    setSaving(false);
    setSheet(null);
  };

  return (
    <div className="pb-28">
      <PageHeader title={t("Catatan")} />
      <div className="px-4 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input-field !pl-10" placeholder={t("Cari catatan...")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
          <Chip active={!activeKat} onClick={() => setActiveKat(null)}>{t("Semua")}</Chip>
          {kategori.map((k) => (
            <Chip key={k} active={activeKat === k} onClick={() => setActiveKat(activeKat === k ? null : k)}>{tx(k)}</Chip>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title={t("Tidak ada catatan")} hint={t("Tekan + untuk membuat catatan.")} />
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <Card key={n.id} onClick={() => open(n)} className="!py-3 flex items-center gap-3">
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5">
                    {n.is_pinned && <Pin size={12} className="text-primary shrink-0" />}
                    <span className="text-sm text-gray-50 truncate">{n.judul}</span>
                  </span>
                  <span className="block text-[11px] text-gray-400 truncate">
                    {fmtDate(n.created_at, "d MMM yyyy")} · {tx(n.kategori)}
                  </span>
                </span>
                <ChevronRight size={16} className="text-gray-500 shrink-0" />
              </Card>
            ))}
          </div>
        )}
      </div>

      <Fab onClick={() => open(null)} label={t("Tambah catatan")} />

      {sheet && (
        <Sheet title={sheet.note ? t("Ubah Catatan") : t("Catatan Baru")} onClose={() => setSheet(null)}>
          <Field label={t("Judul")}>
            <input className="input-field" value={form.judul} onChange={(e) => setForm({ ...form, judul: e.target.value })} autoFocus />
          </Field>
          <Field label={t("Kategori")}>
            <input className="input-field" list="note-kat" value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} />
            <datalist id="note-kat">{kategori.map((k) => <option key={k} value={k} />)}</datalist>
          </Field>
          <Field label={t("Isi")}>
            <textarea className="input-field min-h-32" value={form.konten ?? ""} onChange={(e) => setForm({ ...form, konten: e.target.value })} />
          </Field>
          <Field label={t("Tag (pisahkan dengan koma)")}>
            <input className="input-field" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
          </Field>
          <PrimaryButton onClick={save} disabled={saving || !form.judul.trim()}>{t("Simpan")}</PrimaryButton>
          {sheet.note && (
            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-surface-light text-sm text-gray-200"
                onClick={async () => {
                  await togglePin(sheet.note!);
                  setSheet(null);
                }}
              >
                {sheet.note.is_pinned ? <PinOff size={15} /> : <Pin size={15} />}
                {sheet.note.is_pinned ? t("Lepas sematan") : t("Sematkan")}
              </button>
              <button
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/40 text-sm text-red-400"
                onClick={async () => {
                  if (!confirm(t("Hapus catatan ini?"))) return;
                  await deleteNote(sheet.note!.id);
                  setSheet(null);
                }}
              >
                <Trash2 size={15} /> {t("Hapus")}
              </button>
            </div>
          )}
        </Sheet>
      )}
    </div>
  );
}
