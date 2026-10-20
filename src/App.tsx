import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import BackButtonHandler from "./components/BackButtonHandler";
import Layout from "./components/Layout";
import ExpensePage from "./features/expense/ExpensePage";
import IncomePage from "./features/income/IncomePage";
import ExercisePage from "./features/exercise/ExercisePage";
import CalendarPage from "./features/calendar/CalendarPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import MoneyPage from "./features/money/MoneyPage";
import MindGrowthPage from "./features/mindgrowth/MindGrowthPage";
import CreativeBrainPage from "./features/creative/CreativeBrainPage";
import NotesPage from "./features/notes/NotesPage";
import AnalyticsPage from "./features/analytics/AnalyticsPage";
import ProfilePage from "./features/profile/ProfilePage";
import DevProjectsPage from "./features/devprojects/DevProjectsPage";
import FocusModePage from "./features/focus/FocusModePage";
import GoalsPage from "./features/goals/GoalsPage";
import SocialAccountsPage from "./features/socialaccounts/SocialAccountsPage";
import AchievementsPage from "./features/achievements/AchievementsPage";

// ProtectedRoute kini hanya menahan halaman sampai database lokal siap (tidak ada login).
function withLayout(element: ReactNode) {
  return (
    <ProtectedRoute>
      <Layout>{element}</Layout>
    </ProtectedRoute>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <BackButtonHandler />
      <Routes>
        <Route path="/" element={withLayout(<DashboardPage />)} />

        {/* Money - halaman gabungan Ringkasan+Expense+Income+Wishlist */}
        <Route path="/money" element={withLayout(<MoneyPage />)} />
        <Route path="/expenses" element={withLayout(<ExpensePage />)} />
        <Route path="/incomes" element={withLayout(<IncomePage />)} />

        <Route path="/exercises" element={withLayout(<ExercisePage />)} />
        <Route path="/mind-growth" element={withLayout(<MindGrowthPage />)} />

        <Route path="/creative" element={withLayout(<CreativeBrainPage />)} />
        <Route path="/notes" element={withLayout(<NotesPage />)} />

        <Route path="/calendar" element={withLayout(<CalendarPage />)} />
        <Route path="/analytics" element={withLayout(<AnalyticsPage />)} />
        <Route path="/profile" element={withLayout(<ProfilePage />)} />
        <Route path="/projects" element={withLayout(<DevProjectsPage />)} />
        <Route path="/goals" element={withLayout(<GoalsPage />)} />
        <Route
          path="/social-accounts"
          element={withLayout(<SocialAccountsPage />)}
        />
        <Route
          path="/achievements"
          element={withLayout(<AchievementsPage />)}
        />
        <Route
          path="/focus"
          element={
            <ProtectedRoute>
              <FocusModePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
