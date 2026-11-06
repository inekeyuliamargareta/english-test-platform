// Buat database (jika belum ada), jalankan migrations.sql, lalu tambahkan kolom baru ke database lama.
// Aman dijalankan berulang dan tidak menghapus data.
const fs = require('fs'), path = require('path'), mysql = require('mysql2/promise');
const { config } = require('./db');
const { applyDefaults } = require('./defaults');

// Kolom yang ditambahkan setelah rilis pertama: [tabel, kolom, definisi]
const COLUMNS = [
  ['exams', 'about', 'TEXT'],
  ['exams', 'recommend', 'JSON'],
  ['questions', 'pool', "VARCHAR(40) NOT NULL DEFAULT 'bank'"],
  ['users', 'targets', 'JSON'],
  ['exam_sections', 'office', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['exam_sections', 'note', 'TEXT'],
];

(async () => {
  const name = process.env.DB_NAME;
  if (!/^\w+$/.test(name || '')) throw new Error('DB_NAME di .env tidak valid');
  const conn = await mysql.createConnection({ ...config, multipleStatements: true });
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${name}\``);
  await conn.query(fs.readFileSync(path.join(__dirname, '..', 'migrations.sql'), 'utf8'));

  for (const [table, column, def] of COLUMNS) {
    const [[{ n }]] = await conn.query('SELECT COUNT(*) n FROM information_schema.columns WHERE table_schema = ? AND table_name = ? AND column_name = ?', [name, table, column]);
    if (!n) await conn.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
  }
  await conn.query("ALTER TABLE packages MODIFY type ENUM('full','section','placement') NOT NULL");
  // pool juga bisa berisi id paket mock test (soal khusus mock test itu)
  await conn.query("ALTER TABLE questions MODIFY pool VARCHAR(40) NOT NULL DEFAULT 'bank'");
  await applyDefaults(conn);

  await conn.end();
  console.log(`Migrasi selesai: database ${name}`);
})().catch(e => { console.error(e.message); process.exit(1); });
