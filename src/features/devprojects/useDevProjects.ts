import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";

export interface DevProject {
  id: string;
  user_id: string;
  nama: string;
  riset_kebutuhan: string | null;
  status: "Aktif" | "Selesai" | "Ditunda" | "Arsip";
  created_at: string;
}
export interface DevLog {
  id: string;
  project_id: string;
  tanggal: string;
  catatan: string;
}
export interface DevTodo {
  id: string;
  project_id: string;
  judul: string;
  is_done: boolean;
}
export interface DevIssue {
  id: string;
  project_id: string;
  masalah: string;
  solusi: string | null;
  status: "Open" | "Resolved";
}

export function useDevProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<DevProject[]>([]);
  // Progres tiap project = to-do selesai / total to-do
  const [progress, setProgress] = useState<Record<string, { done: number; total: number }>>({});
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from("dev_projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setProjects(data as DevProject[]);
    const todos = await db.from("dev_project_todos").select("project_id, is_done");
    if (!todos.error) {
      const map: Record<string, { done: number; total: number }> = {};
      for (const r of todos.data as { project_id: string; is_done: boolean }[]) {
        const m = (map[r.project_id] ??= { done: 0, total: 0 });
        m.total++;
        if (r.is_done) m.done++;
      }
      setProgress(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (nama: string, riset_kebutuhan: string) => {
    if (!user) return { error: "Belum login" };
    const { error } = await db
      .from("dev_projects")
      .insert({ user_id: user.id, nama, riset_kebutuhan, status: "Aktif" });
    if (error) return { error: error.message };
    await fetchProjects();
    return { error: null };
  };

  const updateProject = async (
    id: string,
    input: Partial<Omit<DevProject, "id" | "user_id">>,
  ) => {
    const { error } = await db
      .from("dev_projects")
      .update(input)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchProjects();
    return { error: null };
  };

  const deleteProject = async (id: string) => {
    const { error } = await db.from("dev_projects").delete().eq("id", id);
    if (error) return { error: error.message };
    await fetchProjects();
    return { error: null };
  };

  return { projects, progress, loading, addProject, updateProject, deleteProject, refetch: fetchProjects };
}

// Hook terpisah untuk detail 1 project (logs, todos, issues) - dipanggil saat project dibuka
export function useDevProjectDetail(projectId: string) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<DevLog[]>([]);
  const [todos, setTodos] = useState<DevTodo[]>([]);
  const [issues, setIssues] = useState<DevIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [logsRes, todosRes, issuesRes] = await Promise.all([
      db
        .from("dev_project_logs")
        .select("*")
        .eq("project_id", projectId)
        .order("tanggal", { ascending: false }),
      db
        .from("dev_project_todos")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      db
        .from("dev_project_issues")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);
    if (logsRes.data) setLogs(logsRes.data as DevLog[]);
    if (todosRes.data) setTodos(todosRes.data as DevTodo[]);
    if (issuesRes.data) setIssues(issuesRes.data as DevIssue[]);
    setLoading(false);
  }, [user, projectId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const addLog = async (catatan: string, tanggal: string) => {
    if (!user) return;
    await db
      .from("dev_project_logs")
      .insert({ project_id: projectId, user_id: user.id, catatan, tanggal });
    await fetchAll();
  };
  const deleteLog = async (id: string) => {
    await db.from("dev_project_logs").delete().eq("id", id);
    await fetchAll();
  };

  const addTodo = async (judul: string) => {
    if (!user) return;
    await db
      .from("dev_project_todos")
      .insert({
        project_id: projectId,
        user_id: user.id,
        judul,
        is_done: false,
      });
    await fetchAll();
  };
  const toggleTodo = async (todo: DevTodo) => {
    await db
      .from("dev_project_todos")
      .update({ is_done: !todo.is_done })
      .eq("id", todo.id);
    await fetchAll();
  };
  const deleteTodo = async (id: string) => {
    await db.from("dev_project_todos").delete().eq("id", id);
    await fetchAll();
  };

  const addIssue = async (masalah: string) => {
    if (!user) return;
    await db
      .from("dev_project_issues")
      .insert({
        project_id: projectId,
        user_id: user.id,
        masalah,
        status: "Open",
      });
    await fetchAll();
  };
  const resolveIssue = async (id: string, solusi: string) => {
    await db
      .from("dev_project_issues")
      .update({ solusi, status: "Resolved" })
      .eq("id", id);
    await fetchAll();
  };
  const deleteIssue = async (id: string) => {
    await db.from("dev_project_issues").delete().eq("id", id);
    await fetchAll();
  };

  return {
    logs,
    todos,
    issues,
    loading,
    addLog,
    deleteLog,
    addTodo,
    toggleTodo,
    deleteTodo,
    addIssue,
    resolveIssue,
    deleteIssue,
  };
}
