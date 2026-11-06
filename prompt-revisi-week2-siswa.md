# Prompt Revisi Week 2 — Panel Siswa (repo: toefl-ielts)

Revisi web EnglishON! TOEFL/IELTS (Node/Express + MySQL: `src/server.js`, `src/db.js`, `src/defaults.js`, `migrations.sql`; frontend statis di `public/*.html` + `public/assets/app.js`).

**Arah project:** web ini ke depan **hanya untuk panel siswa**. Semua fitur admin/teacher/role lain dibangun di repo `englishone-backend` (prompt terpisah: `prompt-revisi-week2-admin-backend.md`). Jadi:
- **Jangan menambah fitur baru di `public/admin.html`.** Admin lama dibiarkan jalan apa adanya sampai versi backend siap, lalu dihapus.
- Data baru yang diatur admin (program, status, lock, FAQ, cover, review placement) **disimpan di database toefl-ielts** — backend akan baca/tulis langsung ke DB ini. Repo ini yang memegang skema: buat tabel/kolomnya lewat migrasi (`migrations.sql` / `src/migrate.js`) dan pakai di sisi siswa.
- Selama admin backend belum jadi, nilai bisa diisi manual via SQL/seed untuk tes.

Cek dulu yang sudah ada — sebagian sudah dikerjakan di commit `d314c8e` (skills per pertemuan, mock test bertab, level placement A1–C1 + batas %). Lengkapi kekurangannya, jangan bangun ulang.

**Di luar cakupan:** semua generate PDF (ditunda). Rekaman Speaking — tetap tidak ada, Speaking via tombol WA ke kantor.

---

## 1. Skema (dipakai bersama backend)
Tambahkan lewat migrasi, nama jelas dan terdokumentasi di `README.md` (bagian "Tabel yang ditulis englishone-backend"):
- Siswa: `program` (NULL / 20 / 30 / 40), `status` (aktif / tidak_aktif).
- Lock panel: default panel terkunci untuk akun gratis + override per siswa.
- Placement: status hasil (`menunggu_review` / `dipublish`) + `level_final` (bisa beda dari level hitungan otomatis).
- Level placement: pastikan bisa **A1, A2, A2+, B1, B1+, B2, C1** (tabel/konfigurasi level, bukan hardcode).
- Ebook: `cover_url`.
- FAQ consultation: pertanyaan, jawaban, urutan.
- Soal Reading: dukung **satu passage untuk beberapa soal** (passage terpisah, soal mereferensi passage) di placement, skills, dan mock test.
- Mock test: dukung sampai **5 model** paket dengan susunan section masing-masing (data, bukan kode).

## 2. Akses & lock
- Program ditentukan saat pendaftaran di kantor, jadi **siswa tidak memilih program**.
- Siswa **tanpa program** = akun gratis → hanya **Placement Test** dan **Consultation**.
- Siswa **tidak aktif** (program selesai) → tidak bisa akses panel berbayar lagi (perlakukan sama seperti akun gratis).
- Panel terkunci tetap tampil di sidebar: **abu-abu + ikon gembok, tidak bisa diklik**. Akses via URL/API juga ditolak **di server**.
- Isi Curriculum / Skills / Mock Test dibatasi sesuai program (mis. program 20 hanya pertemuan 1–20).

## 3. Umum
- Ganti icon/brand di header, sidebar, login, favicon pakai `public/logo.png`.
- Icon per skill (terutama Speaking) menunggu aset dari klien — kumpulkan di satu tempat supaya gampang diganti.

## 4. About the Program
- Alur belajar sesuai program siswa, mis. program 20:
  **Placement Test → Program 20 Pertemuan → Study the Lessons → Take a Mock Test**
  Akun gratis: alur umum, tahap setelah placement tampil terkunci.
- Tambah link **Instagram** dan perbaiki info kantor:
  *EnglishON! Ponorogo — Jalan HOS Cokroaminoto 6B, Ponorogo, Jawa Timur. Senin – Sabtu, 09.00 s/d 19.30 WIB.*

## 5. Placement
- Hasil yang masih `menunggu_review` **tidak tampil** di dashboard siswa; tampilkan pesan "hasil sedang direview".
- Yang ditampilkan adalah `level_final`.

## 6. Reading (Placement, Skills, Mock Test)
- Satu bacaan bisa untuk beberapa soal. **Tampilan Reading di Placement Test saat ini sudah benar** — jadikan acuan dan pakai yang sama di **Mock Test** dan **Skills**: passage tetap di kiri (scroll sendiri), soal-soal di kanan. Reuse markup/komponen placement, jangan bikin versi baru.

## 7. Curriculum
- Bagian paling atas: ringkasan materi sesuai program siswa (20 / 30 / 40 pertemuan), isinya dari DB (diedit admin di backend). Konten curriculum dirender sebagai HTML dari rich text (tabel + gambar) — sanitasi HTML sebelum dirender.

## 8. Skills
- Struktur: skill (Listening, Reading, Structure/Writing, …) → sub-bab (mis. "Focus on the second line") → soal. Sesuaikan dengan pengelompokan per pertemuan yang sudah ada, jangan duplikasi.
- **Pembahasan dan jumlah benar muncul di akhir**, setelah submit satu set — bukan saat klik jawaban.

## 9. Mock Test
- Layout menyesuaikan model paket (sampai 5 model) dari data.

## 10. Ebook & Consultation
- Ebook: grid kartu dengan **cover**, placeholder kalau belum ada.
- Consultation: daftar **FAQ** (klik pertanyaan → jawaban muncul, accordion) + **tombol chat WA ke admin tetap ada**.

## Dashboard, Result Review
Tidak ada perubahan.

---

## Selesai berarti
- Akun gratis/tidak aktif hanya bisa buka Placement & Consultation; panel lain abu-abu terkunci; URL langsung ditolak server.
- Hasil placement baru tampil setelah dipublish, dengan `level_final`.
- Reading di Placement, Skills, Mock Test memakai tampilan yang sama.
- Pembahasan Skills muncul di akhir set.
- Daftar tabel/kolom yang akan ditulis backend tercatat di `README.md`.
- `src/scoring.test.js` tetap lulus; tambah satu test kecil untuk mapping % benar → level dan untuk cek akses berdasarkan program/status.
