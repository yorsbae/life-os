import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { LockProvider } from "./context/LockContext";
import LockGate from "./components/LockScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import { ShellProvider, useShell } from "./context/ShellContext";
import ProtectedRoute from "./components/ProtectedRoute";
import BackButtonHandler from "./components/BackButtonHandler";
import WidgetSync from "./components/WidgetSync";
import Layout from "./components/Layout";
import { getSetting } from "./utils/appSettings";

import WelcomeFlow from "./features/onboarding/WelcomeFlow";
import DashboardPage from "./features/dashboard/DashboardPage";
const MoneyPage = lazy(() => import("./features/money/MoneyPage"));
const AddTransactionPage = lazy(() => import("./features/money/AddTransactionPage"));
const PlanPage = lazy(() => import("./features/plan/PlanPage"));
const TaskDetailPage = lazy(() => import("./features/plan/TaskDetailPage"));
const HabitPage = lazy(() => import("./features/habit/HabitPage"));
const CalendarPage = lazy(() => import("./features/calendar/CalendarPage"));
const FocusModePage = lazy(() => import("./features/focus/FocusModePage"));
const ExercisePage = lazy(() => import("./features/exercise/ExercisePage"));
const AnalyticsPage = lazy(() => import("./features/analytics/AnalyticsPage"));
const GoalsPage = lazy(() => import("./features/goals/GoalsPage"));
const MindGrowthPage = lazy(() => import("./features/mindgrowth/MindGrowthPage"));
const JournalPage = lazy(() => import("./features/journal/JournalPage"));
const NotesPage = lazy(() => import("./features/notes/NotesPage"));
const CreativeBrainPage = lazy(() => import("./features/creative/CreativeBrainPage"));
const DevProjectsPage = lazy(() => import("./features/devprojects/DevProjectsPage"));
const SocialAccountsPage = lazy(() => import("./features/socialaccounts/SocialAccountsPage"));
const AchievementsPage = lazy(() => import("./features/achievements/AchievementsPage"));
const ProfilePage = lazy(() => import("./features/profile/ProfilePage"));

import { tx } from "./lib/i18n";
// Pengguna baru diarahkan ke alur Welcome (splash + onboarding) satu kali saja.
// Status dibaca sekali dari database lalu disimpan di ShellContext; WelcomeFlow
// mengubahnya langsung saat selesai sehingga tidak ada pembacaan ulang yang bisa balapan.
function FirstRunGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { introDone, setIntroDone } = useShell();
  const location = useLocation();

  useEffect(() => {
    if (!user || introDone !== null) return;
    let cancelled = false;
    getSetting("intro_done")
      .then((v) => !cancelled && setIntroDone(!!v))
      .catch(() => !cancelled && setIntroDone(true));
    return () => {
      cancelled = true;
    };
  }, [user, introDone, setIntroDone]);

  if (introDone === null) return null;
  if (!introDone && location.pathname !== "/welcome") return <Navigate to="/welcome" replace />;
  return <>{children}</>;
}

// Halaman dengan navigasi bawah + header kustom per halaman.
function withLayout(element: ReactNode) {
  return (
    <ProtectedRoute>
      <Layout>{tx(element)}</Layout>
    </ProtectedRoute>
  );
}

// Halaman layar penuh tanpa navigasi bawah (form, fokus, welcome).
function bare(element: ReactNode) {
  return <ProtectedRoute>{tx(element)}</ProtectedRoute>;
}

function AppContent() {
  return (
    <BrowserRouter>
      <BackButtonHandler />
      <WidgetSync />
      <ProtectedRoute>
        <FirstRunGate>
          <Suspense fallback={<div className="min-h-screen bg-bg" />}>
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
            <Route path="/journal" element={withLayout(<JournalPage />)} />
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
            <Route path="/profile/*" element={withLayout(<ProfilePage />)} />

            {/* Rute lama dialihkan ke modul baru */}
            <Route path="/mind-growth" element={<Navigate to="/learning" replace />} />
            <Route path="/expenses" element={<Navigate to="/money" replace />} />
            <Route path="/incomes" element={<Navigate to="/money" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
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
          {/* LockProvider di luar LanguageProvider: ganti bahasa me-remount pohon dan tidak boleh mengunci ulang. */}
          <LockProvider>
            <LanguageProvider>
              <ErrorBoundary>
                <LockGate>
                  <AppContent />
                </LockGate>
              </ErrorBoundary>
            </LanguageProvider>
          </LockProvider>
        </ShellProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
