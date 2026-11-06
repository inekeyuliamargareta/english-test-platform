# EnglishOn — Platform Persiapan TOEFL ITP & IELTS

Node.js + Express 4 + MySQL (`mysql2`, SQL langsung tanpa ORM). Frontend HTML + Alpine.js + Tailwind (CDN) di `public/`.

## Menjalankan di komputer (Laragon)

```bash
npm install
cp .env.example .env      # isi JWT_SECRET dengan teks acak, sesuaikan DB_* dan kontak
npm run migrate           # buat database + tabel; aman diulang untuk update database lama
npm run seed              # isi materi, soal, paket, akun admin & siswa demo (sekali saja)
npm run dev               # http://localhost:3000
npm run css               # buat ulang public/assets/app.css setelah mengubah kelas Tailwind di HTML/JS (npm start melakukannya otomatis)
```

Akun dari seed memakai `SEED_ADMIN_EMAIL` dan `SEED_PASSWORD` di `.env`. Siswa demo memakai email di `src/seed-data.js` dengan password yang sama. Ganti password admin sebelum online.

`npm run seed` menolak berjalan jika sudah ada akun (agar data asli tidak terhapus). Pakai `npm run seed -- --force` hanya di komputer pengembangan.

## Struktur

| Lokasi | Isi |
|---|---|
| `src/server.js` | Semua endpoint API + file statis `public/` |
| `src/scoring.js` | Penilaian simulasi (TOEFL 310–677, IELTS band). Cek: `npm test` |
| `src/db.js` | Koneksi MySQL dari `.env` |
| `migrations.sql` | Skema tabel |
| `src/seed.js`, `src/seed-data.js` | Data awal dari mockup |
| `src/defaults.js` | Deskripsi program, rekomendasi kelas, dan soal placement bawaan (diisi otomatis oleh migrate) |
| `public/assets/app.js` | Script bersama: panggil API, layout sidebar, helper soal |
| `public/uploads/audio/` | File MP3 Listening yang diunggah admin (jangan dihapus, ikutkan backup) |

## Setelah update kode

Jalankan `npm run migrate` sekali setelah menarik versi baru. Kolom baru ditambahkan tanpa menghapus data.

## Fitur admin

- **Sidebar per program**: setiap program punya menu sendiri (Siswa, Materi, Soal, Pengaturan). Daftar siswa dan soal diambil per halaman (20 baris) dari server.
- **Ebook**: menu Ebook tiap program. Upload PDF (maks. 50 MB), pilih Gratis atau Berbayar (hanya siswa Akses Penuh). File disimpan di `storage/ebooks` (ikutkan dalam backup) dan hanya bisa dibuka lewat login.
- **Track per level**: di Pengaturan program, isi nama track, target skor, dan "cocok untuk" per level placement (A2–C1). Tampil di halaman Curriculum siswa.
- **Pertemuan (kurikulum)**: setiap bab terbit = satu pertemuan. Pertemuan berikutnya terbuka setelah pertemuan sebelumnya 100% (semua bagian dibaca + semua latihan dijawab). Urutan di menu Materi (tombol ▲▼) menjadi Meeting 1, 2, 3, … di sisi siswa, dan progres siswa tampil sebagai "Meetings completed 3 / 30". Bab draft tidak diberi nomor.
- **Master Program**: tambah/ubah program (TOEFL, IELTS, dll.), section, penjelasan program untuk siswa, dan rekomendasi kelas per level placement.
- **Editor teks**: penjelasan program, isi bab, dan pembahasan soal diketik seperti di Word (tebal, daftar, judul, kotak tips, tabel). Tempel dari Word/website otomatis jadi teks biasa.
- **Import Soal**: Kelola Soal → Import Soal → unduh template CSV, isi di Excel/Google Sheets, simpan sebagai CSV, lalu unggah. Semua baris diperiksa dulu; jika ada yang salah, tidak ada yang disimpan dan nomor barisnya ditampilkan.
- **Soal placement**: soal dengan "Dipakai untuk = Placement test" hanya muncul di placement test, tidak di simulasi.

## Sisi siswa

Tampilan siswa berbahasa Inggris (panel admin tetap bahasa Indonesia). Setelah login siswa masuk ke **About the Program**, sesuai program yang dipilih di kanan atas. Dashboard meminta placement test lebih dulu jika siswa belum punya hasilnya. Isi yang diketik admin (deskripsi program, materi, pembahasan) tampil apa adanya.

**Satu siswa = satu program** (dipilih saat daftar). Siswa tidak bisa berpindah program sendiri; admin dapat mengubahnya di detail siswa. Server menolak tes dari program lain.

Target skor diisi siswa sendiri per program (klik kartu target di sidebar atau di dashboard). Latihan soal di halaman pertemuan baru muncul setelah siswa membaca sub-bab terakhir dan menekan **Start Practice**.

## Aturan penting

- **Kunci jawaban tidak dikirim ke browser siswa.** Skor dihitung di server saat submit. Kunci dan pembahasan baru dikirim di halaman Review, atau setelah siswa menjawab latihan bab.
- **Akses panel** (`src/access.js`, cek: `npm test`). Siswa berbayar = punya `program` (20/30/40) atau akses penuh, dan `status` aktif. Akun gratis / tidak aktif hanya membuka panel di `free_panels` (default About, Placement, Consultation). Panel terkunci tampil abu-abu, datanya tidak dikirim di `/api/bootstrap`, dan endpoint-nya menolak (403).

## Tabel yang ditulis englishone-backend

Ke depan web ini hanya untuk panel siswa. Admin (Director dulu) ada di `englishone-backend` dan menulis langsung ke database ini. Skema tetap dipegang repo ini (`migrations.sql` + `src/migrate.js`).

| Tabel / kolom | Isi |
|---|---|
| `users.program` | 20 / 30 / 40 pertemuan, NULL = akun gratis. Membatasi pertemuan yang tampil (20 pertemuan pertama, dst.) |
| `users.status` | `aktif` / `tidak_aktif` (program selesai = seperti akun gratis) |
| `users.unlocks` | Override per siswa, mis. `{"simulasi":true,"ebook":false}`. Kunci panel: `program, dashboard, materi, skills, simulasi, hasil, ebook, consult, placement` |
| `app_settings` `free_panels` | Array panel yang terbuka untuk akun gratis |
| `app_settings` `placement_review` | `true` = hasil placement baru tampil setelah admin publish. Default `false` (langsung tampil) sampai menu review di backend siap |
| `attempts.published`, `attempts.level_final` | Review placement: publish (1) dan level akhir dari admin (mis. `B1+`) |
| `exams.recommend` | Level A1, A2, A2+, B1, B1+, B2, C1: batas `min` % benar, perkiraan skor, track |
| `exams.program_intro` | `{"20":"<html>","30":"…","40":"…"}`: ringkasan materi di atas Curriculum (dibersihkan dari script sebelum tampil) |
| `ebooks.cover_url` | URL gambar cover |
| `faqs` | Pertanyaan & jawaban (HTML) di halaman Consultation |
| `passages` + `questions.passage` | Satu passage dipakai beberapa soal (placement, Skills, mock test) |
| `packages.sections` | Susunan section tiap paket mock test (model 1–5 cukup lewat data) |
- **Placement test** memberi level A2–C1 dari persen jawaban benar (≥80% C1, ≥55% B2, ≥30% B1). Tombol Join membuka WhatsApp admin berisi hasil siswa.
- **Audio Listening:** admin mengunggah MP3 per soal. Selama belum ada file, transkrip dibacakan suara bawaan browser (hanya untuk demo).
- **Writing** disimpan dan ditandai "dinilai tutor". Belum ada halaman untuk tutor memberi nilai.

## API ringkas

| Method | Endpoint | Untuk |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Daftar / masuk → token JWT (7 hari) |
| GET | `/api/bootstrap` | Data awal halaman (isi sesuai peran) |
| PUT | `/api/progress/:chapterId` | Simpan progres bab |
| POST | `/api/questions/:id/check` | Cek jawaban latihan bab |
| POST / GET | `/api/attempts`, `/api/attempts/:id` | Submit simulasi / review hasil |
| GET, PATCH | `/api/admin/students[/:id]` | Daftar siswa, buka/kunci akses |
| PUT, DELETE | `/api/admin/chapters/:id`, `/api/admin/questions/:id` | Kelola materi & soal |
| POST | `/api/admin/questions/import` | Import banyak soal (`dryRun: true` = cek saja) |
| PUT | `/api/admin/passages/:id`, `/api/admin/clips/:id[/audio]` | Passage Reading, audio Listening |
| PUT | `/api/admin/exams/:code` | Master Program |
