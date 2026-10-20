import { format } from "date-fns";

/** 'YYYY-MM-DD' pada zona waktu lokal (bukan UTC), aman untuk WIB. */
export function toDateStr(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
