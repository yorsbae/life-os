import {
  Utensils, Car, ShoppingBag, HeartPulse, Receipt, Gamepad2, MoreHorizontal,
  Briefcase, Laptop, Gift, TrendingUp, Heart, Wallet, Landmark, Smartphone, type LucideIcon,
} from "lucide-react";

export interface CatMeta {
  /** teks sumber untuk t() */
  label: string;
  icon: LucideIcon;
  color: string;
}

// Kunci = nilai yang disimpan di database (expenses.kategori / incomes.kategori).
export const EXPENSE_CATS: Record<string, CatMeta> = {
  Makan: { label: "Makanan", icon: Utensils, color: "#f0a35e" },
  Transport: { label: "Transportasi", icon: Car, color: "#6aa8e8" },
  Belanja: { label: "Belanja", icon: ShoppingBag, color: "#e87aa8" },
  Kesehatan: { label: "Kesehatan", icon: HeartPulse, color: "#e57373" },
  Tagihan: { label: "Tagihan", icon: Receipt, color: "#e6c25e" },
  Hiburan: { label: "Hiburan", icon: Gamepad2, color: "#a98be8" },
  Lainnya: { label: "Lainnya", icon: MoreHorizontal, color: "#8b8f93" },
};

export const INCOME_CATS: Record<string, CatMeta> = {
  Gaji: { label: "Gaji", icon: Briefcase, color: "#7dc7a0" },
  Freelance: { label: "Freelance", icon: Laptop, color: "#5fb7c9" },
  Bonus: { label: "Bonus", icon: Gift, color: "#e6c25e" },
  Investasi: { label: "Investasi", icon: TrendingUp, color: "#94d1b0" },
  Hadiah: { label: "Hadiah", icon: Heart, color: "#e87aa8" },
  Lainnya: { label: "Lainnya", icon: MoreHorizontal, color: "#8b8f93" },
};

export function expenseMeta(k: string | null | undefined): CatMeta {
  return EXPENSE_CATS[k ?? ""] ?? { ...EXPENSE_CATS.Lainnya, label: k || "Lainnya" };
}
export function incomeMeta(k: string | null | undefined): CatMeta {
  return INCOME_CATS[k ?? ""] ?? { ...INCOME_CATS.Lainnya, label: k || "Lainnya" };
}

export const ACCOUNT_ICON: Record<string, LucideIcon> = {
  Tunai: Wallet,
  Bank: Landmark,
  "E-Wallet": Smartphone,
};
export const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  Tunai: "Tunai",
  Bank: "Bank",
  "E-Wallet": "E-Wallet",
};
