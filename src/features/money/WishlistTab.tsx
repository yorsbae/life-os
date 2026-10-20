import { useState, type FormEvent } from "react";
import { useWishlists } from "./useWishlists";
import {
  WISHLIST_KATEGORI,
  WISHLIST_STATUS,
  WISHLIST_PRIORITAS,
  type Wishlist,
  type WishlistInput,
} from "../../types";
import CurrencyInput from "../../components/ui/CurrencyInput";

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

const initialForm: WishlistInput = {
  judul: "",
  kategori: WISHLIST_KATEGORI[0],
  estimasi_biaya: null,
  terkumpul: 0,
  prioritas: "Medium",
  target_tanggal: null,
  status: "Diinginkan",
  catatan: null,
};

const PRIORITAS_COLOR: Record<string, string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-yellow-50 text-yellow-700",
  High: "bg-red-50 text-red-600",
};

export default function WishlistTab() {
  const { wishlists, loading, addWishlist, updateWishlist, deleteWishlist } =
    useWishlists();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Wishlist | null>(null);
  const [form, setForm] = useState<WishlistInput>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (w: Wishlist) => {
    setEditing(w);
    setForm({
      judul: w.judul,
      kategori: w.kategori,
      estimasi_biaya: w.estimasi_biaya,
      terkumpul: w.terkumpul,
      prioritas: w.prioritas,
      target_tanggal: w.target_tanggal,
      status: w.status,
      catatan: w.catatan,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (editing) await updateWishlist(editing.id, form);
    else await addWishlist(form);
    setIsSubmitting(false);
    cancelForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin hapus wishlist ini?")) deleteWishlist(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Wishlist / Goals
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="text-sm bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 py-1.5 rounded-lg"
        >
          + Tambah
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4"
        >
          <input
            type="text"
            required
            placeholder="Judul (misal: Kamera Sony A7C)"
            value={form.judul}
            onChange={(e) => setForm({ ...form, judul: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
            >
              {WISHLIST_KATEGORI.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            <select
              value={form.prioritas}
              onChange={(e) =>
                setForm({
                  ...form,
                  prioritas: e.target.value as WishlistInput["prioritas"],
                })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
            >
              {WISHLIST_PRIORITAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <CurrencyInput
              value={form.estimasi_biaya}
              onChange={(val) => setForm({ ...form, estimasi_biaya: val })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
              placeholder="Estimasi biaya (opsional)"
            />

            <CurrencyInput
              value={form.terkumpul}
              onChange={(val) => setForm({ ...form, terkumpul: val ?? 0 })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
              placeholder="Sudah terkumpul"
            />

            <select
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as WishlistInput["status"],
                })
              }
              className="col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
            >
              {WISHLIST_STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gray-900 dark:bg-white dark:text-gray-900 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {isSubmitting ? "Menyimpan..." : editing ? "Update" : "Simpan"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:text-gray-300 text-sm"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>
      ) : wishlists.length === 0 ? (
        <p className="text-gray-400 text-sm py-8 text-center">
          Belum ada wishlist.
        </p>
      ) : (
        <div className="space-y-3">
          {wishlists.map((w) => {
            const progress = w.estimasi_biaya
              ? Math.min(
                  100,
                  Math.round((w.terkumpul / w.estimasi_biaya) * 100),
                )
              : null;
            return (
              <div
                key={w.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-900 dark:text-white wrap-break-word">
                      {w.judul}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                        {w.kategori}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${PRIORITAS_COLOR[w.prioritas]}`}
                      >
                        {w.prioritas}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded-full">
                        {w.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(w)}
                      className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {w.estimasi_biaya && (
                  <>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      {formatRupiah(w.terkumpul)} /{" "}
                      {formatRupiah(w.estimasi_biaya)} ({progress}%)
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
