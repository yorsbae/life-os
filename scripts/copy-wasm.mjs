// Salin sql-wasm.wasm ke public/assets agar mode web (npm run dev) bisa memakai SQLite.
// Di APK Android file ini tidak dipakai (SQLite native), tapi aman ikut terbawa.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";

const src = "node_modules/sql.js/dist/sql-wasm.wasm";
if (existsSync(src)) {
  mkdirSync("public/assets", { recursive: true });
  copyFileSync(src, "public/assets/sql-wasm.wasm");
}
