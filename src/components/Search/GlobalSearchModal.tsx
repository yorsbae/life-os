import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ChevronRight } from "lucide-react";
import { useNotes } from "../../features/notes/useNotes";
import { useJournals } from "../../features/journal/useJournals";
import { useLearnings } from "../../features/learning/useLearnings";
import { useExpenses } from "../../features/expense/useExpenses";
import { useIncomes } from "../../features/income/useIncomes";
import { useExercises } from "../../features/exercise/useExercises";
import { useCreativeProjects } from "../../features/creative/useCreativeProjects";
import { useReadings } from "../../features/reading/useReadings";
import { useDevProjects } from "../../features/devprojects/useDevProjects";
import { useGoals } from "../../features/goals/useGoals";
import { useSocialAccounts } from "../../features/socialaccounts/useSocialAccounts";
import { useWishlists } from "../../features/money/useWishlists";
import { useWeeklyReview } from "../../features/weeklyreview/useWeeklyReview";
import { useTasks } from "../../features/plan/useTasks";
import { useHabits } from "../../features/habit/useHabits";
import { db } from "../../lib/db";
import { t, tx } from "../../lib/i18n";
import { rupiah } from "../../utils/format";

interface SearchResult {
  id: string;
  module: string; // nama modul (kunci terjemahan)
  detail: string;
  path: string;
}

export default function GlobalSearchModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { notes } = useNotes();
  const { journals } = useJournals();
  const { learnings } = useLearnings();
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const { exercises } = useExercises();
  const { projects } = useCreativeProjects();
  const { readings } = useReadings();
  const { projects: devProjects } = useDevProjects();
  const { goals } = useGoals();
  const { accounts: socialAccounts } = useSocialAccounts();
  const { wishlists } = useWishlists();
  const { review: weekReview } = useWeeklyReview();
  const { tasks } = useTasks();
  const { habits } = useHabits();
  const [study, setStudy] = useState<{ id: string; judul: string }[]>([]);
  useEffect(() => {
    db.from("study_items")
      .select("id, judul")
      .then(({ data }) => setStudy((data ?? []) as { id: string; judul: string }[]));
  }, []);

  const results: SearchResult[] = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    const matches = (...texts: (string | null | undefined)[]) => texts.some((x) => x?.toLowerCase().includes(q));
    const out: SearchResult[] = [];
    const add = (id: string, module: string, detail: string, path: string) => out.push({ id, module, detail, path });

    tasks.forEach((x) => matches(x.judul, x.deskripsi, x.kategori) && add(`task-${x.id}`, "Kegiatan", x.judul, `/plan/${x.id}`));
    habits.forEach((h) => matches(h.nama) && add(`habit-${h.id}`, "Kebiasaan", h.nama, "/habits"));
    notes.forEach((n) => matches(n.judul, n.konten, ...(n.tags ?? [])) && add(`note-${n.id}`, "Catatan", n.judul, "/notes"));
    journals.forEach((j) => {
      const judul = (j as { judul?: string | null }).judul;
      if (matches(judul, j.konten, j.mood)) add(`journal-${j.id}`, "Jurnal", judul || j.konten.slice(0, 60), "/journal");
    });
    learnings.forEach((l) => matches(l.topik, l.materi, l.catatan) && add(`learn-${l.id}`, "Belajar", l.topik, "/learning"));
    study.forEach((s) => matches(s.judul) && add(`study-${s.id}`, "Belajar", s.judul, "/learning"));
    readings.forEach((r) => matches(r.judul_buku, r.penulis, r.insight) && add(`read-${r.id}`, "Buku", r.judul_buku, "/learning"));
    expenses.forEach(
      (e) =>
        matches(e.kategori, e.catatan, e.metode_pembayaran) &&
        add(`exp-${e.id}`, "Pengeluaran", `${tx(e.kategori)} - ${rupiah(e.nominal)}`, "/money"),
    );
    incomes.forEach((i) => matches(i.sumber, i.catatan, i.kategori) && add(`inc-${i.id}`, "Pemasukan", String(tx(i.sumber)), "/money"));
    wishlists.forEach((w) => matches(w.judul, w.kategori, w.catatan) && add(`wish-${w.id}`, "Wishlist", w.judul, "/money"));
    exercises.forEach(
      (ex) => matches(ex.tipe, ex.sub_kategori, ex.catatan) && add(`ex-${ex.id}`, "Latihan", `${tx(ex.tipe)} - ${tx(ex.sub_kategori)}`, "/exercises"),
    );
    projects.forEach(
      (p) => matches(p.judul, p.kategori, p.catatan_ide, p.catatan_analisa) && add(`proj-${p.id}`, "Creative Brain", p.judul, "/creative"),
    );
    devProjects.forEach((p) => matches(p.nama, p.riset_kebutuhan) && add(`dev-${p.id}`, "Proyek", p.nama, "/projects"));
    goals.forEach((g) => matches(g.judul) && add(`goal-${g.id}`, "Target", g.judul, "/goals"));
    socialAccounts.forEach(
      (s) => matches(s.username, s.platform, s.niche, s.tujuan) && add(`social-${s.id}`, "Akun Sosial", `@${s.username} (${s.platform})`, "/social-accounts"),
    );
    if (weekReview && matches(weekReview.apa_yang_berhasil, weekReview.apa_yang_gagal, weekReview.yang_mau_diubah)) {
      add(`review-${weekReview.id}`, "Review Mingguan", t("Review minggu ini"), "/learning");
    }
    return out.slice(0, 30);
  }, [query, tasks, habits, notes, journals, learnings, study, readings, expenses, incomes, wishlists, exercises, projects, devProjects, goals, socialAccounts, weekReview]);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-bg flex flex-col pt-[env(safe-area-inset-top)]">
      <div className="p-4 flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            autoFocus
            placeholder={t("Cari catatan, tugas, transaksi...")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input-field !pl-9"
          />
        </div>
        <button onClick={onClose} aria-label={t("Tutup")} className="p-2 text-gray-300 shrink-0">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-4 pb-8">
        {query.trim().length < 2 ? (
          <p className="text-gray-400 text-sm text-center py-10">{t("Ketik minimal 2 huruf untuk mencari")}</p>
        ) : results.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10 break-words">{t('Tidak ada hasil untuk "{0}"', [query])}</p>
        ) : (
          <div className="space-y-2">
            {results.map((r) => (
              <button key={r.id} onClick={() => go(r.path)} className="card w-full flex items-center gap-3 px-4 py-3 text-left">
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-gray-100 truncate">{r.detail}</span>
                  <span className="block text-[11px] text-primary">{t(r.module)}</span>
                </span>
                <ChevronRight size={16} className="text-gray-500 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
