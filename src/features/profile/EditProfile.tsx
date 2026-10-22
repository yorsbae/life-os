import { useEffect, useState } from "react";
import PageHeader from "../../components/ui/PageHeader";
import Field from "../../components/ui/Field";
import { Card, PrimaryButton, SectionTitle } from "../../components/ui/Controls";
import { useProfile, type ProfileInput } from "./useProfile";
import { calculateBMI, getBMICategory, calculateBMR, calculateTDEE, ACTIVITY_LEVELS } from "../../utils/bodyCalculations";
import WeightHistorySection from "./WeightHistorySection";
import { useWeightLogs } from "./useWeightLogs";
import { t, tx } from "../../lib/i18n";

const initialForm: ProfileInput = {
  nama: "", username: null, umur: null, jenis_kelamin: "Pria", tinggi_badan: null,
  berat_badan: null, target_berat_badan: null, aktivitas_level: "Sedang", onboarding_done: false,
};

const numOrNull = (v: string) => (v ? Number(v) : null);

export default function EditProfile() {
  const { profile, saveProfile } = useProfile();
  const { latestWeight } = useWeightLogs();
  const [form, setForm] = useState<ProfileInput>(initialForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (profile) {
      const { id: _id, ...rest } = profile;
      void _id;
      setForm({ ...initialForm, ...rest, jenis_kelamin: rest.jenis_kelamin ?? "Pria", aktivitas_level: rest.aktivitas_level ?? "Sedang", onboarding_done: rest.onboarding_done ?? false });
    }
  }, [profile]);

  const save = async () => {
    setSaving(true);
    const res = await saveProfile(form);
    setMsg(res.error ? t("Gagal menyimpan: {0}", [res.error]) : t("Tersimpan!"));
    setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };

  const berat = latestWeight ?? form.berat_badan;
  const ok = berat && form.tinggi_badan && form.umur && form.jenis_kelamin;
  const bmi = ok ? calculateBMI(berat!, form.tinggi_badan!) : null;
  const cat = bmi ? getBMICategory(bmi) : null;
  const bmr = ok ? calculateBMR(berat!, form.tinggi_badan!, form.umur!, form.jenis_kelamin!) : null;
  const tdee = bmr && form.aktivitas_level ? calculateTDEE(bmr, form.aktivitas_level) : null;

  return (
    <div className="pb-10">
      <PageHeader title={t("Edit Profil")} left="back" search={false} />
      <div className="px-4 space-y-4">
        <Card className="space-y-3">
          <SectionTitle>{t("Data Diri")}</SectionTitle>
          <Field label={t("Nama")}><input className="input-field" value={form.nama ?? ""} onChange={(e) => setForm({ ...form, nama: e.target.value })} /></Field>
          <Field label={t("Username / email")}><input className="input-field" value={form.username ?? ""} onChange={(e) => setForm({ ...form, username: e.target.value || null })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Umur")}><input type="number" inputMode="numeric" className="input-field" value={form.umur ?? ""} onChange={(e) => setForm({ ...form, umur: numOrNull(e.target.value) })} /></Field>
            <Field label={t("Jenis kelamin")}>
              <select className="input-field" value={form.jenis_kelamin ?? "Pria"} onChange={(e) => setForm({ ...form, jenis_kelamin: e.target.value })}>
                <option value="Pria">{t("Pria")}</option>
                <option value="Wanita">{t("Wanita")}</option>
              </select>
            </Field>
            <Field label={t("Tinggi (cm)")}><input type="number" inputMode="decimal" className="input-field" value={form.tinggi_badan ?? ""} onChange={(e) => setForm({ ...form, tinggi_badan: numOrNull(e.target.value) })} /></Field>
            <Field label={t("Berat (kg)")}><input type="number" inputMode="decimal" className="input-field" value={form.berat_badan ?? ""} onChange={(e) => setForm({ ...form, berat_badan: numOrNull(e.target.value) })} /></Field>
            <Field label={t("Target berat (kg)")}><input type="number" inputMode="decimal" className="input-field" value={form.target_berat_badan ?? ""} onChange={(e) => setForm({ ...form, target_berat_badan: numOrNull(e.target.value) })} /></Field>
            <Field label={t("Aktivitas")}>
              <select className="input-field" value={form.aktivitas_level ?? "Sedang"} onChange={(e) => setForm({ ...form, aktivitas_level: e.target.value })}>
                {ACTIVITY_LEVELS.map((l) => <option key={l} value={l}>{tx(l)}</option>)}
              </select>
            </Field>
          </div>
          <PrimaryButton onClick={save} disabled={saving}>{saving ? t("Menyimpan...") : t("Simpan")}</PrimaryButton>
          {msg && <p className="text-xs text-center text-gray-400">{tx(msg)}</p>}
        </Card>

        <Card className="space-y-3">
          <SectionTitle>{t("Metrik Tubuh")}</SectionTitle>
          {!ok ? (
            <p className="text-sm text-gray-400">{t("Lengkapi umur, jenis kelamin, tinggi, dan berat badan untuk melihat perhitungan.")}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-xs text-gray-400">BMI</p><p className="text-lg font-semibold text-gray-50">{bmi!.toFixed(1)}</p><p className="text-[11px] text-gray-400">{tx(cat?.label ?? "")}</p></div>
              <div><p className="text-xs text-gray-400">BMR</p><p className="text-lg font-semibold text-gray-50">{Math.round(bmr!)}</p><p className="text-[11px] text-gray-400">{t("kal/hari")}</p></div>
              <div><p className="text-xs text-gray-400">TDEE</p><p className="text-lg font-semibold text-gray-50">{Math.round(tdee!)}</p><p className="text-[11px] text-gray-400">{t("kal/hari")}</p></div>
            </div>
          )}
        </Card>

        <WeightHistorySection />
      </div>
    </div>
  );
}
