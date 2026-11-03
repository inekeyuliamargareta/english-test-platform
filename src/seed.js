// Isi database dengan konten awal dari mockup + akun admin & siswa demo.
// Menghapus SEMUA konten & akun. Ditolak jika sudah ada akun, kecuali dijalankan dengan --force.
const bcrypt = require('bcryptjs');
const { pool } = require('./db');
const S = require('./seed-data');
const { scoreAttempt } = require('./scoring');
const { applyDefaults } = require('./defaults');

const J = v => v == null ? null : JSON.stringify(v);
const insert = (table, cols, rows) => rows.length && pool.query(`INSERT INTO ${table} (${cols.join(',')}) VALUES ?`, [rows]);
const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, Mei: 4, Jun: 5, Jul: 6, Agu: 7, Sep: 8, Okt: 9, Nov: 10, Des: 11 };
const parseJoined = s => { const [d, m, y] = s.split(' '); return new Date(+y, MONTHS[m], +d, 9); };

(async () => {
  const [[{ n }]] = await pool.query('SELECT COUNT(*) n FROM users');
  if (n && !process.argv.includes('--force')) throw new Error(`Database sudah berisi ${n} akun. Jalankan "npm run seed -- --force" jika memang ingin menghapus semuanya.`);

  for (const t of ['attempts', 'chapter_progress', 'users', 'packages', 'writing_tasks', 'questions', 'clips', 'passages', 'chapters', 'exam_sections', 'exams']) await pool.query(`DELETE FROM ${t}`);

  const exams = Object.values(S.exams);
  await insert('exams', ['code', 'name', 'full_name', 'active', 'rgb', 'rgb_dark', 'rgb_soft', 'scale', 'rules', 'sort'],
    exams.map((e, i) => [e.key, e.name, e.full, e.active, e.rgb, e.rgbDark, e.rgbSoft, e.scale, J(S.rules[e.key] || []), i]));
  await insert('exam_sections', ['exam_key', 'id', 'name', 'short', 'icon', 'official', 'tutor', 'sort'],
    exams.flatMap(e => e.sections.map((s, i) => [e.key, s.id, s.name, s.short, s.icon, s.official, !!s.tutor, i])));
  await insert('chapters', ['id', 'exam', 'section', 'title', 'descr', 'minutes', 'subs', 'draft', 'sort'],
    S.chapters.map((c, i) => [c.id, c.exam, c.section, c.title, c.desc, c.minutes, J(c.subs), 0, i]));
  await insert('passages', ['id', 'title', 'html'], Object.entries(S.passages).map(([id, p]) => [id, p.title, p.html]));
  await insert('clips', ['id', 'title', 'transcript'], Object.entries(S.clips).map(([id, c]) => [id, c.title, J(c.lines)]));
  await insert('questions', ['id', 'exam', 'section', 'chapter', 'topic', 'difficulty', 'type', 'q', 'instr', 'options', 'answer', 'explanation', 'clip', 'passage', 'sort'],
    S.questions.map((q, i) => [q.id, q.exam, q.section, q.chapter, q.topic, q.difficulty, q.type, q.q, q.instr || null, J(q.options), J(q.answer), q.explain, q.clip || null, q.passage || null, i]));
  await insert('writing_tasks', ['id', 'exam', 'section', 'task', 'minutes', 'min_words', 'title', 'prompt', 'chart', 'sample'],
    S.writingTasks.map(t => [t.id, 'ielts', 'writing', t.task, t.minutes, t.minWords, t.title, t.prompt, J(t.chart), t.sample]));
  await insert('packages', ['id', 'exam', 'name', 'type', 'badge', 'descr', 'sections', 'sort'],
    S.packages.map((p, i) => [p.id, p.exam, p.name, p.type, p.badge || null, p.desc, J(p.sections), i]));

  // Akun: 1 admin + siswa demo dari mockup (password sama, lihat SEED_PASSWORD di .env)
  const hash = await bcrypt.hash(process.env.SEED_PASSWORD || 'englishon123', 10);
  await insert('users', ['name', 'email', 'password_hash', 'role', 'exam', 'full_access'], [['Admin EnglishOn', process.env.SEED_ADMIN_EMAIL || 'admin@englishon.test', hash, 'admin', null, 1]]);
  await insert('users', ['name', 'email', 'password_hash', 'role', 'exam', 'full_access', 'created_at'],
    S.students.map(s => [s.name, s.email, hash, 'student', s.exam, s.full, parseJoined(s.joined)]));
  const [users] = await pool.query("SELECT id, email, exam FROM users WHERE role = 'student'");
  const idOf = email => users.find(u => u.email === email).id;

  // Progres materi siswa demo utama
  await insert('chapter_progress', ['user_id', 'chapter_id', 'progress'],
    S.chapters.filter(c => c.progress).map(c => [idOf(S.user.email), c.id, c.progress]));

  // Riwayat simulasi: contoh hasil dari mockup, dinilai dengan aturan skor yang sama seperti server
  const meta = exam => id => S.exams[exam].sections.find(s => s.id === id);
  const items = exam => id => meta(exam)(id)?.tutor ? S.writingTasks : S.questions.filter(q => q.exam === exam && q.section === id);
  const attempt = (userId, exam, date) => {
    const a = S.sampleAttempts[exam], pkg = S.packages.find(p => p.id === a.pkg);
    const res = scoreAttempt(pkg, meta(exam), items(exam), a.answers);
    return [userId, pkg.id, exam, J(a.answers), J(a.flags), a.duration, J(res), res.total, date];
  };
  const rows = [attempt(idOf(S.user.email), 'ielts', new Date(S.sampleAttempts.ielts.date)), attempt(idOf(S.user.email), 'toefl', new Date(S.sampleAttempts.toefl.date))];
  S.students.filter(s => s.tests && s.email !== S.user.email).forEach((s, i) => rows.push(attempt(idOf(s.email), s.exam, new Date(Date.now() - (i + 1) * 3 * 3600e3))));
  await insert('attempts', ['user_id', 'package_id', 'exam', 'answers', 'flags', 'duration', 'result', 'total', 'created_at'], rows);

  await applyDefaults(pool); // deskripsi program, rekomendasi, placement test
  console.log(`Seed selesai: ${S.questions.length} soal, ${S.chapters.length} bab, ${users.length} siswa demo + 1 admin.`);
  await pool.end();
})().catch(async e => { console.error(e.message); await pool.end(); process.exit(1); });
