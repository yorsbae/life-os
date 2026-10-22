import PageHeader from "../../components/ui/PageHeader";
import { useState, type FormEvent } from "react";
import {
  useSocialAccounts,
  PLATFORM_OPTIONS,
  TUJUAN_OPTIONS,
  NICHE_OPTIONS,
  type SocialAccount,
} from "./useSocialAccounts";
import SocialAccountDetail from "./SocialAccountDetail";

import { t, tx } from "../../lib/i18n";
import Select from "../../components/ui/Select";
import { DeleteButton } from "../../components/ui/DeleteButton";
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
    "w-full px-3 py-2 border border-surface-light bg-bg text-gray-100 rounded-lg text-sm";

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <PageHeader title={t("Social Accounts")} className="-mx-4 -mt-4" />
      <div className="flex justify-between items-center">
        <h1 className="sr-only">
          {t("Social Account Tracker")}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm bg-primary text-on-primary px-3 py-1.5 rounded-lg"
        >
          {t("+ Akun Baru")}</button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface p-5 rounded-xl border border-surface-light space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <Select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className={inputClass}
            >
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {tx(p)}
                </option>
              ))}
            </Select>
            <input
              type="text"
              required
              placeholder={t("Username")}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className={inputClass}
            />
            <Select
              value={form.niche ?? ""}
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
              className={inputClass}
            >
              {NICHE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
            <Select
              value={form.tujuan ?? ""}
              onChange={(e) => setForm({ ...form, tujuan: e.target.value })}
              className={inputClass}
            >
              {TUJUAN_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {tx(t)}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-gray-400">
            {t("💡 Password bisa diisi nanti dari halaman detail (terenkripsi pakai PIN App Lock kamu).")}</p>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg text-sm font-medium"
            >
              {isSubmitting ? t("Menyimpan...") : t("Simpan")}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-lg border border-surface-light text-gray-300 text-sm"
            >
              {t("Batal")}</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">{t("Memuat...")}</p>
      ) : accounts.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          {t("Belum ada akun tercatat.")}</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <div
              key={a.id}
              className="bg-surface rounded-xl border border-surface-light p-4"
            >
              <div className="flex justify-between items-start gap-2">
                <button
                  onClick={() => setOpenAccount(a)}
                  className="text-left flex-1 min-w-0"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-50 wrap-break-word">
                      @{tx(a.username)}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full">
                      {tx(a.platform)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {tx(a.niche)} · {tx(a.tujuan)}
                  </p>
                </button>
                <DeleteButton label={t("Hapus")} confirmMessage={t("Hapus akun ini? Semua metrics/earnings di dalamnya ikut terhapus.")} onConfirm={() => handleDelete(a.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
