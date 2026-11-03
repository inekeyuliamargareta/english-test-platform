// Penilaian simulasi. Dijalankan di server agar kunci jawaban tidak pernah dikirim ke browser siswa.

const TOEFL_MAX = { listening: 68, structure: 68, reading: 67 };
const norm = s => String(s ?? '').trim().toLowerCase();
const words = s => ((s || '').trim().match(/\S+/g) || []).length;
const isAnswered = a => a !== undefined && a !== null && String(a).trim() !== '';
const isCorrect = (q, a) => q.type === 'fill' ? q.answer.includes(norm(a)) : a === q.answer;
const halfRound = x => Math.round(x * 2) / 2;

function ieltsBand(r) {
  const t = [[.975, 9], [.925, 8.5], [.875, 8], [.825, 7.5], [.75, 7], [.65, 6.5], [.575, 6], [.45, 5.5], [.375, 5], [.3, 4.5], [.25, 4], [.15, 3.5], [.1, 3]];
  return (t.find(([min]) => r >= min) || [0, 2.5])[1];
}

// Skor per section: TOEFL skala 31–68, IELTS band, ujian lain 0–100.
function sectionScore(exam, id, r) {
  if (exam === 'toefl') return Math.round(31 + r * ((TOEFL_MAX[id] || 67) - 31));
  if (exam === 'ielts') return ieltsBand(r);
  return Math.round(r * 100);
}

function totalScore(exam, scores) {
  if (!scores.length) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  if (exam === 'toefl') return Math.round(sum * 10 / 3);
  if (exam === 'ielts') return halfRound(sum / scores.length);
  return Math.round(sum / scores.length);
}

// pkg: {exam, type, sections:[[id, menit]]}; meta(id) → section; items(id) → soal / task writing section itu
function scoreAttempt(pkg, meta, items, answers) {
  const sections = pkg.sections.map(([id]) => {
    const list = items(id);
    // Writing tidak dinilai otomatis: menunggu penilaian tutor
    if (meta(id)?.tutor) return { id, score: null, pending: true, detail: list.map(t => `${t.title}: ${words(answers[t.id])} words`).join(' · ') };
    const correct = list.filter(q => isCorrect(q, answers[q.id])).length, total = list.length;
    return { id, score: sectionScore(pkg.exam, id, total ? correct / total : 0), correct, total, detail: `${correct} of ${total} correct` };
  });
  const scored = sections.filter(s => s.score !== null).map(s => s.score);
  // Placement: total = persen jawaban benar (0–100), dipetakan ke level di halaman hasil
  if (pkg.type === 'placement') {
    const c = sections.reduce((a, s) => a + (s.correct || 0), 0), t = sections.reduce((a, s) => a + (s.total || 0), 0);
    return { sections, total: t ? Math.round(c / t * 100) : 0 };
  }
  return { sections, total: pkg.type === 'full' ? totalScore(pkg.exam, scored) : null };
}

module.exports = { scoreAttempt, isCorrect, isAnswered, norm, words };
