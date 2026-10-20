import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { Note, NoteInput } from "../../types";

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Urutkan: yang di-pin duluan, baru berdasarkan tanggal terbaru
    const { data, error } = await db
      .from("notes")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error) setNotes(data as Note[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (input: NoteInput) => {
    if (!user) return { error: "Belum login" };
    const { error } = await db
      .from("notes")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchNotes();
    return { error: null };
  };

  const updateNote = async (id: string, input: Partial<NoteInput>) => {
    const { error } = await db.from("notes").update(input).eq("id", id);
    if (error) return { error: error.message };
    await fetchNotes();
    return { error: null };
  };

  const deleteNote = async (id: string) => {
    const { error } = await db.from("notes").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchNotes();
    return { error: null };
  };

  const togglePin = async (note: Note) => {
    return updateNote(note.id, { is_pinned: !note.is_pinned });
  };

  return { notes, loading, addNote, updateNote, deleteNote, togglePin };
}
