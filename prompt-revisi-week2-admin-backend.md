# Prompt Revisi Week 2 — Admin TOEFL/IELTS (repo: englishone-backend)

Bangun modul admin TOEFL/IELTS di `englishone-backend` (Express + MySQL; route di `src/routes/*.js`, auth/role di `src/auth.js` → `requireRole`, frontend statis di `public/*.html` + `public/sidebar.js`).

**Konteks:**
- Web `toefl-ielts` ke depan hanya panel siswa. Semua admin/teacher/role lain TOEFL/IELTS pindah ke sini.
- Modul ini **belum dipublish**: hanya **Director** yang bisa melihat dan mengakses. Role lain tidak boleh melihat menunya, dan semua endpoint memakai `requireRole('Director')`.
- Backend ini sedang dipakai staff setiap hari. **Jangan mengubah tabel, route, atau halaman yang sudah ada** selain menambah satu entri menu di `public/sidebar.js` (khusus Director).

**Data:**
- Data TOEFL/IELTS tetap di **database toefl-ielts**. Tambah koneksi kedua di backend (env baru `TOEFL_DB_HOST/PORT/USER/PASS/NAME`, pool terpisah di file sendiri, mis. `src/toefl-db.js`). Jangan menyalin tabel ke DB backend.
- Skema dipegang repo toefl-ielts (lihat bagian "Tabel yang ditulis englishone-backend" di `README.md` toefl-ielts). Backend **tidak membuat migrasi** untuk tabel itu — kalau butuh kolom baru, catat dan buat migrasinya di toefl-ielts.
- Semua route modul ini di satu file baru, mis. `src/routes/toefl.js`, dengan prefix `/api/toefl/...`. Halaman baru diawali `toefl-*.html`.
- Tambahkan env baru ke `.env.example`.

**Di luar cakupan:** semua generate PDF (ditunda). Penghapusan `admin.html` di toefl-ielts (dilakukan setelah modul ini dipakai).

---

## 1. Siswa TOEFL/IELTS
- Daftar siswa dengan kolom **program** (kosong / 20 / 30 / 40) dan **status** (aktif / tidak aktif). Program diisi admin karena sudah ditentukan saat pendaftaran.
- Kosong = akun gratis (hanya Placement & Consultation).
- Override **lock/unlock fitur per siswa** (mis. buka Simulasi untuk siswa tertentu).

## 2. Pengaturan lock panel
- Atur panel mana yang terkunci untuk akun gratis (default: semua kecuali Placement & Consultation).

## 3. Placement / Diagnostic
- Kelola level: **A1, A2, A2+, B1, B1+, B2, C1** (tambah/edit/urutkan).
- Batas skor per level dalam **% jawaban benar**, dengan keterangan jelas (contoh: "≥30% benar → A2").
- **Review hasil**: daftar hasil berstatus *menunggu review*; admin bisa mengubah **level final** (mis. setelah tes speaking offline) lalu **publish** ke dashboard siswa.
- Kelola soal + import. Template import Reading menyertakan contoh **satu passage (Passage A) untuk soal no. 1–5**.

## 4. Curriculum
- Input/edit konten pakai **rich text editor** yang mendukung **tabel** dan **gambar** (mis. untuk Writing IELTS). Pilih editor ringan; upload gambar disimpan di tempat yang bisa diakses web toefl-ielts.
- Edit ringkasan materi per program (20 / 30 / 40 pertemuan) yang tampil di bagian atas Curriculum siswa.

## 5. Skills
- Kelola soal latihan per skill → sub-bab → soal, mengikuti struktur yang dipakai panel siswa.

## 6. Mock Test
- Sub-panel untuk upload soal per paket, dengan **template import sendiri tanpa kolom pembahasan**.
- Mendukung **satu passage untuk beberapa soal** dan sampai **5 model** paket dengan susunan section masing-masing.

## 7. Ebook
- CRUD ebook + **upload cover**.

## 8. Consultation
- CRUD **FAQ** (pertanyaan, jawaban, urutan). Nomor/link WA admin bisa diatur.

---

## Selesai berarti
- Login sebagai role selain Director: menu TOEFL/IELTS tidak muncul dan semua `/api/toefl/*` → 403.
- Director bisa mengelola semua poin di atas, dan perubahannya langsung terlihat di web toefl-ielts (DB yang sama).
- Halaman/route/tabel lama backend tidak berubah; test yang ada (`*.test.js`) tetap lulus.
- Tambah satu test kecil: endpoint `/api/toefl/*` menolak non-Director.
