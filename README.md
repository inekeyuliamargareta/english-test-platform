# EnglishOn — Platform Persiapan TOEFL ITP & IELTS

Node.js + Express 4 + MySQL (`mysql2`, SQL langsung tanpa ORM). Frontend HTML + Alpine.js + Tailwind (CDN) di `public/`.

## Menjalankan di komputer (Laragon)

```bash
npm install
cp .env.example .env      # isi JWT_SECRET dengan teks acak, sesuaikan DB_* dan kontak
npm run migrate           # buat database + tabel; aman diulang untuk update database lama
npm run seed              # isi materi, soal, paket, akun admin & siswa demo (sekali saja)
npm run dev               # http://localhost:3000
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
- **Master Program**: tambah/ubah program (TOEFL, IELTS, dll.), section, penjelasan program untuk siswa, dan rekomendasi kelas per level placement.
- **Editor teks**: penjelasan program, isi bab, dan pembahasan soal diketik seperti di Word (tebal, daftar, judul, kotak tips, tabel). Tempel dari Word/website otomatis jadi teks biasa.
- **Import Soal**: Kelola Soal → Import Soal → unduh template CSV, isi di Excel/Google Sheets, simpan sebagai CSV, lalu unggah. Semua baris diperiksa dulu; jika ada yang salah, tidak ada yang disimpan dan nomor barisnya ditampilkan.
- **Soal placement**: soal dengan "Dipakai untuk = Placement test" hanya muncul di placement test, tidak di simulasi.

## Sisi siswa

Tampilan siswa berbahasa Inggris (panel admin tetap bahasa Indonesia). Setelah login siswa masuk ke **About the Program**, sesuai program yang dipilih di kanan atas. Dashboard meminta placement test lebih dulu jika siswa belum punya hasilnya. Isi yang diketik admin (deskripsi program, materi, pembahasan) tampil apa adanya.

## Aturan penting

- **Kunci jawaban tidak dikirim ke browser siswa.** Skor dihitung di server saat submit. Kunci dan pembahasan baru dikirim di halaman Review, atau setelah siswa menjawab latihan bab.
- **Akun gratis = 1x simulasi.** Dicek di server. Admin membuka akses penuh di Panel Admin → Siswa & Akses. Placement test tidak memakai jatah ini.
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
