import { intlLocale } from "../lib/i18n";

/** Rupiah ringkas untuk ruang sempit: "Rp 1,2 jt" (id), "Rp 1.2M" (en), "Rp 120万" (zh/ja). */
export function rupiahCompact(n: number): string {
  if (Math.abs(n) < 10000) return "Rp " + new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 0 }).format(Math.round(n));
  return (
    "Rp " +
    new Intl.NumberFormat(intlLocale(), { notation: "compact", maximumFractionDigits: 1 }).format(n)
  );
}
