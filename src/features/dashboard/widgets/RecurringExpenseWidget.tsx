import { Link } from "react-router-dom";
import { Repeat } from "lucide-react";
import { useRecurringExpenses } from "../../money/useRecurringExpenses";
import { rupiah } from "../../../utils/format";
import { t } from "../../../lib/i18n";

function daysUntilDue(tanggal: number) {
  const now = new Date();
  let due = new Date(now.getFullYear(), now.getMonth(), tanggal);
  if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, tanggal);
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

export default function RecurringExpenseWidget() {
  const { items, loading, totalBulanan } = useRecurringExpenses();

  const aktif = items.filter((i) => i.aktif);
  const terdekat = [...aktif]
    .sort((a, b) => daysUntilDue(a.tanggal_jatuh_tempo) - daysUntilDue(b.tanggal_jatuh_tempo))
    .slice(0, 3);

  if (loading || aktif.length === 0) return null;

  return (
    <Link to="/money" className="card p-4 block space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2 min-w-0">
          <Repeat size={16} className="text-primary shrink-0" />
          <span className="truncate">{t("Pengeluaran Rutin")}</span>
        </h3>
        <span className="text-xs text-gray-400 shrink-0">{t("{0}/bulan", [rupiah(totalBulanan)])}</span>
      </div>
      <div className="space-y-2">
        {terdekat.map((item) => {
          const days = daysUntilDue(item.tanggal_jatuh_tempo);
          return (
            <div key={item.id} className="flex items-center justify-between text-sm gap-2">
              <span className="text-gray-100 truncate">{item.nama}</span>
              <span className={`text-xs shrink-0 ${days <= 3 ? "text-amber-300 font-medium" : "text-gray-400"}`}>
                {days === 0 ? t("Hari ini") : t("{0} hari lagi", [days])}
              </span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
