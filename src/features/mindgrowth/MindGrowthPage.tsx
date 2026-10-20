import { useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import LearningPage from "../learning/LearningPage";
import ReadingTab from "../reading/ReadingTab";
import WeeklyReviewTab from "../weeklyreview/WeeklyReviewTab";

type Tab = "learning" | "reading" | "review";
const TABS: { key: Tab; label: string }[] = [
  { key: "learning", label: "Materi" },
  { key: "reading", label: "Buku" },
  { key: "review", label: "Weekly Review" },
];

/** Halaman Learning (desain #17): materi, buku, dan weekly review. */
export default function MindGrowthPage() {
  const [tab, setTab] = useState<Tab>("learning");
  return (
    <div>
      <PageHeader title="Learning" />
      <div className="px-4 space-y-4">
        <Segmented options={TABS} value={tab} onChange={setTab} />
        {tab === "learning" && <LearningPage embedded />}
        {tab === "reading" && <ReadingTab />}
        {tab === "review" && <WeeklyReviewTab />}
      </div>
    </div>
  );
}
