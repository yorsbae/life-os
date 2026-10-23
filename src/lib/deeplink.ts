// Deep link `lifeos://<halaman>` dari widget Home Screen dan app shortcut.
// Hanya rute pada daftar putih yang diterima; selain itu diabaikan.

const ALLOWED = new Set([
  "calendar",
  "plan",
  "habits",
  "money",
  "money/add",
  "focus",
  "notes",
  "journal",
  "goals",
]);

/** Ubah URL masuk menjadi path rute aplikasi, atau null bila tidak dikenal. */
export function routeFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = /^lifeos:\/\/\/?([^?#]*)/i.exec(url.trim());
  if (!m) return null;
  const path = m[1].replace(/\/+$/, "").toLowerCase();
  return ALLOWED.has(path) ? `/${path}` : null;
}
