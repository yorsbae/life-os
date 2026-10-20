import { useEffect, useState, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ShellProvider } from "./context/ShellContext";
import ProtectedRoute from "./components/ProtectedRoute";
import BackButtonHandler from "./components/BackButtonHandler";
import Layout from "./components/Layout";
import { getSetting } from "./utils/appSettings";

import WelcomeFlow from "./features/onboarding/WelcomeFlow";
import DashboardPage from "./features/dashboard/DashboardPage";
import MoneyPage from "./features/money/MoneyPage";
import AddTransactionPage from "./features/money/AddTransactionPage";
import PlanPage from "./features/plan/PlanPage";
import TaskDetailPage from "./features/plan/TaskDetailPage";
import HabitPage from "./features/habit/HabitPage";
import CalendarPage from "./features/calendar/CalendarPage";
import FocusModePage from "./features/focus/FocusModePage";
import ExercisePage from "./features/exercise/ExercisePage";
import AnalyticsPage from "./features/analytics/AnalyticsPage";
import GoalsPage from "./features/goals/GoalsPage";
import MindGrowthPage from "./features/mindgrowth/MindGrowthPage";
import PageHeader from "./components/ui/PageHeader";
import JournalPage from "./features/journal/JournalPage";
import NotesPage from "./features/notes/NotesPage";
import CreativeBrainPage from "./features/creative/CreativeBrainPage";
import DevProjectsPage from "./features/devprojects/DevProjectsPage";
import SocialAccountsPage from "./features/socialaccounts/SocialAccountsPage";
import AchievementsPage from "./features/achievements/AchievementsPage";
import ProfilePage from "./features/profile/ProfilePage";

// Pengguna baru diarahkan ke alur Welcome (splash + onboarding) satu kali saja.
function FirstRunGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const [state, setState] = useState<"checking" | "new" | "ready">("checking");

  // Dicek ulang tiap pindah halaman selama belum "ready", supaya selesai onboarding
  // (yang menulis intro_done lalu navigate("/")) tidak terpental kembali ke /welcome.
  const path = location.pathname;
  useEffect(() => {
    if (!user || state === "ready") return;
    let cancelled = false;
    getSetting("intro_done").then((v) => {
      if (!cancelled) setState(v ? "ready" : "new");
    });
    return () => {
      cancelled = true;
    };
  }, [user, path, state]);

  if (state === "checking") return null;
  if (state === "new" && path !== "/welcome")
    return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

// Halaman dengan navigasi bawah + header kustom per halaman.
function withLayout(element: ReactNode) {
  return (
    <ProtectedRoute>
      <Layout>{element}</Layout>
    </ProtectedRoute>
  );
}

// Halaman layar penuh tanpa navigasi bawah (form, fokus, welcome).
function bare(element: ReactNode) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

function AppContent() {
  return (
    <BrowserRouter>
      <BackButtonHandler />
      <ProtectedRoute>
        <FirstRunGate>
          <Routes>
            <Route path="/welcome" element={bare(<WelcomeFlow />)} />

            <Route path="/" element={withLayout(<DashboardPage />)} />
            <Route path="/money" element={withLayout(<MoneyPage />)} />
            <Route path="/money/add" element={bare(<AddTransactionPage />)} />
            <Route path="/plan" element={withLayout(<PlanPage />)} />
            <Route path="/plan/:id" element={bare(<TaskDetailPage />)} />
            <Route path="/exercises" element={withLayout(<ExercisePage />)} />
            <Route path="/analytics" element={withLayout(<AnalyticsPage />)} />

            <Route path="/habits" element={withLayout(<HabitPage />)} />
            <Route path="/calendar" element={withLayout(<CalendarPage />)} />
            <Route path="/focus" element={bare(<FocusModePage />)} />
            <Route path="/goals" element={withLayout(<GoalsPage />)} />
            <Route path="/learning" element={withLayout(<MindGrowthPage />)} />
            <Route path="/journal" element={withLayout(
                <>
                  <PageHeader title="Journal" />
                  <div className="px-4">
                    <JournalPage />
                  </div>
                </>,
              )} />
            <Route path="/notes" element={withLayout(<NotesPage />)} />
            <Route path="/creative" element={withLayout(<CreativeBrainPage />)} />
            <Route path="/projects" element={withLayout(<DevProjectsPage />)} />
            <Route
              path="/social-accounts"
              element={withLayout(<SocialAccountsPage />)}
            />
            <Route
              path="/achievements"
              element={withLayout(<AchievementsPage />)}
            />
            <Route path="/profile" element={withLayout(<ProfilePage />)} />

            {/* Rute lama dialihkan ke modul baru */}
            <Route path="/mind-growth" element={<Navigate to="/learning" replace />} />
            <Route path="/expenses" element={<Navigate to="/money" replace />} />
            <Route path="/incomes" element={<Navigate to="/money" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </FirstRunGate>
      </ProtectedRoute>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ShellProvider>
          <AppContent />
        </ShellProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
