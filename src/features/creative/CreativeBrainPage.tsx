import { useState, type FormEvent } from "react";
import { useCreativeProjects } from "./useCreativeProjects";
import ProjectModal from "./ProjectModal";
import {
  CREATIVE_STAGES,
  CREATIVE_KATEGORI,
  type CreativeProject,
} from "../../types";

export default function CreativeBrainPage() {
  const { projects, addProject } = useCreativeProjects();
  const [selectedProject, setSelectedProject] =
    useState<CreativeProject | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [newJudul, setNewJudul] = useState("");
  const [newKategori, setNewKategori] = useState<string>(CREATIVE_KATEGORI[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleProjects = projects.filter(
    (p) => p.is_archived === showArchived,
  );

  const handleAddIdea = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await addProject({
      judul: newJudul,
      kategori: newKategori,
      status: "idea",
      is_archived: false,
      catatan_ide: null,
      shot_list: null,
      lokasi: null,
      props: null,
      referensi_url: null,
      tanggal_shooting: null,
      catatan_shooting: null,
      software_edit: null,
      progress_edit: 0,
      catatan_editing: null,
      tanggal_upload: null,
      platform: null,
      link_hasil: null,
      target_upload: null,
      views: null,
      likes: null,
      catatan_analisa: null,
    });
    setNewJudul("");
    setShowAddForm(false);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Creative Brain
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`text-sm px-3 py-1.5 rounded-lg border ${
              showArchived
                ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            📦 {showArchived ? "Lihat Aktif" : "Diarsipkan"}
          </button>
          {!showArchived && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-sm bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 py-1.5 rounded-lg"
            >
              + Ide Baru
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAddIdea}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-2"
        >
          <input
            type="text"
            required
            autoFocus
            placeholder="Judul ide (misal: Morning Routine)"
            value={newJudul}
            onChange={(e) => setNewJudul(e.target.value)}
            className="flex-1 min-w-200px px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
          />
          <select
            value={newKategori}
            onChange={(e) => setNewKategori(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
          >
            {CREATIVE_KATEGORI.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-4 py-2 rounded-lg text-sm"
          >
            Simpan
          </button>
          <button
            type="button"
            onClick={() => setShowAddForm(false)}
            className="px-4 py-2 text-sm text-gray-400"
          >
            Batal
          </button>
        </form>
      )}

      {/* Board per tahap - scroll horizontal di HP, grid di layar lebar */}
      <div className="flex gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible">
        {CREATIVE_STAGES.map((stage) => {
          const stageProjects = visibleProjects.filter(
            (p) => p.status === stage.key,
          );
          return (
            <div key={stage.key} className="min-w-220px sm:min-w-0">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 sticky top-0">
                {stage.icon} {stage.label}{" "}
                <span className="text-gray-300">({stageProjects.length})</span>
              </p>
              <div className="space-y-2">
                {stageProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProject(p)}
                    className="w-full text-left bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {p.judul}
                    </p>
                    {p.kategori && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {p.kategori}
                      </p>
                    )}
                    {p.target_upload && (
                      <p className="text-xs text-gray-400 mt-1">
                        🎯{" "}
                        {new Date(p.target_upload).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                  </button>
                ))}
                {stageProjects.length === 0 && (
                  <p className="text-xs text-gray-300 dark:text-gray-600 italic">
                    Kosong
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedProject && (
        <ProjectModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
