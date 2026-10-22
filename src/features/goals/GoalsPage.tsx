import { useState, type FormEvent } from "react";
import { Pencil, Target, CheckCircle2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { ProgressBar } from "../../components/ui/Progress";
import { Card, EmptyState, Sheet, PrimaryButton, GhostButton } from "../../components/ui/Controls";
import { useGoals, GOAL_TIPE_LABEL, type Goal, type GoalInput, type GoalTipe } from "./useGoals";
import { t, tx } from "../../lib/i18n";
import { rupiah, num, fmtDate } from "../../utils/format";
import { toDateStr } from "../../utils/dates";
import Select from "../../components/ui/Select";
import { DeleteButton } from "../../components/ui/DeleteButton";

type Tab = "aktif" | "selesai";

const emptyForm = (): GoalInput => ({
  judul: "",
  tipe: "custom",
  target_value: 1,
  current_value_manual: 0,
  tanggal_mulai: toDateStr(),
  tanggal_target: null,
  status: "Aktif",
  satuan: null,
});

/** Format nilai goal: satuan "Rp" tampil sebagai rupiah, lainnya angka + satuan. */
function fmtValue(v: number, g: Pick<Goal, "tipe" | "satuan">) {
  if (g.tipe === "custom" && g.satuan?.toLowerCase() === "rp") return rupiah(v);
  const unit = g.tipe === "custom" && g.satuan ? ` ${tx(g.satuan)}` : "";
  return `${num(v)}${unit}`;
}

export default function GoalsPage() {
  const { goals, loading, addGoal, updateGoal, deleteGoal, getProgress } = useGoals();
  const [tab, setTab] = useState<Tab>("aktif");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState<GoalInput>(emptyForm());
  const [saving, setSaving] = useState(false);

  const isDone = (g: Goal) => g.status === "Tercapai" || (g.status === "Aktif" && getProgress(g) >= g.target_value);
  const visible = goals.filter((g) => g.status !== "Dibatalkan" && (tab === "selesai" ? isDone(g) : !isDone(g)));

  const open = (g?: Goal) => {
    setEditing(g ?? null);
    setForm(
      g
        ? {
            judul: g.judul,
            tipe: g.tipe,
            target_value: g.target_value,
            current_value_manual: g.current_value_manual,
            tanggal_mulai: g.tanggal_mulai,
            tanggal_target: g.tanggal_target,
            status: g.status,
            satuan: g.satuan,
          }
        : emptyForm(),
    );
    setShowForm(true);
  };
  const close = () => {
    setShowForm(false);
    setEditing(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, satuan: form.tipe === "custom" ? form.satuan?.trim() || null : null };
    if (editing) await updateGoal(editing.id, payload);
    else await addGoal(payload);
    setSaving(false);
    close();
  };

  const updateProgress = (g: Goal) => {
    const v = prompt(t("Update progress ke berapa?"), String(g.current_value_manual));
    if (v !== null && v.trim() !== "" && !Number.isNaN(Number(v))) updateGoal(g.id, { current_value_manual: Number(v) });
  };

  return (
    <div className="pb-28">
      <PageHeader title={t("Goals")} />
      <div className="px-4 space-y-4">
        <Segmented
          options={[
            { key: "aktif", label: t("Aktif") },
            { key: "selesai", label: t("Selesai") },
          ]}
          value={tab}
          onChange={setTab}
        />

        {loading ? (
          <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Target}
            title={tab === "aktif" ? t("Belum ada goal aktif") : t("Belum ada goal yang selesai")}
            hint={t("Progress goal dihitung otomatis dari data yang sudah kamu catat.")}
          />
        ) : (
          <div className="space-y-3">
            {visible.map((g) => {
              const current = getProgress(g);
              const percent = g.target_value > 0 ? Math.min(100, Math.round((current / g.target_value) * 100)) : 0;
              const done = isDone(g);
              return (
                <Card key={g.id} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-50 break-words">{tx(g.judul)}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{tx(GOAL_TIPE_LABEL[g.tipe])}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary shrink-0">{tx(percent)}%</span>
                  </div>
                  <ProgressBar value={current} max={g.target_value} />
                  <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
                    <span className="min-w-0 truncate">
                      {fmtValue(current, g)} / {fmtValue(g.target_value, g)}
                    </span>
                    {g.tanggal_target && <span className="shrink-0">{fmtDate(g.tanggal_target, "d MMM yyyy")}</span>}
                  </div>
                  <div className="flex items-center gap-3 pt-1 border-t border-surface-light">
                    {g.tipe === "custom" && !done && (
                      <button onClick={() => updateProgress(g)} className="text-xs text-primary pt-2">
                        {t("Update progres")}
                      </button>
                    )}
                    {g.status === "Aktif" && (
                      <button onClick={() => updateGoal(g.id, { status: "Tercapai" })} className="flex items-center gap-1 text-xs text-primary pt-2">
                        <CheckCircle2 size={13} />
                        {t("Tandai tercapai")}
                      </button>
                    )}
                    {g.status === "Tercapai" && (
                      <button onClick={() => updateGoal(g.id, { status: "Aktif" })} className="text-xs text-gray-400 pt-2">
                        {t("Aktifkan lagi")}
                      </button>
                    )}
                    <span className="flex-1" />
                    <button onClick={() => open(g)} aria-label={t("Edit")} className="text-gray-400 pt-2">
                      <Pencil size={15} />
                    </button>
                    <DeleteButton size={15} confirmMessage={t("Hapus goal ini?")} onConfirm={() => deleteGoal(g.id)} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <PrimaryButton onClick={() => open()}>{t("Tambah Goal")}</PrimaryButton>
      </div>

      {showForm && (
        <Sheet title={editing ? t("Edit Goal") : t("Tambah Goal")} onClose={close}>
          <form onSubmit={submit} className="space-y-3">
            <input
              required
              autoFocus
              className="input-field"
              placeholder={t("Judul goal (mis. Dana Darurat)")}
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
            />
            <Select className="input-field" value={form.tipe} onChange={(e) => setForm({ ...form, tipe: e.target.value as GoalTipe })}>
              {Object.entries(GOAL_TIPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {tx(v)}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 min-w-0">
                <span className="text-xs text-gray-400">{t("Target")}</span>
                <input
                  type="number"
                  min={0}
                  className="input-field"
                  value={form.target_value}
                  onChange={(e) => setForm({ ...form, target_value: Number(e.target.value) })}
                />
              </label>
              {form.tipe === "custom" && (
                <label className="space-y-1 min-w-0">
                  <span className="text-xs text-gray-400">{t("Satuan")}</span>
                  <input
                    className="input-field"
                    placeholder={t("Rp, materi, kg")}
                    value={form.satuan ?? ""}
                    onChange={(e) => setForm({ ...form, satuan: e.target.value })}
                  />
                </label>
              )}
            </div>
            {form.tipe === "custom" && (
              <label className="block space-y-1">
                <span className="text-xs text-gray-400">{t("Progres saat ini")}</span>
                <input
                  type="number"
                  className="input-field"
                  value={form.current_value_manual}
                  onChange={(e) => setForm({ ...form, current_value_manual: Number(e.target.value) })}
                />
              </label>
            )}
            <label className="block space-y-1">
              <span className="text-xs text-gray-400">{t("Tanggal target (opsional)")}</span>
              <input
                type="date"
                className="input-field"
                value={form.tanggal_target ?? ""}
                onChange={(e) => setForm({ ...form, tanggal_target: e.target.value || null })}
              />
            </label>
            <div className="flex gap-2 pt-1">
              <GhostButton type="button" onClick={close} className="flex-1">
                {t("Batal")}
              </GhostButton>
              <PrimaryButton type="submit" disabled={saving} className="flex-1">
                {saving ? t("Menyimpan...") : t("Simpan")}
              </PrimaryButton>
            </div>
          </form>
        </Sheet>
      )}
    </div>
  );
}
