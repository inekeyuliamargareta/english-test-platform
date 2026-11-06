// Akses panel siswa. Dipakai server (bootstrap + endpoint) dan diuji di access.test.js.
// Siswa berbayar = punya program (20/30/40) atau akses penuh lama, dan status aktif.
// Akun gratis / tidak aktif hanya membuka panel di pengaturan free_panels. unlocks per siswa menimpa keduanya.
const PANELS = ['program', 'dashboard', 'materi', 'skills', 'simulasi', 'hasil', 'ebook', 'consult', 'placement'];
const FREE_PANELS = ['program', 'placement', 'consult'];

function accessOf(user, freePanels = FREE_PANELS) {
  if (user.role === 'admin') return { paid: true, program: null, panels: [...PANELS] };
  const paid = user.status !== 'tidak_aktif' && (!!user.program || !!user.full_access);
  const open = new Set(paid ? PANELS : freePanels);
  for (const [k, on] of Object.entries(user.unlocks || {})) if (PANELS.includes(k)) on ? open.add(k) : open.delete(k);
  // Batas pertemuan hanya untuk siswa berprogram; akses penuh lama = tanpa batas
  return { paid, program: paid && user.program && !user.full_access ? +user.program : null, panels: PANELS.filter(p => open.has(p)) };
}

module.exports = { PANELS, FREE_PANELS, accessOf };
