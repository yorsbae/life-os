import { useCallback, useEffect, useState } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import { toDateStr } from "../../utils/dates";

export type TaskPriority = "P1" | "P2" | "P3";
export type TaskStatus = "Todo" | "In Progress" | "Selesai";

export interface Task {
  id: string;
  user_id: string;
  judul: string;
  deskripsi: string | null;
  prioritas: TaskPriority;
  status: TaskStatus;
  tanggal_mulai: string | null;
  tanggal_selesai: string | null;
  jam_mulai: string | null;
  jam_selesai: string | null;
  kategori: string | null;
  selesai_pada: string | null;
}
export type TaskInput = Partial<Omit<Task, "id" | "user_id">> & { judul: string };

export interface Subtask {
  id: string;
  task_id: string;
  judul: string;
  is_done: boolean;
  urutan: number;
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  P1: "P1 Prioritas",
  P2: "P2 Normal",
  P3: "P3 Santai",
};

export function formatRange(t: Pick<Task, "jam_mulai" | "jam_selesai">) {
  if (t.jam_mulai && t.jam_selesai) return `${t.jam_mulai} - ${t.jam_selesai}`;
  return t.jam_mulai ?? "Sepanjang hari";
}

/** Seluruh tugas, urut tanggal lalu jam. Filter hari/minggu/bulan dilakukan di UI. */
export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db
      .from("tasks")
      .select("*")
      .order("tanggal_mulai", { ascending: true });
    if (!error) {
      const rows = (data as Task[]).slice();
      rows.sort(
        (a, b) =>
          (a.tanggal_mulai ?? "").localeCompare(b.tanggal_mulai ?? "") ||
          (a.jam_mulai ?? "99:99").localeCompare(b.jam_mulai ?? "99:99"),
      );
      setTasks(rows);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (input: TaskInput) => {
    if (!user) return { error: "Database belum siap", id: null as string | null };
    const id = crypto.randomUUID();
    const { error } = await db.from("tasks").insert({
      tanggal_mulai: toDateStr(),
      ...input,
      id,
      user_id: user.id,
    });
    if (error) return { error: error.message, id: null };
    await fetchTasks();
    return { error: null, id };
  };

  const updateTask = async (id: string, input: Partial<TaskInput>) => {
    const { error } = await db.from("tasks").update(input).eq("id", id);
    if (error) return { error: error.message };
    await fetchTasks();
    return { error: null };
  };

  const toggleDone = async (task: Task) => {
    const done = task.status !== "Selesai";
    return updateTask(task.id, {
      status: done ? "Selesai" : "Todo",
      selesai_pada: done ? new Date().toISOString() : null,
    });
  };

  const deleteTask = async (id: string) => {
    await db.from("tasks").delete().eq("id", id);
    await fetchTasks();
  };

  return { tasks, loading, addTask, updateTask, toggleDone, deleteTask, refetch: fetchTasks };
}

export function useSubtasks(taskId: string | undefined) {
  const { user } = useAuth();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const fetchSubtasks = useCallback(async () => {
    if (!user || !taskId) return;
    const { data, error } = await db
      .from("task_subtasks")
      .select("*")
      .eq("task_id", taskId)
      .order("urutan", { ascending: true });
    if (!error) setSubtasks(data as Subtask[]);
  }, [user, taskId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubtasks();
  }, [fetchSubtasks]);

  const addSubtask = async (judul: string) => {
    if (!user || !taskId || !judul.trim()) return;
    await db.from("task_subtasks").insert({
      task_id: taskId,
      user_id: user.id,
      judul: judul.trim(),
      is_done: false,
      urutan: subtasks.length,
    });
    await fetchSubtasks();
  };

  const toggleSubtask = async (s: Subtask) => {
    await db.from("task_subtasks").update({ is_done: !s.is_done }).eq("id", s.id);
    await fetchSubtasks();
  };

  const deleteSubtask = async (id: string) => {
    await db.from("task_subtasks").delete().eq("id", id);
    await fetchSubtasks();
  };

  return { subtasks, addSubtask, toggleSubtask, deleteSubtask };
}
