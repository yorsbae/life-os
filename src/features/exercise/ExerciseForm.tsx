import { useState, type FormEvent } from "react";
import { Sheet, PrimaryButton, Chip } from "../../components/ui/Controls";
import { t, tx } from "../../lib/i18n";
import {
  EXERCISE_TIPE_PRESETS,
  DISTANCE_BASED_TYPES,
  SUB_KATEGORI_RUNNING,
  SUB_KATEGORI_STRENGTH,
  type Exercise,
  type ExerciseInput,
} from "../../types";
import { toDateStr } from "../../utils/dates";

const CUSTOM = "__custom__";

function subPresets(tipe: string): readonly string[] | null {
  if (tipe === "Running") return SUB_KATEGORI_RUNNING;
  if (tipe === "Strength") return SUB_KATEGORI_STRENGTH;
  return null;
}

export default function ExerciseForm({
  editing,
  onSave,
  onClose,
}: {
  editing: Exercise | null;
  onSave: (input: ExerciseInput) => Promise<{ error: string | null }>;
  onClose: () => void;
}) {
  const [tipe, setTipe] = useState<string>(editing?.tipe ?? "Running");
  const [customTipe, setCustomTipe] = useState(
    editing && !(EXERCISE_TIPE_PRESETS as readonly string[]).includes(editing.tipe) ? editing.tipe : "",
  );
  const [isCustom, setIsCustom] = useState(!!editing && !(EXERCISE_TIPE_PRESETS as readonly string[]).includes(editing.tipe));
  const [sub, setSub] = useState(editing?.sub_kategori ?? SUB_KATEGORI_RUNNING[0]);
  const [durasi, setDurasi] = useState(editing?.durasi != null ? String(editing.durasi) : "");
  const [jarak, setJarak] = useState(editing?.jarak != null ? String(editing.jarak) : "");
  const [tanggal, setTanggal] = useState(editing?.tanggal ?? toDateStr());
  const [catatan, setCatatan] = useState(editing?.catatan ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeTipe = isCustom ? customTipe.trim() : tipe;
  const presets = subPresets(activeTipe);
  const usesDistance = (DISTANCE_BASED_TYPES as readonly string[]).includes(activeTipe);

  const pickTipe = (v: string) => {
    if (v === CUSTOM) {
      setIsCustom(true);
      setSub("");
      return;
    }
    setIsCustom(false);
    setTipe(v);
    setSub(subPresets(v)?.[0] ?? "");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeTipe) return setError(t("Tipe latihan wajib diisi"));
    setSaving(true);
    setError("");
    const res = await onSave({
      tipe: activeTipe as ExerciseInput["tipe"],
      sub_kategori: sub.trim() || activeTipe,
      durasi: durasi ? Number(durasi) : null,
      jarak: usesDistance && jarak ? Number(jarak) : null,
      catatan: catatan.trim() || null,
      tanggal,
    });
    setSaving(false);
    if (res.error) return setError(res.error);
    onClose();
  };

  return (
    <Sheet title={editing ? t("Edit Latihan") : t("Tambah Latihan")} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <span className="text-xs text-gray-400">{t("Tipe Latihan")}</span>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_TIPE_PRESETS.map((p) => (
              <Chip key={p} active={!isCustom && tipe === p} onClick={() => pickTipe(p)}>
                {tx(p)}
              </Chip>
            ))}
            <Chip active={isCustom} onClick={() => pickTipe(CUSTOM)}>
              {t("Lainnya")}
            </Chip>
          </div>
          {isCustom && (
            <input className="input-field" placeholder={t("Ketik tipe latihan (mis. Boxing)")} value={customTipe} onChange={(e) => setCustomTipe(e.target.value)} autoFocus />
          )}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">{t("Jenis")}</span>
          {presets ? (
            <select className="input-field" value={sub} onChange={(e) => setSub(e.target.value)}>
              {presets.map((p) => (
                <option key={p} value={p}>
                  {tx(p)}
                </option>
              ))}
            </select>
          ) : (
            <input className="input-field" placeholder={t("Opsional")} value={sub} onChange={(e) => setSub(e.target.value)} />
          )}
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1.5 min-w-0">
            <span className="text-xs text-gray-400">{t("Durasi (menit)")}</span>
            <input className="input-field" type="number" inputMode="numeric" min={0} value={durasi} onChange={(e) => setDurasi(e.target.value)} placeholder="30" />
          </label>
          {usesDistance && (
            <label className="block space-y-1.5 min-w-0">
              <span className="text-xs text-gray-400">{t("Jarak (km)")}</span>
              <input className="input-field" type="number" inputMode="decimal" step="0.1" min={0} value={jarak} onChange={(e) => setJarak(e.target.value)} placeholder="5" />
            </label>
          )}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">{t("Tanggal")}</span>
          <input className="input-field" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-gray-400">{t("Catatan (opsional)")}</span>
          <textarea className="input-field min-h-16" value={catatan} onChange={(e) => setCatatan(e.target.value)} />
        </label>

        {error && <p className="text-sm text-red-400">{tx(error)}</p>}
        <PrimaryButton type="submit" disabled={saving}>
          {saving ? t("Menyimpan...") : t("Simpan")}
        </PrimaryButton>
      </form>
    </Sheet>
  );
}
