import { useEffect, useState, useCallback } from "react";
import { db } from "../../lib/db";
import { useAuth } from "../../context/AuthContext";
import {
  CREATIVE_STAGES,
  type CreativeProject,
  type CreativeProjectInput,
  type CreativeStatus,
} from "../../types";

export function useCreativeProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<CreativeProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await db
      .from("creative_projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setProjects(data as CreativeProject[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const addProject = async (input: CreativeProjectInput) => {
    if (!user) return { error: "Belum login" };
    const { error } = await db
      .from("creative_projects")
      .insert({ ...input, user_id: user.id });
    if (error) return { error: error.message };
    await fetchProjects();
    return { error: null };
  };

  const updateProject = async (
    id: string,
    input: Partial<CreativeProjectInput>,
  ) => {
    const { error } = await db
      .from("creative_projects")
      .update(input)
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchProjects();
    return { error: null };
  };

  const deleteProject = async (id: string) => {
    const { error } = await db
      .from("creative_projects")
      .delete()
      .eq("id", id);
    if (error) return { error: error.message };
    await fetchProjects();
    return { error: null };
  };

  // Maju SATU langkah saja (tidak boleh skip). Kalau sudah di tahap terakhir, tidak bisa maju lagi.
  const moveNext = async (project: CreativeProject) => {
    const currentIndex = CREATIVE_STAGES.findIndex(
      (s) => s.key === project.status,
    );
    if (currentIndex === -1 || currentIndex === CREATIVE_STAGES.length - 1) {
      return { error: "Sudah di tahap terakhir" };
    }
    const nextStatus = CREATIVE_STAGES[currentIndex + 1].key;
    return updateProject(project.id, { status: nextStatus });
  };

  // Mundur BEBAS ke tahap manapun sebelumnya (tidak harus satu-satu)
  const moveBack = async (
    project: CreativeProject,
    targetStatus: CreativeStatus,
  ) => {
    const currentIndex = CREATIVE_STAGES.findIndex(
      (s) => s.key === project.status,
    );
    const targetIndex = CREATIVE_STAGES.findIndex(
      (s) => s.key === targetStatus,
    );
    if (targetIndex >= currentIndex) {
      return { error: "Cuma bisa mundur ke tahap sebelumnya" };
    }
    return updateProject(project.id, { status: targetStatus });
  };

  const archiveProject = async (id: string) =>
    updateProject(id, { is_archived: true });
  const unarchiveProject = async (id: string) =>
    updateProject(id, { is_archived: false });

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    moveNext,
    moveBack,
    archiveProject,
    unarchiveProject,
  };
}
