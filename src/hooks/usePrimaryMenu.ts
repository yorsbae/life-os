import {
  Home,
  Sun,
  Wallet,
  CalendarCheck,
  Dumbbell,
  BarChart3,
  Repeat,
  CalendarDays,
  Timer,
  Target,
  GraduationCap,
  BookOpen,
  StickyNote,
  Lightbulb,
  FolderKanban,
  Trophy,
  Users,
  User,
  type LucideIcon,
} from "lucide-react";

export interface MenuOption {
  path: string;
  label: string;
  icon: LucideIcon;
}

/** Lima tab tetap di navigasi bawah (sesuai desain). */
export const TAB_MENU: MenuOption[] = [
  { path: "/", label: "Home", icon: Home },
  { path: "/money", label: "Money", icon: Wallet },
  { path: "/plan", label: "Plan", icon: CalendarCheck },
  { path: "/exercises", label: "Body", icon: Dumbbell },
  { path: "/analytics", label: "Insights", icon: BarChart3 },
];

/** Modul lain, tampil di drawer (ikon hamburger). */
export const MODULE_MENU: MenuOption[] = [
  { path: "/today", label: "Hari Ini", icon: Sun },
  { path: "/habits", label: "Habit", icon: Repeat },
  { path: "/calendar", label: "Kalender", icon: CalendarDays },
  { path: "/focus", label: "Focus", icon: Timer },
  { path: "/goals", label: "Goals", icon: Target },
  { path: "/learning", label: "Learning", icon: GraduationCap },
  { path: "/journal", label: "Journal", icon: BookOpen },
  { path: "/notes", label: "Notes", icon: StickyNote },
  { path: "/creative", label: "Creative Brain", icon: Lightbulb },
  { path: "/projects", label: "Projects", icon: FolderKanban },
  { path: "/social-accounts", label: "Social Accounts", icon: Users },
  { path: "/achievements", label: "Achievements", icon: Trophy },
  { path: "/profile", label: "Profil & Pengaturan", icon: User },
];

export const ALL_MENU_OPTIONS: MenuOption[] = [...TAB_MENU, ...MODULE_MENU];
