import { useState, useMemo, type FormEvent } from "react";
import { useNotes } from "./useNotes";
import { NOTE_KATEGORI_DEFAULT, type Note, type NoteInput } from "../../types";

const CUSTOM_VALUE = "__custom__";

const initialForm: NoteInput = {
  judul: "",
  kategori: NOTE_KATEGORI_DEFAULT[0],
  konten: "",
  tags: [],
  is_pinned: false,
};

export default function NotesPage() {
  const { notes, loading, addNote, updateNote, deleteNote, togglePin } =
    useNotes();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState<NoteInput>(initialForm);
  const [tagsText, setTagsText] = useState("");
  const [showCustomKategori, setShowCustomKategori] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [search, setSearch] = useState("");
  const [activeKategori, setActiveKategori] = useState<string | null>(null);

  // Kategori yang benar-benar dipakai user (default + custom yang pernah diinput)
  const allKategori = useMemo(() => {
    const fromNotes = notes.map((n) => n.kategori);
    return Array.from(new Set([...NOTE_KATEGORI_DEFAULT, ...fromNotes]));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const matchKategori = !activeKategori || n.kategori === activeKategori;
      const matchSearch =
        !search ||
        n.judul.toLowerCase().includes(search.toLowerCase()) ||
        (n.konten ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (n.tags ?? []).some((t) =>
          t.toLowerCase().includes(search.toLowerCase()),
        );
      return matchKategori && matchSearch;
    });
  }, [notes, activeKategori, search]);

  const startEdit = (note: Note) => {
    setEditing(note);
    setForm({
      judul: note.judul,
      kategori: note.kategori,
      konten: note.konten,
      tags: note.tags,
      is_pinned: note.is_pinned,
    });
    setTagsText((note.tags ?? []).join(", "));
    setShowCustomKategori(
      !NOTE_KATEGORI_DEFAULT.includes(note.kategori as any),
    );
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(initialForm);
    setTagsText("");
    setShowCustomKategori(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = { ...form, tags };

    if (editing) await updateNote(editing.id, payload);
    else await addNote(payload);

    setIsSubmitting(false);
    cancelForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin hapus note ini?")) deleteNote(id);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Notes
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 py-1.5 rounded-lg"
        >
          + Tambah
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Cari judul, isi, atau tag..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg text-sm"
      />

      {/* Filter kategori */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveKategori(null)}
          className={`text-xs px-3 py-1.5 rounded-full border ${
            !activeKategori
              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
              : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
          }`}
        >
          Semua
        </button>
        {allKategori.map((k) => (
          <button
            key={k}
            onClick={() => setActiveKategori(k)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              activeKategori === k
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <input
            type="text"
            required
            placeholder="Judul"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
          />

          {!showCustomKategori ? (
            <select
              value={form.kategori}
              onChange={(e) => {
                if (e.target.value === CUSTOM_VALUE) {
                  setShowCustomKategori(true);
                  setForm({ ...form, kategori: "" });
                } else {
                  setForm({ ...form, kategori: e.target.value });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
            >
              {NOTE_KATEGORI_DEFAULT.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
              <option value={CUSTOM_VALUE}>+ Kategori Baru...</option>
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                required
                autoFocus
                placeholder="Nama kategori baru"
                value={form.kategori}
                onChange={(e) => setForm({ ...form, kategori: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomKategori(false);
                  setForm({ ...form, kategori: NOTE_KATEGORI_DEFAULT[0] });
                }}
                className="px-3 text-sm text-gray-400"
              >
                Batal
              </button>
            </div>
          )}

          <textarea
            placeholder="Isi catatan..."
            value={form.konten ?? ""}
            onChange={(e) => setForm({ ...form, konten: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
          />

          <input
            type="text"
            placeholder="Tags, pisah pakai koma (misal: golden-hour, budgeting)"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {isSubmitting ? "Menyimpan..." : editing ? "Update" : "Simpan"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:text-gray-300 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>
      ) : filteredNotes.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Tidak ada note ditemukan.
        </p>
      ) : (
        <div className="space-y-2">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {note.is_pinned && <span title="Pinned">📌</span>}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {note.judul}
                    </span>
                  </div>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                    {note.kategori}
                  </span>
                  {note.konten && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                      {note.konten}
                    </p>
                  )}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-blue-500 dark:text-blue-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => togglePin(note)}
                    className="text-sm"
                    title={note.is_pinned ? "Lepas pin" : "Pin note ini"}
                  >
                    {note.is_pinned ? "📌" : "📍"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(note)}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
