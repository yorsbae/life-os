import { t, tx } from "../../lib/i18n";

/** Nama tampilan untuk satu jenis sumber dana. */
export function groupLabel(tipe: string): string {
  switch (tipe) {
    case "Tunai": return t("Cash");
    case "Bank": return t("Rekening / Bank");
    case "E-Wallet": return t("E-Wallet");
    case "Investasi": return t("Investasi");
    default: return String(tx(tipe));
  }
}
