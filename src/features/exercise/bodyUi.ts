import { Activity, Bike, Dumbbell, Flower2, Footprints, Waves, type LucideIcon } from "lucide-react";
import { fmtDate } from "../../utils/format";

/** Nama hari sesuai bahasa aktif. hari: 0=Minggu ... 6=Sabtu. */
export function dayName(hari: number, pattern: "EEEE" | "EEE" = "EEEE") {
  return fmtDate(new Date(2024, 0, 7 + hari), pattern); // 7 Jan 2024 = Minggu
}

/** Urutan tampil Senin ... Minggu. */
export const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const ICONS: Record<string, LucideIcon> = {
  Running: Footprints,
  Strength: Dumbbell,
  Swimming: Waves,
  Cycling: Bike,
  Yoga: Flower2,
};
export function exerciseIcon(tipe: string): LucideIcon {
  return ICONS[tipe] ?? Activity;
}
