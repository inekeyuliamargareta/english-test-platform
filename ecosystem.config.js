// Konfigurasi PM2 (menjalankan server Node di VPS dan menyalakan ulang otomatis jika mati/reboot)
module.exports = {
  apps: [{
    name: 'englishon',
    script: 'src/server.js',
    env: { NODE_ENV: 'production' },
    max_memory_restart: '600M',
  }],
};
