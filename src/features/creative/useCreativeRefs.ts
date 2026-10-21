import { useCallback, useEffect, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

export interface CreativeRef {
  id: string;
  user_id: string;
  judul: string;
  url: string | null;
  catatan: string | null;
  created_at: string;
}
export type CreativeRefInput = Pick<CreativeRef, "judul" | "url" | "catatan">;

export function useCreativeRefs() {
  const { user } = useAuth();
  const [refs, setRefs] = useState<CreativeRef[]>([]);

  const fetchRefs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db.from("creative_refs").select("*").order("created_at", { ascending: false });
    if (!error) setRefs(data as CreativeRef[]);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRefs();
  }, [fetchRefs]);

  const addRef = async (input: CreativeRefInput) => {
    if (!user) return;
    await db.from("creative_refs").insert({ ...input, user_id: user.id });
    await fetchRefs();
  };
  const updateRef = async (id: string, input: Partial<CreativeRefInput>) => {
    await db.from("creative_refs").update(input).eq("id", id);
    await fetchRefs();
  };
  const deleteRef = async (id: string) => {
    await db.from("creative_refs").delete().eq("id", id);
    await fetchRefs();
  };
  return { refs, addRef, updateRef, deleteRef };
}
