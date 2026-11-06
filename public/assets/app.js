// Shared: API, tema, layout (navbar + sidebar), helper soal & skor. Dimuat di <head> setiap halaman.
// Alur: ambil /api/bootstrap → isi DB → baru jalankan Alpine, jadi halaman bisa membaca DB secara langsung.

// ---------- API ----------
let DB = {};
const token = () => { try { return localStorage.getItem('token'); } catch { return null; } };
function logout() { try { localStorage.removeItem('token'); } catch {} location.href = 'login.html'; }
async function api(method, url, body) {
  const file = body instanceof Blob, headers = {};
  if (token()) headers.Authorization = 'Bearer ' + token();
  if (body !== undefined) headers['Content-Type'] = file ? body.type : 'application/json';
  const r = await fetch('/api' + url, { method, headers, body: file ? body : body === undefined ? undefined : JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401 && needsLogin()) return logout();
  if (!r.ok) throw new Error(data.error || 'Could not connect to the server');
  return data;
}
const needsLogin = () => !!(document.body.dataset.shell || document.body.dataset.auth);

const ALPINE = 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js';
document.head.insertAdjacentHTML('beforeend', `<link rel="preload" as="script" href="${ALPINE}"><link rel="icon" type="image/png" href="logo.png">`); // unduh paralel dengan /api/bootstrap
document.addEventListener('DOMContentLoaded', async () => {
  if (needsLogin() && !token()) return location.replace('login.html');
  try { DB = await api('GET', '/bootstrap' + (document.body.dataset.shell === 'admin' ? '?lite=1' : '')); }
  catch (e) { showPage(); document.body.innerHTML = `<p style="padding:2rem;text-align:center;font-family:sans-serif">Cannot reach the server. Please reload the page.<br><small>${e.message}</small></p>`; return; }
  if (needsLogin() && !DB.user) return logout();
  if (document.body.dataset.shell === 'admin' && DB.user.role !== 'admin') return location.replace('dashboard.html');
  document.documentElement.dataset.exam = getExam();
  document.head.insertAdjacentHTML('beforeend', `<style>${Object.values(DB.exams).map((e, i) => `${i ? `:root[data-exam="${e.key}"]` : ':root'} { --accent: ${e.rgb}; --accent-dark: ${e.rgbDark}; --accent-soft: ${e.rgbSoft}; }`).join('\n')}</style>`);
  const s = document.createElement('script');
  s.src = ALPINE; // Alpine langsung start setelah dimuat
  document.head.append(s);
});

// ---------- Ujian aktif (dari master ujian DB.exams) ----------
const activeExams = () => Object.values(DB.exams).filter(e => e.active);
const isActiveExam = k => !!DB.exams[k]?.active;
function getExam() {
  if (DB.user && DB.user.role !== 'admin' && DB.exams[DB.user.exam]) return DB.user.exam;
  const p = new URLSearchParams(location.search).get('exam');
  if (isActiveExam(p)) { try { localStorage.setItem('exam', p); } catch {} return p; }
  let k; try { k = localStorage.getItem('exam'); } catch {}
  return isActiveExam(k) ? k : isActiveExam(DB.user?.exam) ? DB.user.exam : activeExams()[0].key;
}
function setExam(k) { if (!isActiveExam(k)) return; try { localStorage.setItem('exam', k); } catch {} location.href = location.pathname; }

// ---------- Akses akun ----------
// Siswa berbayar = punya program 20/30/40 dan status aktif (diatur admin). Akun gratis hanya membuka
// panel tertentu (default: About, Placement, Consultation). Daftar panel terbuka dihitung server; server juga menolak aksesnya.
const access = {
  get full() { return !!DB.user?.access.full; },
  get program() { return DB.user?.access.program || null; },
  get inactive() { return DB.user?.access.status === 'tidak_aktif'; },
  can: k => !DB.user?.access.panels || DB.user.access.panels.includes(k),
  get locked() { return !this.can('simulasi'); },
};
const waLink = msg => `https://wa.me/${DB.contact.wa}?text=${encodeURIComponent(msg)}`;
// Kartu "fitur terkunci" untuk panel yang belum dibuka (render via x-html / innerHTML)
const lockedHTML = (title = 'This feature is locked') => `
  <div class="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-soft sm:p-10">
    <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600"><i data-lucide="lock" class="h-8 w-8"></i></span>
    <h2 class="mt-5 text-xl font-bold sm:text-2xl">${title}</h2>
    <p class="mt-2 text-slate-500">${access.inactive ? 'Your program has ended, so this feature is no longer available.' : 'This feature is available for students enrolled in an EnglishOn program.'} Visit our office or contact ${DB.contact.name} to join a program.</p>
    <div class="mt-6">
      <a href="${joinLink('I would like to join a program and unlock the learning features.')}" target="_blank" class="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"><i data-lucide="message-circle" class="h-4 w-4"></i>Contact us on WhatsApp</a>
    </div>
    <div class="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-600">
      <i data-lucide="map-pin" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"></i>
      <div><p class="font-semibold text-slate-800">${DB.contact.name}</p><p>${DB.contact.address}</p><p class="text-xs text-slate-500">${DB.contact.hours} · WA ${DB.contact.waLabel}</p></div>
    </div>
  </div>`;


document.head.insertAdjacentHTML('beforeend', `<style>
  :root { --accent: 37 99 235; --accent-dark: 29 78 216; --accent-soft: 239 246 255; }
  html { -webkit-font-smoothing: antialiased; }
  body { background: #f8fafc; color: #0f172a; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  [x-cloak] { display: none !important; }
  body:not(.ready) > :not(#ghost) { visibility: hidden; } /* tampil sekaligus setelah data, sidebar & ikon siap (tanpa kedip) */
  body.ready main, main > section[x-show] { animation: fadein .18s ease-out; } /* konten baru & ganti tab admin muncul halus */
  @keyframes fadein { from { opacity: 0; transform: translateY(4px); } }
  @media (prefers-reduced-motion: reduce) { body.ready main, main > section[x-show] { animation: none; } }
  .skel { background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%); background-size: 200% 100%; animation: skel 1.2s infinite; border-radius: .5rem; }
  @keyframes skel { to { background-position: -200% 0; } }
  .thin-scroll::-webkit-scrollbar { width: 8px; height: 8px; } .thin-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
  .content { line-height: 1.75; color: #334155; }
  .content p { margin: .75rem 0; } .content ol { list-style: decimal; padding-left: 1.25rem; } .content ul { list-style: disc; padding-left: 1.25rem; } .content li { margin: .25rem 0; }
  .content h3 { margin: 1.25rem 0 .5rem; font-size: 1.1rem; font-weight: 700; color: #0f172a; } .content b, .content strong { font-weight: 700; color: #0f172a; }
  .content table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: .9rem; display: block; overflow-x: auto; }
  .content th { background: #f1f5f9; text-align: left; font-weight: 600; color: #0f172a; }
  .content th, .content td { padding: .6rem .8rem; border: 1px solid #e2e8f0; }
  .content .c-ex, .content .c-tip, .content .c-warn { border-radius: .75rem; padding: .9rem 1rem; margin: 1rem 0; font-size: .925rem; }
  .content .c-ex { background: #f8fafc; border: 1px solid #e2e8f0; }
  .content .c-tip { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
  .content .c-warn { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; }
  .passage p { margin-bottom: 1rem; } .passage mark { background: #fef08a; padding: 0 2px; border-radius: 3px; }
  .stem u { text-decoration-thickness: 2px; text-underline-offset: 4px; } .stem sup { font-weight: 700; color: rgb(var(--accent)); margin: 0 2px 0 1px; }
</style>`);

// ---------- Helper ----------
const qs = k => new URLSearchParams(location.search).get(k);
const fmtSize = n => !n ? '—' : n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
// HTML dari editor admin (englishone-backend): buang script/iframe, atribut on*, dan link javascript:
function cleanHTML(html) {
  const doc = new DOMParser().parseFromString(String(html || ''), 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,form,link,meta').forEach(n => n.remove());
  doc.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => {
    if (/^on/i.test(a.name) || (/^(href|src|xlink:href)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) n.removeAttribute(a.name);
  }));
  return doc.body.innerHTML;
}
// Kolom passage Reading (kiri), dipakai bersama oleh test (placement & mock test) dan Skills
const passageHTML = id => { const p = DB.passages[id]; return !p ? '' : `<p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Reading Passage</p>
  <h2 class="mt-1 text-xl font-bold">${esc(p.title)}</h2><div class="passage mt-4 text-[15px] leading-8 text-slate-700">${p.html}</div>`; };
// Halaman siswa berbahasa Inggris, panel admin berbahasa Indonesia
const isEN = () => document.body?.dataset.shell !== 'admin';
const fmtDate = (d, style = 'medium') => new Date(d).toLocaleDateString(isEN() ? 'en-GB' : 'id-ID', { dateStyle: style });
// "3 hours ago" / "3 jam lalu", lalu tanggal
function ago(d) {
  const s = (Date.now() - new Date(d)) / 1000, en = isEN();
  const n = (v, unit, id) => en ? `${v} ${unit}${v === 1 ? '' : 's'} ago` : `${v} ${id} lalu`;
  if (s < 3600) return n(Math.max(1, Math.round(s / 60)), 'minute', 'menit');
  if (s < 86400) return n(Math.round(s / 3600), 'hour', 'jam');
  if (s < 7 * 86400) return n(Math.round(s / 86400), 'day', 'hari');
  return new Date(d).toLocaleDateString(en ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
// Keterangan section hasil tes (data lama tersimpan dalam bahasa Indonesia)
const sectionDetail = s => s.pending ? String(s.detail || '').replace(/kata/g, 'words') : `${s.correct} of ${s.total} correct`;
const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const L = i => 'ABCDEFG'[i];
// Ikon yang namanya bisa berubah: pakai x-html="ico(...)" (Lucide mengganti <i> dengan <svg> sekali saja)
const ico = (name, cls = 'h-4 w-4') => `<i data-lucide="${name}" class="${cls}"></i>`;
const words = s => ((s || '').trim().match(/\S+/g) || []).length;
const examStyle = k => `background-color: rgb(${DB.exams[k]?.rgb || '100 116 139'})`; // warna badge ujian
const sectionMeta =(exam, id) => DB.exams[exam].sections.find(s => s.id === id);
const chapterById = id => DB.chapters.find(c => c.id === id);
// Kurikulum: setiap bab terbit = satu pertemuan, urut sesuai pengaturan admin (Meeting 1, 2, 3, …)
const meetings = exam => DB.chapters.filter(c => c.exam === exam && !c.draft);
const meetingNo = c => meetings(c.exam).findIndex(x => x.id === c.id) + 1;
const questionById = id => DB.questions.find(q => q.id === id);
const statusLabel = { done: 'Completed', progress: 'In progress', new: 'Not started' };
const diffClass = { mudah: 'bg-emerald-50 text-emerald-700', sedang: 'bg-amber-50 text-amber-700', sulit: 'bg-rose-50 text-rose-700' };

// Soal tipe "error": {kata} → digarisbawahi + huruf A-D
function stemHTML(q) {
  let i = 0;
  return q.q.replace(/\{(.+?)\}/g, (_, t) => `<u>${t}</u><sup>${L(i++)}</sup>`).replace(/_{3,}/g, '<span class="inline-block w-16 border-b-2 border-slate-400 align-baseline"></span>');
}
const norm = s => String(s ?? '').trim().toLowerCase();
const isAnswered = (item, a) => a !== undefined && a !== null && String(a).trim() !== '';
const isCorrect = (q, a) => q.type === 'fill' ? q.answer.includes(norm(a)) : a === q.answer;
const correctText = q => q.type === 'fill' ? q.answer[0] : `${L(q.answer)}. ${q.options[q.answer]}`;

// Item per section untuk halaman test: soal pilihan ganda/isian atau task writing (section dinilai tutor)
// pool: 'bank' = soal latihan Skills, 'placement' = soal placement test, id paket = soal khusus mock test itu
// Soal yang dipakai sebuah paket: soalnya sendiri, atau bank latihan untuk paket lama yang belum punya soal sendiri
const pkgPool = p => p.type === 'placement' ? 'placement' : DB.questions?.some(q => q.pool === p.id) ? p.id : 'bank';
function sectionItems(exam, sec, pool = 'bank') {
  if (sectionMeta(exam, sec)?.tutor) return DB.writingTasks.filter(t => t.exam === exam && t.section === sec).map(t => ({ ...t, kind: 'writing' }));
  return DB.questions.filter(q => q.exam === exam && q.section === sec && (q.pool || 'bank') === pool).map(q => ({ ...q, kind: 'q' }));
}

// Putar audio Listening. Pakai file MP3 jika admin sudah mengunggah; jika belum, transkrip dibacakan
// text-to-speech browser (mode demo). onend dipanggil sekali saat selesai; ondur saat durasi file diketahui.
function playClip(clip, onend, ondur) {
  let done = false; const finish = () => { if (!done) { done = true; onend && onend(); } };
  const est = clip.lines.reduce((n, l) => n + words(l[1]), 0) / 2.4 + clip.lines.length * .6;
  if (clip.audio) {
    const a = new Audio(clip.audio);
    a.onloadedmetadata = () => ondur && ondur(a.duration);
    a.onended = a.onerror = finish;
    a.play().catch(finish);
    playClip.current = a;
    return est;
  }
  const synth = window.speechSynthesis;
  setTimeout(finish, (est * 1.5 + 3) * 1000); // cadangan jika TTS tidak tersedia / gagal
  if (synth) {
    synth.cancel();
    const voices = synth.getVoices().filter(v => v.lang.startsWith('en'));
    const who = [...new Set(clip.lines.map(l => l[0]))];
    clip.lines.forEach(([s, t], i) => {
      const u = new SpeechSynthesisUtterance(t), k = who.indexOf(s);
      u.lang = 'en-US'; u.rate = .95; u.pitch = k % 2 ? 1.2 : .9;
      if (voices.length) u.voice = voices[k % voices.length];
      if (i === clip.lines.length - 1) { u.onend = finish; u.onerror = finish; }
      synth.speak(u);
    });
  }
  return est;
}
function stopClip() { window.speechSynthesis?.cancel(); playClip.current?.pause(); }
addEventListener('pagehide', stopClip);

// ---------- Skor (dihitung server saat submit; di sini hanya ditampilkan) ----------
const TOEFL_MAX = { listening: 68, structure: 68, reading: 67 };
const isPlacement = a => DB.packages.find(p => p.id === a.pkg)?.type === 'placement';
// Hasil simulasi (bukan placement) terbaru
const findAttempt = (pred = () => true) => DB.attempts.find(a => DB.packages.some(p => p.id === a.pkg) && !isPlacement(a) && pred(a)) || null;

// ---------- Placement test ----------
// Level dari persen jawaban benar. Perkiraan skor: TOEFL ITP mengikuti batas CEFR resmi ETS; IELTS perkiraan umum.
const LEVELS = [{ code: 'A1', name: 'Beginner', min: 0 }, { code: 'A2', name: 'Elementary', min: 15 }, { code: 'A2+', name: 'Elementary Plus', min: 22 }, { code: 'B1', name: 'Intermediate', min: 30 }, { code: 'B1+', name: 'Intermediate Plus', min: 42 }, { code: 'B2', name: 'Upper-intermediate', min: 55 }, { code: 'C1', name: 'Advanced', min: 80 }];
// Perkiraan skor per level CEFR: TOEFL ITP dari pemetaan resmi ETS, IELTS dari tabel IELTS–CEFR
const LEVEL_RANGE = {
  toefl: { A1: 'below 337', A2: '337–459', B1: '460–542', B2: '543–626', C1: '627 and above' },
  ielts: { A1: 'below band 3.0', A2: 'band 3.0–3.5', B1: 'band 4.0–5.0', B2: 'band 5.5–6.5', C1: 'band 7.0 and above' },
};
const LEVEL_SOURCE = {
  toefl: 'Estimated scores follow the official CEFR mapping for TOEFL ITP published by ETS.',
  ielts: 'Estimated bands follow the IELTS–CEFR comparison published by the IELTS partners.',
};
// Batas level & perkiraan skor bisa diatur admin per program (Pengaturan → Level placement); default di atas
function levelsOf(exam) {
  const r = DB.exams?.[exam]?.recommend || {};
  return LEVELS.map((l, i) => {
    const t = typeof r[l.code] === 'object' ? r[l.code] : {}, min = i === 0 ? 0 : t.min === '' || t.min == null || isNaN(t.min) ? l.min : +t.min;
    // A2+ / B1+ tanpa perkiraan sendiri memakai perkiraan level dasarnya
    return { ...l, min, range: t.range || LEVEL_RANGE[exam]?.[l.code.replace('+', '')] || '' };
  });
}
const levelOf = (percent, exam) => { const ls = levelsOf(exam); return [...ls].reverse().find(l => percent >= l.min) || ls[0]; };
// Level placement yang tampil ke siswa: level dari admin (level_final) jika ada, selain itu hitungan % benar
const plLevel = a => (a.level && levelsOf(a.exam).find(l => l.code === a.level)) || levelOf(a.total, a.exam);
const rangeOf = (exam, code) => levelsOf(exam).find(l => l.code === code)?.range || '';
// Track belajar sesuai level placement terakhir di program ini (null jika belum placement)
const latestPlacement = exam => DB.attempts?.find(a => a.exam === exam && isPlacement(a)) || null;
function trackOf(exam) {
  const pl = latestPlacement(exam); if (!pl) return null;
  const lv = plLevel(pl), t = DB.exams[exam]?.recommend?.[lv.code];
  return { level: lv, name: t?.name || lv.name, target: t?.target || '', points: String(t?.desc || '').split('\n').map(x => x.trim()).filter(Boolean) };
}
// Skor diagnostic: mock test Full terakhir; jika belum ada, dari placement test terakhir
function diagnostic(exam) {
  const full = DB.attempts?.find(a => a.exam === exam && DB.packages.find(p => p.id === a.pkg)?.type === 'full');
  if (full) return { source: 'Latest full mock test', date: full.date, total: full.total, sections: Object.fromEntries(full.sections.map(s => [s.id, s.score])) };
  const pl = latestPlacement(exam);
  if (pl) return { source: 'Placement test (estimate)', date: pl.date, total: null, range: rangeOf(exam, plLevel(pl).code), sections: Object.fromEntries(pl.sections.map(s => [s.id, s.score])) };
  return null;
}
// Section yang dilakukan di kantor (mis. IELTS Speaking): instruksi dari admin + kontak
const officeNote = s => s.note || 'This part is done face-to-face with an EnglishOn tutor. Contact us on WhatsApp to book your schedule, then come to our office.';
const officeLink = (E, s) => joinLink(`I would like to book the ${E.name} ${s.name} session at the office.`);
const joinLink = extra => waLink(`Hello EnglishOn, I am ${DB.user?.name || ''}${DB.user?.email ? ' (' + DB.user.email + ')' : ''}. ${extra}`);
const attemptScore = a => a.total ?? a.sections.find(s => s.score != null)?.score ?? null;
function scoreAttempt(att) {
  const pkg = DB.packages.find(p => p.id === att.pkg);
  return { pkg, exam: att.exam, total: att.total, sections: att.sections.map(s => ({ ...s, meta: sectionMeta(att.exam, s.id) || { name: s.id, short: s.id, icon: 'file-question' } })) };
}

// ---------- Layout ----------
const NAV = {
  app: [['program', 'About the Program', 'info', 'program.html'], ['dashboard', 'Dashboard', 'layout-dashboard', 'dashboard.html'], ['materi', 'Curriculum', 'book-open', 'materi.html'], ['skills', 'Skills', 'target', 'skills.html'], ['simulasi', 'Mock Test', 'timer', 'simulasi.html'], ['hasil', 'Results & Review', 'bar-chart-3', 'hasil.html'], ['ebook', 'Ebooks', 'book-marked', 'ebook.html'], ['consult', 'Consultation', 'message-circle', 'consultation.html']],
  admin: [['master', 'Master Program', 'layers', 'admin.html#master']],
};
const logo = (sub = '') => `<a href="${sub ? 'admin.html' : 'program.html'}" class="flex items-center">
  <img src="logo.png" alt="EnglishOn" class="-ml-8 h-32 w-auto">${sub}</a>`;

const ADMIN_SUB = [['siswa', 'Siswa', 'users'], ['materi', 'Curriculum', 'book-open'], ['soal', 'Soal', 'file-question'], ['mock', 'Mock Test', 'timer'], ['ebook', 'Ebook', 'book-marked'], ['pengaturan', 'Pengaturan', 'settings']];
function adminPrograms(link) {
  return `<p class="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Program</p>` + Object.values(DB.exams).map(e => `
    <div>
      <button @click="grp = grp === '${e.key}' ? '' : '${e.key}'" class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
        <span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background-color: rgb(${e.rgb})"></span>
        <span class="min-w-0 flex-1 truncate">${esc(e.name)}</span>
        ${e.active ? '' : '<span class="rounded bg-slate-100 px-1.5 text-[10px] font-medium text-slate-500">nonaktif</span>'}
        <span class="text-slate-400 transition" :class="grp === '${e.key}' && 'rotate-90'"><i data-lucide="chevron-right" class="h-4 w-4"></i></span>
      </button>
      <div x-show="grp === '${e.key}'" x-cloak class="mb-1 ml-[18px] space-y-0.5 border-l border-slate-200 pl-2">
        ${ADMIN_SUB.map(([t, label, icon]) => link([`p/${e.key}/${t}`, label, icon, `admin.html#p/${e.key}/${t}`])).join('')}
      </div>
    </div>`).join('');
}

// ---------- Target skor siswa ----------
// Dibuka dari kartu target di sidebar atau dashboard (event "open-target")
function targetForm() {
  return {
    tgt: false, tv: '', terr: '', tsaving: false,
    openTarget() { this.tv = DB.user.target[getExam()] ?? ''; this.terr = ''; this.tgt = true; },
    async saveTarget() {
      this.tsaving = true; this.terr = '';
      try { await api('PUT', '/me/target', { exam: getExam(), target: this.tv === '' ? null : this.tv }); location.reload(); }
      catch (e) { this.terr = e.message; this.tsaving = false; }
    },
  };
}
function targetModal(exam) {
  const E = DB.exams[exam], hint = exam === 'toefl' ? 'Score from 310 to 677, e.g. 550' : exam === 'ielts' ? 'Band from 1 to 9, e.g. 6.5' : 'Your target score';
  return `<div x-show="tgt" x-cloak @open-target.window="openTarget()" @keydown.escape.window="tgt = false" class="fixed inset-0 z-50 grid place-items-center p-4">
    <div class="absolute inset-0 bg-slate-900/40" @click="tgt = false"></div>
    <form @submit.prevent="saveTarget()" class="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
      <span class="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><i data-lucide="target" class="h-6 w-6"></i></span>
      <h3 class="mt-4 text-lg font-bold">Your ${esc(E.name)} target</h3>
      <p class="mt-1 text-sm text-slate-500">What score do you need, for example for graduation, a scholarship, or a job?</p>
      <input x-model="tv" type="number" inputmode="decimal" step="${exam === 'ielts' ? '0.5' : '1'}" min="${exam === 'toefl' ? 310 : 0}" max="${exam === 'toefl' ? 677 : exam === 'ielts' ? 9 : 1000}" placeholder="${hint}" class="mt-4 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-lg font-semibold outline-none focus:border-accent">
      <p class="mt-1 text-xs text-slate-400">${hint}. Leave empty to remove your target.</p>
      <p x-show="terr" class="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" x-text="terr"></p>
      <div class="mt-5 grid grid-cols-2 gap-2"><button type="button" @click="tgt = false" class="rounded-xl border border-slate-200 py-2.5 text-sm font-semibold hover:bg-slate-50">Cancel</button><button :disabled="tsaving" class="rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60" x-text="tsaving ? 'Saving…' : 'Save Target'"></button></div>
    </form>
  </div>`;
}

const accountLabel = () => access.inactive ? 'Program ended' : access.program ? `Program ${access.program} meetings` : access.full ? 'Full access' : 'Free account';

function mountShell() {
  const kind = document.body.dataset.shell; if (!kind) return;
  const main = document.querySelector('main'), active = document.body.dataset.active, title = document.body.dataset.title || '';
  const exam = getExam(), admin = kind === 'admin';
  // Panel terkunci: abu-abu + gembok, tidak bisa diklik
  const link = ([k, label, icon, href]) => !admin && !access.can(k)
    ? `<span data-nav="${k}" title="Locked. Contact EnglishOn to unlock" aria-disabled="true" class="flex cursor-not-allowed select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300">
      <i data-lucide="${icon}" class="h-[18px] w-[18px]"></i>${label}<i data-lucide="lock" class="ml-auto h-3.5 w-3.5"></i></span>`
    : `<a href="${href}" data-nav="${k}" @click="nav=false" class="nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${k === active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}">
      <i data-lucide="${icon}" class="h-[18px] w-[18px]"></i>${label}</a>`;
  const examBtn = e => e.active
    ? `<button onclick="setExam('${e.key}')" class="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${exam === e.key ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}">${e.name.split(' ')[0]}</button>`
    : `<span title="${e.name} coming soon" class="hidden cursor-not-allowed whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 md:inline">${e.name.split(' ')[0]} <span class="text-[10px]">· soon</span></span>`;

  const wrap = document.createElement('div');
  // grp = program yang sedang terbuka di sidebar admin
  wrap.setAttribute('x-data', `{ nav: false, menu: false, ...targetForm(), grp: '${(location.hash.match(/^#p\/([\w-]+)/) || [])[1] || ''}' }`);
  wrap.innerHTML = `
  <aside class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white -translate-x-full max-lg:transition-transform max-lg:duration-200 lg:translate-x-0" :class="nav && '!translate-x-0 shadow-2xl'">
    <div class="flex h-16 items-center justify-between px-5">${logo(admin ? ' <span class="ml-1 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Admin</span>' : '')}
      <button class="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" @click="nav=false" aria-label="Close menu"><i data-lucide="x" class="h-5 w-5"></i></button></div>
    <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <p class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">${admin ? 'Manajemen' : 'Learn'}</p>
      ${NAV[kind].map(link).join('')}${admin ? adminPrograms(link) : ''}
    </nav>
    <div class="space-y-3 border-t border-slate-100 p-4">
      ${admin ? '' : `<button @click="openTarget()" title="Set your target score" class="group block w-full rounded-xl bg-gradient-to-br from-accent to-accent-dark p-4 text-left text-white">
        <p class="flex items-center justify-between text-xs text-white/70">${DB.exams[exam].name} target<span class="flex items-center gap-1 opacity-70 group-hover:opacity-100"><i data-lucide="pencil" class="h-3 w-3"></i>${DB.user.target[exam] == null ? 'Set' : 'Edit'}</span></p>
        <p class="mt-1 ${DB.user.target[exam] == null ? 'text-base' : 'text-2xl'} font-bold">${DB.user.target[exam] ?? 'Set your target'}</p>
        <p class="mt-1 flex items-center gap-1 text-xs text-white/80"><i data-lucide="${access.full ? 'calendar-check' : 'lock'}" class="h-3.5 w-3.5"></i> ${accountLabel()}</p></button>`}
      ${DB.user.role === 'admin' ? `<a href="${admin ? 'dashboard.html' : 'admin.html'}" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><i data-lucide="${admin ? 'graduation-cap' : 'shield'}" class="h-[18px] w-[18px]"></i>${admin ? 'Ke Mode Siswa' : 'Admin Panel'}</a>` : ''}
      <button onclick="logout()" class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><i data-lucide="log-out" class="h-[18px] w-[18px]"></i>${admin ? 'Keluar' : 'Log out'}</button>
    </div>
  </aside>
  <div x-show="nav" x-transition.opacity x-cloak @click="nav=false" class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"></div>
  <div class="lg:pl-64">
    <header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6">
      <button class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" @click="nav=true" aria-label="Open menu"><i data-lucide="menu" class="h-5 w-5"></i></button>
      <h1 class="truncate text-base font-semibold text-slate-900 sm:text-lg">${title}</h1>
      <div class="ml-auto flex items-center gap-2 sm:gap-3">
        ${admin ? '' : DB.user.role === 'admin'
          ? `<div class="flex rounded-xl bg-slate-100 p-1">${Object.values(DB.exams).map(examBtn).join('')}</div>`
          : `<span class="whitespace-nowrap rounded-xl bg-accent px-3 py-1.5 text-xs font-semibold text-white">${esc(DB.exams[exam].name)}</span>`}
        <div class="relative">
          <button @click="menu=!menu" @click.outside="menu=false" class="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100">
            <span class="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 text-sm font-semibold text-white">${esc(DB.user.initials)}</span>
            <span class="hidden text-left text-sm md:block"><span class="block font-medium leading-tight">${esc(DB.user.name)}</span><span class="block text-xs text-slate-500">${DB.user.role === 'admin' ? 'Admin' : accountLabel()}</span></span>
            <i data-lucide="chevron-down" class="hidden h-4 w-4 text-slate-400 md:block"></i>
          </button>
          <div x-show="menu" x-transition x-cloak class="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 text-sm shadow-soft">
            <p class="truncate px-3 py-2 text-xs text-slate-500">${esc(DB.user.email)}</p>
            <button onclick="logout()" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50"><i data-lucide="log-out" class="h-4 w-4"></i>${admin ? 'Keluar' : 'Log out'}</button>
          </div>
        </div>
      </div>
    </header>
    <div id="slot"></div>
    ${admin ? '' : targetModal(exam)}
  </div>`;
  // Halaman panel terkunci (dibuka lewat URL langsung): ganti isi dengan kartu terkunci. Datanya juga tidak dikirim server.
  // Review placement mengikuti panel Placement, review mock test mengikuti Results
  const att = DB.attempts?.find(a => a.id === +qs('id')), pnl = document.body.dataset.panel === 'review' ? (att && isPlacement(att) ? 'placement' : 'hasil') : document.body.dataset.panel || active;
  if (!admin && !access.can(pnl)) { main.removeAttribute('x-data'); main.className = ''; main.innerHTML = lockedHTML(`${title || 'This page'} is locked`); }
  main.replaceWith(wrap);
  wrap.querySelector('#slot').replaceWith(main);
  main.classList.add('mx-auto', 'max-w-7xl', 'px-4', 'py-6', 'sm:px-6', 'lg:px-8', 'lg:py-8');
}

// Lucide: render ulang ikon setiap kali Alpine menambahkan elemen baru.
function startIcons() {
  if (!window.lucide) return;
  let queued = false;
  const run = () => { queued = false; lucide.createIcons({ attrs: { 'stroke-width': 2 } }); };
  run();
  new MutationObserver(() => { if (!queued && document.querySelector('i[data-lucide]')) { queued = true; requestAnimationFrame(run); } })
    .observe(document.body, { childList: true, subtree: true });
}

// Sidebar & header halaman sebelumnya disimpan sebagai salinan statis, lalu langsung ditampilkan di halaman
// berikutnya selama data dimuat → saat pindah menu sidebar tidak hilang-muncul (kedip).
const ghostKey = () => 'ghost-' + document.body.dataset.shell;
addEventListener('pagehide', () => {
  const a = document.querySelector('aside'), h = a?.parentElement.querySelector('header');
  if (a && h) try { sessionStorage.setItem(ghostKey(), a.outerHTML + `<div class="lg:pl-64">${h.outerHTML}</div>`); } catch {}
});
document.addEventListener('DOMContentLoaded', () => {
  let html; try { html = document.body.dataset.shell && token() && sessionStorage.getItem(ghostKey()); } catch {}
  if (!html) return;
  const g = document.createElement('div'), admin = document.body.dataset.shell === 'admin';
  g.id = 'ghost'; g.setAttribute('x-ignore', ''); g.innerHTML = html; // salinan statis, jangan diproses Alpine
  const active = admin ? location.hash.slice(1) || 'master' : document.body.dataset.active;
  g.querySelectorAll('[data-nav]').forEach(a => { const on = a.dataset.nav === active; a.classList.toggle('bg-brand-50', on); a.classList.toggle('text-brand-700', on); a.classList.toggle('text-slate-600', !on); });
  g.querySelector('header h1').textContent = document.body.dataset.title || '';
  document.body.prepend(g);
});

document.addEventListener('alpine:init', () => { mountShell(); });
// Halaman disembunyikan sampai Alpine selesai merender & ikon terpasang, lalu ditampilkan sekaligus
function showPage() { document.getElementById('ghost')?.remove(); document.body?.classList.add('ready'); }
document.addEventListener('alpine:initialized', () => { if (window.lucide) lucide.createIcons({ attrs: { 'stroke-width': 2 } }); showPage(); });
setTimeout(showPage, 4000); // cadangan: jangan pernah biarkan halaman kosong
document.addEventListener('DOMContentLoaded', startIcons);
