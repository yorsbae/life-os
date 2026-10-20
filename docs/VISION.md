# Vision — Life OS (Android APK)

> **Revisi 2** — diperbarui setelah audit proyek dan implementasi awal (19 Okt 2026).
> Bagian bertanda 🟢 sudah dikerjakan dan diverifikasi, 🟡 sudah dikerjakan tetapi **belum bisa diverifikasi di perangkat**, ⚪ belum dikerjakan.

## 1. Ringkasan Proyek

**Life OS** (repo: `personal-tracker`) adalah aplikasi pribadi untuk mengelola hidup sehari-hari: keuangan, olahraga, pembelajaran, jurnal, konten kreatif, catatan, kalender, target, proyek, dan analitik. Aplikasi ini semula berbasis web (**Vite + React + TypeScript + Supabase**) dan dimigrasikan menjadi aplikasi Android (**APK**) dengan **SQLite lokal di perangkat** sebagai satu-satunya database operasional.

Hasil akhirnya berjalan mandiri tanpa server, akun, maupun internet. Supabase bukan lagi dependensi.

> Catatan penamaan: dokumen awal menyebut "Daily Tracker". Audit menunjukkan aplikasinya jauh lebih luas (27 tabel data, ±14 ribu baris TypeScript) dan bernama **Life OS**. Nama aplikasi di APK: **Life OS**.

## 2. Tujuan

- Mengubah aplikasi web menjadi APK yang dapat dipasang. 🟡
- Mempertahankan sebanyak mungkin fitur, UI, aturan bisnis, dan kode TypeScript lama. 🟢 (±99 pemanggilan query di 21 file dipertahankan, hanya diganti sumber datanya)
- Mengganti seluruh akses data Supabase dengan SQLite lokal. 🟢
- Fitur inti berjalan sepenuhnya offline. 🟢
- Data di penyimpanan internal privat aplikasi. 🟡
- Dasar yang aman dan mudah dipelihara (skema berversi, tes otomatis). 🟢
- Tanpa ketergantungan pada backend atau cloud. 🟢

## 3. Bukan Tujuan

- Tidak membuat backend baru.
- Tidak memakai Supabase pada aplikasi akhir.
- **Tidak ada login/akun** (fitur login, register, dan ganti password dihapus).
- Tidak ada sinkronisasi antarperangkat.
- Tidak mengirim data pengguna ke cloud (lihat pengecualian cuaca di §10).
- Tidak ada backup cloud otomatis, termasuk **Auto Backup Google dimatikan** secara eksplisit.
- Tidak membangun ulang aplikasi; yang ada dimigrasikan.

## 4. Platform dan Teknologi

| Area | Pilihan | Catatan |
|---|---|---|
| UI & logika | Vite + React + TypeScript + Tailwind | Kode lama dipertahankan |
| Pembungkus Android | **Capacitor 8** | `appId: com.lifeos.app`, nama "Life OS" |
| Database | SQLite lokal | Sumber data tunggal |
| Akses SQLite | `@capacitor-community/sqlite` 8.x | Di Android memakai SQLCipher 4.17 (SQLite modern); mode `no-encryption` |
| Pengingat | `@capacitor/local-notifications` | Pengganti Web Push + Edge Function |
| Backup | `@capacitor/filesystem` + `@capacitor/share` | Ekspor/impor JSON manual |
| Tombol Back | `@capacitor/app` | Mundur satu halaman; keluar di beranda |
| Build | Gradle (lokal atau **GitHub Actions**) | Workflow `build-apk.yml` |
| Server | Tidak ada | |
| Internet | Tidak diperlukan | Hanya fitur Cuaca (opsional) |

Migrasi ini **bukan** konversi ke UI native. UI web dipakai ulang di WebView; yang disesuaikan adalah penyimpanan, navigasi, notifikasi, dan lifecycle.

## 5. Prinsip Arsitektur

### 5.1 Offline-first dan lokal sepenuhnya
SQLite adalah *single source of truth*. Semua baca/tulis ke database lokal. Pemblokiran tulis saat offline (`checkOnline`) dan banner offline dihapus karena tidak lagi relevan. 🟢

### 5.2 Lapisan akses data terpisah
**Keputusan desain (dipercayakan kepada pengembang):** alih-alih menulis ulang ±20 hook menjadi repository per tabel, dibuat **satu lapisan data** `src/lib/db` dengan API bergaya Supabase (`db.from(t).select/insert/update/delete/upsert/eq/order/limit/single/maybeSingle`).

Alasannya:
- Audit menunjukkan seluruh query sederhana (tanpa join, RPC, Storage, atau Realtime), sehingga satu builder generik sudah menutup 100% pola yang dipakai.
- UI sudah tidak memanggil Supabase langsung; hanya hook `use<Modul>` yang menyentuh data. Batas lapisan sudah ada, jadi hook-hook tersebut berfungsi sebagai lapisan repository per modul.
- Risiko regresi jauh lebih kecil daripada menulis ulang 20 hook.

Trade-off yang diterima: kurang "murni" dibanding repository bertipe per tabel, dan hasil query bertipe longgar (`any`) seperti perilaku Supabase client sebelumnya. Jika kelak diperlukan, hook dapat dipindah bertahap ke repository bertipe tanpa mengubah skema. 🟢

Keamanan builder: nama tabel divalidasi terhadap skema, nama kolom divalidasi regex, semua nilai lewat parameter, dan `UPDATE`/`DELETE` tanpa filter **ditolak** untuk mencegah terhapusnya seluruh tabel.

### 5.3 Tidak ada ketergantungan Supabase saat runtime
Paket `@supabase/supabase-js`, folder `supabase/` (Edge Function), RPC `get_email_by_username`, dan Auth telah dihapus. 🟢

### 5.4 Integritas data
- ID tetap UUID (string), dibuat di klien. 🟢
- Foreign key + `ON DELETE CASCADE` dipertahankan (6 relasi). Plugin **tidak** mengaktifkan foreign key sendiri; driver mengaktifkannya dan **gagal dengan pesan jelas** jika tidak aktif, bukan diam-diam. 🟡
- Penulisan banyak baris dan migrasi berjalan dalam **satu transaksi**. 🟢
- Tanggal disimpan sebagai teks ISO (`YYYY-MM-DD` untuk date, ISO 8601 untuk timestamp), sama dengan format yang sudah dipakai kode lama, sehingga tidak ada konversi timezone baru.
- Urutan `NULL` pada `ORDER BY` disamakan dengan Postgres (ASC → NULL di akhir, DESC → NULL di awal) agar tampilan tidak berubah. 🟢

### 5.5 Privasi dan keamanan
Database di penyimpanan privat aplikasi. Tidak ada kredensial server di APK. Enkripsi database **tidak** diaktifkan pada rilis awal (lihat §10).

## 6. Arsitektur

```text
┌─────────────────────────────────────────┐
│               Android APK               │
│        Capacitor + React + TS           │
├─────────────────────────────────────────┤
│       UI / halaman / komponen           │
├─────────────────────────────────────────┤
│   Hook per modul (use<Modul>.ts)        │  ← lapisan repository per fitur
├─────────────────────────────────────────┤
│   db (src/lib/db): query builder,       │
│   migrasi berversi, backup/restore      │
├─────────────────────────────────────────┤
│   Driver SQLite (Capacitor plugin)      │
├─────────────────────────────────────────┤
│              SQLite lokal               │
└─────────────────────────────────────────┘
        Tanpa backend, tanpa Supabase
```

## 7. Hasil Audit (Tahap 1) 🟢

- **27 tabel data** + 2 tabel baru (`_meta` versi skema, `app_settings` pengaturan perangkat). `push_subscriptions` dihapus.
- Operasi query yang dipakai: `select, insert, update, delete, upsert (onConflict), eq, order, limit, single, maybeSingle`. Tidak ada join/select bersarang.
- Hanya satu `rpc` (`get_email_by_username`, untuk login) → dihapus bersama login.
- Tidak ada Storage atau Realtime.
- Tipe PostgreSQL yang perlu padanan: `uuid`→TEXT, `date/timestamp`→TEXT ISO, `numeric`→REAL, `boolean`→INTEGER 0/1, `jsonb` & `text[]`/`integer[]`→TEXT JSON. Konversi dilakukan otomatis per kolom (`TABLE_META`).
- Skema acuan memakai `db.sql` (dipindah ke `docs/legacy-supabase-schema.sql`). README lama menyebut `schema_FINAL_LENGKAP.sql` yang tidak ada di repo; seluruh kolom pada tipe TypeScript aplikasi telah dicocokkan dengan skema baru dan semuanya terpenuhi.
- Ketergantungan browser: Service Worker/PWA, Web Push, `navigator.onLine`, Blob download, geolocation + `fetch` (cuaca), `crypto.subtle` (enkripsi password Social Accounts).

## 8. Keputusan Fitur (disepakati)

| Fitur | Keputusan | Implementasi |
|---|---|---|
| Login / register / ganti password / username login | **Dihapus** | `AuthContext` kini hanya menyediakan satu pengguna lokal (`id: "local"`) dan menahan layar sampai DB siap |
| **App Lock (PIN)** | **Dihapus** | Layar kunci, auto-lock, dan pengaturan PIN dihapus |
| Push notification | **Diganti pengingat lokal** | Notifikasi Android 30 menit sebelum event Calendar, dijadwalkan di perangkat, tanpa server |
| Data lama Supabase | **Mulai dari nol** | Tidak ada impor dari Supabase |
| PWA / service worker | Dihapus | Tidak relevan di Capacitor |
| Banner offline / blokir tulis offline | Dihapus | Tidak relevan |
| Cuaca | **Dipertahankan, tapi opt-in (default mati)** | Mengirim koordinat ke Open-Meteo, jadi harus dipilih pengguna sendiri |
| Enkripsi password Social Accounts | Dipertahankan | PIN-nya adalah kata sandi yang diketik saat melihat/menyimpan, **terpisah** dari App Lock (tidak diverifikasi ke hash), jadi tetap berfungsi |
| Backup | **Masuk rilis awal** | Lihat §11 |
| Nama aplikasi | **Life OS** | `com.lifeos.app` |

Catatan: kolom `user_id` dipertahankan di tiap tabel dengan nilai tetap `"local"` agar kode hook lama tidak perlu dirombak. Ini utang teknis yang disengaja dan terdokumentasi.

## 9. Persyaratan UI/UX Android

- Layout responsif sudah ada (bottom nav + header ringkas di mobile). 🟢
- Tombol Back Android: mundur satu halaman, keluar di halaman utama. 🟡
- Dengan login dihapus, aplikasi langsung membuka dashboard.
- Status loading/error database ditampilkan (layar "Memuat…" dan pesan jika DB gagal dibuka). 🟢
- Tidak ada indikator koneksi server. 🟢
- Desain tidak diubah selain menghapus elemen akun/PIN/logout.
- ⚪ Uji ergonomi di perangkat nyata (keyboard virtual, safe area, ukuran layar) belum dilakukan.

## 10. Keamanan dan Pengelolaan Data

- Database di penyimpanan privat aplikasi. 🟡
- `allowBackup="false"`: Android tidak mengunggah data ke Google Drive. Konsekuensinya, data tidak ikut pindah otomatis ke HP baru; pengguna wajib memakai backup manual.
- **Peringatan yang harus dipahami pengguna:** menghapus aplikasi atau kehilangan HP menghapus data. Peringatan ini ditampilkan di kartu Backup pada Profile.
- Input divalidasi (builder menolak tabel/kolom tak dikenal; nilai selalu diparameterisasi).
- **Enkripsi database ditunda.** Tanpa App Lock, tidak ada rahasia pengguna yang aman untuk menurunkan kunci enkripsi; menyimpan kunci di perangkat tanpa perlindungan tidak menambah keamanan nyata. Perlindungan saat ini mengandalkan sandbox aplikasi Android dan enkripsi penyimpanan perangkat. Dapat dievaluasi ulang bila PIN/biometrik dihidupkan kembali.
- **Satu-satunya pengiriman data keluar perangkat:** fitur Cuaca (opt-in). Jika aktif, koordinat dikirim ke Open-Meteo. Permintaan izin lokasi tetap dari Android.
- **Kunci penandatanganan APK** tidak pernah disimpan di repo; dibaca dari variabel lingkungan/GitHub Secrets. Kunci yang berubah membuat update tidak mungkin dan memaksa uninstall (data hilang), jadi kunci harus dibackup terpisah.
- File backup JSON berisi data dalam teks biasa; pengguna perlu menyimpannya di tempat aman.

## 11. Backup 🟢

Masuk rilis awal (menggantikan "opsional" pada versi lama), karena tanpa Auto Backup dan tanpa cloud, backup manual adalah satu-satunya jalur pemulihan.

- **Ekspor:** seluruh 27 tabel data (versi lama hanya mengekspor 11 tabel dan tidak punya impor) ke JSON berversi (`format`, `version`, `schema_version`, `exported_at`), dibagikan lewat menu Share Android.
- **Impor:** file divalidasi **sebelum** menyentuh database (format, versi, tabel dikenal, nama kolom). Pengguna diminta konfirmasi dengan ringkasan jumlah data. Pemulihan **menimpa** data yang ada dalam **satu transaksi**: bila ada satu baris saja yang gagal (mis. relasi rusak), semuanya dibatalkan dan data lama tetap utuh (teruji).
- Tabel `app_settings` (pengaturan perangkat) sengaja tidak ikut backup.
- Setelah restore, jadwal pengingat dihitung ulang.
- ⚪ Belum ada "backup otomatis sebelum restore"; perlindungan saat ini adalah konfirmasi + atomisitas.

## 12. Tahapan Pengerjaan dan Status

| Tahap | Status |
|---|---|
| 1. Audit | 🟢 Selesai (§7) |
| 2. Desain teknis | 🟢 Selesai (§5, §8) |
| 3. Fondasi Android & SQLite | 🟡 Proyek Android, Capacitor, migrasi, dan driver sudah dibuat dan `cap sync` berhasil. **APK belum pernah dikompilasi** (lingkungan pengembangan tidak punya Android SDK/Gradle) |
| 4. Migrasi fitur | 🟢 Seluruh akses data dialihkan; `tsc` dan build produksi bersih |
| 5. Migrasi data | ⏭ Dilewati (keputusan: mulai dari nol) |
| 6. Pengujian | 🟡 Otomatis selesai (lihat bawah); **uji di perangkat belum dilakukan** |
| 7. Build & rilis | 🟡 Konfigurasi, ikon, signing, dan workflow CI siap; build pertama belum dijalankan |

### Yang sudah terverifikasi
- 26 tes otomatis terhadap **SQLite sungguhan** (`node:sqlite`) dengan skema yang sama: CRUD, upsert + `onConflict`, `insert().select().single()`, konversi boolean/JSON, urutan NULL, cascade & foreign key, atomisitas, penolakan injeksi/tabel asing, migrasi (termasuk menolak DB lebih baru), serta backup→restore (termasuk skenario restore gagal).
- Tes dibuktikan sensitif lewat *mutation check* (merusak kode sengaja → tes gagal).
- `tsc` bersih, `vite build` sukses, `cap sync android` sukses.
- Setiap pemanggilan query lama dianalisis statis: 99 rantai query, tidak ada `update`/`delete` tanpa filter; semua tabel terpetakan; semua field tipe TS ada di skema.
- Perilaku plugin Android dibaca dari kodenya: SQLite 3.4x (mendukung `NULLS LAST`/`ON CONFLICT`), `executeSet` bertransaksi dan rollback saat gagal, `DELETE` tidak dialihkan karena tabel tidak memakai kolom sinkronisasi.

### Yang BELUM terverifikasi (wajib diuji di HP)
1. Kompilasi APK (Gradle, SDK 36, JDK 21).
2. Driver SQLite Capacitor di perangkat nyata (hanya type-check dan pembacaan kode plugin; logika query-nya sendiri sudah teruji).
3. Foreign key aktif di Android (driver akan menampilkan error jelas jika tidak).
4. Notifikasi terjadwal: izin Android 13+, ketepatan waktu (Android dapat menunda alarm tak-presisi), dan bertahan setelah reboot.
5. Tombol Back, Share backup, dan pemilih file impor di WebView.
6. Mode web (`npm run dev` via jeep-sqlite) belum dicoba di browser.

## 13. Kriteria Keberhasilan

- [ ] APK terpasang dan berjalan di perangkat target.
- [x] Fitur lama yang disepakati tetap ada (kecuali login & App Lock, sesuai keputusan).
- [x] Seluruh data operasional disimpan lewat SQLite lokal (secara kode).
- [x] Tidak ada ketergantungan Supabase pada kode.
- [ ] Fitur inti terbukti berjalan di mode pesawat (perlu uji perangkat).
- [ ] Data bertahan setelah aplikasi ditutup/dibuka (perlu uji perangkat).
- [x] Perubahan skema dapat dikelola lewat migrasi berversi.
- [x] Tidak ada kredensial server di APK.
- [x] Proses build terdokumentasi (README) dan dapat diulang (GitHub Actions).
- [ ] Update APK di atas versi lama terbukti mempertahankan data (perlu uji dengan kunci tanda tangan tetap).

## 14. Risiko dan Mitigasi

| Risiko | Mitigasi / status |
|---|---|
| Data hilang saat uninstall/HP rusak | Backup manual + peringatan di UI; Auto Backup Google sengaja mati |
| **Kunci tanda tangan hilang/berbeda → tidak bisa update tanpa uninstall** | Buat kunci sekali, simpan di GitHub Secrets **dan** backup terpisah; APK debug CI hanya untuk uji coba |
| Driver SQLite perilakunya berbeda di perangkat | Logika dipisah dari driver dan teruji; driver tipis; uji perangkat adalah langkah wajib berikutnya |
| Foreign key tidak aktif | Diverifikasi saat start, gagal dengan jelas |
| Pengingat tertunda/tidak muncul (penghemat baterai, izin) | Izin diminta eksplisit; perilaku Android dijelaskan; perlu uji nyata |
| Skema berubah di versi berikut | Migrasi berversi per transaksi; DB lebih baru dari aplikasi ditolak |
| Bundel web besar (≈1,1 MB JS, belum dipecah) | Tidak kritis untuk aplikasi lokal; bisa dipecah dengan dynamic import jika terasa lambat |
| Peringatan lint warisan (47, pola `setState` di effect) | Sudah ada sebelum migrasi (52 → 47); tidak disentuh agar migrasi tetap fokus |
| `user_id` konstan di semua tabel | Utang teknis sadar; hapus bila suatu saat skema disederhanakan |

## 15. Keputusan yang Sudah Ditetapkan

- Aplikasi: **Life OS**, Vite + React + TypeScript, dibungkus Capacitor, APK `com.lifeos.app`.
- Database operasional: SQLite lokal; Supabase tidak dipakai.
- Offline sepenuhnya untuk fitur inti; cuaca opt-in.
- **Tanpa login. Tanpa App Lock.**
- **Push → pengingat lokal.**
- **Mulai dari nol** (tanpa impor data Supabase).
- Lapisan data: adaptor bergaya Supabase di atas SQLite (§5.2).
- Backup manual JSON masuk rilis awal; tanpa backup cloud.
- Penandatanganan rilis memakai kunci tetap dari Secrets.

## 16. Langkah Berikutnya

1. Push branch ke GitHub, isi 4 secret penandatanganan (lihat README), jalankan workflow **Build APK**.
2. Pasang APK di HP; jalankan daftar uji pada §12 ("belum terverifikasi"), terutama: tambah data → tutup paksa → buka lagi; mode pesawat; pengingat; backup → hapus data → pulihkan.
3. Perbaiki temuan dari perangkat nyata.
4. Pasang versi yang sama **di atas** versi lama untuk memastikan update mempertahankan data.

**Prinsip utama:** migrasikan aplikasi yang sudah ada, jangan membuat ulang berdasarkan asumsi, dan jangan menyatakan sesuatu "berfungsi" sebelum diuji di tempat ia akan dipakai.
