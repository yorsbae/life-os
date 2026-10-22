import { Route, Routes, useNavigate } from "react-router-dom";
import { Bell, ChevronRight, Database, Info, Languages, LayoutDashboard, Palette, Pencil, ShieldCheck, type LucideIcon } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Controls";
import { useProfile } from "./useProfile";
import { LANGUAGES, getLang, t, tx } from "../../lib/i18n";
import EditProfile from "./EditProfile";
import { AboutPage, AppearancePage, DataPage, LanguagePage, ModulesPage, PrivacyPage, RemindersPage } from "./SettingsPages";

interface Row { to: string; icon: LucideIcon; title: string; sub: string }

function SettingsHome() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const langName = LANGUAGES.find((l) => l.code === getLang())?.native ?? "";

  const rows: Row[] = [
    { to: "appearance", icon: Palette, title: t("Tampilan"), sub: t("Tema, warna, ukuran") },
    { to: "modules", icon: LayoutDashboard, title: t("Dashboard & Modul"), sub: t("Atur tampilan Home") },
    { to: "reminders", icon: Bell, title: t("Pengingat"), sub: t("Jadwal dan cuaca") },
    { to: "data", icon: Database, title: t("Data & Backup"), sub: t("Backup, impor, ekspor") },
    { to: "privacy", icon: ShieldCheck, title: t("Privasi & Keamanan"), sub: t("Kontrol data dan nominal") },
    { to: "language", icon: Languages, title: t("Bahasa"), sub: langName },
    { to: "about", icon: Info, title: t("Tentang Life OS"), sub: t("Versi dan info aplikasi") },
  ];

  return (
    <div className="pb-10">
      <PageHeader title={t("Profil & Pengaturan")} />
      <div className="px-4 space-y-4">
        <Card onClick={() => navigate("edit")} className="flex items-center gap-3">
          <span className="w-14 h-14 rounded-full bg-primary/20 text-primary text-xl font-bold flex items-center justify-center shrink-0">
            {(profile?.nama || "L").slice(0, 1).toUpperCase()}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-base font-semibold text-gray-50 truncate">{profile?.nama || t("Pengguna")}</span>
            <span className="block text-xs text-gray-400 truncate">{profile?.username || t("Belum ada email")}</span>
          </span>
          <Pencil size={16} className="text-gray-400 shrink-0" />
        </Card>

        <div className="card divide-y divide-surface-light overflow-hidden">
          {rows.map(({ to, icon: Icon, title, sub }) => (
            <button key={to} onClick={() => navigate(to)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
              <span className="w-9 h-9 rounded-xl bg-surface-light text-primary flex items-center justify-center shrink-0"><Icon size={18} /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-gray-50 truncate">{tx(title)}</span>
                <span className="block text-[11px] text-gray-400 truncate">{tx(sub)}</span>
              </span>
              <ChevronRight size={16} className="text-gray-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Routes>
      <Route index element={<SettingsHome />} />
      <Route path="edit" element={<EditProfile />} />
      <Route path="appearance" element={<AppearancePage />} />
      <Route path="modules" element={<ModulesPage />} />
      <Route path="reminders" element={<RemindersPage />} />
      <Route path="data" element={<DataPage />} />
      <Route path="privacy" element={<PrivacyPage />} />
      <Route path="language" element={<LanguagePage />} />
      <Route path="about" element={<AboutPage />} />
    </Routes>
  );
}
