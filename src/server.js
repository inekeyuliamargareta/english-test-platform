const path = require('path'), fs = require('fs');
const express = require('express'), helmet = require('helmet'), cors = require('cors');
const jwt = require('jsonwebtoken'), bcrypt = require('bcryptjs');
const { pool } = require('./db');
const { scoreAttempt, isCorrect, isAnswered } = require('./scoring');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET belum diisi di .env');
const PUBLIC = path.join(__dirname, '..', 'public');
const AUDIO_DIR = path.join(PUBLIC, 'uploads', 'audio');
const CONTACT = {
  name: process.env.CONTACT_NAME, address: process.env.CONTACT_ADDRESS, wa: process.env.CONTACT_WA,
  waLabel: process.env.CONTACT_WA_LABEL, hours: process.env.CONTACT_HOURS,
};

const app = express();
// ponytail: CSP dimatikan karena Alpine (CDN) butuh eval & halaman memakai script inline. Aktifkan setelah pindah ke build Alpine CSP + Tailwind terkompilasi.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false }));
app.use(express.json({ limit: '2mb' }));
app.use(express.static(PUBLIC));

// ---------- Helper ----------
const q = (sql, params) => pool.query(sql, params).then(([rows]) => rows);
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const J = v => v == null ? null : JSON.stringify(v);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const validId = id => /^[\w-]{1,40}$/.test(id) || fail(400, 'ID tidak valid');
const text = (v, max, label) => { const s = String(v ?? '').trim(); if (!s) fail(400, `${label} wajib diisi`); return s.slice(0, max); };
const initials = name => name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

// ---------- Mapper baris DB → bentuk yang dipakai frontend ----------
const mapChapter = c => ({ id: c.id, exam: c.exam, section: c.section, title: c.title, desc: c.descr, minutes: c.minutes, subs: c.subs, draft: !!c.draft });
const mapPackage = p => ({ id: p.id, exam: p.exam, name: p.name, type: p.type, badge: p.badge, desc: p.descr, sections: p.sections });
const mapClip = c => ({ title: c.title, lines: c.transcript, audio: c.audio_url });
// full = sertakan kunci jawaban & pembahasan (admin, review, cek latihan)
function mapQuestion(r, full) {
  const o = { id: r.id, exam: r.exam, section: r.section, chapter: r.chapter, topic: r.topic, difficulty: r.difficulty, type: r.type, q: r.q, instr: r.instr, options: r.options, clip: r.clip, passage: r.passage, pool: r.pool };
  if (full) Object.assign(o, { answer: r.answer, explain: r.explanation });
  for (const k in o) if (o[k] == null) delete o[k];
  return o;
}
const mapTask = (t, full) => ({ id: t.id, exam: t.exam, section: t.section, task: t.task, minutes: t.minutes, minWords: t.min_words, title: t.title, prompt: t.prompt, chart: t.chart, ...(full && { sample: t.sample }) });
const mapAttempt = a => ({ id: a.id, pkg: a.package_id, exam: a.exam, date: a.created_at, duration: a.duration, total: a.total == null ? null : +a.total, sections: a.result.sections, flags: a.flags });

async function loadExams() {
  const [exams, secs] = await Promise.all([q('SELECT * FROM exams ORDER BY sort, code'), q('SELECT * FROM exam_sections ORDER BY sort, id')]);
  return Object.fromEntries(exams.map(e => [e.code, {
    key: e.code, name: e.name, full: e.full_name, active: !!e.active, rgb: e.rgb, rgbDark: e.rgb_dark, rgbSoft: e.rgb_soft, scale: e.scale, rules: e.rules || [], about: e.about || '', recommend: e.recommend || {},
    sections: secs.filter(s => s.exam_key === e.code).map(s => ({ id: s.id, name: s.name, short: s.short, icon: s.icon, official: s.official, tutor: !!s.tutor })),
  }]));
}

// Paket + soal-soalnya (lengkap dengan kunci) untuk menilai dan me-review simulasi
async function packageContext(pkgId) {
  const [row] = await q('SELECT * FROM packages WHERE id = ?', [pkgId]);
  if (!row) fail(404, 'Paket test tidak ditemukan');
  const pkg = mapPackage(row), E = (await loadExams())[pkg.exam], ids = pkg.sections.map(s => s[0]);
  const pool = pkg.type === 'placement' ? 'placement' : 'bank';
  const [qs, ts] = await Promise.all([
    q('SELECT * FROM questions WHERE exam = ? AND section IN (?) AND pool = ? ORDER BY sort, id', [pkg.exam, ids, pool]),
    q('SELECT * FROM writing_tasks WHERE exam = ? AND section IN (?) ORDER BY task, id', [pkg.exam, ids]),
  ]);
  const meta = id => E?.sections.find(s => s.id === id);
  const items = id => meta(id)?.tutor ? ts.filter(t => t.section === id).map(t => mapTask(t, true)) : qs.filter(x => x.section === id).map(x => mapQuestion(x, true));
  return { pkg, E, meta, items };
}

// ---------- Auth ----------
const sign = id => jwt.sign({ sub: id }, SECRET, { expiresIn: '7d' });
app.use('/api', wrap(async (req, res, next) => {
  const h = req.get('authorization') || '';
  if (h.startsWith('Bearer ')) {
    try {
      const { sub } = jwt.verify(h.slice(7), SECRET);
      [req.user] = await q('SELECT id, name, email, role, exam, target_toefl, target_ielts, full_access FROM users WHERE id = ?', [sub]);
    } catch { /* token kedaluwarsa / rusak → dianggap belum masuk */ }
  }
  next();
}));
const need = role => (req, res, next) => !req.user ? res.status(401).json({ error: 'Silakan masuk terlebih dahulu' })
  : role && req.user.role !== role ? res.status(403).json({ error: 'Akses ditolak' }) : next();

app.post('/api/auth/register', wrap(async (req, res) => {
  const b = req.body || {}, email = String(b.email || '').trim().toLowerCase();
  const name = text(b.name, 120, 'Nama');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) fail(400, 'Format email tidak valid');
  if (String(b.password || '').length < 8) fail(400, 'Kata sandi minimal 8 karakter');
  if (!(await loadExams())[b.exam]?.active) fail(400, 'Pilih ujian yang tersedia');
  const hash = await bcrypt.hash(String(b.password), 10);
  try {
    const r = await q('INSERT INTO users (name, email, phone, password_hash, exam) VALUES (?, ?, ?, ?, ?)', [name, email, String(b.phone || '').slice(0, 30) || null, hash, b.exam]);
    res.json({ token: sign(r.insertId) });
  } catch (e) { if (e.code === 'ER_DUP_ENTRY') fail(409, 'Email sudah terdaftar. Silakan masuk.'); throw e; }
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const b = req.body || {};
  const [u] = await q('SELECT id, password_hash FROM users WHERE email = ?', [String(b.email || '').trim().toLowerCase()]);
  if (!u || !(await bcrypt.compare(String(b.password || ''), u.password_hash))) fail(401, 'Email atau kata sandi salah');
  res.json({ token: sign(u.id) });
}));

// ---------- Data awal halaman ----------
// Tanpa login: kontak & daftar ujian. Siswa: konten tanpa kunci jawaban. Admin: semua termasuk draft & kunci.
app.get('/api/bootstrap', wrap(async (req, res) => {
  const out = { contact: CONTACT, exams: await loadExams() }, u = req.user;
  if (!u) return res.json(out);
  const admin = u.role === 'admin';
  const [chapters, passages, clips, questions, tasks, packages, progress, attempts] = await Promise.all([
    q(`SELECT * FROM chapters ${admin ? '' : 'WHERE draft = 0'} ORDER BY sort, id`),
    q('SELECT * FROM passages'), q('SELECT * FROM clips'),
    q('SELECT * FROM questions ORDER BY sort, id'), q('SELECT * FROM writing_tasks ORDER BY task, id'),
    q('SELECT * FROM packages ORDER BY sort, id'),
    q('SELECT chapter_id, progress, updated_at FROM chapter_progress WHERE user_id = ?', [u.id]),
    q('SELECT * FROM attempts WHERE user_id = ? ORDER BY created_at DESC, id DESC', [u.id]),
  ]);
  const prog = Object.fromEntries(progress.map(p => [p.chapter_id, p.progress]));
  out.user = {
    id: u.id, name: u.name, email: u.email, role: u.role, exam: u.exam, initials: initials(u.name),
    target: { toefl: u.target_toefl, ielts: +u.target_ielts },
    access: { full: admin || !!u.full_access, used: attempts.some(a => !isPlacement(a.package_id)) },
  };
  out.chapters = chapters.map(c => { const p = prog[c.id] || 0; return { ...mapChapter(c), progress: p, status: p >= 100 ? 'done' : p ? 'progress' : 'new' }; });
  out.passages = Object.fromEntries(passages.map(p => [p.id, { title: p.title, html: p.html }]));
  out.clips = Object.fromEntries(clips.map(c => [c.id, mapClip(c)]));
  out.questions = questions.map(x => mapQuestion(x, admin));
  out.writingTasks = tasks.map(t => mapTask(t, admin));
  out.packages = packages.map(mapPackage);
  out.attempts = attempts.map(mapAttempt);
  // Aktivitas terbaru: gabungan simulasi & progres bab
  const pkgName = id => packages.find(p => p.id === id)?.name || id, ch = id => chapters.find(c => c.id === id);
  function isPlacement(id) { return packages.find(p => p.id === id)?.type === 'placement'; }
  out.activity = [
    ...attempts.map(a => isPlacement(a.package_id)
      ? { exam: a.exam, icon: 'gauge', text: `Mengerjakan <b>${esc(pkgName(a.package_id))}</b> — ${+a.total}% benar`, at: a.created_at }
      : { exam: a.exam, icon: 'timer', text: `Simulasi <b>${esc(pkgName(a.package_id))}</b>${a.total == null ? '' : ' — skor ' + +a.total}`, at: a.created_at }),
    ...progress.filter(p => ch(p.chapter_id)).map(p => ({ exam: ch(p.chapter_id).exam, icon: p.progress >= 100 ? 'check-circle' : 'book-open', text: `${p.progress >= 100 ? 'Menyelesaikan' : 'Mempelajari'} bab <b>${esc(ch(p.chapter_id).title)}</b>`, at: p.updated_at })),
  ].sort((a, b) => b.at - a.at).slice(0, 30);
  res.json(out);
}));

// ---------- Siswa ----------
app.put('/api/progress/:chapterId', need(), wrap(async (req, res) => {
  const p = Math.max(0, Math.min(100, Math.round(+req.body?.progress || 0)));
  const [c] = await q('SELECT id FROM chapters WHERE id = ?', [req.params.chapterId]);
  if (!c) fail(404, 'Bab tidak ditemukan');
  // Progres tidak pernah turun (membuka ulang bab tidak mereset)
  await q(`INSERT INTO chapter_progress (user_id, chapter_id, progress) VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE progress = GREATEST(progress, VALUES(progress))`, [req.user.id, c.id, p]);
  res.json({ ok: true });
}));

// Latihan di akhir bab: kunci & pembahasan dikirim setelah siswa menjawab.
// ponytail: soal latihan dan simulasi memakai bank soal yang sama; pisahkan jika kunci simulasi harus benar-benar rahasia.
app.post('/api/questions/:id/check', need(), wrap(async (req, res) => {
  const [r] = await q('SELECT type, answer, explanation FROM questions WHERE id = ? AND chapter IS NOT NULL', [req.params.id]);
  if (!r) fail(404, 'Soal tidak ditemukan');
  res.json({ correct: isCorrect(r, req.body?.answer), answer: r.answer, explain: r.explanation });
}));

app.post('/api/attempts', need(), wrap(async (req, res) => {
  const u = req.user, b = req.body || {};
  const { pkg, E, meta, items } = await packageContext(b.pkg);
  const placement = pkg.type === 'placement'; // placement test bebas dicoba, termasuk program yang belum aktif
  if (!E || (!E.active && !placement)) fail(400, 'Ujian ini belum tersedia');
  // Simpan hanya jawaban untuk soal di paket ini, dengan tipe yang benar
  const all = pkg.sections.flatMap(([id]) => items(id)), answers = {}, src = b.answers || {};
  for (const it of all) {
    const a = src[it.id];
    if (it.type === 'mc' || it.type === 'error') { if (Number.isInteger(a)) answers[it.id] = a; }
    else if (typeof a === 'string') answers[it.id] = a.slice(0, 20000);
  }
  const flags = (Array.isArray(b.flags) ? b.flags : []).filter(id => all.some(it => it.id === id));
  const duration = Math.max(0, Math.min(86400, Math.round(+b.duration || 0)));
  const result = scoreAttempt(pkg, meta, items, answers);

  // Kunci baris user agar dua submit bersamaan tidak sama-sama lolos kuota gratis
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SELECT id FROM users WHERE id = ? FOR UPDATE', [u.id]);
    if (u.role !== 'admin' && !u.full_access && !placement) {
      const [[{ n }]] = await conn.query("SELECT COUNT(*) n FROM attempts a JOIN packages p ON p.id = a.package_id WHERE a.user_id = ? AND p.type <> 'placement'", [u.id]);
      if (n) fail(403, 'Simulasi gratis sudah terpakai. Hubungi EnglishOn untuk membuka akses penuh.');
    }
    const [r] = await conn.query('INSERT INTO attempts (user_id, package_id, exam, answers, flags, duration, result, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [u.id, pkg.id, pkg.exam, J(answers), J(flags), duration, J(result), result.total]);
    await conn.commit();
    res.json({ id: r.insertId });
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
}));

// Review: soal + kunci + pembahasan + jawaban siswa
app.get('/api/attempts/:id', need(), wrap(async (req, res) => {
  const [a] = await q('SELECT * FROM attempts WHERE id = ?', [+req.params.id || 0]);
  if (!a || (a.user_id !== req.user.id && req.user.role !== 'admin')) fail(404, 'Hasil test tidak ditemukan');
  const { pkg, meta, items } = await packageContext(a.package_id);
  const list = pkg.sections.flatMap(([sid]) => items(sid).map(it => {
    const user = a.answers[it.id], kind = meta(sid)?.tutor ? 'writing' : 'q', blank = !isAnswered(user);
    return { ...it, kind, section: sid, user, blank, ok: kind === 'q' && !blank && isCorrect(it, user) };
  }));
  res.json({ attempt: mapAttempt(a), items: list });
}));

// ---------- Admin ----------
const admin = need('admin');

app.get('/api/admin/students', admin, wrap(async (req, res) => {
  const [users, attempts, sums, counts, [{ nq }]] = await Promise.all([
    q("SELECT id, name, email, phone, exam, full_access, created_at FROM users WHERE role = 'student' ORDER BY created_at DESC"),
    q("SELECT a.id, a.user_id, a.exam, a.package_id, a.total, a.result, a.created_at, u.name, p.type = 'placement' placement FROM attempts a JOIN users u ON u.id = a.user_id LEFT JOIN packages p ON p.id = a.package_id ORDER BY a.created_at DESC, a.id DESC"),
    q('SELECT p.user_id, c.exam, SUM(p.progress) s FROM chapter_progress p JOIN chapters c ON c.id = p.chapter_id AND c.draft = 0 GROUP BY p.user_id, c.exam'),
    q('SELECT exam, COUNT(*) n FROM chapters WHERE draft = 0 GROUP BY exam'),
    q('SELECT COUNT(*) nq FROM questions'),
  ]);
  // Skor utama: total Full Test, atau skor section pertama untuk tes per section
  const score = a => a.total != null ? +a.total : a.result.sections.find(s => s.score != null)?.score ?? null;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  res.json({
    stats: { students: users.length, studentsMonth: users.filter(u => u.created_at >= monthStart).length, questions: nq },
    recent: attempts.filter(a => !a.placement).slice(0, 5).map(a => ({ id: a.id, name: a.name, exam: a.exam, score: score(a), date: a.created_at })),
    students: users.map(u => {
      const all = attempts.filter(a => a.user_id === u.id), mine = all.filter(a => !a.placement), pl = all.find(a => a.placement);
      const total = counts.find(c => c.exam === u.exam)?.n || 0, sum = +(sums.find(s => s.user_id === u.id && s.exam === u.exam)?.s || 0);
      return {
        id: u.id, name: u.name, email: u.email, phone: u.phone, exam: u.exam, full: !!u.full_access, joined: u.created_at,
        tests: mine.length, last: mine.length ? score(mine[0]) : null, lastExam: mine[0]?.exam,
        progress: total ? Math.round(sum / total) : 0,
        placement: pl ? { exam: pl.exam, percent: +pl.total, date: pl.created_at } : null,
        history: all.slice(0, 6).map(a => ({ id: a.id, date: a.created_at, exam: a.exam, pkg: a.package_id, score: score(a), placement: !!a.placement })),
      };
    }),
  });
}));

app.patch('/api/admin/students/:id', admin, wrap(async (req, res) => {
  const r = await q("UPDATE users SET full_access = ? WHERE id = ? AND role = 'student'", [req.body?.full ? 1 : 0, +req.params.id || 0]);
  if (!r.affectedRows) fail(404, 'Siswa tidak ditemukan');
  res.json({ ok: true });
}));

app.put('/api/admin/chapters/:id', admin, wrap(async (req, res) => {
  const b = req.body || {}, id = req.params.id; validId(id);
  const subs = (Array.isArray(b.subs) ? b.subs : []).map(s => ({ title: text(s.title, 160, 'Judul sub-bab'), html: String(s.html || '') }));
  if (!subs.length) fail(400, 'Minimal satu sub-bab');
  const row = [text(b.exam, 20, 'Ujian'), text(b.section, 30, 'Section'), text(b.title, 160, 'Judul bab'), String(b.desc || ''), Math.max(1, +b.minutes || 20), J(subs), b.draft ? 1 : 0];
  const [{ sort }] = await q('SELECT COALESCE(MAX(sort), 0) + 1 sort FROM chapters');
  await q(`INSERT INTO chapters (id, exam, section, title, descr, minutes, subs, draft, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE exam = VALUES(exam), section = VALUES(section), title = VALUES(title), descr = VALUES(descr), minutes = VALUES(minutes), subs = VALUES(subs), draft = VALUES(draft)`, [id, ...row, sort]);
  const [c] = await q('SELECT * FROM chapters WHERE id = ?', [id]);
  res.json(mapChapter(c));
}));

// Periksa & rapikan satu soal. refs = { exams, chapters, passages, clips } untuk cek relasi.
function questionRow(b, refs) {
  if (!['mc', 'error', 'fill'].includes(b.type)) fail(400, 'Tipe soal tidak valid (mc / error / fill)');
  if (!['mudah', 'sedang', 'sulit'].includes(b.difficulty)) fail(400, 'Tingkat kesulitan harus mudah / sedang / sulit');
  if (!['bank', 'placement'].includes(b.pool || 'bank')) fail(400, 'Kolom "untuk" harus simulasi atau placement');
  const E = refs.exams[b.exam];
  if (!E) fail(400, `Program "${b.exam ?? ''}" tidak ada`);
  if (!E.sections.some(s => s.id === b.section)) fail(400, `Section "${b.section ?? ''}" tidak ada di program ${E.name}`);
  const ref = (v, list, label) => { v = v ? String(v).trim() : null; if (v && !list.has(v)) fail(400, `${label} "${v}" tidak ditemukan`); return v; };
  let options = null, answer;
  if (b.type === 'fill') {
    answer = (Array.isArray(b.answer) ? b.answer : []).map(a => String(a).trim().toLowerCase()).filter(Boolean);
    if (!answer.length) fail(400, 'Isi minimal satu jawaban benar');
  } else {
    options = (Array.isArray(b.options) ? b.options : []).map(o => String(o).trim());
    if (options.length < 2 || options.some(o => !o)) fail(400, 'Isi semua opsi jawaban (minimal 2)');
    answer = b.answer;
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) fail(400, 'Kunci jawaban harus salah satu opsi yang terisi');
  }
  return [b.exam, b.section, ref(b.chapter, refs.chapters, 'Bab'), String(b.topic || '').slice(0, 80), b.difficulty, b.type, text(b.q, 5000, 'Pertanyaan'),
    b.instr ? String(b.instr).slice(0, 255) : null, J(options), J(answer), String(b.explain || ''), ref(b.clip, refs.clips, 'Audio'), ref(b.passage, refs.passages, 'Passage'), b.pool || 'bank'];
}
async function questionRefs() {
  const [exams, ch, ps, cl] = await Promise.all([loadExams(), q('SELECT id FROM chapters'), q('SELECT id FROM passages'), q('SELECT id FROM clips')]);
  const ids = rows => new Set(rows.map(r => r.id));
  return { exams, chapters: ids(ch), passages: ids(ps), clips: ids(cl) };
}
const Q_COLS = 'exam, section, chapter, topic, difficulty, type, q, instr, options, answer, explanation, clip, passage, pool';

app.put('/api/admin/questions/:id', admin, wrap(async (req, res) => {
  const id = req.params.id; validId(id);
  const row = questionRow(req.body || {}, await questionRefs());
  const [{ sort }] = await q('SELECT COALESCE(MAX(sort), 0) + 1 sort FROM questions');
  await q(`INSERT INTO questions (id, ${Q_COLS}, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE ${Q_COLS.split(', ').map(c => `${c} = VALUES(${c})`).join(', ')}`, [id, ...row, sort]);
  const [r] = await q('SELECT * FROM questions WHERE id = ?', [id]);
  res.json(mapQuestion(r, true));
}));

// Import banyak soal sekaligus (dari CSV yang diolah di browser). Semua baris diperiksa dulu;
// jika ada satu saja yang salah, tidak ada yang disimpan. dryRun = hanya periksa.
app.post('/api/admin/questions/import', admin, wrap(async (req, res) => {
  const list = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!list.length) fail(400, 'Tidak ada soal untuk diimport');
  if (list.length > 2000) fail(400, 'Maksimal 2000 soal sekali import');
  const refs = await questionRefs(), rows = [], errors = [];
  list.forEach((b, i) => { try { rows.push(questionRow(b || {}, refs)); } catch (e) { if (!e.status) throw e; errors.push({ row: b?.row || i + 1, error: e.message }); } });
  if (errors.length || req.body.dryRun) return res.json({ ok: !errors.length, count: rows.length, errors });
  const [{ sort }] = await q('SELECT COALESCE(MAX(sort), 0) sort FROM questions'), stamp = Date.now().toString(36);
  await q(`INSERT INTO questions (id, ${Q_COLS}, sort) VALUES ?`, [rows.map((r, i) => [`q-${stamp}-${i + 1}`, ...r, sort + i + 1])]);
  const [added] = [await q('SELECT * FROM questions WHERE id LIKE ? ORDER BY sort', [`q-${stamp}-%`])];
  res.json({ ok: true, count: added.length, questions: added.map(r => mapQuestion(r, true)) });
}));

for (const table of ['chapters', 'questions']) {
  app.delete(`/api/admin/${table}/:id`, admin, wrap(async (req, res) => {
    const r = await q(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
    if (!r.affectedRows) fail(404, 'Data tidak ditemukan');
    res.json({ ok: true });
  }));
}

app.put('/api/admin/passages/:id', admin, wrap(async (req, res) => {
  validId(req.params.id);
  const b = req.body || {};
  await q('INSERT INTO passages (id, title, html) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title), html = VALUES(html)',
    [req.params.id, text(b.title, 160, 'Judul passage'), text(b.html, 100000, 'Teks passage')]);
  res.json({ ok: true });
}));

app.put('/api/admin/clips/:id', admin, wrap(async (req, res) => {
  validId(req.params.id);
  const b = req.body || {}, lines = (Array.isArray(b.lines) ? b.lines : []).filter(l => Array.isArray(l) && l[1]).map(([s, t]) => [String(s || '').slice(0, 40), String(t)]);
  await q('INSERT INTO clips (id, title, transcript) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title), transcript = VALUES(transcript)',
    [req.params.id, text(b.title, 160, 'Judul audio'), J(lines)]);
  res.json({ ok: true });
}));

// Upload MP3/WAV/M4A: body berisi file mentah (Content-Type audio/*). Disimpan di public/uploads/audio.
const AUDIO_EXT = { 'audio/mpeg': 'mp3', 'audio/mp3': 'mp3', 'audio/wav': 'wav', 'audio/x-wav': 'wav', 'audio/wave': 'wav', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/ogg': 'ogg' };
app.put('/api/admin/clips/:id/audio', admin, express.raw({ type: 'audio/*', limit: '25mb' }), wrap(async (req, res) => {
  const id = req.params.id, ext = AUDIO_EXT[req.get('content-type')];
  validId(id);
  if (!ext) fail(400, 'Format audio harus MP3, WAV, M4A, atau OGG');
  if (!Buffer.isBuffer(req.body) || !req.body.length) fail(400, 'File audio kosong');
  const [clip] = await q('SELECT audio_url FROM clips WHERE id = ?', [id]);
  if (!clip) fail(404, 'Audio tidak ditemukan');
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const file = `${id}-${Date.now()}.${ext}`;
  fs.writeFileSync(path.join(AUDIO_DIR, file), req.body);
  await q('UPDATE clips SET audio_url = ? WHERE id = ?', [`uploads/audio/${file}`, id]);
  if (clip.audio_url) fs.rm(path.join(PUBLIC, clip.audio_url), { force: true }, () => {});
  res.json({ audio: `uploads/audio/${file}` });
}));

// Master Test: simpan ujian + daftar section (section lama dipertahankan ID-nya agar soal tidak terputus)
app.put('/api/admin/exams/:code', admin, wrap(async (req, res) => {
  const code = String(req.params.code).toLowerCase(), b = req.body || {};
  if (!/^[a-z0-9-]{2,20}$/.test(code)) fail(400, 'Kode ujian hanya huruf kecil, angka, atau tanda minus (2–20 karakter)');
  const rgb = String(b.rgb || ''), parts = rgb.split(' ').map(Number);
  if (parts.length !== 3 || parts.some(n => !(n >= 0 && n <= 255))) fail(400, 'Warna tidak valid');
  const mix = t => parts.map(n => Math.round(t > 0 ? n + (255 - n) * t : n * (1 + t))).join(' ');
  const secs = (Array.isArray(b.sections) ? b.sections : []).map(s => ({ ...s, name: text(s.name, 80, 'Nama section'), official: String(s.official || '').slice(0, 60) || null }));
  const recommend = Object.fromEntries(['A2', 'B1', 'B2', 'C1'].map(k => [k, String(b.recommend?.[k] || '').slice(0, 500)]));
  if (!secs.length) fail(400, 'Minimal satu section');
  const used = new Set();
  for (const s of secs) {
    let id = /^[\w-]{1,30}$/.test(s.id || '') ? s.id : s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'section';
    while (used.has(id)) id += '-2';
    used.add(id); s.id = id;
  }
  const name = text(b.name, 80, 'Nama ujian');
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[{ sort }]] = await conn.query('SELECT COALESCE(MAX(sort), 0) + 1 sort FROM exams');
    await conn.query(`INSERT INTO exams (code, name, full_name, active, rgb, rgb_dark, rgb_soft, scale, rules, about, recommend, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?)
      ON DUPLICATE KEY UPDATE name = VALUES(name), full_name = VALUES(full_name), active = VALUES(active), rgb = VALUES(rgb), rgb_dark = VALUES(rgb_dark), rgb_soft = VALUES(rgb_soft),
        scale = VALUES(scale), about = VALUES(about), recommend = VALUES(recommend)`,
      [code, name, String(b.full || '').trim().slice(0, 120) || name, b.active ? 1 : 0, rgb, mix(-0.2), mix(0.93), String(b.scale || '').slice(0, 30), String(b.about || ''), J(recommend), sort]);
    const [old] = await conn.query('SELECT * FROM exam_sections WHERE exam_key = ?', [code]);
    await conn.query('DELETE FROM exam_sections WHERE exam_key = ?', [code]);
    await conn.query('INSERT INTO exam_sections (exam_key, id, name, short, icon, official, tutor, sort) VALUES ?', [secs.map((s, i) => {
      const prev = old.find(o => o.id === s.id);
      return [code, s.id, s.name, prev?.short || s.name.split(' ')[0], prev?.icon || (s.tutor ? 'pen-line' : 'book-open'), s.official, s.tutor ? 1 : 0, i];
    })]);
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  res.json((await loadExams())[code]);
}));

// ---------- Error ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }));
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.type === 'entity.too.large' ? 'File terlalu besar (maks. 25 MB)' : err.message });
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan di server' });
});

const port = +process.env.PORT || 3000;
app.listen(port, () => console.log(`EnglishOn berjalan di http://localhost:${port}`));
