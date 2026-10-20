export type Granularity = "daily" | "weekly" | "monthly";

export interface SeriesPoint {
  label: string;
  value: number;
}

interface RawItem {
  tanggal: string;
  value: number;
}

// Mundur N periode dari hari ini, hasilkan tanggal awal tiap periode
function getPeriodStarts(granularity: Granularity, count: number): Date[] {
  const starts: Date[] = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    if (granularity === "daily") d.setDate(now.getDate() - i);
    else if (granularity === "weekly") d.setDate(now.getDate() - i * 7);
    else d.setMonth(now.getMonth() - i);
    starts.push(d);
  }
  return starts;
}

function formatLabel(date: Date, granularity: Granularity): string {
  if (granularity === "daily")
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  if (granularity === "weekly")
    return `Mgg ${date.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`;
  return date.toLocaleDateString("id-ID", { month: "short", year: "2-digit" });
}

function isInPeriod(
  itemDate: Date,
  periodStart: Date,
  granularity: Granularity,
): boolean {
  if (granularity === "daily") {
    return itemDate.toDateString() === periodStart.toDateString();
  }
  if (granularity === "weekly") {
    const end = new Date(periodStart);
    end.setDate(end.getDate() + 7);
    return itemDate >= periodStart && itemDate < end;
  }
  // monthly
  return (
    itemDate.getFullYear() === periodStart.getFullYear() &&
    itemDate.getMonth() === periodStart.getMonth()
  );
}

/**
 * Ubah list item mentah (tanggal + value) jadi series siap-chart, sudah dikelompokkan per periode.
 * Dipakai untuk SEMUA domain (Money/Body/Mind&Growth/Creative Brain) - cuma beda apa yang dihitung sebagai "value".
 */
export function aggregateByPeriod(
  items: RawItem[],
  granularity: Granularity,
  count = 7,
): SeriesPoint[] {
  const periodStarts = getPeriodStarts(granularity, count);

  return periodStarts.map((start) => {
    const sum = items
      .filter((item) => isInPeriod(new Date(item.tanggal), start, granularity))
      .reduce((acc, item) => acc + item.value, 0);
    return { label: formatLabel(start, granularity), value: sum };
  });
}

// Insight otomatis: bandingkan total periode SEKARANG vs SEBELUMNYA (kalkulasi, bukan AI)
export function generateInsight(
  series: SeriesPoint[],
  unit: string,
  noun: string,
): string | null {
  if (series.length < 2) return null;
  const current = series[series.length - 1].value;
  const previous = series[series.length - 2].value;

  if (previous === 0 && current === 0) return null;
  if (previous === 0)
    return `${noun} periode ini: ${current}${unit} (belum ada data periode sebelumnya untuk dibandingkan)`;

  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return `${noun} periode ini sama dengan periode sebelumnya`;

  const arah = change > 0 ? "naik" : "turun";
  return `${noun} ${arah} ${Math.abs(change)}% dibanding periode sebelumnya`;
}
