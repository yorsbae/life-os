import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

export type StudyTipe = "Kursus" | "Buku";

export interface StudyItem {
  id: string;
  user_id: string;
  judul: string;
  tipe: StudyTipe;
  selesai: number;
  total: number | null;
  satuan: string | null;
  catatan: string | null;
  created_at: string;
}
export type StudyItemInput = Omit<StudyItem, "id" | "user_id" | "created_at">;

/** Materi belajar bertahap (kursus, modul, dll). Buku memakai tabel readings. */
export function useStudyItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<StudyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db.from("study_items").select("*").order("created_at", { ascending: false });
    if (!error) setItems(data as StudyItem[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  const addItem = async (input: StudyItemInput) => {
    if (!user) return { error: "Database belum siap" };
    const { error } = await db.from("study_items").insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchItems();
    return { error: null };
  };

  const updateItem = async (id: string, input: Partial<StudyItemInput>) => {
    const { error } = await db.from("study_items").update(input).eq("id", id);
    if (error) return { error: error.message };
    await fetchItems();
    return { error: null };
  };

  const deleteItem = async (id: string) => {
    const { error } = await db.from("study_items").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchItems();
    return { error: null };
  };

  return { items, loading, addItem, updateItem, deleteItem };
}
