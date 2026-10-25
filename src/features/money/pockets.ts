import {
  Car, GraduationCap, Heart, Home, Landmark, PiggyBank, Plane, ShieldCheck, ShoppingBag, Smartphone,
  Utensils, Wallet, Gift, HeartPulse, Gamepad2, TrendingUp, type LucideIcon,
} from "lucide-react";

export interface PocketIcon {
  icon: LucideIcon;
  color: string;
}

// Kunci = nilai yang disimpan di pockets.ikon.
export const POCKET_ICONS: Record<string, PocketIcon> = {
  heart: { icon: Heart, color: "#e8606a" },
  shield: { icon: ShieldCheck, color: "#8b8fe8" },
  car: { icon: Car, color: "#6aa8e8" },
  landmark: { icon: Landmark, color: "#5fb7c9" },
  wallet: { icon: Wallet, color: "#7dc7a0" },
  piggy: { icon: PiggyBank, color: "#e87aa8" },
  home: { icon: Home, color: "#f0a35e" },
  school: { icon: GraduationCap, color: "#a98be8" },
  plane: { icon: Plane, color: "#5fb7c9" },
  gift: { icon: Gift, color: "#e6c25e" },
  food: { icon: Utensils, color: "#f0a35e" },
  shop: { icon: ShoppingBag, color: "#e87aa8" },
  health: { icon: HeartPulse, color: "#e57373" },
  phone: { icon: Smartphone, color: "#6aa8e8" },
  game: { icon: Gamepad2, color: "#a98be8" },
  invest: { icon: TrendingUp, color: "#94d1b0" },
};

export const POCKET_ICON_KEYS = Object.keys(POCKET_ICONS);

export function pocketIcon(key: string | null | undefined): PocketIcon {
  return POCKET_ICONS[key ?? ""] ?? POCKET_ICONS.wallet;
}
