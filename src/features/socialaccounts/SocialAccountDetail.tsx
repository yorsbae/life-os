import { useState } from "react";
import { useSocialAccountDetail, EARNING_TIPE } from "./useSocialAccountDetail";
import { useSocialAccounts, type SocialAccount } from "./useSocialAccounts";
import { useEncryptionSalt } from "../../hooks/useEncryptionSalt";
import { encryptText, decryptText } from "../../utils/cryptoUtils";
import PinPromptModal from "../../components/PinPromptModal";

interface DetailProps {
  account: SocialAccount;
  onBack: () => void;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
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
        alert("Password tersimpan (terenkripsi).");
      }
      setPinAction(null);
    } catch {
      setPinError("PIN salah atau data rusak, coba lagi.");
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm";

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        ← Semua Akun
      </button>

      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white break-words">
          @{account.username}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {account.platform} · {account.niche}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-400">Followers Terakhir</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {latestFollowers?.toLocaleString("id-ID") ?? "-"}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-400">Total Earnings</p>
          <p className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatRupiah(totalEarnings)}
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {(["info", "metrics", "earnings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${tab === t ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" : "border-transparent text-gray-400"}`}
          >
            {t === "info"
              ? "Info & Password"
              : t === "metrics"
                ? "Metrics"
                : "Earnings"}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            🔒 Password (Terenkripsi)
          </h3>
          {decryptedPassword ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg text-sm text-gray-900 dark:text-white">
                {decryptedPassword}
              </code>
              <button
                onClick={() => setDecryptedPassword(null)}
                className="text-xs text-gray-400"
              >
                Sembunyikan
              </button>
            </div>
          ) : (
            <button
              onClick={handleViewPassword}
              disabled={!account.password_encrypted}
              className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-lg disabled:opacity-40"
            >
              {account.password_encrypted
                ? "👁 Lihat Password (butuh PIN)"
                : "Belum ada password tersimpan"}
            </button>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">
              {account.password_encrypted
                ? "Ganti Password"
                : "Set Password Baru"}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Password baru"
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className={inputClass}
              />
              <button
                onClick={handleSetPassword}
                disabled={!newPasswordInput}
                className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-4 rounded-lg text-sm disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Akan diminta PIN App Lock untuk enkripsi/dekripsi. Kalau belum
              aktifkan App Lock, set dulu di Profile.
            </p>
          </div>
        </div>
      )}

      {tab === "metrics" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Followers"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="Catatan insight"
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
              className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2 rounded-lg text-sm"
            >
              + Catat Metrics Hari Ini
            </button>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-4">Memuat...</p>
          ) : (
            metrics.map((m) => (
              <div
                key={m.id}
                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {m.followers?.toLocaleString("id-ID") ?? "-"} followers
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(m.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    {m.insight_note && `· ${m.insight_note}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteMetric(m.id)}
                  className="text-xs text-red-500"
                >
                  Hapus
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "earnings" && (
        <div className="space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Sumber (nama brand)"
                value={earningSumber}
                onChange={(e) => setEarningSumber(e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                placeholder="Nominal"
                value={earningNominal}
                onChange={(e) => setEarningNominal(e.target.value)}
                className={inputClass}
              />
              <select
                value={earningTipe}
                onChange={(e) => setEarningTipe(e.target.value)}
                className={`${inputClass} col-span-2`}
              >
                {EARNING_TIPE.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
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
              className="w-full bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2 rounded-lg text-sm"
            >
              + Catat Earnings
            </button>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-4">Memuat...</p>
          ) : (
            earnings.map((e) => (
              <div
                key={e.id}
                className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {e.sumber}{" "}
                    <span className="text-xs text-gray-400">({e.tipe})</span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(e.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {formatRupiah(e.nominal)}
                  </span>
                  <button
                    onClick={() => deleteEarning(e.id)}
                    className="text-xs text-red-500"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {pinAction && (
        <PinPromptModal
          title={
            pinAction.mode === "view"
              ? "Masukkan PIN untuk lihat password"
              : "Masukkan PIN untuk enkripsi password"
          }
          onSubmit={handlePinSubmit}
          onCancel={() => setPinAction(null)}
          error={pinError}
        />
      )}
    </div>
  );
}
