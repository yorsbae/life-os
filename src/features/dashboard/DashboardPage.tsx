import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Wallet, CheckSquare, TrendingUp, Repeat, Search } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useProfile } from "../profile/useProfile";
import { useTasks } from "../plan/useTasks";
import { useHabits } from "../habit/useHabits";
import { useExpenses } from "../expense/useExpenses";
import { useShell } from "../../context/ShellContext";
import { Card, SectionTitle } from "../../components/ui/Controls";
import { toDateStr } from "../../utils/dates";
import { rupiah } from "../../utils/format";
import ReminderBanners from "./reminders/ReminderBanners";
import WeatherBadge from "./widgets/WeatherBadge";
import DailyQuote from "./widgets/DailyQuote";
import ExercisePlanWidget from "./widgets/ExercisePlanWidget";
import RecurringExpenseWidget from "./widgets/RecurringExpenseWidget";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { openSearch } = useShell();
  const { profile } = useProfile();
  const { tasks } = useTasks();
  const { habits, isDone } = useHabits();
  const { expenses } = useExpenses();

  const today = toDateStr();
  const todayTasks = tasks.filter((t) => t.tanggal_mulai === today);
  const tasksDone = todayTasks.filter((t) => t.status === "Selesai").length;
  const spent = expenses.filter((e) => e.tanggal === today).reduce((s, e) => s + e.nominal, 0);
  const habitsDone = habits.filter((h) => isDone(h)).length;
  const focusTask = useMemo(
    () => todayTasks.find((t) => t.status === "In Progress") ?? todayTasks.find((t) => t.status === "Todo"),
    [todayTasks],
  );

  const quick = [
    { label: "Transaksi", to: "/money/add", icon: Wallet },
    { label: "Tugas", to: "/plan", icon: CheckSquare },
    { label: "Olahraga", to: "/exercises", icon: TrendingUp },
    { label: "Habit", to: "/habits", icon: Repeat },
  ];

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] space-y-5">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate("/profile")}
          className="w-11 h-11 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center"
          aria-label="Profil"
        >
          {(profile?.nama || "L").slice(0, 1).toUpperCase()}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-50 truncate">
            Halo{profile?.nama ? `, ${profile.nama}` : ""}
          </p>
          <p className="text-[11px] text-gray-400">{greeting()}! Semoga hari ini produktif.</p>
        </div>
        <button onClick={openSearch} aria-label="Cari" className="p-1 text-gray-300">
          <Search size={20} />
        </button>
      </header>

      <p className="text-sm text-gray-300 flex items-center gap-2 px-1">
        <span className="capitalize">{format(new Date(), "EEE, d MMM yyyy", { locale: idLocale })}</span>
        <WeatherBadge />
      </p>

      <ReminderBanners />

      <Card className="space-y-3">
        <SectionTitle>Ringkasan Hari Ini</SectionTitle>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xl font-bold text-primary">{tasksDone}/{todayTasks.length}</p>
            <p className="text-[10px] text-gray-400">Tugas selesai</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-50 leading-7">{rupiah(spent)}</p>
            <p className="text-[10px] text-gray-400">Pengeluaran</p>
          </div>
          <div>
            <p className="text-xl font-bold text-primary">{habitsDone}/{habits.length}</p>
            <p className="text-[10px] text-gray-400">Habit</p>
          </div>
        </div>
      </Card>

      <Card onClick={() => navigate("/focus", { state: { taskId: focusTask?.id } })} className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-400">Fokus</p>
          <p className="text-sm font-medium text-gray-50 truncate">{focusTask ? focusTask.judul : "Mulai sesi fokus"}</p>
          <p className="text-[11px] text-gray-400">25 menit</p>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </Card>

      <div className="space-y-2">
        <SectionTitle>Quick Add</SectionTitle>
        <div className="grid grid-cols-4 gap-2">
          {quick.map(({ label, to, icon: Icon }) => (
            <Link key={label} to={to} className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-surface border border-surface-light text-[11px] text-gray-200">
              <Icon size={20} className="text-primary" />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <DailyQuote />
      <ExercisePlanWidget />
      <RecurringExpenseWidget />
    </div>
  );
}
