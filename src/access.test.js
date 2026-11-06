// Cek aturan akses panel: node src/access.test.js
const assert = require('assert');
const { accessOf, PANELS, freeMockIds } = require('./access');

const free = accessOf({ role: 'student' });
assert.deepStrictEqual(free.panels, ['program', 'simulasi', 'hasil', 'consult', 'placement']);

// Mock test gratis = yang pertama di tiap tab per program
const pk = (id, type, secs, exam = 'toefl') => ({ id, exam, type, sections: secs.map(s => [s, 30]) });
const ids = freeMockIds([pk('pl', 'placement', ['structure']), pk('f1', 'full', ['listening', 'reading']), pk('f2', 'full', ['listening', 'reading']),
  pk('l1', 'section', ['listening']), pk('l2', 'section', ['listening']), pk('r1', 'section', ['reading']), pk('i1', 'full', ['reading'], 'ielts')]);
assert.deepStrictEqual([...ids], ['f1', 'l1', 'r1', 'i1']);
assert.strictEqual(free.paid, false);

const p20 = accessOf({ role: 'student', program: 20, status: 'aktif' });
assert.deepStrictEqual(p20.panels, PANELS);
assert.strictEqual(p20.program, 20);

const done = accessOf({ role: 'student', program: 30, status: 'tidak_aktif' });
assert.strictEqual(done.paid, false, 'program selesai = seperti akun gratis');
assert.ok(!done.panels.includes('materi'));

const override0 = accessOf({ role: 'student', unlocks: { simulasi: false } });
assert.ok(!override0.panels.includes('simulasi'));

const legacy = accessOf({ role: 'student', full_access: 1, program: 20 });
assert.strictEqual(legacy.program, null, 'akses penuh lama tanpa batas pertemuan');

const override = accessOf({ role: 'student', unlocks: { simulasi: true, consult: false } });
assert.ok(override.panels.includes('simulasi') && !override.panels.includes('consult'));

assert.deepStrictEqual(accessOf({ role: 'admin' }).panels, PANELS);
console.log('access: semua cek lulus');
