import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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

interface SearchResult {
  id: string;
  label: string;
  detail: string;
  path: string;
}

interface GlobalSearchModalProps {
  onClose: () => void;
}

export default function GlobalSearchModal({ onClose }: GlobalSearchModalProps) {
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
  const { review: currentWeekReview } = useWeeklyReview();

  const results: SearchResult[] = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    const matches = (...texts: (string | null | undefined)[]) =>
      texts.some((t) => t?.toLowerCase().includes(q));

    const out: SearchResult[] = [];

    notes.forEach((n) => {
      if (matches(n.judul, n.konten, ...(n.tags ?? [])))
        out.push({
          id: `note-${n.id}`,
          label: "Notes",
          detail: n.judul,
          path: "/notes",
        });
    });
    journals.forEach((j) => {
      if (matches(j.konten, j.mood))
        out.push({
          id: `journal-${j.id}`,
          label: "Journal",
          detail: j.konten.slice(0, 60),
          path: "/mind-growth",
        });
    });
    learnings.forEach((l) => {
      if (matches(l.topik, l.materi, l.catatan))
        out.push({
          id: `learn-${l.id}`,
          label: "Learning",
          detail: l.topik,
          path: "/mind-growth",
        });
    });
    expenses.forEach((e) => {
      if (matches(e.kategori, e.catatan, e.metode_pembayaran))
        out.push({
          id: `exp-${e.id}`,
          label: "Pengeluaran",
          detail: `${e.kategori} - Rp${e.nominal.toLocaleString("id-ID")}`,
          path: "/money",
        });
    });
    incomes.forEach((i) => {
      if (matches(i.sumber, i.catatan, i.kategori))
        out.push({
          id: `inc-${i.id}`,
          label: "Pemasukan",
          detail: i.sumber,
          path: "/money",
        });
    });
    exercises.forEach((ex) => {
      if (matches(ex.tipe, ex.sub_kategori, ex.catatan))
        out.push({
          id: `ex-${ex.id}`,
          label: "Latihan",
          detail: `${ex.tipe} - ${ex.sub_kategori}`,
          path: "/exercises",
        });
    });
    projects.forEach((p) => {
      if (matches(p.judul, p.kategori, p.catatan_ide, p.catatan_analisa))
        out.push({
          id: `proj-${p.id}`,
          label: "Creative Brain",
          detail: p.judul,
          path: "/creative",
        });
    });
    readings.forEach((r) => {
      if (matches(r.judul_buku, r.penulis, r.insight))
        out.push({
          id: `read-${r.id}`,
          label: "Reading",
          detail: r.judul_buku,
          path: "/mind-growth",
        });
    });
    devProjects.forEach((p) => {
      if (matches(p.nama, p.riset_kebutuhan))
        out.push({
          id: `dev-${p.id}`,
          label: "Project Tracker",
          detail: p.nama,
          path: "/projects",
        });
    });
    goals.forEach((g) => {
      if (matches(g.judul))
        out.push({
          id: `goal-${g.id}`,
          label: "Goals",
          detail: g.judul,
          path: "/goals",
        });
    });
    socialAccounts.forEach((s) => {
      if (matches(s.username, s.platform, s.niche, s.tujuan))
        out.push({
          id: `social-${s.id}`,
          label: "Social Accounts",
          detail: `@${s.username} (${s.platform})`,
          path: "/social-accounts",
        });
    });
    wishlists.forEach((w) => {
      if (matches(w.judul, w.kategori, w.catatan))
        out.push({
          id: `wish-${w.id}`,
          label: "Wishlist",
          detail: w.judul,
          path: "/money",
        });
    });
    if (
      currentWeekReview &&
      matches(
        currentWeekReview.apa_yang_berhasil,
        currentWeekReview.apa_yang_gagal,
        currentWeekReview.yang_mau_diubah,
      )
    ) {
      out.push({
        id: `review-${currentWeekReview.id}`,
        label: "Weekly Review",
        detail: "Review minggu ini",
        path: "/mind-growth",
      });
    }

    return out.slice(0, 20);
  }, [
    query,
    notes,
    journals,
    learnings,
    expenses,
    incomes,
    exercises,
    projects,
    readings,
    devProjects,
    goals,
    socialAccounts,
    wishlists,
    currentWeekReview,
  ]);

  const handleClickResult = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center pt-20 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg mx-4 max-h-[70vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            autoFocus
            placeholder="Cari di semua modul... (misal: golden hour, budget, sparring)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
          />
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {query.trim().length < 2 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              Ketik minimal 2 huruf untuk mencari
            </p>
          ) : results.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              Tidak ada hasil untuk "{query}"
            </p>
          ) : (
            <div className="space-y-1">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleClickResult(r.path)}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    {r.detail}
                  </p>
                  <p className="text-xs text-gray-400">{r.label}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
