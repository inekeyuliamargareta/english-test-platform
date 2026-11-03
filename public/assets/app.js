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

document.addEventListener('DOMContentLoaded', async () => {
  if (needsLogin() && !token()) return location.replace('login.html');
  try { DB = await api('GET', '/bootstrap' + (document.body.dataset.shell === 'admin' ? '?lite=1' : '')); }
  catch (e) { document.body.innerHTML = `<p style="padding:2rem;text-align:center;font-family:sans-serif">Cannot reach the server. Please reload the page.<br><small>${e.message}</small></p>`; return; }
  if (needsLogin() && !DB.user) return logout();
  if (document.body.dataset.shell === 'admin' && DB.user.role !== 'admin') return location.replace('dashboard.html');
  document.documentElement.dataset.exam = getExam();
  document.head.insertAdjacentHTML('beforeend', `<style>${Object.values(DB.exams).map((e, i) => `${i ? `:root[data-exam="${e.key}"]` : ':root'} { --accent: ${e.rgb}; --accent-dark: ${e.rgbDark}; --accent-soft: ${e.rgbSoft}; }`).join('\n')}</style>`);
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js'; // Alpine langsung start setelah dimuat
  document.head.append(s);
});

// ---------- Ujian aktif (dari master ujian DB.exams) ----------
const activeExams = () => Object.values(DB.exams).filter(e => e.active);
const isActiveExam = k => !!DB.exams[k]?.active;
function getExam() {
  const p = new URLSearchParams(location.search).get('exam');
  if (isActiveExam(p)) { try { localStorage.setItem('exam', p); } catch {} return p; }
  let k; try { k = localStorage.getItem('exam'); } catch {}
  return isActiveExam(k) ? k : isActiveExam(DB.user?.exam) ? DB.user.exam : activeExams()[0].key;
}
function setExam(k) { if (!isActiveExam(k)) return; try { localStorage.setItem('exam', k); } catch {} location.href = location.pathname; }

// ---------- Akses akun ----------
// Akun gratis hanya dapat 1x simulasi. Setelah itu terkunci sampai admin membuka akses penuh
// (siswa datang ke kantor / menghubungi EnglishOn). Status dari server; server juga menolak submit jika terkunci.
const access = {
  get used() { return !!DB.user?.access.used; },
  get full() { return !!DB.user?.access.full; },
  get locked() { return this.used && !this.full; },
};
const waLink = msg => `https://wa.me/${DB.contact.wa}?text=${encodeURIComponent(msg)}`;
// Kartu "fitur terkunci" yang dipakai lobby, halaman test, dan hasil (render via x-html)
const lockedHTML = (title = 'Free mock test already used') => `
  <div class="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-soft sm:p-10">
    <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600"><i data-lucide="lock" class="h-8 w-8"></i></span>
    <h2 class="mt-5 text-xl font-bold sm:text-2xl">${title}</h2>
    <p class="mt-2 text-slate-500">Free accounts get <b>1 mock test</b>. To unlock more mock tests and features, visit our office or contact ${DB.contact.name}.</p>
    <div class="mt-6">
      <a href="${joinLink('I would like to unlock full access to the mock tests.')}" target="_blank" class="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"><i data-lucide="message-circle" class="h-4 w-4"></i>Contact us on WhatsApp</a>
    </div>
    <div class="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-600">
      <i data-lucide="map-pin" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"></i>
      <div><p class="font-semibold text-slate-800">${DB.contact.name}</p><p>${DB.contact.address}</p><p class="text-xs text-slate-500">${DB.contact.hours} · WA ${DB.contact.waLabel}</p></div>
    </div>
  </div>`;

// ---------- Tailwind ----------
tailwind.config = {
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af' },
        ielts: { 50: '#fff1f2', 100: '#ffe4e6', 500: '#e11d48', 600: '#be123c', 700: '#9f1239', 800: '#881337' },
        accent: { DEFAULT: 'rgb(var(--accent) / <alpha-value>)', dark: 'rgb(var(--accent-dark) / <alpha-value>)', soft: 'rgb(var(--accent-soft) / <alpha-value>)' },
      },
      boxShadow: { soft: '0 1px 2px rgb(15 23 42 / .04), 0 6px 20px -6px rgb(15 23 42 / .08)' },
    },
  },
};

document.head.insertAdjacentHTML('beforeend', `<style>
  :root { --accent: 37 99 235; --accent-dark: 29 78 216; --accent-soft: 239 246 255; }
  html { -webkit-font-smoothing: antialiased; }
  body { background: #f8fafc; color: #0f172a; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  [x-cloak] { display: none !important; }
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
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
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
// pool: 'bank' = soal simulasi & latihan, 'placement' = soal placement test
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
const LEVELS = [{ code: 'A2', name: 'Elementary', min: 0 }, { code: 'B1', name: 'Intermediate', min: 30 }, { code: 'B2', name: 'Upper-intermediate', min: 55 }, { code: 'C1', name: 'Advanced', min: 80 }];
const LEVEL_RANGE = {
  toefl: { A2: 'below 460', B1: '460–542', B2: '543–626', C1: '627 and above' },
  ielts: { A2: 'band 4.0 or below', B1: 'band 4.0–5.0', B2: 'band 5.5–6.5', C1: 'band 7.0 and above' },
};
const levelOf = percent => [...LEVELS].reverse().find(l => percent >= l.min);
const joinLink = extra => waLink(`Hello EnglishOn, I am ${DB.user?.name || ''}${DB.user?.email ? ' (' + DB.user.email + ')' : ''}. ${extra}`);
const attemptScore = a => a.total ?? a.sections.find(s => s.score != null)?.score ?? null;
function scoreAttempt(att) {
  const pkg = DB.packages.find(p => p.id === att.pkg);
  return { pkg, exam: att.exam, total: att.total, sections: att.sections.map(s => ({ ...s, meta: sectionMeta(att.exam, s.id) || { name: s.id, short: s.id, icon: 'file-question' } })) };
}

// ---------- Layout ----------
const NAV = {
  app: [['program', 'About the Program', 'info', 'program.html'], ['dashboard', 'Dashboard', 'layout-dashboard', 'dashboard.html'], ['materi', 'Lessons', 'book-open', 'materi.html'], ['simulasi', 'Mock Test', 'timer', 'simulasi.html'], ['hasil', 'Results & Review', 'bar-chart-3', 'hasil.html']],
  admin: [['master', 'Master Program', 'layers', 'admin.html#master']],
};
const logo = (sub = '') => `<a href="${sub ? 'admin.html' : 'program.html'}" class="flex items-center gap-2.5 font-bold text-slate-900">
  <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm"><i data-lucide="graduation-cap" class="h-5 w-5"></i></span>
  <span class="text-[17px] tracking-tight">English<span class="text-brand-600">On</span>${sub}</span></a>`;

const ADMIN_SUB = [['siswa', 'Siswa', 'users'], ['materi', 'Materi', 'book-open'], ['soal', 'Soal', 'file-question'], ['pengaturan', 'Pengaturan', 'settings']];
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

function mountShell() {
  const kind = document.body.dataset.shell; if (!kind) return;
  const main = document.querySelector('main'), active = document.body.dataset.active, title = document.body.dataset.title || '';
  const exam = getExam(), admin = kind === 'admin';
  const link = ([k, label, icon, href]) => `<a href="${href}" data-nav="${k}" @click="nav=false" class="nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${k === active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}">
      <i data-lucide="${icon}" class="h-[18px] w-[18px]"></i>${label}</a>`;
  const examBtn = e => e.active
    ? `<button onclick="setExam('${e.key}')" class="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${exam === e.key ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}">${e.name.split(' ')[0]}</button>`
    : `<span title="${e.name} coming soon" class="hidden cursor-not-allowed whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 md:inline">${e.name.split(' ')[0]} <span class="text-[10px]">· soon</span></span>`;

  const wrap = document.createElement('div');
  // grp = program yang sedang terbuka di sidebar admin
  wrap.setAttribute('x-data', `{ nav: false, menu: false, grp: '${(location.hash.match(/^#p\/([\w-]+)/) || [])[1] || ''}' }`);
  wrap.innerHTML = `
  <aside class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white -translate-x-full transition-transform duration-200 lg:translate-x-0" :class="nav && '!translate-x-0 shadow-2xl'">
    <div class="flex h-16 items-center justify-between px-5">${logo(admin ? ' <span class="ml-1 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Admin</span>' : '')}
      <button class="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" @click="nav=false" aria-label="Close menu"><i data-lucide="x" class="h-5 w-5"></i></button></div>
    <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <p class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">${admin ? 'Manajemen' : 'Learn'}</p>
      ${NAV[kind].map(link).join('')}${admin ? adminPrograms(link) : ''}
    </nav>
    <div class="space-y-3 border-t border-slate-100 p-4">
      ${admin ? '' : `<div class="rounded-xl bg-gradient-to-br from-accent to-accent-dark p-4 text-white">
        <p class="text-xs text-white/70">${DB.exams[exam].name} target</p>
        <p class="mt-1 text-2xl font-bold">${DB.user.target[exam] ?? '-'}</p>
        <p class="mt-1 flex items-center gap-1 text-xs text-white/80"><i data-lucide="${access.locked ? 'lock' : 'timer'}" class="h-3.5 w-3.5"></i> ${access.full ? 'Full access active' : access.used ? 'Free mock test used' : '1 free mock test available'}</p></div>`}
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
        ${admin ? '' : `<div class="flex rounded-xl bg-slate-100 p-1">${Object.values(DB.exams).map(examBtn).join('')}</div>`}
        <button class="relative hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block" aria-label="Notifications"><i data-lucide="bell" class="h-5 w-5"></i><span class="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span></button>
        <div class="relative">
          <button @click="menu=!menu" @click.outside="menu=false" class="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100">
            <span class="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 text-sm font-semibold text-white">${esc(DB.user.initials)}</span>
            <span class="hidden text-left text-sm md:block"><span class="block font-medium leading-tight">${esc(DB.user.name)}</span><span class="block text-xs text-slate-500">${DB.user.role === 'admin' ? 'Admin' : access.full ? 'Full access' : 'Free account'}</span></span>
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
  </div>`;
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

document.addEventListener('alpine:init', () => { mountShell(); });
document.addEventListener('DOMContentLoaded', startIcons);
