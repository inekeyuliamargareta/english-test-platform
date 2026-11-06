const path = require('path'), fs = require('fs');
const express = require('express'), helmet = require('helmet'), cors = require('cors');
const jwt = require('jsonwebtoken'), bcrypt = require('bcryptjs');
const { pool } = require('./db');
const { scoreAttempt, isCorrect, isAnswered } = require('./scoring');
const { accessOf, FREE_PANELS, freeMockIds } = require('./access');

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET belum diisi di .env');
const PUBLIC = path.join(__dirname, '..', 'public');
const AUDIO_DIR = path.join(PUBLIC, 'uploads', 'audio');
const EBOOK_DIR = path.join(__dirname, '..', 'storage', 'ebooks');
const CONTACT = {
  name: process.env.CONTACT_NAME, address: process.env.CONTACT_ADDRESS, wa: process.env.CONTACT_WA,
  waLabel: process.env.CONTACT_WA_LABEL, hours: process.env.CONTACT_HOURS, instagram: process.env.CONTACT_INSTAGRAM || '',
};

const app = express();
// ponytail: CSP dimatikan karena Alpine (CDN) butuh eval & halaman memakai script inline. Aktifkan setelah pindah ke build Alpine CSP + Tailwind terkompilasi.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : false }));
app.use(express.json({ limit: '2mb' }));
// HTML & JS selalu dicek ulang ke server agar perubahan langsung terpakai setelah update
app.use(express.static(PUBLIC, { setHeaders(res, file) { if (/\.(html|js)$/.test(file)) res.setHeader('Cache-Control', 'no-cache'); } }));

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
const mapEbook = (e, full) => ({ id: e.id, exam: e.exam, title: e.title, desc: e.descr, access: e.access, size: e.size, cover: e.cover_url, hasFile: !!e.file, locked: e.access === 'paid' && !full });
const mapAttempt = a => ({ id: a.id, pkg: a.package_id, exam: a.exam, date: a.created_at, duration: a.duration, total: a.total == null ? null : +a.total, sections: a.result.sections, flags: a.flags, level: a.level_final || undefined });

async function loadExams() {
  const [exams, secs] = await Promise.all([q('SELECT * FROM exams ORDER BY sort, code'), q('SELECT * FROM exam_sections ORDER BY sort, id')]);
  return Object.fromEntries(exams.map(e => [e.code, {
    key: e.code, name: e.name, full: e.full_name, active: !!e.active, rgb: e.rgb, rgbDark: e.rgb_dark, rgbSoft: e.rgb_soft, scale: e.scale, rules: e.rules || [], about: e.about || '', recommend: e.recommend || {}, programIntro: e.program_intro || {},
    sections: secs.filter(s => s.exam_key === e.code).map(s => ({ id: s.id, name: s.name, short: s.short, icon: s.icon, official: s.official, tutor: !!s.tutor, office: !!s.office, note: s.note || '' })),
  }]));
}

// Paket + soal-soalnya (lengkap dengan kunci) untuk menilai dan me-review simulasi
async function packageContext(pkgId) {
  const [row] = await q('SELECT * FROM packages WHERE id = ?', [pkgId]);
  if (!row) fail(404, 'Test package not found');
  const pkg = mapPackage(row), E = (await loadExams())[pkg.exam], ids = pkg.sections.map(s => s[0]);
  // Mock test dengan soal sendiri memakai pool = id paket; paket lama tanpa soal sendiri memakai bank latihan
  const own = pkg.type !== 'placement' && (await q('SELECT 1 FROM questions WHERE pool = ? LIMIT 1', [pkg.id])).length;
  const pool = pkg.type === 'placement' ? 'placement' : own ? pkg.id : 'bank';
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
      [req.user] = await q('SELECT id, name, email, role, exam, targets, full_access, program, status, unlocks FROM users WHERE id = ?', [sub]);
    } catch { /* token kedaluwarsa / rusak → dianggap belum masuk */ }
  }
  next();
}));
const need = role => (req, res, next) => !req.user ? res.status(401).json({ error: 'Please sign in first' })
  : role && req.user.role !== role ? res.status(403).json({ error: 'Access denied' }) : next();

// Pengaturan umum (diubah dari englishone-backend) + akses panel siswa
async function settings() {
  const rows = await q('SELECT k, v FROM app_settings');
  return { free_panels: FREE_PANELS, placement_review: false, ...Object.fromEntries(rows.map(r => [r.k, r.v])) };
}
const userAccess = async u => accessOf(u, (await settings()).free_panels);
const LOCKED_MSG = 'This feature is not part of your account yet. Contact EnglishOn to unlock it.';
// Tolak jika tidak satu pun panel yang disebut terbuka untuk siswa ini
const panel = (...keys) => wrap(async (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Please sign in first' });
  const acc = await userAccess(req.user);
  if (!keys.some(k => acc.panels.includes(k))) fail(403, LOCKED_MSG);
  req.access = acc; next();
});
// Pertemuan yang boleh dibuka: program 20 = 20 pertemuan pertama tiap ujian (urutan admin)
function allowedChapters(chapters, program) {
  if (!program) return chapters;
  const n = {};
  return chapters.filter(c => !c.draft && (n[c.exam] = (n[c.exam] || 0) + 1) <= program);
}

app.post('/api/auth/register', wrap(async (req, res) => {
  const b = req.body || {}, email = String(b.email || '').trim().toLowerCase();
  const name = String(b.name ?? '').trim().slice(0, 120); if (!name) fail(400, 'Please enter your name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) fail(400, 'Please enter a valid email address');
  if (String(b.password || '').length < 8) fail(400, 'Password must be at least 8 characters');
  if (!(await loadExams())[b.exam]?.active) fail(400, 'Please choose an available program');
  const hash = await bcrypt.hash(String(b.password), 10);
  try {
    const r = await q('INSERT INTO users (name, email, phone, password_hash, exam) VALUES (?, ?, ?, ?, ?)', [name, email, String(b.phone || '').slice(0, 30) || null, hash, b.exam]);
    res.json({ token: sign(r.insertId) });
  } catch (e) { if (e.code === 'ER_DUP_ENTRY') fail(409, 'This email is already registered. Please sign in.'); throw e; }
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const b = req.body || {};
  const [u] = await q('SELECT id, password_hash FROM users WHERE email = ?', [String(b.email || '').trim().toLowerCase()]);
  if (!u || !(await bcrypt.compare(String(b.password || ''), u.password_hash))) fail(401, 'Incorrect email or password');
  res.json({ token: sign(u.id) });
}));

// ---------- Data awal halaman ----------
// Tanpa login: kontak & daftar ujian. Siswa: konten tanpa kunci jawaban. Admin: semua termasuk draft & kunci.
app.get('/api/bootstrap', wrap(async (req, res) => {
  const out = { contact: CONTACT, exams: await loadExams() }, u = req.user;
  if (!u) return res.json(out);
  const admin = u.role === 'admin';
  if (admin && req.query.lite) {
    const [chapters, passages, clips, packages, counts, ebooks] = await Promise.all([
      q('SELECT id, exam, section, title, descr, minutes, draft, JSON_LENGTH(subs) n FROM chapters ORDER BY sort, id'),
      q('SELECT id, title FROM passages ORDER BY title'), q('SELECT * FROM clips ORDER BY title'),
      q('SELECT * FROM packages ORDER BY sort, id'), questionCounts(), q('SELECT * FROM ebooks ORDER BY sort, created_at'),
    ]);
    out.user = { id: u.id, name: u.name, email: u.email, role: u.role, initials: initials(u.name), target: {}, access: { full: true, used: false } };
    out.chapters = chapters.map(c => ({ id: c.id, exam: c.exam, section: c.section, title: c.title, desc: c.descr, minutes: c.minutes, draft: !!c.draft, subsCount: c.n }));
    out.passages = Object.fromEntries(passages.map(p => [p.id, { title: p.title }]));
    out.clips = Object.fromEntries(clips.map(c => [c.id, mapClip(c)]));
    out.packages = packages.map(mapPackage);
    out.counts = counts;
    out.ebooks = ebooks.map(e => mapEbook(e, true));
    return res.json(out);
  }
  const acc = await userAccess(u), open = k => acc.panels.includes(k);
  const [allChapters, passages, clips, allQuestions, tasks, packages, progress, allAttempts, ebooks, faqs] = await Promise.all([
    q(`SELECT * FROM chapters ${admin ? '' : 'WHERE draft = 0'} ORDER BY sort, id`),
    q('SELECT * FROM passages'), q('SELECT * FROM clips'),
    q('SELECT * FROM questions ORDER BY sort, id'), q('SELECT * FROM writing_tasks ORDER BY task, id'),
    q('SELECT * FROM packages ORDER BY sort, id'),
    q('SELECT chapter_id, progress, updated_at FROM chapter_progress WHERE user_id = ?', [u.id]),
    q('SELECT * FROM attempts WHERE user_id = ? ORDER BY created_at DESC, id DESC', [u.id]),
    open('ebook') ? q('SELECT * FROM ebooks WHERE file IS NOT NULL ORDER BY sort, created_at') : [],
    q('SELECT id, question, answer FROM faqs ORDER BY sort, id'),
  ]);
  // Konten panel yang terkunci tidak dikirim; pertemuan dibatasi sesuai program siswa
  const chapters = open('materi') || open('skills') ? (admin ? allChapters : allowedChapters(allChapters, acc.program)) : [];
  const chIds = new Set(chapters.map(c => c.id)), freeMocks = freeMockIds(packages);
  const questions = allQuestions.filter(x => x.pool === 'placement' ? open('placement')
    // bank juga dipakai mock test lama yang belum punya soal sendiri (tanpa kunci jawaban)
    : x.pool === 'bank' ? open('simulasi') || ((open('materi') || open('skills')) && (!x.chapter || chIds.has(x.chapter)))
    : x.pool === 'skills' ? open('skills') && (!x.chapter || chIds.has(x.chapter))
    : open('simulasi') && (acc.paid || freeMocks.has(x.pool)));
  // Hasil placement yang masih menunggu review admin belum ditampilkan
  const attempts = allAttempts.filter(a => a.published);
  const prog = Object.fromEntries(progress.map(p => [p.chapter_id, p.progress]));
  out.user = {
    id: u.id, name: u.name, email: u.email, role: u.role, exam: u.exam, initials: initials(u.name),
    target: u.targets || {},
    access: { full: acc.paid, program: u.program || null, status: u.status, panels: acc.panels },
  };
  out.chapters = chapters.map(c => { const p = prog[c.id] || 0; return { ...mapChapter(c), progress: p, status: p >= 100 ? 'done' : p ? 'progress' : 'new' }; });
  out.passages = Object.fromEntries(passages.map(p => [p.id, { title: p.title, html: p.html }]));
  out.clips = Object.fromEntries(clips.map(c => [c.id, mapClip(c)]));
  out.questions = questions.map(x => mapQuestion(x, admin));
  out.writingTasks = open('simulasi') ? tasks.map(t => mapTask(t, admin)) : [];
  out.packages = packages.map(mapPackage);
  out.attempts = attempts.map(mapAttempt);
  out.pendingPlacements = allAttempts.filter(a => !a.published).map(a => ({ id: a.id, exam: a.exam, date: a.created_at }));
  out.ebooks = ebooks.map(e => mapEbook(e, acc.paid));
  out.faqs = faqs;
  // Aktivitas terbaru: gabungan simulasi & progres bab
  const pkgName = id => packages.find(p => p.id === id)?.name || id, ch = id => chapters.find(c => c.id === id);
  function isPlacement(id) { return packages.find(p => p.id === id)?.type === 'placement'; }
  out.activity = [
    ...attempts.map(a => isPlacement(a.package_id)
      ? { exam: a.exam, icon: 'gauge', text: `Took the <b>${esc(pkgName(a.package_id))}</b> — ${+a.total}% correct`, at: a.created_at }
      : { exam: a.exam, icon: 'timer', text: `Mock test <b>${esc(pkgName(a.package_id))}</b>${a.total == null ? '' : ' — score ' + +a.total}`, at: a.created_at }),
    ...progress.filter(p => ch(p.chapter_id)).map(p => ({ exam: ch(p.chapter_id).exam, icon: p.progress >= 100 ? 'check-circle' : 'book-open', text: `${p.progress >= 100 ? 'Completed' : 'Studied'} chapter <b>${esc(ch(p.chapter_id).title)}</b>`, at: p.updated_at })),
  ].sort((a, b) => b.at - a.at).slice(0, 30);
  res.json(out);
}));

// ---------- Siswa ----------
// Target skor diisi siswa sendiri, per program, dalam skala program itu
app.put('/api/me/target', need(), wrap(async (req, res) => {
  const exam = String(req.body?.exam || ''), raw = req.body?.target, v = raw === null || raw === '' ? null : Number(raw);
  if (!(await loadExams())[exam]) fail(400, 'Unknown program');
  if (v !== null) {
    const ok = exam === 'toefl' ? Number.isInteger(v) && v >= 310 && v <= 677
      : exam === 'ielts' ? v >= 1 && v <= 9 && Number.isInteger(v * 2)
      : v >= 0 && v <= 1000;
    if (!ok) fail(400, exam === 'toefl' ? 'TOEFL ITP target must be a whole number between 310 and 677' : exam === 'ielts' ? 'IELTS target must be a band from 1 to 9 (e.g. 6.5)' : 'Please enter a valid target score');
  }
  const [{ targets }] = await q('SELECT targets FROM users WHERE id = ?', [req.user.id]);
  const next = { ...(targets || {}) };
  if (v === null) delete next[exam]; else next[exam] = v;
  await q('UPDATE users SET targets = ? WHERE id = ?', [J(next), req.user.id]);
  res.json({ target: next });
}));
app.put('/api/progress/:chapterId', panel('materi'), wrap(async (req, res) => {
  const p = Math.max(0, Math.min(100, Math.round(+req.body?.progress || 0)));
  const [c] = await q('SELECT id FROM chapters WHERE id = ?', [req.params.chapterId]);
  if (!c) fail(404, 'Chapter not found');
  // Progres tidak pernah turun (membuka ulang bab tidak mereset)
  await q(`INSERT INTO chapter_progress (user_id, chapter_id, progress) VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE progress = GREATEST(progress, VALUES(progress))`, [req.user.id, c.id, p]);
  res.json({ ok: true });
}));

// Latihan bab & latihan per skill: kunci & pembahasan dikirim setelah siswa menjawab.
// ponytail: soal latihan dan simulasi memakai bank soal yang sama; pisahkan jika kunci simulasi harus benar-benar rahasia.
app.post('/api/questions/:id/check', panel('materi', 'skills'), wrap(async (req, res) => {
  const [r] = await q("SELECT type, answer, explanation FROM questions WHERE id = ? AND pool IN ('bank', 'skills')", [req.params.id]);
  if (!r) fail(404, 'Question not found');
  res.json({ correct: isCorrect(r, req.body?.answer), answer: r.answer, explain: r.explanation });
}));
// Skills: satu set dikumpulkan sekaligus → kunci & pembahasan semua soal dikirim di akhir
app.post('/api/questions/check', panel('skills'), wrap(async (req, res) => {
  const answers = req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {}, ids = Object.keys(answers).slice(0, 500);
  if (!ids.length) fail(400, 'No answers to check');
  const rows = await q("SELECT id, type, answer, explanation FROM questions WHERE id IN (?) AND pool IN ('bank', 'skills')", [ids]);
  res.json(Object.fromEntries(rows.map(r => [r.id, { correct: isCorrect(r, answers[r.id]), answer: r.answer, explain: r.explanation }])));
}));

app.post('/api/attempts', need(), wrap(async (req, res) => {
  const u = req.user, b = req.body || {};
  const { pkg, E, meta, items } = await packageContext(b.pkg);
  const placement = pkg.type === 'placement'; // placement test bebas dicoba, termasuk program yang belum aktif
  const acc = await userAccess(u);
  if (!acc.panels.includes(placement ? 'placement' : 'simulasi')) fail(403, LOCKED_MSG);
  // Belum berbayar: hanya mock test pertama di tiap tab (Full, Listening only, …)
  if (!placement && !acc.paid && !freeMockIds(await q('SELECT * FROM packages ORDER BY sort, id')).has(pkg.id)) fail(403, 'Only Mock Test 1 is free. ' + LOCKED_MSG);
  // Satu siswa = satu program
  if (u.role !== 'admin' && u.exam && pkg.exam !== u.exam) fail(403, 'This test is not part of your program.');
  if (!E || (!E.active && !placement)) fail(400, 'This program is not available yet');
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

  // Placement menunggu review admin jika pengaturan placement_review aktif
  const published = placement && u.role !== 'admin' && (await settings()).placement_review ? 0 : 1;
  const r = await q('INSERT INTO attempts (user_id, package_id, exam, answers, flags, duration, result, total, published) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [u.id, pkg.id, pkg.exam, J(answers), J(flags), duration, J(result), result.total, published]);
  res.json({ id: r.insertId, pending: !published });
}));

// Review: soal + kunci + pembahasan + jawaban siswa
app.get('/api/attempts/:id', need(), wrap(async (req, res) => {
  const [a] = await q('SELECT * FROM attempts WHERE id = ?', [+req.params.id || 0]);
  if (!a || (a.user_id !== req.user.id && req.user.role !== 'admin')) fail(404, 'Test result not found');
  const { pkg, meta, items } = await packageContext(a.package_id);
  if (req.user.role !== 'admin') {
    if (!a.published) fail(403, 'Your result is being reviewed by EnglishOn. It will appear here soon.');
    const acc = await userAccess(req.user);
    if (!acc.panels.includes(pkg.type === 'placement' ? 'placement' : 'hasil')) fail(403, LOCKED_MSG);
  }
  const list = pkg.sections.flatMap(([sid]) => items(sid).map(it => {
    const user = a.answers[it.id], kind = meta(sid)?.tutor ? 'writing' : 'q', blank = !isAnswered(user);
    return { ...it, kind, section: sid, user, blank, ok: kind === 'q' && !blank && isCorrect(it, user) };
  }));
  res.json({ attempt: mapAttempt(a), items: list });
}));

// ---------- Admin ----------
const admin = need('admin');

// Jumlah soal per program/section/penggunaan/bab, untuk angka di menu admin
const questionCounts = () => q('SELECT exam, section, pool, chapter, COUNT(*) n FROM questions GROUP BY exam, section, pool, chapter');
app.get('/api/admin/counts', admin, wrap(async (req, res) => res.json(await questionCounts())));

const page = req => { const limit = Math.min(5000, Math.max(1, +req.query.limit || 20)), p = Math.max(1, +req.query.page || 1); return { limit, page: p, offset: (p - 1) * limit }; };
const like = v => `%${String(v).replace(/[\\%_]/g, '\\$&')}%`;

// Siswa per program, per halaman. Siswa masuk sebuah program jika memilihnya saat daftar atau pernah tes di program itu.
app.get('/api/admin/students', admin, wrap(async (req, res) => {
  const { limit, page: p, offset } = page(req), exam = String(req.query.exam || ''), where = ["u.role = 'student'"], args = [];
  if (exam) { where.push('(u.exam = ? OR EXISTS (SELECT 1 FROM attempts a WHERE a.user_id = u.id AND a.exam = ?))'); args.push(exam, exam); }
  if (req.query.q) { where.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)'); args.push(like(req.query.q), like(req.query.q), like(req.query.q)); }
  const w = 'WHERE ' + where.join(' AND ');
  const [[{ total }], users] = await Promise.all([
    q(`SELECT COUNT(*) total FROM users u ${w}`, args),
    q(`SELECT u.id, u.name, u.email, u.phone, u.exam, u.full_access, u.created_at FROM users u ${w} ORDER BY u.created_at DESC, u.id DESC LIMIT ? OFFSET ?`, [...args, limit, offset]),
  ]);
  if (!users.length) return res.json({ total, page: p, limit, rows: [] });
  const ids = users.map(u => u.id);
  const [attempts, sums, counts] = await Promise.all([
    q("SELECT a.id, a.user_id, a.exam, a.package_id, a.total, a.result, a.created_at, p.type = 'placement' placement FROM attempts a LEFT JOIN packages p ON p.id = a.package_id WHERE a.user_id IN (?) ORDER BY a.created_at DESC, a.id DESC", [ids]),
    q('SELECT p.user_id, c.exam, SUM(p.progress) s FROM chapter_progress p JOIN chapters c ON c.id = p.chapter_id AND c.draft = 0 WHERE p.user_id IN (?) GROUP BY p.user_id, c.exam', [ids]),
    q('SELECT exam, COUNT(*) n FROM chapters WHERE draft = 0 GROUP BY exam'),
  ]);
  // Skor utama: total Full Test, atau skor section pertama untuk tes per section
  const score = a => a.total != null ? +a.total : a.result.sections.find(x => x.score != null)?.score ?? null;
  res.json({ total, page: p, limit, rows: users.map(u => {
    const ex = exam || u.exam, all = attempts.filter(a => a.user_id === u.id && (!exam || a.exam === exam));
    const mine = all.filter(a => !a.placement), pl = all.find(a => a.placement);
    const n = counts.find(c => c.exam === ex)?.n || 0, sum = +(sums.find(x => x.user_id === u.id && x.exam === ex)?.s || 0);
    return {
      id: u.id, name: u.name, email: u.email, phone: u.phone, exam: u.exam, full: !!u.full_access, joined: u.created_at,
      tests: mine.length, last: mine.length ? score(mine[0]) : null, lastExam: mine[0]?.exam,
      progress: n ? Math.round(sum / n) : 0,
      placement: pl ? { exam: pl.exam, percent: +pl.total, date: pl.created_at } : null,
      history: all.slice(0, 6).map(a => ({ id: a.id, date: a.created_at, exam: a.exam, pkg: a.package_id, score: score(a), placement: !!a.placement })),
    };
  }) });
}));

// Soal per program/section, per halaman (terbaru di atas)
app.get('/api/admin/questions', admin, wrap(async (req, res) => {
  const { limit, page: p, offset } = page(req), where = [], args = [];
  for (const k of ['exam', 'section', 'pool']) if (req.query[k]) { where.push(`${k} = ?`); args.push(String(req.query[k])); }
  if (req.query.q) { where.push('(q LIKE ? OR topic LIKE ? OR id LIKE ?)'); args.push(like(req.query.q), like(req.query.q), like(req.query.q)); }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const [[{ total }], rows, topics] = await Promise.all([
    q(`SELECT COUNT(*) total FROM questions ${w}`, args),
    q(`SELECT * FROM questions ${w} ORDER BY sort DESC, id LIMIT ? OFFSET ?`, [...args, limit, offset]),
    req.query.exam ? q("SELECT DISTINCT topic FROM questions WHERE exam = ? AND topic <> '' ORDER BY topic", [String(req.query.exam)]) : [],
  ]);
  res.json({ total, page: p, limit, rows: rows.map(r => mapQuestion(r, true)), topics: topics.map(t => t.topic) });
}));

// Urutan pertemuan (bab) dalam satu program: ids sesuai urutan baru → Pertemuan 1, 2, 3, …
app.put('/api/admin/chapter-order', admin, wrap(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
  if (!ids.length || ids.length > 1000 || new Set(ids).size !== ids.length) fail(400, 'Urutan tidak valid');
  const [{ n }] = await q('SELECT COUNT(*) n FROM chapters WHERE id IN (?)', [ids]);
  if (n !== ids.length) fail(400, 'Sebagian pertemuan tidak ditemukan. Muat ulang halaman lalu coba lagi.');
  await q(`UPDATE chapters SET sort = CASE id ${ids.map(() => 'WHEN ? THEN ?').join(' ')} END WHERE id IN (?)`, [...ids.flatMap((id, i) => [id, i]), ids]);
  res.json({ ok: true });
}));

app.get('/api/admin/chapters/:id', admin, wrap(async (req, res) => {
  const [c] = await q('SELECT * FROM chapters WHERE id = ?', [req.params.id]);
  if (!c) fail(404, 'Bab tidak ditemukan');
  res.json(mapChapter(c));
}));

// Ubah akses penuh dan/atau program siswa
app.patch('/api/admin/students/:id', admin, wrap(async (req, res) => {
  const b = req.body || {}, sets = [], args = [];
  if ('full' in b) { sets.push('full_access = ?'); args.push(b.full ? 1 : 0); }
  if ('exam' in b) { if (!(await loadExams())[b.exam]) fail(400, 'Program tidak valid'); sets.push('exam = ?'); args.push(b.exam); }
  if (!sets.length) fail(400, 'Tidak ada perubahan');
  const r = await q(`UPDATE users SET ${sets.join(', ')} WHERE id = ? AND role = 'student'`, [...args, +req.params.id || 0]);
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
  const E = refs.exams[b.exam];
  if (!E) fail(400, `Program "${b.exam ?? ''}" tidak ada`);
  const pool = b.pool || 'bank';
  if (!['bank', 'skills', 'placement'].includes(pool) && refs.mocks.get(pool) !== b.exam) fail(400, `Kolom "untuk" harus latihan, skills, placement, atau mock test program ${E.name}`);
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
  return [b.exam, b.section, ['bank', 'skills'].includes(pool) ? ref(b.chapter, refs.chapters, 'Bab') : null, String(b.topic || '').slice(0, 80), b.difficulty, b.type, text(b.q, 5000, 'Pertanyaan'),
    b.instr ? String(b.instr).slice(0, 255) : null, J(options), J(answer), String(b.explain || ''), ref(b.clip, refs.clips, 'Audio'), ref(b.passage, refs.passages, 'Passage'), pool];
}
async function questionRefs() {
  const [exams, ch, ps, cl, pk] = await Promise.all([loadExams(), q('SELECT id FROM chapters'), q('SELECT id FROM passages'), q('SELECT id FROM clips'), q("SELECT id, exam FROM packages WHERE type <> 'placement'")]);
  const ids = rows => new Set(rows.map(r => r.id));
  return { exams, chapters: ids(ch), passages: ids(ps), clips: ids(cl), mocks: new Map(pk.map(p => [p.id, p.exam])) };
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

// Mock test: semua section online = full test, sebagian = per section (mis. Listening 2)
app.put('/api/admin/packages/:id', admin, wrap(async (req, res) => {
  const id = req.params.id, b = req.body || {}; validId(id);
  const E = (await loadExams())[b.exam];
  if (!E) fail(400, 'Program tidak valid');
  const [old] = await q('SELECT exam, type FROM packages WHERE id = ?', [id]);
  if (old && (old.type === 'placement' || old.exam !== b.exam)) fail(400, 'Paket ini tidak bisa diubah di sini');
  const online = E.sections.filter(s => !s.office).map(s => s.id), picked = Array.isArray(b.sections) ? b.sections : [];
  const sections = online.map(s => picked.find(p => Array.isArray(p) && p[0] === s)).filter(Boolean).map(([s, m]) => [s, Math.round(Number(m))]);
  if (!sections.length) fail(400, 'Pilih minimal satu section');
  if (sections.some(([, m]) => !(m >= 1 && m <= 300))) fail(400, 'Waktu tiap section 1–300 menit');
  const type = sections.length === online.length ? 'full' : 'section';
  const [{ sort }] = await q('SELECT COALESCE(MAX(sort), 0) + 1 sort FROM packages');
  await q(`INSERT INTO packages (id, exam, name, type, badge, descr, sections, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), badge = VALUES(badge), descr = VALUES(descr), sections = VALUES(sections)`,
    [id, b.exam, text(b.name, 120, 'Nama mock test'), type, String(b.badge || '').trim().slice(0, 40) || null, String(b.desc || '').slice(0, 1000), J(sections), sort]);
  const [p] = await q('SELECT * FROM packages WHERE id = ?', [id]);
  res.json(mapPackage(p));
}));

app.delete('/api/admin/packages/:id', admin, wrap(async (req, res) => {
  const id = req.params.id, [p] = await q('SELECT type FROM packages WHERE id = ?', [id]);
  if (!p) fail(404, 'Mock test tidak ditemukan');
  if (p.type === 'placement') fail(400, 'Placement test tidak bisa dihapus di sini');
  const [[{ a }], [{ n }]] = await Promise.all([q('SELECT COUNT(*) a FROM attempts WHERE package_id = ?', [id]), q('SELECT COUNT(*) n FROM questions WHERE pool = ?', [id])]);
  if (a) fail(400, `Sudah dikerjakan ${a}× oleh siswa, jadi tidak bisa dihapus (riwayat nilainya tetap dibutuhkan)`);
  if (n) fail(400, `Masih ada ${n} soal di mock test ini. Hapus atau pindahkan soalnya dulu`);
  await q('DELETE FROM packages WHERE id = ?', [id]);
  res.json({ ok: true });
}));

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
  const secs = (Array.isArray(b.sections) ? b.sections : []).map(s => ({ ...s, name: text(s.name, 80, 'Nama section'), official: String(s.official || '').slice(0, 60) || null,
    office: !!s.office, tutor: !s.office && !!s.tutor, note: String(s.note || '').slice(0, 2000) || null }));
  // Track per level: nama, target, poin, batas % benar placement (min) dan perkiraan skor (range)
  const DEF_MIN = { A1: 0, A2: 15, 'A2+': 22, B1: 30, 'B1+': 42, B2: 55, C1: 80 }, CODES = Object.keys(DEF_MIN);
  const [prev] = await q('SELECT recommend FROM exams WHERE code = ?', [code]);
  const recommend = Object.fromEntries(CODES.map(k => {
    const t = b.recommend?.[k] || prev?.recommend?.[k] || {}, min = k === 'A1' ? 0 : Math.round(Number(t.min ?? DEF_MIN[k]));
    return [k, { name: String(t.name || '').slice(0, 80), target: String(t.target || '').slice(0, 40), desc: String(t.desc || '').slice(0, 1000), min, range: String(t.range || '').slice(0, 60) }];
  }));
  const mins = CODES.map(k => recommend[k].min);
  if (mins.some((m, i) => !(m >= 0 && m <= 100) || (i && m <= mins[i - 1]))) fail(400, 'Batas level harus naik: A1 < A2 < A2+ < B1 < B1+ < B2 < C1 (0–100%)');
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
    await conn.query('INSERT INTO exam_sections (exam_key, id, name, short, icon, official, tutor, office, note, sort) VALUES ?', [secs.map((s, i) => {
      const prev = old.find(o => o.id === s.id);
      return [code, s.id, s.name, prev?.short || s.name.split(' ')[0], prev?.icon || (s.office ? 'mic' : s.tutor ? 'pen-line' : 'book-open'), s.official, s.tutor ? 1 : 0, s.office ? 1 : 0, s.note, i];
    })]);
    await conn.commit();
  } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
  res.json((await loadExams())[code]);
}));

// ---------- Ebook ----------
// Siswa membuka file lewat API (bukan URL publik), agar ebook berbayar tidak bisa dibagikan sembarangan.
app.get('/api/ebooks/:id/file', panel('ebook'), wrap(async (req, res) => {
  const [e] = await q('SELECT * FROM ebooks WHERE id = ?', [req.params.id]);
  if (!e || !e.file) fail(404, 'Ebook not found');
  if (e.access === 'paid' && !req.access.paid) fail(403, 'This ebook is for students with full access. Contact EnglishOn to unlock it.');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${e.title.replace(/[^\w .-]+/g, '').slice(0, 80) || 'ebook'}.pdf"`);
  res.sendFile(path.join(EBOOK_DIR, e.file));
}));

app.put('/api/admin/ebooks/:id', admin, wrap(async (req, res) => {
  const id = req.params.id, b = req.body || {}; validId(id);
  if (!(await loadExams())[b.exam]) fail(400, 'Program tidak valid');
  const [{ sort }] = await q('SELECT COALESCE(MAX(sort), 0) + 1 sort FROM ebooks');
  await q(`INSERT INTO ebooks (id, exam, title, descr, access, sort) VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE title = VALUES(title), descr = VALUES(descr), access = VALUES(access)`,
    [id, b.exam, text(b.title, 160, 'Judul ebook'), String(b.desc || '').slice(0, 1000), b.access === 'paid' ? 'paid' : 'free', sort]);
  const [e] = await q('SELECT * FROM ebooks WHERE id = ?', [id]);
  res.json(mapEbook(e, true));
}));

app.put('/api/admin/ebooks/:id/file', admin, express.raw({ type: 'application/pdf', limit: '50mb' }), wrap(async (req, res) => {
  const id = req.params.id; validId(id);
  if (!Buffer.isBuffer(req.body) || req.body.subarray(0, 5).toString() !== '%PDF-') fail(400, 'File harus PDF');
  const [e] = await q('SELECT file FROM ebooks WHERE id = ?', [id]);
  if (!e) fail(404, 'Ebook tidak ditemukan');
  fs.mkdirSync(EBOOK_DIR, { recursive: true });
  const file = `${id}-${Date.now()}.pdf`;
  fs.writeFileSync(path.join(EBOOK_DIR, file), req.body);
  await q('UPDATE ebooks SET file = ?, size = ? WHERE id = ?', [file, req.body.length, id]);
  if (e.file) fs.rm(path.join(EBOOK_DIR, e.file), { force: true }, () => {});
  res.json({ size: req.body.length });
}));

app.delete('/api/admin/ebooks/:id', admin, wrap(async (req, res) => {
  const [e] = await q('SELECT file FROM ebooks WHERE id = ?', [req.params.id]);
  if (!e) fail(404, 'Ebook tidak ditemukan');
  await q('DELETE FROM ebooks WHERE id = ?', [req.params.id]);
  if (e.file) fs.rm(path.join(EBOOK_DIR, e.file), { force: true }, () => {});
  res.json({ ok: true });
}));

// ---------- Error ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }));
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.type === 'entity.too.large' ? 'File terlalu besar (audio maks. 25 MB, ebook maks. 50 MB)' : err.message });
  console.error(err);
  res.status(500).json({ error: 'Server error, please try again' });
});

const port = +process.env.PORT || 3000;
app.listen(port, () => console.log(`EnglishOn berjalan di http://localhost:${port}`));
