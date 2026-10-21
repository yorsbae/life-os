import { useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import LearningItems from "../learning/LearningItems";
import LearningPage from "../learning/LearningPage";
import WeeklyReviewTab from "../weeklyreview/WeeklyReviewTab";
import { t } from "../../lib/i18n";

type Tab = "all" | "book" | "course" | "notes" | "review";

/** Halaman Learning (desain #17): semua materi, buku, kursus, catatan belajar, dan weekly review. */
export default function MindGrowthPage() {
  const [tab, setTab] = useState<Tab>("all");
  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: t("Semua") },
    { key: "book", label: t("Buku") },
    { key: "course", label: t("Kursus") },
    { key: "notes", label: t("Catatan") },
    { key: "review", label: t("Review") },
  ];
  return (
    <div>
      <PageHeader title={t("Belajar")} />
      <div className="px-4 space-y-4">
        <Segmented options={tabs} value={tab} onChange={setTab} />
        {(tab === "all" || tab === "book" || tab === "course") && <LearningItems filter={tab} />}
        {tab === "notes" && <LearningPage embedded />}
        {tab === "review" && <WeeklyReviewTab />}
      </div>
    </div>
  );
}
