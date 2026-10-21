import { useState } from "react";
import { Lightbulb, Trash2, Plus } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { ProgressBar } from "../../components/ui/Progress";
import { Card, CheckCircle, Chip, EmptyState, PrimaryButton } from "../../components/ui/Controls";
import { useDevProjectDetail } from "./useDevProjects";
import type { DevProject } from "./useDevProjects";
import { t, tx } from "../../lib/i18n";
import { fmtDate } from "../../utils/format";
import { toDateStr } from "../../utils/dates";

interface DevProjectDetailProps {
  project: DevProject;
  onBack: () => void;
  onUpdate: (id: string, input: Partial<Omit<DevProject, "id" | "user_id">>) => Promise<{ error: string | null }>;
}

type Tab = "log" | "todo" | "issue" | "riset";
const STATUSES: DevProject["status"][] = ["Aktif", "Selesai", "Ditunda", "Arsip"];

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (v: string) => void }) {
  const [v, setV] = useState("");
  const submit = () => {
    if (!v.trim()) return;
    onAdd(v.trim());
    setV("");
  };
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input className="input-field min-w-0" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} />
      <button aria-label={t("Tambah")} className="shrink-0 w-11 rounded-xl bg-primary text-on-primary flex items-center justify-center">
        <Plus size={18} />
      </button>
    </form>
  );
}

export default function DevProjectDetail({ project, onBack, onUpdate }: DevProjectDetailProps) {
  const { logs, todos, issues, loading, addLog, deleteLog, addTodo, toggleTodo, deleteTodo, addIssue, resolveIssue, deleteIssue } =
    useDevProjectDetail(project.id);

  const [tab, setTab] = useState<Tab>("log");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [solusi, setSolusi] = useState("");
  const [riset, setRiset] = useState(project.riset_kebutuhan ?? "");
  const [savedRiset, setSavedRiset] = useState(false);

  const done = todos.filter((x) => x.is_done).length;

  return (
    <div className="pb-10">
      <PageHeader title={project.nama} left="back" search={false} onBack={onBack} />
      <div className="px-4 space-y-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{t("Progres")}</span>
            <span className="text-primary font-semibold">{todos.length ? Math.round((done / todos.length) * 100) : 0}%</span>
          </div>
          <ProgressBar value={done} max={todos.length || 1} />
          <div className="flex gap-2 flex-wrap pt-1">
            {STATUSES.map((s) => (
              <Chip key={s} active={project.status === s} onClick={() => onUpdate(project.id, { status: s })}>
                {tx(s)}
              </Chip>
            ))}
          </div>
        </Card>

        <Segmented
          options={[
            { key: "log", label: t("Log Harian") },
            { key: "todo", label: t("To-Do ({0})", [todos.filter((x) => !x.is_done).length]) },
            { key: "issue", label: t("Masalah ({0})", [issues.filter((i) => i.status === "Open").length]) },
            { key: "riset", label: t("Riset") },
          ]}
          value={tab}
          onChange={setTab}
        />

        {loading ? (
          <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>
        ) : (
          <>
            {tab === "log" && (
              <div className="space-y-3">
                <AddRow placeholder={t("Hari ini ngapain?")} onAdd={(v) => addLog(v, toDateStr())} />
                {logs.map((l) => (
                  <Card key={l.id} className="!py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-400">{fmtDate(l.tanggal, "d MMM yyyy")}</p>
                      <p className="text-sm text-gray-50 break-words">{l.catatan}</p>
                    </div>
                    <button aria-label={t("Hapus")} className="text-gray-500" onClick={() => deleteLog(l.id)}>
                      <Trash2 size={15} />
                    </button>
                  </Card>
                ))}
                {logs.length === 0 && <EmptyState title={t("Belum ada log.")} />}
              </div>
            )}

            {tab === "todo" && (
              <div className="space-y-2">
                <AddRow placeholder={t("Tambah to-do...")} onAdd={addTodo} />
                {todos.map((x) => (
                  <Card key={x.id} className="!py-3 flex items-center gap-3">
                    <CheckCircle size={22} checked={x.is_done} onClick={() => toggleTodo(x)} />
                    <span className={`flex-1 min-w-0 text-sm break-words ${x.is_done ? "line-through text-gray-500" : "text-gray-50"}`}>{x.judul}</span>
                    <button aria-label={t("Hapus")} className="text-gray-500" onClick={() => deleteTodo(x.id)}>
                      <Trash2 size={15} />
                    </button>
                  </Card>
                ))}
                {todos.length === 0 && <EmptyState title={t("Belum ada to-do.")} />}
              </div>
            )}

            {tab === "issue" && (
              <div className="space-y-2">
                <AddRow placeholder={t("Masalah yang ditemui...")} onAdd={addIssue} />
                {issues.map((i) => (
                  <Card key={i.id} className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <Chip tone={i.status === "Open" ? "danger" : "primary"}>{tx(i.status)}</Chip>
                        <p className="text-sm text-gray-50 break-words">{i.masalah}</p>
                        {i.solusi && (
                          <p className="text-sm text-gray-400 flex gap-1.5 break-words">
                            <Lightbulb size={14} className="text-primary shrink-0 mt-0.5" />
                            <span className="min-w-0">{i.solusi}</span>
                          </p>
                        )}
                      </div>
                      <button aria-label={t("Hapus")} className="text-gray-500" onClick={() => deleteIssue(i.id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {i.status === "Open" &&
                      (resolvingId === i.id ? (
                        <div className="flex gap-2">
                          <input className="input-field min-w-0" placeholder={t("Solusinya apa?")} value={solusi} onChange={(e) => setSolusi(e.target.value)} />
                          <button
                            className="shrink-0 px-4 rounded-xl bg-primary text-on-primary text-xs font-medium"
                            onClick={() => {
                              resolveIssue(i.id, solusi);
                              setResolvingId(null);
                              setSolusi("");
                            }}
                          >
                            {t("Simpan")}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setResolvingId(i.id)} className="text-xs text-primary">
                          {t("Tandai selesai + isi solusi")}
                        </button>
                      ))}
                  </Card>
                ))}
                {issues.length === 0 && <EmptyState title={t("Belum ada masalah tercatat.")} />}
              </div>
            )}

            {tab === "riset" && (
              <div className="space-y-3">
                <textarea
                  className="input-field min-h-40"
                  placeholder={t("Riset / kebutuhan project")}
                  value={riset}
                  onChange={(e) => {
                    setRiset(e.target.value);
                    setSavedRiset(false);
                  }}
                />
                <PrimaryButton
                  onClick={async () => {
                    await onUpdate(project.id, { riset_kebutuhan: riset });
                    setSavedRiset(true);
                  }}
                >
                  {savedRiset ? t("Tersimpan!") : t("Simpan")}
                </PrimaryButton>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
