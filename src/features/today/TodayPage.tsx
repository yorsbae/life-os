import { Link } from "react-router-dom";
import { CalendarDays, CheckSquare, Repeat, Wallet } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import { Card, SectionTitle } from "../../components/ui/Controls";
import { fmtDate } from "../../utils/format";
import { rupiahCompact } from "../../utils/compactMoney";
import { hideAmounts } from "../../lib/privacy";
import { t, tx } from "../../lib/i18n";
import type { ScoreKey } from "../../utils/scorecard";
import { useToday } from "./useToday";

const SCORE_LABEL: Record<ScoreKey, string> = {
  tasks: "Tugas",
  habits: "Kebiasaan",
  focus: "Fokus",
  reflection: "Refleksi",
};

function Bar({ value }: { value: number | null }) {
  return (
    <div className="h-1.5 rounded-full bg-surface-light overflow-hidden">
      <div className="h-full bg-primary" style={{ width: `${value ?? 0}%` }} />
    </div>
  );
}

export default function TodayPage() {
  const { data, error } = useToday();

  return (
    <div>
      <PageHeader title={t("Hari Ini")} />
      <div className="px-4 space-y-5 pb-6">
        <p className="text-xs text-gray-400 px-1">{fmtDate(new Date(), "EEEE, d MMMM yyyy")}</p>

        {error && <p className="text-xs text-red-400 break-words">{tx(error)}</p>}
        {!data && !error && <p className="text-sm text-gray-400 text-center py-10">{t("Memuat...")}</p>}

        {data && (
          <>
            <Card>
              <div className="flex items-end justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-100">{t("Skor Pekan Ini")}</h2>
                <span className="text-3xl font-bold text-primary">{data.score.overall ?? "–"}</span>
              </div>
              <div className="space-y-2.5">
                {data.score.items.map((it) => (
                  <div key={it.key} className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>{t(SCORE_LABEL[it.key])}</span>
                      <span>{it.score === null ? "–" : it.score}</span>
                    </div>
                    <Bar value={it.score} />
                  </div>
                ))}
              </div>
            </Card>

            <section className="space-y-2">
              <SectionTitle action={<Link to="/plan" className="text-xs text-primary">{t("Buka")}</Link>}>
                <CheckSquare size={14} className="inline -mt-0.5 mr-1.5" />
                {t("Tugas hari ini")}
              </SectionTitle>
              <Card>
                {data.tasks.length === 0 ? (
                  <p className="text-xs text-gray-400">{t("Tidak ada tugas hari ini")}</p>
                ) : (
                  <ul className="space-y-2">
                    {data.tasks.map((x) => (
                      <li key={x.id} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${x.status === "Selesai" ? "bg-primary" : "bg-gray-500"}`} />
                        <span className={x.status === "Selesai" ? "line-through text-gray-500" : "text-gray-100"}>{x.judul}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            <section className="space-y-2">
              <SectionTitle action={<Link to="/habits" className="text-xs text-primary">{t("Buka")}</Link>}>
                <Repeat size={14} className="inline -mt-0.5 mr-1.5" />
                {t("Habit hari ini")}
              </SectionTitle>
              <Card>
                {data.habits.length === 0 ? (
                  <p className="text-xs text-gray-400">{t("Belum ada kebiasaan")}</p>
                ) : (
                  <ul className="space-y-3">
                    {data.habits.map((h) => (
                      <li key={h.id} className="space-y-1">
                        <div className="flex justify-between text-sm text-gray-100">
                          <span>{tx(h.nama)}</span>
                          <span className="text-xs text-gray-400">{h.nilai}/{h.target}</span>
                        </div>
                        <Bar value={Math.min(100, Math.round((h.nilai / Math.max(h.target, 0.0001)) * 100))} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            <section className="space-y-2">
              <SectionTitle action={<Link to="/calendar" className="text-xs text-primary">{t("Buka")}</Link>}>
                <CalendarDays size={14} className="inline -mt-0.5 mr-1.5" />
                {t("Agenda hari ini")}
              </SectionTitle>
              <Card>
                {data.events.length === 0 ? (
                  <p className="text-xs text-gray-400">{t("Tidak ada agenda")}</p>
                ) : (
                  <ul className="space-y-2">
                    {data.events.map((e) => (
                      <li key={e.id} className="text-sm text-gray-100">{e.judul}</li>
                    ))}
                  </ul>
                )}
              </Card>
            </section>

            <Link to="/money" className="block">
              <Card>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm text-gray-100">
                    <Wallet size={16} className="text-primary" />
                    {t("Pengeluaran hari ini")}
                  </span>
                  <span className="text-sm font-semibold text-gray-50">
                    {hideAmounts() ? "Rp ••••" : rupiahCompact(data.spentToday)}
                  </span>
                </div>
              </Card>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
