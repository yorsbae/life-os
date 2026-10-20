import { useState, type FormEvent } from "react";
import { useDevProjects, type DevProject } from "./useDevProjects";
import DevProjectDetail from "./DevProjectDetail";

export default function DevProjectsPage() {
  const { projects, loading, addProject, updateProject, deleteProject } =
    useDevProjects();
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState("");
  const [riset, setRiset] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openProject, setOpenProject] = useState<DevProject | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await addProject(nama, riset);
    setNama("");
    setRiset("");
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Hapus project ini? Semua log/todo/issue di dalamnya ikut terhapus.",
      )
    )
      deleteProject(id);
  };

  if (openProject) {
    return (
      <DevProjectDetail
        project={openProject}
        onBack={() => setOpenProject(null)}
        onUpdateStatus={updateProject}
      />
    );
  }

  const statusColor: Record<string, string> = {
    Aktif: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-300",
    Selesai: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300",
    Ditunda: "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Project Tracker
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 py-1.5 rounded-lg"
        >
          + Project Baru
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <input
            type="text"
            required
            autoFocus
            placeholder="Nama project (misal: App Tracker Pribadi)"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
          />
          <textarea
            placeholder="Riset / kebutuhan awal (opsional)"
            value={riset}
            onChange={(e) => setRiset(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>
      ) : projects.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Belum ada project.
        </p>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex justify-between items-start">
                <button
                  onClick={() => setOpenProject(p)}
                  className="text-left flex-1"
                >
                  <span className="font-medium text-gray-900 dark:text-white">
                    {p.nama}
                  </span>
                  <div className="mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${statusColor[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  {p.riset_kebutuhan && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {p.riset_kebutuhan}
                    </p>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs text-red-500 hover:text-red-700 shrink-0 ml-2"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
