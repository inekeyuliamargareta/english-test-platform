// Buat database (jika belum ada) lalu jalankan migrations.sql. Aman dijalankan berulang.
const fs = require('fs'), path = require('path'), mysql = require('mysql2/promise');
const { config } = require('./db');

(async () => {
  const name = process.env.DB_NAME;
  if (!/^\w+$/.test(name || '')) throw new Error('DB_NAME di .env tidak valid');
  const conn = await mysql.createConnection({ ...config, multipleStatements: true });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${name}\``);
  await conn.query(fs.readFileSync(path.join(__dirname, '..', 'migrations.sql'), 'utf8'));
  await conn.end();
  console.log(`Migrasi selesai: database ${name}`);
})().catch(e => { console.error(e.message); process.exit(1); });
