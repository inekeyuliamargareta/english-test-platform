// Cek aturan akses panel: node src/access.test.js
const assert = require('assert');
const { accessOf, PANELS } = require('./access');

const free = accessOf({ role: 'student' });
assert.deepStrictEqual(free.panels, ['program', 'consult', 'placement']);
assert.strictEqual(free.paid, false);

const p20 = accessOf({ role: 'student', program: 20, status: 'aktif' });
assert.deepStrictEqual(p20.panels, PANELS);
assert.strictEqual(p20.program, 20);

const done = accessOf({ role: 'student', program: 30, status: 'tidak_aktif' });
assert.strictEqual(done.paid, false, 'program selesai = seperti akun gratis');
assert.ok(!done.panels.includes('materi'));

const legacy = accessOf({ role: 'student', full_access: 1, program: 20 });
assert.strictEqual(legacy.program, null, 'akses penuh lama tanpa batas pertemuan');

const override = accessOf({ role: 'student', unlocks: { simulasi: true, consult: false } });
assert.ok(override.panels.includes('simulasi') && !override.panels.includes('consult'));

assert.deepStrictEqual(accessOf({ role: 'admin' }).panels, PANELS);
console.log('access: semua cek lulus');
