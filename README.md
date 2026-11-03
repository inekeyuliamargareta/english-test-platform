# EnglishOn — Platform Persiapan TOEFL ITP & IELTS

Node.js + Express 4 + MySQL (`mysql2`, SQL langsung tanpa ORM). Frontend HTML + Alpine.js + Tailwind (CDN) di `public/`.

## Menjalankan di komputer (Laragon)

```bash
npm install
cp .env.example .env      # isi JWT_SECRET dengan teks acak, sesuaikan DB_* dan kontak
npm run migrate           # buat database + tabel dari migrations.sql
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
| `public/assets/app.js` | Script bersama: panggil API, layout sidebar, helper soal |
| `public/uploads/audio/` | File MP3 Listening yang diunggah admin (jangan dihapus, ikutkan backup) |

## Aturan penting

- **Kunci jawaban tidak dikirim ke browser siswa.** Skor dihitung di server saat submit. Kunci dan pembahasan baru dikirim di halaman Review, atau setelah siswa menjawab latihan bab.
- **Akun gratis = 1x simulasi.** Dicek di server. Admin membuka akses penuh di Panel Admin → Siswa & Akses.
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
| PUT | `/api/admin/passages/:id`, `/api/admin/clips/:id[/audio]` | Passage Reading, audio Listening |
| PUT | `/api/admin/exams/:code` | Master Test |
