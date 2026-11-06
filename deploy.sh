#!/usr/bin/env bash
# Update aplikasi di server ke versi terbaru dari GitHub.
# Dijalankan otomatis oleh GitHub Actions setiap push ke main, atau manual: bash deploy.sh
# File .env, public/uploads (audio), dan storage (ebook) tidak tersentuh karena tidak ada di Git.
set -euo pipefail
cd "$(dirname "$0")"

# Node & PM2 dari aaPanel (Node.js version manager) kadang tidak ada di PATH sesi SSH
for d in /www/server/nodejs/v*/bin; do [ -d "$d" ] && PATH="$d:$PATH"; done
export PATH

echo "==> Ambil kode terbaru"
git fetch --prune origin main
git reset --hard origin/main

echo "==> Pasang dependensi"
npm ci --omit=dev

echo "==> Build CSS"
npm run css

echo "==> Update database (aman diulang, tidak menghapus data)"
npm run migrate

echo "==> Restart aplikasi"
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

echo "==> Selesai: $(git log -1 --format='%h %s')"
