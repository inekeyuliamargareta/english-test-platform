# Prompt Revisi Week 2 — Admin TOEFL/IELTS (repo: englishone-backend)

Bangun modul admin TOEFL/IELTS di `englishone-backend` (Express + MySQL; route di `src/routes/*.js`, auth/role di `src/auth.js` → `requireRole`, frontend statis di `public/*.html` + `public/sidebar.js`).

**Konteks:**
- Web `toefl-ielts` ke depan hanya panel siswa. Semua admin/teacher/role lain TOEFL/IELTS pindah ke sini.
- Modul ini **belum dipublish**: hanya **Director** yang bisa melihat dan mengakses. Role lain tidak boleh melihat menunya, dan semua endpoint memakai `requireRole('Director')`.
- Backend ini sedang dipakai staff setiap hari. **Jangan mengubah tabel, route, atau halaman yang sudah ada** selain menambah satu entri menu di `public/sidebar.js` (khusus Director).

**Data: lewat API toefl-ielts, bukan koneksi database langsung.**
Dua aplikasi ada di dua server Lighthouse: toefl-ielts (6 GB, dipakai siswa) dan englishone-backend (4 GB). Database **tidak disatukan** dan port MySQL toefl-ielts **tidak dibuka** ke luar.
- Semua data dan file TOEFL/IELTS (soal, audio, ebook, cover, gambar materi) tetap disimpan di server toefl-ielts: database toefl-ielts, `public/uploads/…`, dan `storage/ebooks`.
- Backend **tidak menyentuh database toefl-ielts sama sekali.** Backend memanggil API admin toefl-ielts dari server ke server lewat HTTPS:
  - env baru di backend: `TOEFL_API_URL` (mis. `https://<domain-toefl>`) dan `TOEFL_SERVICE_TOKEN`.
  - Satu file route baru, mis. `src/routes/toefl.js`, dengan prefix `/api/toefl/...`: cek `requireRole('Director')`, lalu teruskan ke `TOEFL_API_URL/api/admin/...` dengan header `Authorization: Service <token>`. Upload file (audio, PDF, gambar) diteruskan sebagai body mentah dengan `Content-Type` yang sama.
  - **Token tidak pernah dikirim ke browser.** Error dari toefl-ielts (400/404 + pesan) diteruskan apa adanya.
- Halaman baru diawali `toefl-*.html`. Tambahkan env baru ke `.env.example`.

**Bagian A: dikerjakan dulu di repo toefl-ielts** (bukan di backend):
1. Auth service: header `Authorization: Service <TOEFL_SERVICE_TOKEN>` (env di toefl-ielts) diperlakukan sebagai admin di `/api/admin/*` saja. Bandingkan token dengan `crypto.timingSafeEqual`, dan tolak semua token kalau env-nya kosong.
2. Endpoint yang sudah ada dipakai apa adanya: siswa (list + PATCH), soal (CRUD + import CSV, termasuk `pool = skills`), bab/pertemuan, passage, audio, paket mock test, ebook + file PDF, master program/level (`PUT /api/admin/exams/:code`).
3. Endpoint baru:
   - `PATCH /api/admin/students/:id`: tambah `program` (null/20/30/40), `status` (aktif/tidak_aktif), dan `unlocks`.
   - `GET/PUT /api/admin/settings`: `free_panels` dan `placement_review`.
   - Review placement: daftar hasil yang belum dipublish, lalu `PATCH /api/admin/attempts/:id` dengan `{ level_final, published }`.
   - CRUD FAQ (`/api/admin/faqs`).
   - `program_intro` per program (20/30/40).
   - Upload cover ebook, dan upload gambar untuk editor materi. Simpan di `public/uploads/…` dan kembalikan URL-nya.
   - Urutan paket mock test (`packages.sort`), karena urutan itu menentukan Mock Test 1, 2, 3 di tiap tab.
4. Setiap kolom atau tabel baru dibuat lewat migrasi toefl-ielts. Daftar tabel dan kolomnya ada di `README.md` toefl-ielts.

**Bagian B: di backend.** Halaman admin Director yang memakai endpoint di atas (poin 1–8 di bawah).

**Di luar cakupan:** semua generate PDF (ditunda). Penghapusan `admin.html` di toefl-ielts (dilakukan setelah modul ini dipakai).

---

## 1. Siswa TOEFL/IELTS
- Daftar siswa dengan kolom **program** (kosong / 20 / 30 / 40) dan **status** (aktif / tidak aktif). Program diisi admin karena sudah ditentukan saat pendaftaran.
- Kosong = akun gratis (Placement, Consultation, dan Mock Test 1 di tiap tab).
- Override **lock/unlock fitur per siswa** (mis. buka Simulasi untuk siswa tertentu).

## 2. Pengaturan lock panel
- Atur panel mana yang terbuka untuk akun gratis (`app_settings.free_panels`, default: About, Placement, Consultation, Mock Test, Results — mock test hanya Mock Test 1 per tab).

## 3. Placement / Diagnostic
- Kelola level: **A1, A2, A2+, B1, B1+, B2, C1** (tambah/edit/urutkan).
- Batas skor per level dalam **% jawaban benar**, dengan keterangan jelas (contoh: "≥30% benar → A2").
- **Review hasil**: daftar hasil berstatus *menunggu review*; admin bisa mengubah **level final** (mis. setelah tes speaking offline) lalu **publish** ke dashboard siswa.
- Kelola soal + import. Template import Reading menyertakan contoh **satu passage (Passage A) untuk soal no. 1–5**.

## 4. Curriculum
- Input/edit konten pakai **rich text editor** yang mendukung **tabel** dan **gambar** (mis. untuk Writing IELTS). Pilih editor ringan; upload gambar disimpan di tempat yang bisa diakses web toefl-ielts.
- Edit ringkasan materi per program (20 / 30 / 40 pertemuan) yang tampil di bagian atas Curriculum siswa.

## 5. Skills (beda dengan Curriculum)
- **Curriculum** = materi per pertemuan + soal latihan pertemuan (`questions.pool = 'bank'`).
- **Skills** = kumpulan soal latihan terpisah (`questions.pool = 'skills'`), per skill (section) lalu **dikelompokkan per bab** (`questions.chapter` = id bab). Siswa: tab skill → daftar bab → halaman soal bab itu; skor & pembahasan muncul setelah submit.
- Admin bisa tambah/edit soal Skills dan **import** (CSV) dengan kolom bab. Template import Skills menyertakan contoh satu passage untuk beberapa soal.

## 6. Mock Test
- Sub-panel untuk upload soal per paket, dengan **template import sendiri tanpa kolom pembahasan**.
- Di sisi siswa paket tampil per tab: **Full Mock Test**, **Listening Only**, **Reading Only**, dst. (paket satu section = tab section itu). Isi tiap tab = Mock Test 1, 2, 3… sesuai urutan `packages.sort` — admin perlu bisa mengatur urutannya.
- Siswa belum berbayar hanya bisa mengerjakan **mock test pertama di tiap tab**; sisanya terkunci (aturan di `src/access.js` toefl-ielts: `freeMockIds`).
- Mendukung **satu passage untuk beberapa soal** dan sampai **5 model** paket dengan susunan section masing-masing.

## 7. Ebook
- CRUD ebook + **upload cover**.

## 8. Consultation
- CRUD **FAQ** (pertanyaan, jawaban, urutan). Nomor/link WA admin bisa diatur.

---

## Selesai berarti
- Login sebagai role selain Director: menu TOEFL/IELTS tidak muncul dan semua `/api/toefl/*` → 403.
- Director bisa mengelola semua poin di atas, dan perubahannya langsung terlihat di web toefl-ielts (lewat API, data tersimpan di server toefl-ielts).
- Backend tidak punya koneksi ke database toefl-ielts, dan `TOEFL_SERVICE_TOKEN` tidak muncul di respons atau halaman mana pun.
- Halaman, route, dan tabel lama backend tidak berubah; test yang ada (`*.test.js`) tetap lulus.
- Tambah satu test kecil: endpoint `/api/toefl/*` menolak non-Director.
- Di toefl-ielts: `/api/admin/*` menolak token service yang salah atau kosong (test kecil).
