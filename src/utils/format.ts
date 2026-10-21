import { format as dfFormat } from "date-fns";
import { dateLocale, intlLocale } from "../lib/i18n";

export function rupiah(n: number): string {
  return "Rp " + new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function num(n: number, max = 1): string {
  return new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: max }).format(n);
}

/** Format tanggal sesuai bahasa aktif. Pola date-fns, mis. "EEE, d MMM yyyy". */
export function fmtDate(d: Date | string | number, pattern: string): string {
  const date = typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + "T00:00:00") : new Date(d);
  return dfFormat(date, pattern, { locale: dateLocale() });
}
