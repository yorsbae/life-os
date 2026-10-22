import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Search, Wallet, CheckSquare, Dumbbell, Repeat, Timer } from "lucide-react";
import { addDays, startOfWeek } from "date-fns";
import { useProfile } from "../profile/useProfile";
import { useTasks } from "../plan/useTasks";
import { useHabits } from "../habit/useHabits";
import { useExpenses } from "../expense/useExpenses";
import { useEvents } from "../calendar/useEvents";
import { useShell } from "../../context/ShellContext";
import { Card, SectionTitle } from "../../components/ui/Controls";
import { toDateStr } from "../../utils/dates";
import { fmtDate } from "../../utils/format";
import { rupiahCompact } from "../../utils/compactMoney";
import { HOME_SECTIONS, loadHomeSections, type HomeSection } from "../../utils/homeSections";
import { t, tx } from "../../lib/i18n";
import { useReminders } from "./reminders/useReminders";
import ReminderBanners from "./reminders/ReminderBanners";
import WeatherBadge from "./widgets/WeatherBadge";
import DailyQuote from "./widgets/DailyQuote";
import ExercisePlanWidget from "./widgets/ExercisePlanWidget";
import RecurringExpenseWidget from "./widgets/RecurringExpenseWidget";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return t("Selamat pagi");
  if (h < 15) return t("Selamat siang");
  if (h < 18) return t("Selamat sore");
  return t("Selamat malam");
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { openSearch } = useShell();
  const { profile } = useProfile();
  const { tasks } = useTasks();
  const { habits, isDone } = useHabits();
  const { expenses } = useExpenses();
  const { events } = useEvents();
  const reminders = useReminders();

  const [selected, setSelected] = useState(() => toDateStr());
  const [showReminders, setShowReminders] = useState(true);
  const [sections, setSections] = useState<Record<HomeSection, boolean>>(
    () => Object.fromEntries(HOME_SECTIONS.map((s) => [s, true])) as Record<HomeSection, boolean>,
  );
  useEffect(() => {
    loadHomeSections().then(setSections);
  }, []);

  const today = toDateStr();
  const week = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, []);

  const dayTasks = tasks.filter((x) => x.tanggal_mulai === selected);
  const tasksDone = dayTasks.filter((x) => x.status === "Selesai").length;
  const dayEvents = events.filter((e) => e.tanggal_mulai.slice(0, 10) === selected).length;
  const spent = expenses.filter((e) => e.tanggal === selected).reduce((s, e) => s + e.nominal, 0);
  const habitsDone = habits.filter((h) => isDone(h, selected)).length;
  const focusTask = dayTasks.find((x) => x.status === "In Progress") ?? dayTasks.find((x) => x.status === "Todo");

  const quick = [
    { label: t("Transaksi"), to: "/money/add", icon: Wallet },
    { label: t("Tugas"), to: "/plan", icon: CheckSquare },
    { label: t("Olahraga"), to: "/exercises", icon: Dumbbell },
    { label: t("Kebiasaan"), to: "/habits", icon: Repeat },
  ];

  const stats = [
    { value: `${tasksDone}/${dayTasks.length}`, label: t("Tugas selesai") },
    { value: String(dayEvents), label: t("Kegiatan") },
    { value: rupiahCompact(spent), label: t("Pengeluaran") },
    { value: `${habitsDone}/${habits.length}`, label: t("Kebiasaan") },
  ];

  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-6 space-y-5">
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate("/profile")}
          className="w-11 h-11 shrink-0 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center"
          aria-label={t("Profil")}
        >
          {(profile?.nama || "L").slice(0, 1).toUpperCase()}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-50 truncate">
            {profile?.nama ? t("Halo, {0}", [profile.nama]) : t("Halo")}
          </p>
          <p className="text-[11px] text-gray-400 truncate">{greeting()}! {t("Semoga hari ini produktif.")}</p>
        </div>
        {sections.reminders && (
          <button
            onClick={() => setShowReminders((v) => !v)}
            aria-label={t("Pengingat")}
            className="relative p-1.5 text-gray-300"
          >
            <Bell size={20} />
            {reminders.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-on-primary text-[9px] font-bold flex items-center justify-center">
                {reminders.length}
              </span>
            )}
          </button>
        )}
        <button onClick={openSearch} aria-label={t("Cari")} className="p-1.5 text-gray-300">
          <Search size={20} />
        </button>
      </header>

      <p className="text-sm text-gray-300 flex items-center gap-2 px-1 flex-wrap">
        <span>{fmtDate(new Date(), "EEE, d MMM yyyy")}</span>
        <WeatherBadge />
      </p>

      {sections.week && (
        <div className="grid grid-cols-7 gap-1">
          {week.map((d) => {
            const key = toDateStr(d);
            const active = key === selected;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1 py-2 rounded-2xl text-center transition ${
                  active ? "bg-primary text-on-primary" : "bg-surface text-gray-300 border border-surface-light"
                }`}
              >
                <span className={`text-[10px] ${active ? "opacity-80" : "text-gray-400"}`}>{fmtDate(d, "EEE")}</span>
                <span className="text-sm font-semibold">{d.getDate()}</span>
                {key === today && <span className={`w-1 h-1 rounded-full ${active ? "bg-on-primary" : "bg-primary"}`} />}
              </button>
            );
          })}
        </div>
      )}

      {sections.reminders && showReminders && <ReminderBanners reminders={reminders} />}

      {sections.summary && (
        <Card className="space-y-3">
          <SectionTitle>{selected === today ? t("Ringkasan Hari Ini") : t("Ringkasan {0}", [fmtDate(selected, "d MMM")])}</SectionTitle>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {stats.map((s, i) => (
              <div key={i} className="min-w-0">
                <p className="text-sm font-bold text-primary truncate">{tx(s.value)}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5 break-words">{tx(s.label)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {sections.focus && (
        <Card onClick={() => navigate("/focus", { state: { taskId: focusTask?.id } })} className="flex items-center gap-3">
          <span className="w-10 h-10 shrink-0 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Timer size={18} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-gray-400">{t("Fokus")}</p>
            <p className="text-sm font-medium text-gray-50 truncate">{focusTask ? tx(focusTask.judul) : t("Mulai sesi fokus")}</p>
            <p className="text-[11px] text-gray-400">{t("{0} menit", [25])}</p>
          </div>
          <ChevronRight size={18} className="text-gray-400 shrink-0" />
        </Card>
      )}

      {sections.quickadd && (
        <div className="space-y-2">
          <SectionTitle>{t("Tambah Cepat")}</SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            {quick.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl bg-surface border border-surface-light text-[11px] text-gray-200 text-center"
              >
                <Icon size={20} className="text-primary" />
                <span className="leading-tight break-words max-w-full">{tx(label)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {sections.quote && <DailyQuote />}
      {sections.training && <ExercisePlanWidget />}
      {sections.recurring && <RecurringExpenseWidget />}
    </div>
  );
}
