import { useState, useEffect } from "react";
import {
  CREATIVE_STAGES,
  type CreativeProject,
  type CreativeProjectInput,
} from "../../types";
import { useCreativeProjects } from "./useCreativeProjects";

import { t, tx } from "../../lib/i18n";
interface ProjectModalProps {
  project: CreativeProject;
  onClose: () => void;
}

export default function ProjectModal({ project, onClose }: ProjectModalProps) {
  const { updateProject, deleteProject, moveNext, moveBack, archiveProject } =
    useCreativeProjects();
  const [form, setForm] = useState<CreativeProjectInput>(project);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => setForm(project), [project]);

  const currentIndex = CREATIVE_STAGES.findIndex(
    (s) => s.key === project.status,
  );
  const nextStage = CREATIVE_STAGES[currentIndex + 1];
  const previousStages = CREATIVE_STAGES.slice(0, currentIndex);

  const handleSave = async () => {
    setError("");
    setIsSaving(true);
    const result = await updateProject(project.id, form);
    if (result.error) setError(result.error);
    setIsSaving(false);
  };

  const handleNext = async () => {
    const result = await moveNext(project);
    if (!result.error) onClose();
  };

  const handleBack = async (target: typeof project.status) => {
    const result = await moveBack(project, target);
    if (!result.error) onClose();
  };

  const handleArchive = async () => {
    if (
      confirm(
        t("Arsipkan konten ini? Bisa dibuka lagi nanti dari filter \"Diarsipkan\"."),
      )
    ) {
      await archiveProject(project.id);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (confirm(t("Hapus permanen? Ini tidak bisa dibatalkan."))) {
      await deleteProject(project.id);
      onClose();
    }
  };

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {tx(label)}
      </label>
      {tx(node)}
    </div>
  );

  const inputClass =
    "w-full px-3 py-2 border border-surface-light bg-bg text-gray-100 rounded-lg text-sm";

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] w-full max-w-lg space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + status */}
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {CREATIVE_STAGES.map((s, i) => (
              <span
                key={s.key}
                className={`text-xs px-2 py-1 rounded-full ${
                  i === currentIndex
                    ? "bg-primary text-on-primary font-medium"
                    : i < currentIndex
                      ? "bg-primary/15 text-primary"
                      : "bg-surface-light text-gray-400"
                }`}
              >
                {tx(s.label)}
              </span>
            ))}
          </div>
          <input
            type="text"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            className="w-full text-lg font-semibold px-0 py-1 border-none focus:outline-none bg-transparent text-gray-50"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
            {tx(error)}
          </div>
        )}

        {/* Field umum */}
        <div className="grid grid-cols-2 gap-3">
          {field(
            "Kategori",
            <input
              type="text"
              value={form.kategori ?? ""}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              className={inputClass}
            />,
          )}
          {field(
            "Target Upload",
            <input
              type="date"
              value={form.target_upload ?? ""}
              onChange={(e) =>
                setForm({ ...form, target_upload: e.target.value || null })
              }
              className={inputClass}
            />,
          )}
        </div>

        {/* Section Idea */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">
            {t("💡 Idea")}</p>
          {field(
            "Catatan Ide",
            <textarea
              rows={2}
              value={form.catatan_ide ?? ""}
              onChange={(e) =>
                setForm({ ...form, catatan_ide: e.target.value })
              }
              className={inputClass}
            />,
          )}
        </div>

        {/* Section Planning */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">
            {t("📋 Planning")}</p>
          {field(
            "Shot List",
            <textarea
              rows={2}
              placeholder={t("1. Alarm berbunyi\n2. Buka jendela\n3. Seduh kopi")}
              value={form.shot_list ?? ""}
              onChange={(e) => setForm({ ...form, shot_list: e.target.value })}
              className={inputClass}
            />,
          )}
          <div className="grid grid-cols-2 gap-3">
            {field(
              "Lokasi",
              <input
                type="text"
                value={form.lokasi ?? ""}
                onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                className={inputClass}
              />,
            )}
            {field(
              "Props",
              <input
                type="text"
                value={form.props ?? ""}
                onChange={(e) => setForm({ ...form, props: e.target.value })}
                className={inputClass}
              />,
            )}
          </div>
          {field(
            "Link Referensi",
            <input
              type="text"
              placeholder="https://..."
              value={form.referensi_url ?? ""}
              onChange={(e) =>
                setForm({ ...form, referensi_url: e.target.value })
              }
              className={inputClass}
            />,
          )}
        </div>

        {/* Section Shooting */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">
            {t("🎥 Shooting")}</p>
          <div className="grid grid-cols-2 gap-3">
            {field(
              "Tanggal Shooting",
              <input
                type="date"
                value={form.tanggal_shooting ?? ""}
                onChange={(e) =>
                  setForm({ ...form, tanggal_shooting: e.target.value || null })
                }
                className={inputClass}
              />,
            )}
          </div>
          {field(
            "Catatan Shooting",
            <textarea
              rows={2}
              value={form.catatan_shooting ?? ""}
              onChange={(e) =>
                setForm({ ...form, catatan_shooting: e.target.value })
              }
              className={inputClass}
            />,
          )}
        </div>

        {/* Section Editing */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">
            {t("✂️ Editing")}</p>
          <div className="grid grid-cols-2 gap-3">
            {field(
              "Software",
              <input
                type="text"
                placeholder={t("CapCut, DaVinci...")}
                value={form.software_edit ?? ""}
                onChange={(e) =>
                  setForm({ ...form, software_edit: e.target.value })
                }
                className={inputClass}
              />,
            )}
            {field(
              "Progress (%)",
              <input
                type="number"
                min={0}
                max={100}
                value={form.progress_edit ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    progress_edit: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className={inputClass}
              />,
            )}
          </div>
        </div>

        {/* Section Uploaded */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">
            {t("✅ Uploaded")}</p>
          <div className="grid grid-cols-2 gap-3">
            {field(
              "Tanggal Upload",
              <input
                type="date"
                value={form.tanggal_upload ?? ""}
                onChange={(e) =>
                  setForm({ ...form, tanggal_upload: e.target.value || null })
                }
                className={inputClass}
              />,
            )}
            {field(
              "Platform",
              <input
                type="text"
                placeholder={t("YouTube, TikTok...")}
                value={form.platform ?? ""}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className={inputClass}
              />,
            )}
          </div>
          {field(
            "Link Hasil",
            <input
              type="text"
              value={form.link_hasil ?? ""}
              onChange={(e) => setForm({ ...form, link_hasil: e.target.value })}
              className={inputClass}
            />,
          )}
        </div>

        {/* Section Analisa */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase">
            {t("📈 Analisa")}</p>
          <div className="grid grid-cols-2 gap-3">
            {field(
              "Views",
              <input
                type="number"
                value={form.views ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    views: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className={inputClass}
              />,
            )}
            {field(
              "Likes",
              <input
                type="number"
                value={form.likes ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    likes: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className={inputClass}
              />,
            )}
          </div>
          {field(
            "Catatan Analisa",
            <textarea
              rows={2}
              placeholder={t("Apa yang berhasil, apa yang perlu diperbaiki...")}
              value={form.catatan_analisa ?? ""}
              onChange={(e) =>
                setForm({ ...form, catatan_analisa: e.target.value })
              }
              className={inputClass}
            />,
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gray-100 dark:bg-gray-700 text-gray-50 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          {isSaving ? t("Menyimpan...") : t("Simpan Perubahan")}
        </button>

        {/* Kontrol perpindahan tahap */}
        <div className="border-t border-surface-light pt-4 space-y-2">
          {nextStage && (
            <button
              onClick={handleNext}
              className="w-full bg-primary text-on-primary py-2.5 rounded-lg text-sm font-medium"
            >
              {t("Lanjut ke")}{nextStage.icon} {tx(nextStage.label)} →
            </button>
          )}

          {previousStages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previousStages.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleBack(s.key)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-surface-light text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t("← Kembali ke")}{tx(s.label)}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleArchive}
              className="flex-1 text-sm text-gray-500 dark:text-gray-400 border border-surface-light py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t("📦 Arsipkan")}</button>
            <button
              onClick={handleDelete}
              className="flex-1 text-sm text-red-500 border border-red-200 dark:border-red-900 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950"
            >
              {t("Hapus")}</button>
            <button
              onClick={onClose}
              className="flex-1 text-sm text-gray-500 dark:text-gray-400 border border-surface-light py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t("Tutup")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
