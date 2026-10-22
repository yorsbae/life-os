import { useMemo, useState } from "react";
import { BookOpen, GraduationCap, Flame, Minus, Plus, Trash2 } from "lucide-react";
import ItemRow from "../../components/ui/ItemRow";
import Field from "../../components/ui/Field";
import Segmented from "../../components/ui/Segmented";
import { Chip, EmptyState, GhostButton, PrimaryButton, Sheet } from "../../components/ui/Controls";
import { useReadings, type Reading, type ReadingInput } from "../reading/useReadings";
import { useStudyItems, type StudyItem, type StudyTipe } from "./useStudyItems";
import { t, tx } from "../../lib/i18n";
import { toDateStr } from "../../utils/dates";

export type ItemFilter = "all" | "book" | "course";

type Unified =
  | { kind: "book"; id: string; sort: string; reading: Reading }
  | { kind: "course"; id: string; sort: string; item: StudyItem };

// Streak membaca: hari berturut-turut ada pencatatan bacaan (mundur dari hari ini/kemarin).
function readingStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniq = Array.from(new Set(dates)).sort().reverse();
  const today = toDateStr();
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (uniq[0] !== today && uniq[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 0; i < uniq.length - 1; i++) {
    const diff = Math.round((new Date(uniq[i]).getTime() - new Date(uniq[i + 1]).getTime()) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

const num = (v: string): number | null => (v.trim() === "" || isNaN(Number(v)) ? null : Number(v));
const pct = (a: number, b: number | null) => (b && b > 0 ? Math.min(100, Math.round((a / b) * 100)) : null);

const BOOK_STATUS: { key: Reading["status"]; label: string }[] = [
  { key: "Dibaca", label: "Sedang dibaca" },
  { key: "Selesai", label: "Selesai" },
  { key: "Berhenti", label: "Berhenti" },
];

interface Draft {
  kind: "book" | "course";
  judul: string;
  penulis: string;
  halaman: string;
  total: string;
  status: Reading["status"];
  insight: string;
  satuan: string;
  catatan: string;
}

function emptyDraft(kind: "book" | "course"): Draft {
  return { kind, judul: "", penulis: "", halaman: "0", total: "", status: "Dibaca", insight: "", satuan: "materi", catatan: "" };
}

function ItemSheet({
  target,
  onClose,
  readings,
  courses,
}: {
  target: Unified | null;
  onClose: () => void;
  readings: ReturnType<typeof useReadings>;
  courses: ReturnType<typeof useStudyItems>;
}) {
  const editing = target !== null;
  const [d, setD] = useState<Draft>(() => {
    if (!target) return emptyDraft("course");
    if (target.kind === "book") {
      const r = target.reading;
      return {
        ...emptyDraft("book"),
        judul: r.judul_buku,
        penulis: r.penulis ?? "",
        halaman: String(r.halaman_sekarang),
        total: r.total_halaman != null ? String(r.total_halaman) : "",
        status: r.status,
        insight: r.insight ?? "",
      };
    }
    const c = target.item;
    return {
      ...emptyDraft("course"),
      judul: c.judul,
      halaman: String(c.selesai),
      total: c.total != null ? String(c.total) : "",
      satuan: c.satuan ?? "materi",
      catatan: c.catatan ?? "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const step = d.kind === "book" ? 10 : 1;
  const bump = (delta: number) => set({ halaman: String(Math.max(0, (num(d.halaman) ?? 0) + delta)) });

  const save = async () => {
    if (!d.judul.trim()) return setError(t("Judul wajib diisi"));
    setSaving(true);
    setError("");
    let res: { error: string | null };
    if (d.kind === "book") {
      const now = num(d.halaman) ?? 0;
      const total = num(d.total);
      const input: ReadingInput = {
        judul_buku: d.judul.trim(),
        penulis: d.penulis.trim() || null,
        halaman_sekarang: now,
        total_halaman: total,
        // Otomatis selesai jika halaman sudah mencapai total
        status: total && now >= total ? "Selesai" : d.status,
        insight: d.insight.trim() || null,
        tanggal: toDateStr(),
      };
      res = target?.kind === "book" ? await readings.updateReading(target.reading.id, input) : await readings.addReading(input);
    } else {
      const input = {
        judul: d.judul.trim(),
        tipe: "Kursus" as StudyTipe,
        selesai: num(d.halaman) ?? 0,
        total: num(d.total),
        satuan: d.satuan.trim() || "materi",
        catatan: d.catatan.trim() || null,
      };
      res = target?.kind === "course" ? await courses.updateItem(target.item.id, input) : await courses.addItem(input);
    }
    setSaving(false);
    if (res.error) return setError(res.error);
    onClose();
  };

  const remove = async () => {
    if (!target || !confirm(t("Yakin hapus data ini?"))) return;
    if (target.kind === "book") await readings.deleteReading(target.reading.id);
    else await courses.deleteItem(target.item.id);
    onClose();
  };

  return (
    <Sheet title={editing ? t("Detail Materi") : t("Tambah Materi")} onClose={onClose}>
      {!editing && (
        <Segmented
          options={[
            { key: "course", label: t("Kursus") },
            { key: "book", label: t("Buku") },
          ]}
          value={d.kind}
          onChange={(k) => set({ kind: k, halaman: "0" })}
        />
      )}
      <Field label={d.kind === "book" ? t("Judul buku") : t("Judul kursus")}>
        <input className="input-field" value={d.judul} onChange={(e) => set({ judul: e.target.value })} autoFocus={!editing} />
      </Field>
      {d.kind === "book" && (
        <Field label={t("Penulis (opsional)")}>
          <input className="input-field" value={d.penulis} onChange={(e) => set({ penulis: e.target.value })} />
        </Field>
      )}

      <div className="space-y-1.5">
        <span className="text-xs text-gray-400">{d.kind === "book" ? t("Halaman sekarang") : t("Progres")}</span>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={t("Kurangi")} onClick={() => bump(-step)} className="w-10 h-10 rounded-xl bg-surface-light text-gray-200 flex items-center justify-center shrink-0">
            <Minus size={16} />
          </button>
          <input className="input-field text-center" inputMode="numeric" value={d.halaman} onChange={(e) => set({ halaman: e.target.value })} />
          <button type="button" aria-label={t("Tambah")} onClick={() => bump(step)} className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={d.kind === "book" ? t("Total halaman") : t("Total")}>
          <input className="input-field" inputMode="numeric" value={d.total} onChange={(e) => set({ total: e.target.value })} />
        </Field>
        {d.kind === "course" && (
          <Field label={t("Satuan")}>
            <input className="input-field" value={d.satuan} onChange={(e) => set({ satuan: e.target.value })} placeholder={t("materi")} />
          </Field>
        )}
      </div>

      {d.kind === "book" && (
        <>
          <div className="space-y-1.5">
            <span className="text-xs text-gray-400">{t("Status")}</span>
            <div className="flex gap-2 flex-wrap">
              {BOOK_STATUS.map((s) => (
                <Chip key={s.key} active={d.status === s.key} onClick={() => set({ status: s.key })}>
                  {t(s.label)}
                </Chip>
              ))}
            </div>
          </div>
          <Field label={t("Insight / apa yang bisa diambil")}>
            <textarea className="input-field min-h-20" value={d.insight} onChange={(e) => set({ insight: e.target.value })} />
          </Field>
        </>
      )}
      {d.kind === "course" && (
        <Field label={t("Catatan")}>
          <textarea className="input-field min-h-20" value={d.catatan} onChange={(e) => set({ catatan: e.target.value })} placeholder={t("Opsional...")} />
        </Field>
      )}

      {error && <p className="text-sm text-red-400">{tx(error)}</p>}
      <PrimaryButton onClick={save} disabled={saving}>
        {saving ? t("Menyimpan...") : t("Simpan")}
      </PrimaryButton>
      {editing && (
        <GhostButton onClick={remove} className="!border-red-500/40 !text-red-400 flex items-center justify-center gap-2">
          <Trash2 size={15} />
          {t("Hapus")}
        </GhostButton>
      )}
    </Sheet>
  );
}

export default function LearningItems({ filter }: { filter: ItemFilter }) {
  const readings = useReadings();
  const courses = useStudyItems();
  const [sheet, setSheet] = useState<{ target: Unified | null } | null>(null);

  const streak = useMemo(() => readingStreak(readings.readings.map((r) => r.tanggal)), [readings.readings]);

  const list = useMemo(() => {
    const all: Unified[] = [
      ...readings.readings.map((r): Unified => ({ kind: "book", id: r.id, sort: r.created_at ?? r.tanggal, reading: r })),
      ...courses.items.map((c): Unified => ({ kind: "course", id: c.id, sort: c.created_at, item: c })),
    ];
    return all
      .filter((u) => filter === "all" || (filter === "book" ? u.kind === "book" : u.kind === "course"))
      .sort((a, b) => (b.sort ?? "").localeCompare(a.sort ?? ""));
  }, [readings.readings, courses.items, filter]);

  const loading = readings.loading || courses.loading;

  return (
    <div className="space-y-3">
      {streak > 0 && filter !== "course" && (
        <div className="flex">
          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-orange-500/15 text-orange-400">
            <Flame size={13} />
            {t("Streak membaca {0} hari", [streak])}
          </span>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>
      ) : list.length === 0 ? (
        <EmptyState icon={GraduationCap} title={t("Belum ada materi")} hint={t("Tambahkan buku atau kursus yang sedang kamu pelajari.")} />
      ) : (
        list.map((u) => {
          if (u.kind === "book") {
            const r = u.reading;
            const p = pct(r.halaman_sekarang, r.total_halaman);
            return (
              <ItemRow
                key={u.id}
                icon={BookOpen}
                title={r.judul_buku}
                subtitle={p != null ? t("Buku · {0}%", [p]) : t("Buku · hal. {0}", [r.halaman_sekarang])}
                progress={p ?? 0}
                onClick={() => setSheet({ target: u })}
              />
            );
          }
          const c = u.item;
          const p = pct(c.selesai, c.total);
          return (
            <ItemRow
              key={u.id}
              icon={GraduationCap}
              title={c.judul}
              subtitle={c.total != null ? t("Kursus · {0}/{1}", [c.selesai, c.total]) : t("Kursus · {0} {1}", [c.selesai, tx(c.satuan ?? "materi") as string])}
              progress={p ?? 0}
              onClick={() => setSheet({ target: u })}
            />
          );
        })
      )}

      <PrimaryButton onClick={() => setSheet({ target: null })}>{t("Tambah Materi")}</PrimaryButton>

      {sheet && <ItemSheet target={sheet.target} onClose={() => setSheet(null)} readings={readings} courses={courses} />}
    </div>
  );
}
