// Shared: tema, layout (navbar + sidebar), helper soal & skor. Dimuat di <head> setiap halaman.

// ---------- Ujian aktif (dari master ujian DB.exams) ----------
const activeExams = () => Object.values(DB.exams).filter(e => e.active);
const isActiveExam = k => !!DB.exams[k]?.active;
function getExam() {
  const p = new URLSearchParams(location.search).get('exam');
  if (isActiveExam(p)) { try { localStorage.setItem('exam', p); } catch {} return p; }
  let k; try { k = localStorage.getItem('exam'); } catch {}
  return isActiveExam(k) ? k : activeExams()[0].key;
}
function setExam(k) { if (!isActiveExam(k)) return; try { localStorage.setItem('exam', k); } catch {} location.href = location.pathname; }

// ---------- Akses akun ----------
// Akun gratis hanya dapat 1x simulasi. Setelah itu terkunci sampai admin membuka akses penuh
// (siswa datang ke kantor / menghubungi EnglishOn). ponytail: disimpan di localStorage, pindah ke server saat backend siap.
const access = {
  get used() { try { return localStorage.getItem('trialUsed') === '1'; } catch { return false; } },
  get full() { try { return localStorage.getItem('fullAccess') === '1'; } catch { return false; } },
  get locked() { return this.used && !this.full; },
  markUsed() { try { localStorage.setItem('trialUsed', '1'); } catch {} },
  reset() { try { localStorage.removeItem('trialUsed'); localStorage.removeItem('fullAccess'); } catch {} },
};
const waLink = msg => `https://wa.me/${DB.contact.wa}?text=${encodeURIComponent(msg)}`;
// Kartu "fitur terkunci" yang dipakai lobby, halaman test, dan hasil (render via x-html)
const lockedHTML = (title = 'Simulasi gratis sudah terpakai') => `
  <div class="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-soft sm:p-10">
    <span class="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600"><i data-lucide="lock" class="h-8 w-8"></i></span>
    <h2 class="mt-5 text-xl font-bold sm:text-2xl">${title}</h2>
    <p class="mt-2 text-slate-500">Akun gratis mendapat <b>1x simulasi test</b>. Untuk membuka simulasi berikutnya dan fitur lainnya, datang ke kantor atau hubungi ${DB.contact.name}.</p>
    <div class="mt-6 grid gap-3 sm:grid-cols-2">
      <a href="${waLink('Halo EnglishOn, saya ingin membuka akses penuh simulasi test di platform.')}" target="_blank" class="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"><i data-lucide="message-circle" class="h-4 w-4"></i>Hubungi via WhatsApp</a>
      <a href="booking.html" class="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold hover:bg-slate-50"><i data-lucide="calendar-check" class="h-4 w-4"></i>Booking Trial Class</a>
    </div>
    <div class="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-left text-sm text-slate-600">
      <i data-lucide="map-pin" class="mt-0.5 h-4 w-4 shrink-0 text-slate-400"></i>
      <div><p class="font-semibold text-slate-800">${DB.contact.name}</p><p>${DB.contact.address}</p><p class="text-xs text-slate-500">${DB.contact.hours} · WA ${DB.contact.waLabel}</p></div>
    </div>
    <button onclick="access.reset(); location.reload()" class="mt-5 text-xs text-slate-400 underline hover:text-slate-600">Reset kuota (khusus demo)</button>
  </div>`;
document.documentElement.dataset.exam = getExam();

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
  ${Object.values(DB.exams).map((e, i) => `${i ? `:root[data-exam="${e.key}"]` : ':root'} { --accent: ${e.rgb}; --accent-dark: ${e.rgbDark}; --accent-soft: ${e.rgbSoft}; }`).join('\n')}
  html { -webkit-font-smoothing: antialiased; }
  body { background: #f8fafc; color: #0f172a; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
  [x-cloak] { display: none !important; }
  .skel { background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 50%, #eef2f7 75%); background-size: 200% 100%; animation: skel 1.2s infinite; border-radius: .5rem; }
  @keyframes skel { to { background-position: -200% 0; } }
  .thin-scroll::-webkit-scrollbar { width: 8px; height: 8px; } .thin-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
  .content { line-height: 1.75; color: #334155; }
  .content p { margin: .75rem 0; } .content ol { list-style: decimal; padding-left: 1.25rem; } .content ol li { margin: .25rem 0; }
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
const fmt = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const L = i => 'ABCDEFG'[i];
// Ikon yang namanya bisa berubah: pakai x-html="ico(...)" (Lucide mengganti <i> dengan <svg> sekali saja)
const ico = (name, cls = 'h-4 w-4') => `<i data-lucide="${name}" class="${cls}"></i>`;
const words = s => ((s || '').trim().match(/\S+/g) || []).length;
const examStyle = k => `background-color: rgb(${DB.exams[k]?.rgb || '100 116 139'})`; // warna badge ujian
const sectionMeta =(exam, id) => DB.exams[exam].sections.find(s => s.id === id);
const chapterById = id => DB.chapters.find(c => c.id === id);
const questionById = id => DB.questions.find(q => q.id === id);
const statusLabel = { done: 'Selesai', progress: 'Sedang dipelajari', new: 'Belum mulai' };
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

// Item per section untuk halaman test: soal pilihan ganda/isian atau task writing
function sectionItems(exam, sec) {
  if (exam === 'ielts' && sec === 'writing') return DB.writingTasks.map(t => ({ ...t, kind: 'writing' }));
  return DB.questions.filter(q => q.exam === exam && q.section === sec).map(q => ({ ...q, kind: 'q' }));
}

// Audio placeholder: transkrip dibacakan via Web Speech API (tanpa file audio). Callback dipanggil sekali saat selesai.
function playClip(clip, onend) {
  let done = false; const finish = () => { if (!done) { done = true; onend && onend(); } };
  const est = clip.lines.reduce((n, l) => n + words(l[1]), 0) / 2.4 + clip.lines.length * .6;
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
addEventListener('pagehide', () => window.speechSynthesis && speechSynthesis.cancel());

// ---------- Skor ----------
const TOEFL_MAX = { listening: 68, structure: 68, reading: 67 };
function ieltsBand(r) {
  const t = [[.975, 9], [.925, 8.5], [.875, 8], [.825, 7.5], [.75, 7], [.65, 6.5], [.575, 6], [.45, 5.5], [.375, 5], [.3, 4.5], [.25, 4], [.15, 3.5], [.1, 3]];
  return (t.find(([min]) => r >= min) || [0, 2.5])[1];
}
const halfRound = x => Math.round(x * 2) / 2;

function loadAttempt() {
  try { const a = JSON.parse(localStorage.getItem('lastAttempt')); if (a && DB.packages.some(p => p.id === a.pkg)) return a; } catch {}
  return null;
}
function scoreAttempt(att) {
  const pkg = DB.packages.find(p => p.id === att.pkg), exam = pkg.exam, A = att.answers || {};
  const topics = {};
  const sections = pkg.sections.map(([id]) => {
    const meta = sectionMeta(exam, id), items = sectionItems(exam, id);
    // Writing tidak dinilai otomatis: menunggu penilaian tutor
    if (meta.tutor) return { id, meta, score: null, pending: true, detail: items.map(t => `${t.title}: ${words(A[t.id])} kata`).join(' · ') };
    let correct = 0;
    items.forEach(q => {
      const ok = isCorrect(q, A[q.id]); if (ok) correct++;
      const t = topics[q.topic] ||= { topic: q.topic, chapter: q.chapter, section: meta.short, correct: 0, total: 0 };
      t.total++; if (ok) t.correct++;
    });
    const r = correct / items.length;
    const score = exam === 'toefl' ? Math.round(31 + r * (TOEFL_MAX[id] - 31)) : ieltsBand(r);
    return { id, meta, score, correct, total: items.length, ratio: r, detail: `${correct} dari ${items.length} benar` };
  });
  const scored = sections.filter(x => x.score !== null);
  let total = null;
  if (pkg.type === 'full') total = exam === 'toefl' ? Math.round(scored.reduce((s, x) => s + x.score, 0) * 10 / 3) : halfRound(scored.reduce((s, x) => s + x.score, 0) / scored.length);
  const tl = Object.values(topics).map(t => ({ ...t, ratio: t.correct / t.total })).sort((a, b) => a.ratio - b.ratio);
  return { pkg, exam, sections, total, topics: tl, weak: tl.filter(t => t.ratio < .6), strong: tl.filter(t => t.ratio === 1) };
}

// ---------- Layout ----------
const NAV = {
  app: [['dashboard', 'Dashboard', 'layout-dashboard', 'dashboard.html'], ['materi', 'Materi', 'book-open', 'materi.html'], ['simulasi', 'Simulasi Test', 'timer', 'simulasi.html'], ['bank', 'Bank Soal', 'library', 'bank-soal.html'], ['hasil', 'Hasil & Review', 'bar-chart-3', 'hasil.html'], ['booking', 'Trial Class', 'calendar-check', 'booking.html']],
  admin: [['ringkasan', 'Ringkasan', 'layout-dashboard', 'admin.html#ringkasan'], ['materi', 'Kelola Materi', 'book-open', 'admin.html#materi'], ['soal', 'Kelola Soal', 'file-question', 'admin.html#soal'], ['paket', 'Paket Test', 'package', 'admin.html#paket'], ['siswa', 'Siswa & Akses', 'users', 'admin.html#siswa'], ['booking', 'Booking Trial', 'calendar-check', 'admin.html#booking'], ['master', 'Master Test', 'layers', 'admin.html#master']],
};
const logo = (sub = '') => `<a href="dashboard.html" class="flex items-center gap-2.5 font-bold text-slate-900">
  <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm"><i data-lucide="graduation-cap" class="h-5 w-5"></i></span>
  <span class="text-[17px] tracking-tight">English<span class="text-brand-600">On</span>${sub}</span></a>`;

function mountShell() {
  const kind = document.body.dataset.shell; if (!kind) return;
  const main = document.querySelector('main'), active = document.body.dataset.active, title = document.body.dataset.title || '';
  const exam = getExam(), admin = kind === 'admin';
  const link = ([k, label, icon, href]) => `<a href="${href}" data-nav="${k}" @click="nav=false" class="nav-link group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${k === active ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}">
      <i data-lucide="${icon}" class="h-[18px] w-[18px]"></i>${label}</a>`;
  const examBtn = e => e.active
    ? `<button onclick="setExam('${e.key}')" class="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${exam === e.key ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}">${e.name.split(' ')[0]}</button>`
    : `<span title="${e.name} segera hadir" class="hidden cursor-not-allowed whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 md:inline">${e.name.split(' ')[0]} <span class="text-[10px]">· segera</span></span>`;

  const wrap = document.createElement('div');
  wrap.setAttribute('x-data', '{ nav: false, menu: false }');
  wrap.innerHTML = `
  <aside class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white -translate-x-full transition-transform duration-200 lg:translate-x-0" :class="nav && '!translate-x-0 shadow-2xl'">
    <div class="flex h-16 items-center justify-between px-5">${logo(admin ? ' <span class="ml-1 rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Admin</span>' : '')}
      <button class="lg:hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" @click="nav=false" aria-label="Tutup menu"><i data-lucide="x" class="h-5 w-5"></i></button></div>
    <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      <p class="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">${admin ? 'Manajemen' : 'Belajar'}</p>
      ${NAV[kind].map(link).join('')}
    </nav>
    <div class="space-y-3 border-t border-slate-100 p-4">
      ${admin ? '' : `<div class="rounded-xl bg-gradient-to-br from-accent to-accent-dark p-4 text-white">
        <p class="text-xs text-white/70">Target ${DB.exams[exam].name}</p>
        <p class="mt-1 text-2xl font-bold">${DB.user.target[exam] ?? '-'}</p>
        <p class="mt-1 flex items-center gap-1 text-xs text-white/80"><i data-lucide="${access.locked ? 'lock' : 'timer'}" class="h-3.5 w-3.5"></i> ${access.full ? 'Akses penuh aktif' : access.used ? 'Simulasi gratis terpakai' : '1x simulasi gratis tersedia'}</p></div>`}
      <a href="${admin ? 'dashboard.html' : 'admin.html'}" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><i data-lucide="${admin ? 'graduation-cap' : 'shield'}" class="h-[18px] w-[18px]"></i>${admin ? 'Ke Mode Siswa' : 'Panel Admin'}</a>
      <a href="login.html" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"><i data-lucide="log-out" class="h-[18px] w-[18px]"></i>Keluar</a>
    </div>
  </aside>
  <div x-show="nav" x-transition.opacity x-cloak @click="nav=false" class="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"></div>
  <div class="lg:pl-64">
    <header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6">
      <button class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" @click="nav=true" aria-label="Buka menu"><i data-lucide="menu" class="h-5 w-5"></i></button>
      <h1 class="truncate text-base font-semibold text-slate-900 sm:text-lg">${title}</h1>
      <div class="ml-auto flex items-center gap-2 sm:gap-3">
        ${admin ? '' : `<div class="flex rounded-xl bg-slate-100 p-1">${Object.values(DB.exams).map(examBtn).join('')}</div>`}
        <button class="relative hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block" aria-label="Notifikasi"><i data-lucide="bell" class="h-5 w-5"></i><span class="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span></button>
        <div class="relative">
          <button @click="menu=!menu" @click.outside="menu=false" class="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100">
            <span class="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 text-sm font-semibold text-white">${admin ? 'AD' : DB.user.initials}</span>
            <span class="hidden text-left text-sm md:block"><span class="block font-medium leading-tight">${admin ? 'Admin EnglishOn' : DB.user.name}</span><span class="block text-xs text-slate-500">${admin ? 'Super admin' : access.full ? 'Akses penuh' : 'Akun gratis'}</span></span>
            <i data-lucide="chevron-down" class="hidden h-4 w-4 text-slate-400 md:block"></i>
          </button>
          <div x-show="menu" x-transition x-cloak class="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 text-sm shadow-soft">
            <a href="dashboard.html" class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-50"><i data-lucide="user" class="h-4 w-4"></i>Profil saya</a>
            <a href="login.html" class="flex items-center gap-2 rounded-lg px-3 py-2 text-rose-600 hover:bg-rose-50"><i data-lucide="log-out" class="h-4 w-4"></i>Keluar</a>
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
