import { useState, type FormEvent } from "react";
import { Archive, ArchiveRestore, FolderKanban } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { ProgressBar } from "../../components/ui/Progress";
import { Card, EmptyState, Sheet, PrimaryButton, GhostButton } from "../../components/ui/Controls";
import { useDevProjects, type DevProject } from "./useDevProjects";
import DevProjectDetail from "./DevProjectDetail";
import { t, tx } from "../../lib/i18n";
import { DeleteButton } from "../../components/ui/DeleteButton";

type Tab = "aktif" | "arsip";

export default function DevProjectsPage() {
  const { projects, progress, loading, addProject, updateProject, deleteProject, refetch } = useDevProjects();
  const [tab, setTab] = useState<Tab>("aktif");
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState("");
  const [riset, setRiset] = useState("");
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const openProject = projects.find((p) => p.id === openId) ?? null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await addProject(nama.trim(), riset.trim());
    setNama("");
    setRiset("");
    setShowForm(false);
    setSaving(false);
  };

  if (openProject) {
    return (
      <DevProjectDetail
        project={openProject}
        onBack={() => {
          setOpenId(null);
          refetch();
        }}
        onUpdate={updateProject}
      />
    );
  }

  // Tab Aktif = status Aktif; Arsip = Selesai / Ditunda / Arsip.
  const visible = projects.filter((p) => (tab === "aktif" ? p.status === "Aktif" : p.status !== "Aktif"));

  const card = (p: DevProject) => {
    const pr = progress[p.id] ?? { done: 0, total: 0 };
    const pct = pr.total ? Math.round((pr.done / pr.total) * 100) : 0;
    return (
      <Card key={p.id} className="space-y-2.5">
        <div className="flex items-start gap-3">
          <button onClick={() => setOpenId(p.id)} className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-gray-50 truncate">{tx(p.nama)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {t("Progres")} {pct}%
              {p.status !== "Aktif" && <> · {tx(p.status)}</>}
            </p>
          </button>
          <button
            aria-label={p.status === "Aktif" ? t("Arsipkan") : t("Aktifkan lagi")}
            className="text-gray-400 p-0.5"
            onClick={() => updateProject(p.id, { status: p.status === "Aktif" ? "Arsip" : "Aktif" })}
          >
            {p.status === "Aktif" ? <Archive size={16} /> : <ArchiveRestore size={16} />}
          </button>
          <DeleteButton size={16} confirmMessage={t("Hapus project ini? Semua log/todo/issue di dalamnya ikut terhapus.")} onConfirm={() => deleteProject(p.id)} />
        </div>
        <ProgressBar value={pr.done} max={pr.total || 1} />
        {pr.total > 0 && (
          <p className="text-[11px] text-gray-500">{t("{0} dari {1} to-do selesai", [pr.done, pr.total])}</p>
        )}
      </Card>
    );
  };

  return (
    <div className="pb-28">
      <PageHeader title={t("Projects")} />
      <div className="px-4 space-y-4">
        <Segmented
          options={[
            { key: "aktif", label: t("Aktif") },
            { key: "arsip", label: t("Arsip") },
          ]}
          value={tab}
          onChange={setTab}
        />
        {loading ? (
          <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>
        ) : visible.length === 0 ? (
          <EmptyState icon={FolderKanban} title={tab === "aktif" ? t("Belum ada project aktif") : t("Arsip kosong")} />
        ) : (
          <div className="space-y-3">{visible.map(card)}</div>
        )}
        <PrimaryButton onClick={() => setShowForm(true)}>{t("Tambah Project")}</PrimaryButton>
      </div>

      {showForm && (
        <Sheet title={t("Project Baru")} onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <input required autoFocus className="input-field" placeholder={t("Nama project (mis. Aplikasi Tracker)")} value={nama} onChange={(e) => setNama(e.target.value)} />
            <textarea className="input-field min-h-24" placeholder={t("Riset / kebutuhan awal (opsional)")} value={riset} onChange={(e) => setRiset(e.target.value)} />
            <div className="flex gap-2">
              <GhostButton type="button" className="flex-1" onClick={() => setShowForm(false)}>
                {t("Batal")}
              </GhostButton>
              <PrimaryButton type="submit" className="flex-1" disabled={saving || !nama.trim()}>
                {saving ? t("Menyimpan...") : t("Simpan")}
              </PrimaryButton>
            </div>
          </form>
        </Sheet>
      )}
    </div>
  );
}
