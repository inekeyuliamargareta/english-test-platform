# Prompt: Surat Penawaran Platform EnglishOn

Salin seluruh teks di bawah garis ke ChatGPT / Claude / AI lain. Ganti dulu semua teks dalam [kurung siku].

---

Kamu adalah konsultan bisnis software house yang berpengalaman menulis surat penawaran proyek untuk klien UMKM dan lembaga pendidikan di Indonesia. Buatkan **surat penawaran harga resmi** dalam Bahasa Indonesia yang formal, rapi, dan meyakinkan, siap dicetak atau dikirim dalam format PDF.

## Data surat

- Pengirim: [Nama perusahaan / nama developer], [alamat], [email], [no. WhatsApp]
- Nomor surat: [nomor surat]
- Tanggal: [tanggal surat]
- Kepada: Pimpinan EnglishOn Ponorogo, [alamat EnglishOn]
- Perihal: Penawaran Pembuatan Platform Web Persiapan TOEFL ITP & IELTS Academic
- Penanda tangan: [nama], [jabatan]

## Latar belakang proyek

EnglishOn Ponorogo adalah lembaga kursus bahasa Inggris yang membutuhkan platform web untuk siswa persiapan **TOEFL ITP** dan **IELTS Academic**. Platform berisi materi per bab, bank soal dengan pembahasan berbahasa Indonesia, serta simulasi test dengan timer dan skor dalam skala resmi. Platform juga dirancang agar bisa menambah jenis ujian baru di kemudian hari (contoh: English General Test) tanpa membangun ulang sistem.

Mockup interaktif sudah dipresentasikan ke klien sebagai acuan tampilan dan alur. Surat penawaran ini untuk pengembangan versi fungsional (dengan backend dan database).

## Ruang lingkup pekerjaan (rincikan per sisi, gunakan tabel dan poin)

### 1. Sisi Landing Page — Rp300.000
- Halaman beranda publik yang responsif (HP, tablet, desktop)
- Hero section dengan ajakan daftar dan masuk
- Penjelasan 3 fitur utama: Materi, Simulasi Test, Bank Soal
- Kartu pilihan ujian (TOEFL ITP, IELTS Academic) dan info "segera hadir" untuk ujian berikutnya
- Testimoni siswa
- Ajakan bertindak (CTA) dan footer dengan identitas serta alamat EnglishOn

### 2. Sisi Siswa — Rp2.500.000
- **Akun:** daftar dan masuk dengan email + kata sandi (sistem login sendiri, tanpa login Google), data nomor WhatsApp dan pilihan ujian saat daftar
- **Dashboard:** progres belajar per section (progress bar), skor simulasi terakhir, grafik riwayat skor, rekomendasi topik yang perlu diperkuat, tombol "lanjutkan belajar", status kuota simulasi
- **Pilihan ujian:** siswa bisa berpindah antara TOEFL ITP dan IELTS. Ujian yang belum aktif tampil sebagai "segera hadir"
- **Materi per bab:** dikelompokkan per section (TOEFL: Listening, Structure & Written Expression, Reading. IELTS: Listening, Reading, Writing), dengan judul, deskripsi, jumlah soal, status belum/sedang/selesai, pencarian, dan filter
- **Detail materi:** daftar sub-bab, konten (teks, contoh, tips, tabel), lalu latihan soal dengan umpan balik benar/salah dan pembahasan langsung
- **Bank soal:** daftar soal dengan kunci dan pembahasan, filter ujian, section, topik, tingkat kesulitan, dan pencarian
- **Lobby simulasi:** pilih paket (Full Test atau per section), info durasi, jumlah soal, dan aturan
- **Halaman test:**
  - timer per section yang berubah merah saat sisa waktu kurang dari 5 menit, dengan submit otomatis saat waktu habis
  - Reading dengan tampilan terbelah (passage di kiri, soal di kanan, bertumpuk di HP)
  - Listening dengan pemutar audio yang hanya bisa diputar satu kali
  - Structure / Written Expression (pilihan ganda dan identifikasi kesalahan)
  - soal isian singkat untuk IELTS
  - IELTS Writing Task 1 (grafik) dan Task 2 dengan penghitung kata
  - panel navigasi nomor soal (belum dijawab / sudah dijawab / ragu-ragu)
  - konfirmasi sebelum submit
- **Hasil test:** skor TOEFL ITP skala 310–677 (per section 31–68), IELTS band 1–9, setara CEFR, rincian per section, grafik akurasi per topik, analisis kelemahan ("Kamu lemah di …") dengan tautan ke bab terkait
- **Review & pembahasan:** semua soal dengan jawaban siswa, kunci, dan pembahasan, dengan filter semua / salah / ditandai
- **Kuota simulasi:** akun baru mendapat 1x simulasi gratis. Setelah itu simulasi terkunci dan siswa diarahkan untuk datang ke kantor atau menghubungi EnglishOn via WhatsApp untuk membuka akses penuh
- Catatan: jawaban IELTS Writing disimpan dan berstatus "dinilai tutor" (tidak dinilai otomatis)

### 3. Sisi Admin — Rp2.500.000
- **Ringkasan:** statistik siswa, jumlah soal, test yang dikerjakan, hasil test terbaru, topik paling sulit
- **Kelola materi:** tambah, ubah, hapus bab dan sub-bab, status draft/terbit
- **Kelola soal:** tambah, ubah, hapus soal dengan tipe (pilihan ganda, written expression, isian singkat), ujian, section, topik, tingkat kesulitan, passage, unggah audio, opsi jawaban, kunci, dan pembahasan
- **Paket test:** atur paket simulasi (section dan durasi), aktif/nonaktif
- **Siswa & akses:** daftar siswa beserta skor terakhir, progres, jumlah test, serta tombol untuk membuka/menutup akses penuh setelah siswa datang ke kantor atau menghubungi EnglishOn
- **Master Test:** tambah dan ubah jenis ujian (nama, kode, skala skor, warna, daftar section, mode section online/dinilai tutor), aktif/nonaktif, sehingga ujian baru seperti English General Test bisa ditambahkan tanpa membangun ulang sistem

### Add-on opsional: Fitur Booking Trial Class — Rp400.000
Tidak termasuk paket utama. Tampilkan sebagai opsi tambahan terpisah.
- Halaman booking untuk siswa: pilih kelas (Speaking, review Writing, strategi TOEFL), tempat (offline di kantor / online), tanggal dan jam, data diri, lalu konfirmasi via WhatsApp
- Kartu ajakan booking di materi, simulasi, hasil, dan dashboard (untuk materi yang sulit diujikan online seperti Speaking)
- Menu admin "Booking Trial" untuk melihat daftar booking dan mengubah status (baru / dikonfirmasi / selesai)

## Rincian harga (buat dalam tabel)

| Item | Harga |
|---|---|
| Sisi Landing Page | Rp300.000 |
| Sisi Siswa | Rp2.500.000 |
| Sisi Admin | Rp2.500.000 |
| **Harga normal** | **Rp5.300.000** |
| Diskon khusus klien | − Rp300.000 |
| **Total paket utama** | **Rp5.000.000** |
| Add-on Booking Trial Class (opsional) | Rp400.000 |
| **Total jika mengambil add-on** | **Rp5.400.000** |

## Bagian lain yang wajib ada

- Pembuka yang sopan dan ucapan terima kasih atas kesempatan presentasi mockup
- Tahapan pengerjaan dan estimasi waktu: [contoh: analisis & finalisasi desain, pengembangan, uji coba bersama klien, serah terima] dengan total [x minggu]
- Teknologi: [stack, contoh: Laravel + MySQL], responsif di HP, tablet, dan desktop
- Yang **tidak termasuk** penawaran: hosting & domain [atau sebutkan jika termasuk], penyusunan konten soal/materi (diinput oleh EnglishOn melalui panel admin), file audio listening, dan fitur di luar ruang lingkup di atas
- Revisi: [jumlah revisi] kali revisi minor selama pengembangan
- Garansi perbaikan bug: [x hari/bulan] setelah serah terima
- Termin pembayaran: [contoh: DP 50% saat persetujuan, 50% saat serah terima], nomor rekening [bank, nomor, atas nama]
- Masa berlaku penawaran: [contoh: 14 hari sejak tanggal surat]
- Penutup dan kolom tanda tangan pengirim, serta kolom persetujuan klien

## Gaya penulisan

- Formal tetapi hangat, tidak bertele-tele, mudah dipahami pemilik lembaga kursus yang bukan orang IT
- Gunakan format mata uang Indonesia (Rp5.000.000)
- Tonjolkan manfaat bagi EnglishOn: siswa bisa latihan mandiri kapan saja, kuota simulasi gratis mendorong siswa datang ke kantor, dan platform mudah dikembangkan untuk ujian baru
- Jangan menambahkan fitur atau harga di luar yang tercantum di atas
