// Pengaturan privasi sinkron (dibaca saat render): sembunyikan nominal uang.
const KEY = "lifeos-hide-amounts";

export function hideAmounts(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setHideAmounts(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? "1" : "0");
  } catch {
    /* abaikan */
  }
}
