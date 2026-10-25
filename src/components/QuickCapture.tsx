import { useState } from "react";
import { Zap } from "lucide-react";
import { db, LOCAL_USER_ID } from "../lib/db";
import { Chip, PrimaryButton, Sheet } from "./ui/Controls";
import { useLanguage } from "../context/LanguageContext";
import { EXPENSE_CATS } from "../features/money/categories";
import { NOTE_KATEGORI_DEFAULT } from "../types";
import { toDateStr } from "../utils/dates";
import { parseQuickExpense, parseWeight } from "../utils/quickParse";
import { defaultAccountName } from "../features/money/defaultAccount";
import { intlLocale, t, tx } from "../lib/i18n";

type Kind = "expense" | "note" | "weight";

// Tombol cepat di semua halaman bernavigasi: catat pengeluaran ("kopi 25rb"), catatan, atau berat badan.
export default function QuickCapture() {
  const { remount } = useLanguage();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("expense");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const expense = kind === "expense" ? parseQuickExpense(text) : null;
  const weight = kind === "weight" ? parseWeight(text) : null;
  const valid = kind === "note" ? text.trim().length > 0 : kind === "expense" ? !!expense : weight !== null;

  const close = () => {
    setOpen(false);
    setText("");
    setError("");
  };

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setError("");
    const tanggal = toDateStr();
    let res;
    if (kind === "expense" && expense) {
      // Tanpa sumber dana, pengeluaran cepat tidak memotong saldo akun mana pun.
      const akun = await defaultAccountName();
      res = await db.from("expenses").insert({
        user_id: LOCAL_USER_ID,
        nominal: expense.nominal,
        kategori: expense.kategori,
        catatan: expense.catatan || null,
        metode_pembayaran: akun,
        tanggal,
      });
    } else if (kind === "weight" && weight !== null) {
      res = await db.from("body_weight_logs").insert({ user_id: LOCAL_USER_ID, berat: weight, tanggal });
    } else {
      const body = text.trim();
      res = await db.from("notes").insert({
        user_id: LOCAL_USER_ID,
        judul: body.split("\n")[0].slice(0, 60),
        kategori: NOTE_KATEGORI_DEFAULT[0],
        konten: body,
        tags: [],
        is_pinned: false,
      });
    }
    setBusy(false);
    if (res?.error) {
      setError(res.error.message);
      return;
    }
    close();
    remount(); // muat ulang halaman aktif agar data baru langsung terlihat
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("Catat Cepat")}
        className="fixed left-5 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] w-12 h-12 rounded-full bg-surface text-primary border border-surface-light shadow-lg shadow-black/40 flex items-center justify-center z-30"
      >
        <Zap size={22} />
      </button>
      {open && (
        <Sheet title={t("Catat Cepat")} onClose={close}>
          <div className="flex gap-2">
            <Chip active={kind === "expense"} onClick={() => setKind("expense")}>{t("Pengeluaran")}</Chip>
            <Chip active={kind === "note"} onClick={() => setKind("note")}>{t("Catatan")}</Chip>
            <Chip active={kind === "weight"} onClick={() => setKind("weight")}>{t("Berat (kg)")}</Chip>
          </div>
          {kind === "note" ? (
            <textarea
              autoFocus
              rows={4}
              className="input-field"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("Tulis catatan...")}
            />
          ) : (
            <input
              autoFocus
              className="input-field"
              inputMode={kind === "weight" ? "decimal" : "text"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={kind === "expense" ? t("mis. kopi 25rb") : t("mis. 65,5")}
            />
          )}
          {expense && (
            <p className="text-xs text-gray-400">
              Rp {new Intl.NumberFormat(intlLocale()).format(expense.nominal)} · {tx(EXPENSE_CATS[expense.kategori]?.label ?? expense.kategori)}
            </p>
          )}
          {error && <p className="text-xs text-red-400 break-words">{tx(error)}</p>}
          <PrimaryButton onClick={save} disabled={!valid || busy}>
            {busy ? t("Menyimpan...") : t("Simpan")}
          </PrimaryButton>
        </Sheet>
      )}
    </>
  );
}
