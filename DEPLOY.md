# Deploy ke Tencent Lighthouse (aaPanel) + Autodeploy dari GitHub

Hasil akhir: setiap `git push` ke branch `main`, GitHub otomatis menjalankan tes, masuk ke server, mengambil kode terbaru, mengupdate database, dan me-restart aplikasi. Waktu: ±1–2 menit per deploy.

```
Laptop ──git push──▶ GitHub ──(GitHub Actions, SSH)──▶ Server: bash deploy.sh ──▶ PM2 restart
                                                         Nginx (domain + HTTPS) ──▶ Node :3000
```

Contoh di bawah memakai IP server `43.156.200.140` dan folder `/www/wwwroot/englishtest`. Ganti `englishon.co.id` dengan domain asli.

---

## 0. Sebelum mulai (penting)

- **Repo GitHub saat ini publik.** Siapa pun bisa melihat kode dan `prompt-surat-penawaran.md`. Sebaiknya ubah jadi **private**: GitHub → repo → *Settings* → *Danger Zone* → *Change visibility* → Private. Jika private, ikuti langkah **3b** (deploy key).
- **Jangan pakai password bawaan** `englishon123` di server. Nilai itu tertulis di `.env.example` yang bisa dilihat orang.

## 1. Buka port di Firewall Lighthouse

Tencent Cloud console → instance → tab **Firewall** → *Add rule*:

| Port | Untuk |
|---|---|
| 22 | SSH (biasanya sudah terbuka) |
| 80, 443 | Website (HTTP/HTTPS) |
| port aaPanel (lihat langkah 2, mis. 8888) | Membuka aaPanel |

Port 3000 **tidak perlu** dibuka. Aplikasi diakses lewat Nginx.

## 2. Masuk aaPanel & pasang software

1. Ambil alamat & password aaPanel: tab **Pre-installed application** di console Lighthouse, atau login SSH (tombol **Login** di console) lalu jalankan `bt default`.
2. Buka alamat aaPanel di browser, lalu login.
3. **App Store** (atau jendela *Recommended software packages* → kolom **LNMP**, method *Fast*) → pasang:
   - **Nginx** (versi stable)
   - **MySQL 5.7** (aaPanel hanya mengizinkan MySQL 8.0 di server RAM ≥ 6 GB; aplikasi ini sudah dicek cocok dengan 5.7). Jangan pilih MariaDB.
   - **PHP 8.3 + phpMyAdmin** (hanya untuk membuka database lewat browser). **Pure-Ftpd tidak perlu**, hilangkan centangnya.
   - **Node.js version manager** → pasang **Node v22 (LTS)** → klik *Set as command line version*
4. Cek di **Terminal** aaPanel: `node -v` dan `npm -v` harus muncul. Lalu pasang PM2: `npm install -g pm2`.

## 3. Ambil kode dari GitHub

Buka Terminal (aaPanel → *Terminal*, atau SSH):

### 3a. Repo publik
```bash
cd /www/wwwroot
git clone https://github.com/inekeyuliamargareta/english-test-platform.git englishtest
```

### 3b. Repo private (pakai deploy key, hanya bisa baca)
```bash
ssh-keygen -t ed25519 -C englishon-server -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```
Salin hasilnya → GitHub repo → *Settings* → *Deploy keys* → *Add deploy key* (jangan centang *write access*). Lalu:
```bash
printf 'Host github.com\n  IdentityFile ~/.ssh/github_deploy\n' >> ~/.ssh/config
cd /www/wwwroot
git clone git@github.com:inekeyuliamargareta/english-test-platform.git englishtest
```
Jika sudah terlanjur clone dengan https lalu repo dijadikan private:
`cd /www/wwwroot/englishtest && git remote set-url origin git@github.com:inekeyuliamargareta/english-test-platform.git`

## 4. Buat database

aaPanel → **Databases** → *Add database*:
- Database name: `englishon`
- Username: `englishon`
- Password: klik *generate* (simpan baik-baik)

## 5. Isi file `.env`

```bash
cd /www/wwwroot/englishtest
cp .env.example .env
openssl rand -hex 32        # salin hasilnya untuk JWT_SECRET
nano .env
```
Isi minimal:
```
PORT=3000
DB_HOST=127.0.0.1
DB_USER=englishon
DB_PASSWORD=<password database langkah 4>
DB_NAME=englishon
JWT_SECRET=<hasil openssl tadi>
CONTACT_NAME=EnglishOn Ponorogo
CONTACT_ADDRESS=<alamat kantor asli>
CONTACT_WA=<nomor WA format 62..., mis. 6281234567890>
CONTACT_WA_LABEL=<nomor yang tampil, mis. 0812-3456-7890>
CONTACT_HOURS=Senin–Sabtu, 08.00–20.00 WIB
SEED_ADMIN_EMAIL=<email admin asli>
SEED_PASSWORD=<password kuat, BUKAN englishon123>
```
Simpan: `Ctrl+O`, `Enter`, `Ctrl+X`.

## 6. Instalasi pertama & jalankan aplikasi

```bash
cd /www/wwwroot/englishtest
npm ci --omit=dev
npm run migrate
npm run seed            # SEKALI SAJA: materi, soal, akun admin + siswa demo
pm2 start ecosystem.config.js
pm2 save
pm2 startup             # jalankan perintah yang muncul, agar aplikasi hidup lagi setelah server restart
```
Cek: `pm2 status` → `englishon` harus *online*. `curl -I localhost:3000` → `HTTP/1.1 200 OK`.

Siswa demo dari seed (Rina, Dimas, dst.) memakai password `SEED_PASSWORD`. Untuk produksi, hapus siswa demo jika tidak dibutuhkan:
aaPanel → Databases → `englishon` → phpMyAdmin → jalankan
`DELETE FROM users WHERE role = 'student' AND email LIKE '%@email.com';`

## 7. Domain, Nginx & HTTPS

1. Di pengelola domain, buat **A record**: `@` dan `www` → `43.156.200.140`. Tunggu propagasi (5 menit – beberapa jam).
2. aaPanel → **Website** → *Add site* → domain `englishon.co.id` (+ `www.englishon.co.id`), PHP: *Static* (tanpa PHP), database: tidak perlu.
3. Buka site → **Reverse proxy** → *Add reverse proxy*: Target URL `http://127.0.0.1:3000`, Sent domain `$host`.
4. **SSL** → *Let's Encrypt* → centang domain → *Apply* → nyalakan **Force HTTPS**.
5. Batas upload (ebook sampai 50 MB): aaPanel → App Store → Nginx → *Settings* → *Performance tuning* (atau *Config modification*) → `client_max_body_size 60m` → simpan → *Reload*.

Buka `https://englishon.co.id` → login dengan `SEED_ADMIN_EMAIL` / `SEED_PASSWORD`.

Belum punya domain? Sementara bisa pakai IP: tambahkan site dengan nama `43.156.200.140` (tanpa SSL) lalu buka `http://43.156.200.140`.

## 8. Autodeploy dari GitHub

### 8a. Kunci SSH khusus GitHub Actions (di Terminal server)
```bash
ssh-keygen -t ed25519 -C github-actions -f ~/.ssh/actions_deploy -N ""
cat ~/.ssh/actions_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
cat ~/.ssh/actions_deploy       # salin SELURUH isi (termasuk baris BEGIN & END)
```

### 8b. Secret di GitHub
GitHub repo → *Settings* → *Secrets and variables* → *Actions* → *New repository secret*:

| Name | Value |
|---|---|
| `SSH_HOST` | `43.156.200.140` |
| `SSH_USER` | `root` (user yang dipakai di langkah 8a) |
| `SSH_KEY` | isi private key dari `cat ~/.ssh/actions_deploy` |

Setelah disalin ke GitHub, hapus private key dari server: `rm ~/.ssh/actions_deploy` (public key di `authorized_keys` tetap).

> Jika login SSH sebagai `root` ditolak, jalankan langkah 8a dengan user bawaan Lighthouse (mis. `ubuntu` / `lighthouse`), isi `SSH_USER` dengan user itu, dan ubah baris `script:` di `.github/workflows/deploy.yml` menjadi `sudo bash /www/wwwroot/englishtest/deploy.sh`.

### 8c. Coba
Push perubahan apa pun ke `main` → GitHub repo → tab **Actions** → workflow **Deploy** berjalan. Hijau = server sudah terupdate. Merah = klik untuk melihat langkah yang gagal.

Deploy manual (tanpa push): tab **Actions** → **Deploy** → *Run workflow*, atau di server `bash /www/wwwroot/englishtest/deploy.sh`.

## 9. Backup (jangan dilewati)

- **Snapshot otomatis**: console Lighthouse → *Snapshot* → *Scheduled snapshot* (mis. mingguan).
- **Database harian**: aaPanel → *Cron* → *Backup database* → `englishon` → setiap hari.
- **File upload**: aaPanel → *Cron* → *Backup directory* untuk `/www/wwwroot/englishtest/storage` (ebook) dan `/www/wwwroot/englishtest/public/uploads` (audio).

## Alur kerja sehari-hari

1. Ubah kode di laptop → tes di Laragon.
2. `git commit` → `git push`.
3. Tunggu ±1–2 menit → website sudah terupdate.

**Jangan mengedit kode langsung di server.** Setiap deploy menyamakan kode server dengan GitHub, sehingga perubahan di server akan hilang. File `.env`, ebook, dan audio aman karena tidak ada di Git.

## Jika ada masalah

| Gejala | Cek |
|---|---|
| Website 502 Bad Gateway | `pm2 status` dan `pm2 logs englishon --lines 50` |
| Deploy gagal di langkah SSH | Secret `SSH_HOST/USER/KEY`, port 22 terbuka di Firewall |
| `npm: command not found` saat deploy | aaPanel → Node.js version manager → *Set as command line version* |
| Upload ebook gagal "413" | `client_max_body_size` di Nginx (langkah 7.5) |
| Lupa password admin | `SEED_PASSWORD` di `.env` hanya dipakai saat seed pertama; reset lewat phpMyAdmin perlu hash bcrypt — hubungi developer |
