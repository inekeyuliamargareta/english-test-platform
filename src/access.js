// Akses panel siswa. Dipakai server (bootstrap + endpoint) dan diuji di access.test.js.
// Siswa berbayar = punya program (20/30/40) atau akses penuh lama, dan status aktif.
// Akun gratis / tidak aktif hanya membuka panel di pengaturan free_panels. unlocks per siswa menimpa keduanya.
const PANELS = ['program', 'dashboard', 'materi', 'skills', 'simulasi', 'hasil', 'ebook', 'consult', 'placement'];
// Akun gratis: About, Placement, Consultation, dan Mock Test 1 di tiap tab (beserta hasilnya)
const FREE_PANELS = ['program', 'placement', 'consult', 'simulasi', 'hasil'];

function accessOf(user, freePanels = FREE_PANELS) {
  if (user.role === 'admin') return { paid: true, program: null, panels: [...PANELS] };
  const paid = user.status !== 'tidak_aktif' && (!!user.program || !!user.full_access);
  const open = new Set(paid ? PANELS : freePanels);
  for (const [k, on] of Object.entries(user.unlocks || {})) if (PANELS.includes(k)) on ? open.add(k) : open.delete(k);
  // Batas pertemuan hanya untuk siswa berprogram; akses penuh lama = tanpa batas
  return { paid, program: paid && user.program && !user.full_access ? +user.program : null, panels: PANELS.filter(p => open.has(p)) };
}

// Tab mock test: Full, satu section (Listening only, …), atau campuran. Sama dengan simulasi.html.
const mockTab = p => p.type === 'full' ? 'full' : p.sections.length === 1 ? p.sections[0][0] : 'mixed';
// Mock test yang gratis: yang pertama (urutan admin) di tiap tab per program. packages harus sudah urut.
function freeMockIds(packages) {
  const seen = new Set(), ids = new Set();
  for (const p of packages) {
    if (p.type === 'placement') continue;
    const k = p.exam + ':' + mockTab(p);
    if (!seen.has(k)) { seen.add(k); ids.add(p.id); }
  }
  return ids;
}

module.exports = { PANELS, FREE_PANELS, accessOf, mockTab, freeMockIds };
