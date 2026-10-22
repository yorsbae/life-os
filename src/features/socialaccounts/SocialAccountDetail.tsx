import { useState } from "react";
import { useSocialAccountDetail, EARNING_TIPE } from "./useSocialAccountDetail";
import { useSocialAccounts, type SocialAccount } from "./useSocialAccounts";
import { useEncryptionSalt } from "../../hooks/useEncryptionSalt";
import { encryptText, decryptText } from "../../utils/cryptoUtils";
import PinPromptModal from "../../components/PinPromptModal";

import { t, tx, intlLocale } from "../../lib/i18n";
import Select from "../../components/ui/Select";
import { DeleteButton } from "../../components/ui/DeleteButton";
interface DetailProps {
  account: SocialAccount;
  onBack: () => void;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat(intlLocale(), {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

type PinAction = { mode: "view" } | { mode: "set"; newPassword: string } | null;

export default function SocialAccountDetail({ account, onBack }: DetailProps) {
  const { updateAccount } = useSocialAccounts();
  const {
    metrics,
    earnings,
    loading,
    addMetric,
    deleteMetric,
    addEarning,
    deleteEarning,
    totalEarnings,
    latestFollowers,
  } = useSocialAccountDetail(account.id);
  const { salt } = useEncryptionSalt();

  const [tab, setTab] = useState<"info" | "metrics" | "earnings">("info");
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(
    null,
  );
  const [pinAction, setPinAction] = useState<PinAction>(null);
  const [pinError, setPinError] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");

  const [followers, setFollowers] = useState("");
  const [insightNote, setInsightNote] = useState("");
  const [earningSumber, setEarningSumber] = useState("");
  const [earningNominal, setEarningNominal] = useState("");
  const [earningTipe, setEarningTipe] = useState(EARNING_TIPE[0]);

  const handleViewPassword = () => {
    setPinError("");
    setPinAction({ mode: "view" });
  };

  const handleSetPassword = () => {
    if (!newPasswordInput) return;
    setPinError("");
    setPinAction({ mode: "set", newPassword: newPasswordInput });
  };

  const handlePinSubmit = async (pin: string) => {
    if (!salt || !pinAction) return;
    try {
      if (pinAction.mode === "view") {
        if (!account.password_encrypted)
          throw new Error("Belum ada password tersimpan");
        const plain = await decryptText(account.password_encrypted, pin, salt);
        setDecryptedPassword(plain);
      } else {
        const cipher = await encryptText(pinAction.newPassword, pin, salt);
        await updateAccount(account.id, { password_encrypted: cipher });
        setNewPasswordInput("");
        alert(t("Password tersimpan (terenkripsi)."));
      }
      setPinAction(null);
    } catch {
      setPinError(t("PIN salah atau data rusak, coba lagi."));
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-surface-light bg-bg text-gray-100 rounded-lg text-sm";

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-400 hover:text-gray-50"
      >
        {t("← Semua Akun")}</button>

      <div>
        <h1 className="text-xl font-semibold text-gray-50 break-words">
          @{tx(account.username)}
        </h1>
        <p className="text-sm text-gray-400">
          {tx(account.platform)} · {tx(account.niche)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-xl border border-surface-light p-4">
          <p className="text-xs text-gray-400">{t("Followers Terakhir")}</p>
          <p className="text-lg font-semibold text-gray-50">
            {latestFollowers?.toLocaleString(intlLocale()) ?? "-"}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-surface-light p-4">
          <p className="text-xs text-gray-400">{t("Total Earnings")}</p>
          <p className="text-lg font-semibold text-green-400">
            {formatRupiah(totalEarnings)}
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-surface-light overflow-x-auto">
        {(["info", "metrics", "earnings"] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${tab === tb ? "border-primary text-gray-50" : "border-transparent text-gray-400"}`}
          >
            {tb === "info" ? t("Info & Password") : tb === "metrics" ? t("Metrics") : t("Earnings")}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="bg-surface rounded-xl border border-surface-light p-5 space-y-3">
          <h3 className="font-semibold text-gray-50">
            {t("🔒 Password (Terenkripsi)")}</h3>
          {decryptedPassword ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-bg px-3 py-2 rounded-lg text-sm text-gray-50">
                {tx(decryptedPassword)}
              </code>
              <button
                onClick={() => setDecryptedPassword(null)}
                className="text-xs text-gray-400"
              >
                {t("Sembunyikan")}</button>
            </div>
          ) : (
            <button
              onClick={handleViewPassword}
              disabled={!account.password_encrypted}
              className="text-sm bg-gray-700 text-gray-50 px-3 py-2 rounded-lg disabled:opacity-40"
            >
              {account.password_encrypted ? t("👁 Lihat Password (butuh PIN)") : t("Belum ada password tersimpan")}
            </button>
          )}

          <div className="border-t border-surface-light pt-3 space-y-2">
            <label className="block text-xs font-medium text-gray-400">
              {account.password_encrypted ? t("Ganti Password") : t("Set Password Baru")}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder={t("Password baru")}
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className={inputClass}
              />
              <button
                onClick={handleSetPassword}
                disabled={!newPasswordInput}
                className="bg-primary text-on-primary px-4 rounded-lg text-sm disabled:opacity-50"
              >
                {t("Simpan")}</button>
            </div>
            <p className="text-xs text-gray-400">
              {t("Akan diminta PIN App Lock untuk enkripsi/dekripsi. Kalau belum aktifkan App Lock, set dulu di Profile.")}</p>
          </div>
        </div>
      )}

      {tab === "metrics" && (
        <div className="space-y-3">
          <div className="bg-surface rounded-xl border border-surface-light p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder={t("Followers")}
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder={t("Catatan insight")}
                value={insightNote}
                onChange={(e) => setInsightNote(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              onClick={() => {
                addMetric(
                  followers ? Number(followers) : null,
                  insightNote,
                  new Date().toISOString().split("T")[0],
                );
                setFollowers("");
                setInsightNote("");
              }}
              className="w-full bg-primary text-on-primary py-2 rounded-lg text-sm"
            >
              {t("+ Catat Metrics Hari Ini")}</button>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-4">{t("Memuat...")}</p>
          ) : (
            metrics.map((m) => (
              <div
                key={m.id}
                className="bg-surface p-3 rounded-lg border border-surface-light flex justify-between items-center"
              >
                <div>
                  <p className="text-sm text-gray-50">
                    {m.followers?.toLocaleString(intlLocale()) ?? "-"} {t("followers")}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(m.tanggal).toLocaleDateString(intlLocale(), {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    {m.insight_note && `· ${m.insight_note}`}
                  </p>
                </div>
                <DeleteButton label={t("Hapus")} confirmMessage={t("Yakin hapus data ini?")} onConfirm={() => deleteMetric(m.id)} />
              </div>
            ))
          )}
        </div>
      )}

      {tab === "earnings" && (
        <div className="space-y-3">
          <div className="bg-surface rounded-xl border border-surface-light p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder={t("Sumber (nama brand)")}
                value={earningSumber}
                onChange={(e) => setEarningSumber(e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                placeholder={t("Nominal")}
                value={earningNominal}
                onChange={(e) => setEarningNominal(e.target.value)}
                className={inputClass}
              />
              <Select
                value={earningTipe}
                onChange={(e) => setEarningTipe(e.target.value)}
                className={`${inputClass} col-span-2`}
              >
                {EARNING_TIPE.map((t) => (
                  <option key={t} value={t}>
                    {tx(t)}
                  </option>
                ))}
              </Select>
            </div>
            <button
              onClick={() => {
                if (earningSumber && earningNominal) {
                  addEarning(
                    earningSumber,
                    Number(earningNominal),
                    earningTipe,
                    new Date().toISOString().split("T")[0],
                    "",
                  );
                  setEarningSumber("");
                  setEarningNominal("");
                }
              }}
              className="w-full bg-primary text-on-primary py-2 rounded-lg text-sm"
            >
              {t("+ Catat Earnings")}</button>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-4">{t("Memuat...")}</p>
          ) : (
            earnings.map((e) => (
              <div
                key={e.id}
                className="bg-surface p-3 rounded-lg border border-surface-light flex justify-between items-center"
              >
                <div>
                  <p className="text-sm text-gray-50">
                    {tx(e.sumber)}{" "}
                    <span className="text-xs text-gray-400">({tx(e.tipe)})</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(e.tanggal).toLocaleDateString(intlLocale(), {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-400">
                    {formatRupiah(e.nominal)}
                  </span>
                  <DeleteButton label={t("Hapus")} confirmMessage={t("Yakin hapus data ini?")} onConfirm={() => deleteEarning(e.id)} />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {pinAction && (
        <PinPromptModal
          title={
            pinAction.mode === "view" ? t("Masukkan PIN untuk lihat password") : t("Masukkan PIN untuk enkripsi password")
          }
          onSubmit={handlePinSubmit}
          onCancel={() => setPinAction(null)}
          error={pinError}
        />
      )}
    </div>
  );
}
