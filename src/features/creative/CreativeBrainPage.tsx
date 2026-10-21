import { useState } from "react";
import { Archive, ExternalLink, Lightbulb, Link2, Trash2, Video } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import Field from "../../components/ui/Field";
import ItemRow from "../../components/ui/ItemRow";
import { Chip, EmptyState, Fab, PrimaryButton, Sheet } from "../../components/ui/Controls";
import { useCreativeProjects } from "./useCreativeProjects";
import { useCreativeRefs, type CreativeRef } from "./useCreativeRefs";
import ProjectModal from "./ProjectModal";
import { CREATIVE_STAGES, CREATIVE_KATEGORI, type CreativeProject } from "../../types";
import { t, tx } from "../../lib/i18n";
import { fmtDate } from "../../utils/format";

type Tab = "ide" | "konten" | "referensi";

export default function CreativeBrainPage() {
  const { projects, addProject } = useCreativeProjects();
  const { refs, addRef, updateRef, deleteRef } = useCreativeRefs();
  const [tab, setTab] = useState<Tab>("ide");
  const [stage, setStage] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selected, setSelected] = useState<CreativeProject | null>(null);
  const [ideaSheet, setIdeaSheet] = useState(false);
  const [refSheet, setRefSheet] = useState<{ ref: CreativeRef | null } | null>(null);
  const [judul, setJudul] = useState("");
  const [kategori, setKategori] = useState<string>(CREATIVE_KATEGORI[0]);
  const [refForm, setRefForm] = useState({ judul: "", url: "", catatan: "" });

  const active = projects.filter((p) => p.is_archived === showArchived);
  const ideas = active.filter((p) => p.status === "idea");
  const content = active.filter((p) => p.status !== "idea" && (!stage || p.status === stage));
  const stageLabel = (k: string) => tx(CREATIVE_STAGES.find((s) => s.key === k)?.label ?? k);

  const saveIdea = async () => {
    if (!judul.trim()) return;
    await addProject({
      judul: judul.trim(), kategori, status: "idea", is_archived: false, catatan_ide: null, shot_list: null, lokasi: null,
      props: null, referensi_url: null, tanggal_shooting: null, catatan_shooting: null, software_edit: null, progress_edit: 0,
      catatan_editing: null, tanggal_upload: null, platform: null, link_hasil: null, target_upload: null, views: null, likes: null,
      catatan_analisa: null,
    });
    setJudul("");
    setIdeaSheet(false);
  };

  const openRef = (r: CreativeRef | null) => {
    setRefForm({ judul: r?.judul ?? "", url: r?.url ?? "", catatan: r?.catatan ?? "" });
    setRefSheet({ ref: r });
  };
  const saveRef = async () => {
    if (!refForm.judul.trim()) return;
    const payload = { judul: refForm.judul.trim(), url: refForm.url.trim() || null, catatan: refForm.catatan.trim() || null };
    if (refSheet?.ref) await updateRef(refSheet.ref.id, payload);
    else await addRef(payload);
    setRefSheet(null);
  };

  return (
    <div className="pb-28">
      <PageHeader title={t("Creative Brain")} />
      <div className="px-4 space-y-4">
        <Segmented
          options={[{ key: "ide", label: t("Ide") }, { key: "konten", label: t("Konten") }, { key: "referensi", label: t("Referensi") }]}
          value={tab}
          onChange={setTab}
        />

        {tab !== "referensi" && (
          <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-1">
            <Chip active={showArchived} onClick={() => setShowArchived(!showArchived)}>
              <span className="inline-flex items-center gap-1"><Archive size={12} /> {t("Diarsipkan")}</span>
            </Chip>
            {tab === "konten" && (
              <>
                <Chip active={!stage} onClick={() => setStage(null)}>{t("Semua")}</Chip>
                {CREATIVE_STAGES.filter((s) => s.key !== "idea").map((s) => (
                  <Chip key={s.key} active={stage === s.key} onClick={() => setStage(stage === s.key ? null : s.key)}>{tx(s.label)}</Chip>
                ))}
              </>
            )}
          </div>
        )}

        {tab === "ide" && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-100 px-1">{t("Ide konten")}</h2>
            {ideas.length === 0 ? (
              <EmptyState icon={Lightbulb} title={t("Belum ada ide")} hint={t("Tekan + untuk menambah ide.")} />
            ) : (
              ideas.map((p) => (
                <ItemRow key={p.id} icon={Lightbulb} title={p.judul} subtitle={`${p.kategori ? tx(p.kategori) + " · " : ""}${fmtDate(p.created_at, "d MMM yyyy")}`} onClick={() => setSelected(p)} />
              ))
            )}
          </div>
        )}

        {tab === "konten" && (
          <div className="space-y-2">
            {content.length === 0 ? (
              <EmptyState icon={Video} title={t("Belum ada konten")} hint={t("Pindahkan ide ke tahap berikutnya untuk memulai.")} />
            ) : (
              content.map((p) => (
                <ItemRow
                  key={p.id}
                  icon={Video}
                  title={p.judul}
                  subtitle={`${stageLabel(p.status)}${p.kategori ? " · " + tx(p.kategori) : ""}${p.target_upload ? " · " + fmtDate(p.target_upload, "d MMM") : ""}`}
                  progress={p.status === "editing" ? p.progress_edit ?? 0 : null}
                  onClick={() => setSelected(p)}
                />
              ))
            )}
          </div>
        )}

        {tab === "referensi" && (
          <div className="space-y-2">
            {refs.length === 0 ? (
              <EmptyState icon={Link2} title={t("Belum ada referensi")} hint={t("Simpan tautan atau inspirasi di sini.")} />
            ) : (
              refs.map((r) => (
                <ItemRow
                  key={r.id}
                  icon={Link2}
                  title={r.judul}
                  subtitle={r.catatan || r.url || undefined}
                  onClick={() => openRef(r)}
                  trailing={
                    r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label={t("Buka tautan")} className="text-primary p-1">
                        <ExternalLink size={16} />
                      </a>
                    ) : undefined
                  }
                />
              ))
            )}
          </div>
        )}
      </div>

      <Fab onClick={() => (tab === "referensi" ? openRef(null) : setIdeaSheet(true))} label={tab === "referensi" ? t("Tambah referensi") : t("Tambah ide")} />

      {ideaSheet && (
        <Sheet title={t("Ide Baru")} onClose={() => setIdeaSheet(false)}>
          <Field label={t("Judul ide")}>
            <input className="input-field" placeholder={t("mis. Rutinitas pagi")} value={judul} onChange={(e) => setJudul(e.target.value)} autoFocus />
          </Field>
          <Field label={t("Kategori")}>
            <select className="input-field" value={kategori} onChange={(e) => setKategori(e.target.value)}>
              {CREATIVE_KATEGORI.map((k) => <option key={k} value={k}>{tx(k)}</option>)}
            </select>
          </Field>
          <PrimaryButton onClick={saveIdea} disabled={!judul.trim()}>{t("Simpan")}</PrimaryButton>
        </Sheet>
      )}

      {refSheet && (
        <Sheet title={refSheet.ref ? t("Ubah Referensi") : t("Referensi Baru")} onClose={() => setRefSheet(null)}>
          <Field label={t("Judul")}><input className="input-field" value={refForm.judul} onChange={(e) => setRefForm({ ...refForm, judul: e.target.value })} autoFocus /></Field>
          <Field label={t("Tautan")}><input className="input-field" inputMode="url" placeholder="https://" value={refForm.url} onChange={(e) => setRefForm({ ...refForm, url: e.target.value })} /></Field>
          <Field label={t("Catatan")}><textarea className="input-field min-h-20" value={refForm.catatan} onChange={(e) => setRefForm({ ...refForm, catatan: e.target.value })} /></Field>
          <PrimaryButton onClick={saveRef} disabled={!refForm.judul.trim()}>{t("Simpan")}</PrimaryButton>
          {refSheet.ref && (
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/40 text-sm text-red-400"
              onClick={async () => {
                if (!confirm(t("Hapus referensi ini?"))) return;
                await deleteRef(refSheet.ref!.id);
                setRefSheet(null);
              }}
            >
              <Trash2 size={15} /> {t("Hapus")}
            </button>
          )}
        </Sheet>
      )}

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
