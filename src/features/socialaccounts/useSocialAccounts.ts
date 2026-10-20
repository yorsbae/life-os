import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: string;
  username: string;
  password_encrypted: string | null;
  niche: string | null;
  tujuan: string | null;
  status: "Aktif" | "Nonaktif";
  created_at: string;
}
export type SocialAccountInput = Omit<
  SocialAccount,
  "id" | "user_id" | "created_at"
>;

export const PLATFORM_OPTIONS = [
  "Instagram",
  "TikTok",
  "Facebook",
  "YouTube",
  "Twitter/X",
  "Lainnya",
];
export const TUJUAN_OPTIONS = [
  "Upload Konten",
  "Brand Partnership",
  "Personal",
  "Backup Account",
];
export const NICHE_OPTIONS = [
  "Daily Life",
  "Travel",
  "Food",
  "Workout",
  "Fashion",
  "Tech",
  "Comedy",
  "Education",
  "Lainnya",
];

export function useSocialAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from("social_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setAccounts(data as SocialAccount[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = async (input: SocialAccountInput) => {
    if (!user) return { error: "Belum login" };
    const { error } = await db
      .from("social_accounts")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchAccounts();
    return { error: null };
  };

  const updateAccount = async (
    id: string,
    input: Partial<SocialAccountInput>,
  ) => {
    const { error } = await db
      .from("social_accounts")
      .update(input)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchAccounts();
    return { error: null };
  };

  const deleteAccount = async (id: string) => {
    await db.from("social_accounts").delete().eq("id", id);
    await fetchAccounts();
  };

  return { accounts, loading, addAccount, updateAccount, deleteAccount };
}
