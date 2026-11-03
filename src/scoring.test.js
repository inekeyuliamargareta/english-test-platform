// Cek cepat penilaian: node src/scoring.test.js
const assert = require('assert');
const { scoreAttempt, isCorrect } = require('./scoring');

const qs = {
  listening: [{ id: 'l1', type: 'mc', answer: 1 }, { id: 'l2', type: 'fill', answer: ['14', '14th'] }],
  structure: [{ id: 's1', type: 'mc', answer: 0 }, { id: 's2', type: 'mc', answer: 2 }],
  reading: [{ id: 'r1', type: 'mc', answer: 3 }],
  writing: [{ id: 'w1', title: 'Task 1' }],
};
const meta = id => ({ tutor: id === 'writing' });
const items = id => qs[id];

assert.ok(isCorrect(qs.listening[1], ' 14TH '), 'isian tidak peka huruf besar & spasi');
assert.ok(!isCorrect(qs.listening[0], '1'), 'pilihan ganda membandingkan angka, bukan teks');

// TOEFL semua benar → 68 + 68 + 67 = 203 → 677
const toefl = scoreAttempt({ exam: 'toefl', type: 'full', sections: [['listening'], ['structure'], ['reading']] }, meta, items,
  { l1: 1, l2: '14', s1: 0, s2: 2, r1: 3 });
assert.deepStrictEqual(toefl.sections.map(s => s.score), [68, 68, 67]);
assert.strictEqual(toefl.total, 677);

// Semua kosong → skor minimum 31 per section
assert.strictEqual(scoreAttempt({ exam: 'toefl', type: 'full', sections: [['listening'], ['structure'], ['reading']] }, meta, items, {}).total, 310);

// IELTS: writing menunggu tutor, overall dari section lain; paket per section tanpa total
const ielts = scoreAttempt({ exam: 'ielts', type: 'full', sections: [['listening'], ['writing']] }, meta, items, { l1: 1, l2: 'x', w1: 'one two three' });
assert.deepStrictEqual(ielts.sections[1], { id: 'writing', score: null, pending: true, detail: 'Task 1: 3 kata' });
assert.strictEqual(ielts.sections[0].score, 5.5); // 1/2 benar
assert.strictEqual(ielts.total, 5.5);
assert.strictEqual(scoreAttempt({ exam: 'ielts', type: 'section', sections: [['reading']] }, meta, items, { r1: 3 }).total, null);

// Placement: total = persen benar dari semua section
assert.strictEqual(scoreAttempt({ exam: 'toefl', type: 'placement', sections: [['structure'], ['reading']] }, meta, items, { s1: 0, r1: 3 }).total, 67);

console.log('scoring OK');
