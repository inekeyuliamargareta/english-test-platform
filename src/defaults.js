// Konten bawaan yang ditambahkan oleh `npm run migrate` / `npm run seed` bila belum ada:
// deskripsi program, rekomendasi kelas per level, dan placement test. Setelah ada, admin bebas mengubahnya.
const J = v => JSON.stringify(v);

const about = {
  toefl: `<p><b>TOEFL ITP</b> (Institutional Testing Program) adalah tes kemampuan bahasa Inggris buatan ETS yang dipakai kampus, instansi, dan program beasiswa di Indonesia, misalnya untuk syarat kelulusan, seleksi S2, atau kenaikan jabatan.</p>
<p>Tes berbentuk <b>pilihan ganda</b> dengan total <b>140 soal</b> dalam <b>±115 menit</b>, terbagi menjadi 3 section (lihat tabel di bawah).</p>
<p><b>Skor total 310–677.</b> Jawaban benar tiap section dikonversi ke skala 31–68 (Listening, Structure) dan 31–67 (Reading), lalu jumlahnya dikali 10 dan dibagi 3. Jawaban salah tidak mengurangi nilai.</p>
<p>Kebutuhan skor berbeda di tiap instansi; banyak kampus meminta sekitar <b>450–550</b>. Hasil tes umumnya berlaku 2 tahun.</p>`,
  ielts: `<p><b>IELTS Academic</b> dipakai untuk kuliah di luar negeri (Inggris, Australia, Kanada, dan lainnya), beasiswa, serta registrasi profesi. Tes dikelola British Council dan IDP.</p>
<p>Ada 4 bagian: <b>Listening</b> (40 soal, ±30 menit), <b>Reading</b> (40 soal, 60 menit), <b>Writing</b> (2 task, 60 menit), dan <b>Speaking</b> (wawancara 11–14 menit). Total sekitar 2 jam 45 menit.</p>
<p><b>Skor berupa band 1–9</b> untuk tiap bagian. Overall band adalah rata-rata keempat bagian, dibulatkan ke 0,5 terdekat. Kebanyakan universitas meminta overall 6.0–7.0.</p>
<p>Di platform ini kamu berlatih Listening, Reading, dan Writing (Writing dinilai tutor). <b>Speaking</b> dilatih langsung bersama tutor di kantor EnglishOn Ponorogo.</p>`,
  general: `<p><b>English General Test</b> mengukur kemampuan bahasa Inggris sehari-hari: grammar, kosakata, membaca, dan mendengar. Cocok untuk mengetahui level awalmu sebelum memilih kelas.</p>
<p>Skor 0–100 dan dipetakan ke level CEFR, dari <b>A1</b> (pemula) sampai <b>C1</b> (mahir).</p>`,
};

// Track belajar per level placement (tampil di halaman Curriculum siswa). desc: satu poin per baris.
const T = (name, target, ...points) => ({ name, target, desc: points.join('\n') });
const recommend = {
  toefl: {
    A1: T('Starter Track', '450–500', 'Baru mulai belajar bahasa Inggris', 'Skor diagnostic di bawah 337', 'Fokus kosakata dasar & kalimat sederhana', 'Bangun fondasi sebelum strategi TOEFL'),
    A2: T('Foundation Track', '500–550', 'Pemula yang baru mulai persiapan TOEFL', 'Skor diagnostic 337–459', 'Fokus pada fundamental grammar & struktur kalimat', 'Belajar bertahap dengan penjelasan detail'),
    B1: T('Intermediate Track', '550–580', 'Sudah paham dasar grammar', 'Skor diagnostic 460–542', 'Fokus strategi Structure & Listening', 'Latihan soal bertingkat'),
    B2: T('Advanced Track', '580–620', 'Skor diagnostic 543–626', 'Fokus soal sulit & manajemen waktu', 'Simulasi rutin untuk menjaga konsistensi'),
    C1: T('Mastery Track', '620+', 'Skor diagnostic 627 ke atas', 'Memoles detail & strategi ujian', 'Simulasi penuh sebelum tes resmi'),
  },
  ielts: {
    A1: T('Starter Track', 'Band 4.5–5.0', 'Baru mulai belajar bahasa Inggris', 'Band perkiraan di bawah 3.0', 'Fokus kosakata dasar & kalimat sederhana'),
    A2: T('Foundation Track', 'Band 5.0–5.5', 'Pemula yang baru mulai persiapan IELTS', 'Band perkiraan 3.0–3.5', 'Fokus grammar, kosakata, dan membaca dasar'),
    B1: T('Intermediate Track', 'Band 6.0', 'Band perkiraan 4.0–5.0', 'Fokus Reading, Writing, dan kosakata akademik'),
    B2: T('Advanced Track', 'Band 6.5–7.0', 'Band perkiraan 5.5–6.5', 'Fokus Writing Task 2 & strategi Listening'),
    C1: T('Mastery Track', 'Band 7.5+', 'Band perkiraan 7.0 ke atas', 'Simulasi penuh + latihan Speaking bersama tutor'),
  },
  general: {
    A1: T('Starter Track', 'A2', 'Baru mulai belajar', 'Fokus kosakata & kalimat dasar'),
    A2: T('Foundation Track', 'B1', 'Pemula', 'Fokus grammar & kosakata sehari-hari'),
    B1: T('Intermediate Track', 'B2', 'Sudah bisa percakapan sederhana', 'Fokus kelancaran & tata bahasa menengah'),
    B2: T('Advanced Track', 'C1', 'Siap mulai persiapan TOEFL/IELTS'),
    C1: T('Mastery Track', 'C1+', 'Langsung ke persiapan TOEFL ITP atau IELTS'),
  },
};

const packages = [
  { id: 'toefl-placement', exam: 'toefl', name: 'Placement Test TOEFL ITP', desc: '10 soal Structure, dari mudah ke sulit, untuk memperkirakan level TOEFL-mu.', sections: [['structure', 10]] },
  { id: 'ielts-placement', exam: 'ielts', name: 'Placement Test IELTS', desc: 'Reading singkat dan kosakata akademik untuk memperkirakan band IELTS-mu.', sections: [['reading', 15]] },
  { id: 'general-placement', exam: 'general', name: 'Placement Test English Umum', desc: '12 soal grammar & kosakata dari level dasar sampai mahir.', sections: [['grammar', 12]] },
];

const passages = [{ id: 'pl-i-p1', title: 'Working from Home', html: `<p>Before 2020, only a small proportion of office employees worked from home on a regular basis. The pandemic changed this almost overnight, as companies were forced to close their offices and move their teams online.</p>
<p>Several years later, many organisations have chosen a hybrid model, in which staff spend part of the week in the office and the rest at home. Surveys suggest that most employees prefer this arrangement because it reduces commuting time and gives them more control over their day.</p>
<p>However, managers have raised concerns. Some report that new employees learn more slowly when they cannot observe experienced colleagues, and that informal conversations, which often lead to new ideas, happen less frequently online.</p>
<p>As a result, a growing number of firms now ask staff to come to the office on the same days, so that teams can meet in person. Whether this compromise will last remains to be seen.</p>` }];

// [id, exam, section, difficulty, type, q, options, answer, pembahasan, passage]
const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN'];
const questions = [
  ['pl-t1', 'toefl', 'structure', 'mudah', 'mc', 'My brother _______ in Surabaya since 2020.', ['live', 'lives', 'has lived', 'is living'], 2, '"Since + titik waktu" menandakan kejadian yang masih berlangsung sampai sekarang → <b>present perfect</b> (has lived).'],
  ['pl-t2', 'toefl', 'structure', 'mudah', 'mc', '_______ the weather was bad, the match continued.', ['Despite', 'Although', 'Because of', 'In spite'], 1, 'Setelah kata yang kosong ada klausa lengkap (the weather was bad), jadi pakai <b>Although</b>. Despite / because of diikuti kata benda.'],
  ['pl-t3', 'toefl', 'structure', 'sedang', 'mc', 'The book _______ on the table belongs to Sarah.', ['lie', 'lying', 'lies', 'is lying'], 1, 'Ini bentuk ringkas dari "the book <i>which is lying</i> on the table" → <b>lying</b>. Kalimat sudah punya kata kerja utama (belongs).'],
  ['pl-t4', 'toefl', 'structure', 'sedang', 'mc', 'Neither the students nor the teacher _______ aware of the change.', ['were', 'are', 'was', 'have been'], 2, 'Pada "neither… nor…", kata kerja mengikuti subjek terdekat: <b>the teacher</b> (tunggal, lampau) → was.'],
  ['pl-t5', 'toefl', 'structure', 'mudah', 'error', 'The {children} {was} playing {in} the park {when} it started to rain.', ['children', 'was', 'in', 'when'], 1, '"Children" jamak, jadi seharusnya <b>were</b> playing.'],
  ['pl-t6', 'toefl', 'structure', 'sulit', 'mc', 'Only after the results were announced _______ how difficult the exam had been.', ['the students realized', 'did the students realize', 'the students did realize', 'realized the students'], 1, 'Kalimat diawali "<b>Only after</b>…" memicu inversi: did + subjek + kata kerja dasar.'],
  ['pl-t7', 'toefl', 'structure', 'sulit', 'mc', 'The committee recommended that the proposal _______ revised.', ['is', 'was', 'be', 'being'], 2, 'Setelah kata kerja saran seperti recommend/suggest/insist + that, dipakai bentuk dasar (subjunctive) → <b>be</b> revised.'],
  ['pl-t8', 'toefl', 'structure', 'sedang', 'error', 'Each of the {participants} {have} {submitted} {their} report.', ['participants', 'have', 'submitted', 'their'], 1, 'Subjeknya "<b>Each</b>" (tunggal), jadi seharusnya <b>has</b> submitted.'],
  ['pl-t9', 'toefl', 'structure', 'sedang', 'mc', '_______ in 1636, Harvard is the oldest university in the United States.', ['Founding', 'Founded', 'It was founded', 'Having founded'], 1, 'Harvard <i>didirikan</i> (pasif) → <b>Founded</b>. "It was founded" membuat dua klausa tanpa kata penghubung.'],
  ['pl-t10', 'toefl', 'structure', 'sedang', 'error', 'The {more} you practice, the {most} {confident} you {become}.', ['more', 'most', 'confident', 'become'], 1, 'Pola "the + comparative…, the + comparative…" → the more…, the <b>more</b> confident.'],

  ['pl-i1', 'ielts', 'reading', 'mudah', 'mc', 'Working from home was common for office employees before 2020.', TFNG, 1, 'Paragraf 1: sebelum 2020 hanya "<b>a small proportion</b>" yang bekerja dari rumah → bertentangan → FALSE.', 'pl-i-p1'],
  ['pl-i2', 'ielts', 'reading', 'mudah', 'mc', 'Most employees prefer the hybrid model.', TFNG, 0, 'Paragraf 2: "surveys suggest that <b>most employees prefer</b> this arrangement" → TRUE.', 'pl-i-p1'],
  ['pl-i3', 'ielts', 'reading', 'sedang', 'mc', 'Hybrid working has increased company profits.', TFNG, 2, 'Teks tidak membahas keuntungan perusahaan sama sekali → NOT GIVEN.', 'pl-i-p1'],
  ['pl-i4', 'ielts', 'reading', 'sedang', 'mc', 'According to the passage, what is one concern of managers?', ['Employees spend too much on commuting', 'New employees learn more slowly', 'Offices are too expensive', 'Staff work longer hours'], 1, 'Paragraf 3: "new employees <b>learn more slowly</b> when they cannot observe experienced colleagues".', 'pl-i-p1'],
  ['pl-i5', 'ielts', 'reading', 'sedang', 'mc', 'Why do some firms ask staff to come to the office on the same days?', ['To save electricity', 'So that teams can meet in person', 'To reduce the number of meetings', 'Because employees requested it'], 1, 'Paragraf 4: "…on the same days, <b>so that teams can meet in person</b>".', 'pl-i-p1'],
  ['pl-i6', 'ielts', 'reading', 'mudah', 'mc', 'The word "significant" is closest in meaning to', ['small', 'important', 'recent', 'careful'], 1, '"Significant" = penting / besar pengaruhnya → <b>important</b>.'],
  ['pl-i7', 'ielts', 'reading', 'sedang', 'mc', 'The number of tourists _______ sharply in 2019.', ['rose', 'raised', 'risen', 'rising'], 0, '"Rise" tidak butuh objek (naik dengan sendirinya); bentuk lampaunya <b>rose</b>. "Raise" butuh objek (menaikkan sesuatu).'],
  ['pl-i8', 'ielts', 'reading', 'sedang', 'mc', 'Which linking word shows CONTRAST?', ['Moreover', 'Therefore', 'Nevertheless', 'Furthermore'], 2, '<b>Nevertheless</b> = namun demikian (kontras). Moreover/furthermore = menambahkan, therefore = akibat.'],
  ['pl-i9', 'ielts', 'reading', 'sedang', 'mc', 'The research was _______ by a team of scientists from three countries.', ['carried', 'carried out', 'carry out', 'carrying'], 1, '"Carry out research" = melakukan penelitian. Dalam bentuk pasif: was <b>carried out</b>.'],
  ['pl-i10', 'ielts', 'reading', 'sulit', 'mc', 'Choose the most suitable sentence for an academic essay.', ['Lots of people think cities are too crowded.', 'A great deal of people reckon cities are too crowded.', 'Many people believe that cities are too crowded.', 'Loads of people say cities are way too crowded.'], 2, 'Essay akademik memakai bahasa formal: <b>Many people believe…</b>. "Lots of", "reckon", "loads of", "way too" terlalu santai.'],

  ['pl-g1', 'general', 'grammar', 'mudah', 'mc', 'She _______ a teacher.', ['am', 'is', 'are', 'be'], 1, 'Subjek "she" memakai <b>is</b>.'],
  ['pl-g2', 'general', 'grammar', 'mudah', 'mc', 'I _______ to the market yesterday.', ['go', 'goes', 'went', 'gone'], 2, '"Yesterday" = masa lampau → <b>went</b>.'],
  ['pl-g3', 'general', 'grammar', 'mudah', 'mc', "There aren't _______ apples in the fridge.", ['some', 'any', 'much', 'a'], 1, 'Kalimat negatif dengan benda jamak memakai <b>any</b>.'],
  ['pl-g4', 'general', 'grammar', 'mudah', 'mc', 'This is the _______ film I have ever seen.', ['good', 'better', 'best', 'most good'], 2, 'Superlatif dari good adalah <b>the best</b>.'],
  ['pl-g5', 'general', 'grammar', 'sedang', 'mc', 'If it rains tomorrow, we _______ at home.', ['stay', 'will stay', 'would stay', 'stayed'], 1, 'Conditional tipe 1 (mungkin terjadi): if + present, <b>will</b> + kata kerja.'],
  ['pl-g6', 'general', 'grammar', 'sedang', 'mc', 'He asked me _______ I could help him.', ['that', 'if', 'what', 'which'], 1, 'Pertanyaan ya/tidak dalam kalimat tidak langsung memakai <b>if</b> / whether.'],
  ['pl-g7', 'general', 'grammar', 'sedang', 'mc', "I'm not used to _______ up so early.", ['get', 'getting', 'got', 'have got'], 1, '"Be used to" (terbiasa) diikuti kata kerja <b>-ing</b>.'],
  ['pl-g8', 'general', 'grammar', 'sedang', 'mc', 'By the time we arrived, the film _______.', ['already started', 'has already started', 'had already started', 'was already start'], 2, 'Kejadian yang lebih dulu terjadi di masa lampau → <b>past perfect</b> (had started).'],
  ['pl-g9', 'general', 'grammar', 'sedang', 'mc', 'Choose the word closest in meaning to "reluctant".', ['eager', 'unwilling', 'careful', 'angry'], 1, '"Reluctant" = enggan → <b>unwilling</b>.'],
  ['pl-g10', 'general', 'grammar', 'sulit', 'mc', 'If I _______ harder at school, I would have a better job now.', ['studied', 'had studied', 'have studied', 'would study'], 1, 'Mixed conditional: penyesalan masa lalu (<b>had studied</b>) dengan akibat sekarang (would have).'],
  ['pl-g11', 'general', 'grammar', 'sulit', 'mc', 'Hardly _______ the house when the phone rang.', ['I had left', 'had I left', 'I left', 'did I leave'], 1, '"Hardly" di awal kalimat memicu inversi: <b>had I left</b>.'],
  ['pl-g12', 'general', 'grammar', 'sulit', 'mc', 'The manager insisted that everyone _______ on time.', ['is', 'was', 'be', 'being'], 2, 'Insist that + subjek + kata kerja dasar (subjunctive) → <b>be</b>.'],
];

// Tambahkan konten bawaan yang belum ada. Placement hanya diisi jika belum ada satu pun paket placement,
// agar soal yang sengaja dihapus admin tidak muncul lagi.
async function applyDefaults(db) {
  for (const code of Object.keys(about)) {
    await db.query('UPDATE exams SET about = ? WHERE code = ? AND about IS NULL', [about[code], code]);
    // Isi track bawaan jika kosong, atau jika masih format lama (teks rekomendasi kelas)
    await db.query("UPDATE exams SET recommend = ? WHERE code = ? AND (recommend IS NULL OR JSON_TYPE(JSON_EXTRACT(recommend, '$.A2')) = 'STRING')", [J(recommend[code]), code]);
    // Level A1 ditambahkan belakangan: isi track A1 bawaan jika belum ada
    await db.query("UPDATE exams SET recommend = JSON_SET(recommend, '$.A1', CAST(? AS JSON)) WHERE code = ? AND JSON_EXTRACT(recommend, '$.A1') IS NULL", [J(recommend[code].A1), code]);
  }
  // Teks bawaan A2 lama (sebelum ada A1) disesuaikan dengan rentang barunya; teks yang sudah diubah admin tidak tersentuh
  for (const [code, from, to] of [['toefl', 'Skor diagnostic di bawah 460', 'Skor diagnostic 337–459'], ['ielts', 'Band perkiraan 4.0 ke bawah', 'Band perkiraan 3.0–3.5']]) {
    await db.query("UPDATE exams SET recommend = JSON_SET(recommend, '$.A2.desc', REPLACE(JSON_UNQUOTE(JSON_EXTRACT(recommend, '$.A2.desc')), ?, ?)) WHERE code = ? AND JSON_UNQUOTE(JSON_EXTRACT(recommend, '$.A2.desc')) LIKE ?", [from, to, code, '%' + from + '%']);
  }
  // Level A2+ dan B1+ (level kantor) ditambahkan belakangan: batas % di tengah level sebelum & sesudahnya
  // Level lama tanpa angka min memakai batas bawaan (sama dengan LEVELS di app.js). Batas A2+/B1+ yang
  // tidak berada di antara level sebelum & sesudahnya (mis. 0 dari versi sebelumnya) dihitung ulang.
  const DEF_MIN = { A1: 0, A2: 15, B1: 30, B2: 55, C1: 80 };
  const minOf = (r, k) => r[k]?.min === '' || r[k]?.min == null || isNaN(r[k].min) ? DEF_MIN[k] : +r[k].min;
  const [rows] = await db.query('SELECT code, recommend FROM exams WHERE recommend IS NOT NULL');
  for (const { code, recommend: r } of rows) {
    let changed = false;
    for (const [k, lo, hi, name] of [['A2+', 'A2', 'B1', 'Elementary Plus Track'], ['B1+', 'B1', 'B2', 'Intermediate Plus Track']]) {
      if (!r[lo] || !r[hi]) continue;
      const a = minOf(r, lo), b = minOf(r, hi), cur = r[k]?.min;
      if (r[k] && cur > a && cur < b) continue;
      r[k] = { name, target: '', desc: '', range: '', ...r[k], min: Math.round((a + b) / 2) };
      changed = true;
    }
    if (changed) await db.query('UPDATE exams SET recommend = ? WHERE code = ?', [J(r), code]);
  }
  const FREE = ['program', 'placement', 'consult', 'simulasi', 'hasil'];
  await db.query('INSERT IGNORE INTO app_settings (k, v) VALUES (?, ?), (?, ?)', ['free_panels', J(FREE), 'placement_review', 'false']);
  // Default lama (tanpa Mock Test 1 gratis) diganti; pengaturan yang sudah diubah admin tidak tersentuh
  await db.query("UPDATE app_settings SET v = ? WHERE k = 'free_panels' AND v = CAST(? AS JSON)", [J(FREE), J(['program', 'placement', 'consult'])]);

  const [[{ n }]] = await db.query("SELECT COUNT(*) n FROM packages WHERE type = 'placement'");
  const [exams] = await db.query('SELECT code FROM exams');
  const has = code => exams.some(e => e.code === code);
  if (n) return syncPlacement(db);
  for (const p of passages) await db.query('INSERT IGNORE INTO passages (id, title, html) VALUES (?, ?, ?)', [p.id, p.title, p.html]);
  const qs = questions.filter(q => has(q[1]));
  if (qs.length) await db.query(`INSERT IGNORE INTO questions (id, exam, section, chapter, topic, difficulty, type, q, options, answer, explanation, passage, pool, sort) VALUES ?`,
    [qs.map(([id, exam, section, difficulty, type, q, options, answer, explain, passage], i) => [id, exam, section, null, 'Placement', difficulty, type, q, J(options), J(answer), explain, passage || null, 'placement', 10000 + i])]);
  const ps = packages.filter(p => has(p.exam));
  if (ps.length) await db.query('INSERT IGNORE INTO packages (id, exam, name, type, badge, descr, sections, sort) VALUES ?',
    [ps.map((p, i) => [p.id, p.exam, p.name, 'placement', null, p.desc, J(p.sections), 100 + i])]);
}

// Section paket placement mengikuti soal placement yang ada: section yang diberi soal (mis. Reading)
// otomatis ikut tes, section yang soalnya habis dihapus. Waktu section lama dipertahankan
// (minimal 1 menit per soal); section baru 1,5 menit per soal.
async function syncPlacement(db) {
  const [pkgs] = await db.query("SELECT id, exam, sections FROM packages WHERE type = 'placement'");
  const [counts] = await db.query("SELECT q.exam, q.section, COUNT(*) n, MIN(s.sort) s FROM questions q LEFT JOIN exam_sections s ON s.exam_key = q.exam AND s.id = q.section WHERE q.pool = 'placement' GROUP BY q.exam, q.section ORDER BY s, q.section");
  for (const p of pkgs) {
    const old = new Map(p.sections), next = counts.filter(c => c.exam === p.exam).map(c => [c.section, old.has(c.section) ? Math.max(old.get(c.section), c.n) : Math.ceil(c.n * 1.5)]);
    if (J(next) !== J(p.sections)) await db.query('UPDATE packages SET sections = ? WHERE id = ?', [J(next), p.id]);
  }
}

module.exports = { applyDefaults, syncPlacement };
