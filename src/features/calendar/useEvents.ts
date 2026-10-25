import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import type { CalendarEvent, CalendarEventInput } from "../../types";
import { t } from "../../lib/i18n";
import { syncEventReminders } from "../../utils/reminders";

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error } = await db
      .from("events")
      .select("*")
      .order("tanggal_mulai", { ascending: true });

    if (error) setError(error.message);
    else {
      setEvents(data as CalendarEvent[]);
      // Jaga pengingat lokal tetap sesuai daftar event terbaru (diam-diam kalau gagal).
      // Ditunda: jangan berebut jembatan native dengan pemuatan layar pertama.
      const list = data as CalendarEvent[];
      setTimeout(() => syncEventReminders(list).catch(() => {}), 4000);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const addEvent = async (input: CalendarEventInput) => {
    if (!user) return { error: t("Database belum siap") };
    const { error } = await db
      .from("events")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchEvents();
    return { error: null };
  };

  const updateEvent = async (id: string, input: CalendarEventInput) => {
    const { error } = await db.from("events").update(input).eq("id", id);
    if (error) return { error: error.message };
    await fetchEvents();
    return { error: null };
  };

  const deleteEvent = async (id: string) => {
    const { error } = await db.from("events").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchEvents();
    return { error: null };
  };

  return { events, loading, error, addEvent, updateEvent, deleteEvent };
}
