import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card, PrimaryButton, GhostButton, SectionTitle, Sheet, Chip } from "../../components/ui/Controls";
import { ProgressBar } from "../../components/ui/Progress";
import { t, tx } from "../../lib/i18n";
import { fmtDate, num } from "../../utils/format";
import { toDateStr } from "../../utils/dates";
import { useProfile } from "../profile/useProfile";
import { useWeightLogs } from "../profile/useWeightLogs";
import { ACTIVITY_LEVELS, calculateBMI, calculateBMR, calculateTDEE, getBMICategory } from "../../utils/bodyCalculations";
import Select from "../../components/ui/Select";
import { DeleteButton } from "../../components/ui/DeleteButton";

export default function MetricsTab() {
  const { profile, saveProfile } = useProfile();
  const { logs, addLog, deleteLog, latestWeight } = useWeightLogs();
  const [berat, setBerat] = useState("");
  const [tanggal, setTanggal] = useState(toDateStr());
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ tinggi: "", umur: "", jk: "Pria", level: "Sedang", target: "" });
  const [msg, setMsg] = useState("");

  const weight = latestWeight ?? profile?.berat_badan ?? null;
  const tinggi = profile?.tinggi_badan ?? null;
  const umur = profile?.umur ?? null;
  const jk = profile?.jenis_kelamin ?? null;
  const target = profile?.target_berat_badan ?? null;
  const level = profile?.aktivitas_level ?? "Sedang";

  const bmi = weight && tinggi ? calculateBMI(weight, tinggi) : null;
  const bmr = weight && tinggi && umur && jk ? calculateBMR(weight, tinggi, umur, jk) : null;
  const tdee = bmr ? calculateTDEE(bmr, level) : null;
  const cat = bmi ? getBMICategory(bmi) : null;

  const first = logs.length ? logs[logs.length - 1].berat : null;
  const progress = first != null && weight != null && target != null && first !== target ? Math.min(1, Math.max(0, (first - weight) / (first - target))) : null;

  const openEdit = () => {
    setForm({
      tinggi: tinggi ? String(tinggi) : "",
      umur: umur ? String(umur) : "",
      jk: jk ?? "Pria",
      level,
      target: target ? String(target) : "",
    });
    setEditing(true);
  };

  const submitWeight = async () => {
    const v = Number(berat.replace(",", "."));
    if (!(v > 0)) return setMsg(t("Berat badan tidak valid"));
    const res = await addLog(v, tanggal);
    setMsg(res.error ?? "");
    if (!res.error) setBerat("");
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <p className="text-xs text-gray-400">{t("Berat Badan")}</p>
        <p className="text-3xl font-bold text-primary">{weight ? t("{0} kg", [num(weight, 1)]) : "—"}</p>
        <div className="grid grid-cols-[1fr_1fr] gap-2">
          <input className="input-field min-w-0" inputMode="decimal" placeholder={t("Berat (kg)")} value={berat} onChange={(e) => setBerat(e.target.value)} />
          <input className="input-field min-w-0" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>
        {msg && <p className="text-xs text-red-400">{tx(msg)}</p>}
        <PrimaryButton onClick={submitWeight}>{t("Catat Berat")}</PrimaryButton>
      </Card>

      {target != null && weight != null && (
        <Card className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">{t("Target berat")}: {t("{0} kg", [num(target, 1)])}</span>
            <span className="text-gray-200">{t("Sisa {0} kg", [num(Math.abs(weight - target), 1)])}</span>
          </div>
          <ProgressBar value={(progress ?? 0) * 100} max={100} />
        </Card>
      )}

      <div className="space-y-2">
        <SectionTitle
          action={
            <button onClick={openEdit} className="flex items-center gap-1 text-xs text-primary">
              <Pencil size={13} /> {t("Ubah data")}
            </button>
          }
        >
          {t("Data Tubuh")}
        </SectionTitle>
        <Card className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-[11px] text-gray-400">{t("Tinggi")}</p><p className="text-gray-100">{tinggi ? t("{0} cm", [tinggi]) : "—"}</p></div>
          <div><p className="text-[11px] text-gray-400">{t("Umur")}</p><p className="text-gray-100">{umur ? t("{0} tahun", [umur]) : "—"}</p></div>
          <div><p className="text-[11px] text-gray-400">{t("Jenis kelamin")}</p><p className="text-gray-100">{jk ? tx(jk) : "—"}</p></div>
          <div><p className="text-[11px] text-gray-400">{t("Tingkat aktivitas")}</p><p className="text-gray-100 truncate">{tx(level)}</p></div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center !px-2">
          <p className="text-[11px] text-gray-400">BMI</p>
          <p className="text-lg font-bold text-gray-50">{bmi ? num(bmi, 1) : "—"}</p>
          {cat && <p className="text-[10px] text-primary truncate">{tx(cat.label)}</p>}
        </Card>
        <Card className="text-center !px-2">
          <p className="text-[11px] text-gray-400">BMR</p>
          <p className="text-lg font-bold text-gray-50">{bmr ? num(bmr, 0) : "—"}</p>
          <p className="text-[10px] text-gray-500">{t("kkal/hari")}</p>
        </Card>
        <Card className="text-center !px-2">
          <p className="text-[11px] text-gray-400">TDEE</p>
          <p className="text-lg font-bold text-gray-50">{tdee ? num(tdee, 0) : "—"}</p>
          <p className="text-[10px] text-gray-500">{t("kkal/hari")}</p>
        </Card>
      </div>
      {!bmi && <p className="text-xs text-gray-400 px-1">{t("Lengkapi tinggi, umur, dan jenis kelamin untuk melihat BMI, BMR, dan TDEE.")}</p>}

      <div className="space-y-2">
        <SectionTitle>{t("Riwayat Berat Badan")}</SectionTitle>
        {logs.length === 0 ? (
          <p className="text-xs text-gray-400 px-1">{t("Belum ada catatan berat badan.")}</p>
        ) : (
          logs.slice(0, 15).map((l) => (
            <Card key={l.id} className="!py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-gray-100">{t("{0} kg", [num(l.berat, 1)])}</span>
              <span className="flex-1 text-right text-[11px] text-gray-400">{fmtDate(l.tanggal, "d MMM yyyy")}</span>
              <DeleteButton size={15} confirmMessage={t("Yakin hapus data ini?")} onConfirm={() => deleteLog(l.id)} />
            </Card>
          ))
        )}
      </div>

      {editing && (
        <Sheet title={t("Data Tubuh")} onClose={() => setEditing(false)}>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 min-w-0"><span className="text-xs text-gray-400">{t("Tinggi (cm)")}</span>
              <input className="input-field" inputMode="decimal" value={form.tinggi} onChange={(e) => setForm({ ...form, tinggi: e.target.value })} /></label>
            <label className="space-y-1 min-w-0"><span className="text-xs text-gray-400">{t("Umur")}</span>
              <input className="input-field" inputMode="numeric" value={form.umur} onChange={(e) => setForm({ ...form, umur: e.target.value })} /></label>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-gray-400">{t("Jenis kelamin")}</span>
            <div className="flex gap-2">
              {["Pria", "Wanita"].map((v) => <Chip key={v} active={form.jk === v} onClick={() => setForm({ ...form, jk: v })}>{tx(v)}</Chip>)}
            </div>
          </div>
          <label className="block space-y-1"><span className="text-xs text-gray-400">{t("Tingkat aktivitas")}</span>
            <Select className="input-field" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {ACTIVITY_LEVELS.map((a) => <option key={a} value={a}>{tx(a)}</option>)}
            </Select></label>
          <label className="block space-y-1"><span className="text-xs text-gray-400">{t("Target berat (kg)")}</span>
            <input className="input-field" inputMode="decimal" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} /></label>
          <PrimaryButton
            onClick={async () => {
              await saveProfile({
                tinggi_badan: Number(form.tinggi) || null,
                umur: Number(form.umur) || null,
                jenis_kelamin: form.jk,
                aktivitas_level: form.level,
                target_berat_badan: Number(form.target.replace(",", ".")) || null,
              });
              setEditing(false);
            }}
          >
            {t("Simpan")}
          </PrimaryButton>
          <GhostButton onClick={() => setEditing(false)}>{t("Batal")}</GhostButton>
        </Sheet>
      )}
    </div>
  );
}
