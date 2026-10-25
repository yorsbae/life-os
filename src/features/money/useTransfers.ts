import { useCallback, useEffect, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

import { t } from "../../lib/i18n";
export interface Transfer {
  id: string;
  user_id: string;
  dari_akun: string;
  ke_akun: string;
  nominal: number;
  tanggal: string;
  catatan: string | null;
  created_at: string;
}
export type TransferInput = Pick<Transfer, "dari_akun" | "ke_akun" | "nominal" | "tanggal" | "catatan">;

export function useTransfers() {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransfers = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db
      .from("transfers")
      .select("*")
      .order("tanggal", { ascending: false });
    if (!error) setTransfers(data as Transfer[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransfers();
  }, [fetchTransfers]);

  const addTransfer = async (input: TransferInput) => {
    if (!user) return { error: t("Database belum siap") };
    const { error } = await db.from("transfers").insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchTransfers();
    return { error: null };
  };

  const updateTransfer = async (id: string, input: TransferInput) => {
    const { error } = await db.from("transfers").update(input).eq("id", id);
    if (error) return { error: error.message };
    await fetchTransfers();
    return { error: null };
  };

  const deleteTransfer = async (id: string) => {
    const { error } = await db.from("transfers").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchTransfers();
    return { error: null };
  };

  return { transfers, loading, addTransfer, updateTransfer, deleteTransfer, refetch: fetchTransfers };
}
