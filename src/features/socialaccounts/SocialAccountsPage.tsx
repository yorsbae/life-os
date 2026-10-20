import { useState, type FormEvent } from "react";
import {
  useSocialAccounts,
  PLATFORM_OPTIONS,
  TUJUAN_OPTIONS,
  NICHE_OPTIONS,
  type SocialAccount,
} from "./useSocialAccounts";
import SocialAccountDetail from "./SocialAccountDetail";

const initialForm = {
  platform: PLATFORM_OPTIONS[0],
  username: "",
  niche: NICHE_OPTIONS[0],
  tujuan: TUJUAN_OPTIONS[0],
  status: "Aktif" as const,
  password_encrypted: null,
};

export default function SocialAccountsPage() {
  const { accounts, loading, addAccount, deleteAccount } = useSocialAccounts();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openAccount, setOpenAccount] = useState<SocialAccount | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await addAccount(form);
    setForm(initialForm);
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        "Hapus akun ini? Semua metrics/earnings di dalamnya ikut terhapus.",
      )
    )
      deleteAccount(id);
  };

  if (openAccount) {
    return (
      <SocialAccountDetail
        account={openAccount}
        onBack={() => setOpenAccount(null)}
      />
    );
  }

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm";

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          Social Account Tracker
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 py-1.5 rounded-lg"
        >
          + Akun Baru
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className={inputClass}
            >
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className={inputClass}
            />
            <select
              value={form.niche ?? ""}
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
              className={inputClass}
            >
              {NICHE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <select
              value={form.tujuan ?? ""}
              onChange={(e) => setForm({ ...form, tujuan: e.target.value })}
              className={inputClass}
            >
              {TUJUAN_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400">
            💡 Password bisa diisi nanti dari halaman detail (terenkripsi pakai
            PIN App Lock kamu).
          </p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>
      ) : accounts.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Belum ada akun tercatat.
        </p>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex justify-between items-start gap-2">
                <button
                  onClick={() => setOpenAccount(a)}
                  className="text-left flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 dark:text-white wrap-break-word">
                      @{a.username}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                      {a.platform}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {a.niche} · {a.tujuan}
                  </p>
                </button>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs text-red-500 shrink-0"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
