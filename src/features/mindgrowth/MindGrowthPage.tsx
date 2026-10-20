import { useState } from "react";
import LearningPage from "../learning/LearningPage";
import JournalPage from "../journal/JournalPage";
import ReadingTab from "../reading/ReadingTab";
import WeeklyReviewTab from "../weeklyreview/WeeklyReviewTab";

type Tab = "learning" | "journal" | "reading" | "review";

const TABS: { key: Tab; label: string }[] = [
  { key: "learning", label: "Learning" },
  { key: "reading", label: "Reading" },
  { key: "journal", label: "Journal" },
  { key: "review", label: "Weekly Review" },
];

export default function MindGrowthPage() {
  const [tab, setTab] = useState<Tab>("learning");

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
        Mind & Growth
      </h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              tab === t.key
                ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "learning" && <LearningPage embedded />}
      {tab === "journal" && <JournalPage />}
      {tab === "reading" && <ReadingTab />}
      {tab === "review" && <WeeklyReviewTab />}
    </div>
  );
}
