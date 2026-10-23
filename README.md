# Life OS (Android)

Aplikasi manajemen hidup pribadi: keuangan, olahraga, pembelajaran, jurnal, konten kreatif, catatan, kalender, target, dan analitik. Berjalan **sepenuhnya di HP**, tanpa server, tanpa akun, tanpa internet.

Dibangun dengan **React + Vite + TypeScript + Tailwind**, dibungkus **Capacitor** menjadi APK, data disimpan di **SQLite lokal** (penyimpanan privat aplikasi).

> Visi dan keputusan desain: [`docs/VISION.md`](docs/VISION.md). Skema Supabase lama (arsip): `docs/legacy-supabase-schema.sql`.

## Tampilan (revamp UI/UX)

Tema hijau gelap (Background `#151815`, Surface `#202520`, Primary `#7DC7A0`, font Inter, ikon Lucide). Navigasi bawah 5 tab: **Home, Money, Plan, Body, Insights**; modul lain (Habit, Kalender, Focus, Goals, Learning, Journal, Notes, Creative Brain, Projects, Achievements, Profil) lewat ikon hamburger di header. Alur pertama kali: Splash → 3 slide onboarding → pengaturan singkat. Token desain ada di `src/index.css`, komponen bersama di `src/components/ui/`.

## Baru di v4

- **Hari Ini** (menu modul): tugas, habit, agenda, dan pengeluaran hari ini + **Skor Pekan Ini** (tugas, kebiasaan, fokus, refleksi) dihitung dari data yang sudah ada.
- **Catat Cepat** (tombol petir di kiri bawah): ketik `kopi 25rb` untuk pengeluaran (nominal & kategori terdeteksi otomatis), tulis catatan, atau catat berat badan.
- **Perbaikan layar hitam saat dibuka**: timeout + pesan error + tombol coba lagi pada pembukaan database/penyimpanan aman, koneksi SQLite yang rusak dibuat ulang, warna latar WebView, dan jaring pengaman error di `main.tsx`.

## Fitur

Dashboard, Money (expense, income, budget, recurring, wishlist), Body (log latihan, jadwal, coaching), Mind & Growth (learning, reading, journal, weekly review), Creative Brain, Notes, Project Tracker, Social Accounts, Goals, Achievements, Calendar, Analytics, Focus Mode, Profile, Quick-Add, pencarian global, dark mode.

Khusus Android:
- **Pengingat jadwal**: notifikasi lokal 30 menit sebelum event Calendar (aktifkan di Profile).
- **Backup & Pulihkan**: ekspor semua data ke file JSON, impor kembali (atomik).
- **Tombol Back** Android: mundur satu halaman, keluar di halaman utama.
- **Cuaca** (opsional, mati secara default): satu-satunya fitur yang memakai internet.

## Penting soal data

Data hanya ada di HP ini. **Menghapus aplikasi atau kehilangan HP = data hilang**, kecuali kamu punya file backup. Auto Backup Google sengaja dimatikan agar tidak ada data yang keluar dari perangkat. Buat backup berkala dari **Profile → Backup & Pulihkan** dan simpan file-nya di tempat aman (isinya teks biasa).

## Arsitektur

```
UI (React) → hook per modul (use<Modul>.ts) → db (src/lib/db) → SQLite
```

`src/lib/db` adalah lapisan data lokal dengan API bergaya Supabase (`db.from("expenses").select("*").eq(...).order(...)`), sehingga hook lama tidak perlu ditulis ulang.

| File | Peran |
|---|---|
| `schema.ts` | Skema + daftar migrasi berversi |
| `query.ts` | Query builder, backup/restore |
| `migrate.ts` | Menjalankan migrasi yang belum diterapkan |
| `capacitorDriver.ts` | Koneksi SQLite (native Android; browser untuk dev) |
| `db.test.ts` | Tes terhadap SQLite sungguhan |

### Mengubah skema di versi berikutnya

Jangan edit migrasi lama. Tambahkan entri baru di akhir `MIGRATIONS` di `schema.ts`; migrasi dijalankan otomatis dalam satu transaksi saat aplikasi dibuka. Jika menambah tabel, daftarkan juga di `TABLE_META` (dan `BACKUP_TABLES` bila datanya perlu ikut backup, urut dari induk ke anak).

> Kolom `user_id` masih ada di tiap tabel dengan nilai tetap `"local"`. Ini sisa dari versi multi-user yang dipertahankan agar kode hook lama tetap bekerja.

## Pengembangan

```bash
npm install
npm test            # tes lapisan data (SQLite sungguhan)
npm run dev         # jalan di browser (SQLite via sql.js, hanya untuk development)
npm run build       # type-check + build web
```

## Membangun APK

### Opsi A — GitHub Actions (tanpa Android Studio)

1. Push repo ke GitHub.
2. **Tanda tangan (wajib sekali saja)** — lihat bagian berikutnya.
3. Tab **Actions → Build APK → Run workflow**. Unduh APK dari bagian *Artifacts*.

### Opsi B — Lokal (butuh Android Studio / Android SDK + JDK 21)

```bash
npm run android:sync     # build web + salin ke proyek Android
npm run android:open     # buka di Android Studio, lalu Run ▶ ke HP
# atau debug APK lewat terminal:
npm run android:debug    # hasil: android/app/build/outputs/apk/debug/app-debug.apk
```

### Tanda tangan (jangan dilewati)

Android hanya mengizinkan update jika APK baru ditandatangani **kunci yang sama** dengan yang terpasang. Jika kuncinya berbeda, satu-satunya jalan adalah uninstall, yang **menghapus database lokal**. Karena itu buat kunci sendiri sekali, simpan baik-baik, dan pakai terus:

```bash
keytool -genkeypair -v -keystore lifeos.keystore -alias lifeos \
  -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 lifeos.keystore    # salin hasilnya
```

Di GitHub: **Settings → Secrets and variables → Actions**, tambahkan:

| Secret | Isi |
|---|---|
| `LIFEOS_KEYSTORE_BASE64` | hasil `base64` di atas |
| `LIFEOS_KEYSTORE_PASSWORD` | password keystore |
| `LIFEOS_KEY_ALIAS` | `lifeos` |
| `LIFEOS_KEY_PASSWORD` | password kunci |

**Backup file `lifeos.keystore` dan passwordnya di tempat aman. Jangan commit ke repo.** Tanpa secret ini workflow hanya membuat APK debug (cukup untuk uji coba, tapi tidak bisa di-update).

Untuk rilis berikutnya naikkan `versionCode` (dan `versionName`) di `android/app/build.gradle`.

### Memperbarui aplikasi

Pasang APK baru **di atas** yang lama (jangan uninstall). Database dan migrasi skema ditangani otomatis.
