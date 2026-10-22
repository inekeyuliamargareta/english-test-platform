// Data dummy untuk mockup. Semua konten soal berbahasa Inggris, pembahasan berbahasa Indonesia.
// ponytail: data statis di satu file; ganti dengan API/DB saat backend siap.
const DB = {
  user: { name: 'Rina Maharani', email: 'rina.maharani@email.com', initials: 'RM', target: { toefl: 550, ielts: 6.5 }, streak: 12 },

  // Kontak lembaga. ponytail: placeholder, ganti dengan alamat & nomor WhatsApp asli EnglishOn Ponorogo.
  contact: {
    name: 'EnglishOn Ponorogo',
    address: 'Jl. (alamat kantor EnglishOn), Ponorogo, Jawa Timur',
    wa: '6281200000000', waLabel: '0812-0000-0000',
    hours: 'Senin–Sabtu, 08.00–20.00 WIB',
  },

  // Master ujian. Tambah ujian baru cukup di sini (atau lewat Admin → Master Test).
  // rgb = warna aksen ujian; active=false → tampil "Segera hadir" untuk siswa.
  // Section dengan booking:true tidak diujikan online, siswa diarahkan booking trial class.
  exams: {
    toefl: {
      key: 'toefl', name: 'TOEFL ITP', full: 'TOEFL ITP (Institutional Testing Program)', active: true, rgb: '37 99 235', rgbDark: '29 78 216', rgbSoft: '239 246 255', scale: '310–677',
      sections: [
        { id: 'listening', name: 'Listening Comprehension', short: 'Listening', icon: 'headphones', official: '50 soal · 35 menit' },
        { id: 'structure', name: 'Structure & Written Expression', short: 'Structure', icon: 'spell-check', official: '40 soal · 25 menit' },
        { id: 'reading', name: 'Reading Comprehension', short: 'Reading', icon: 'book-open', official: '50 soal · 55 menit' },
      ],
    },
    ielts: {
      key: 'ielts', name: 'IELTS Academic', full: 'IELTS Academic', active: true, rgb: '159 18 57', rgbDark: '136 19 55', rgbSoft: '255 241 242', scale: 'Band 1–9',
      sections: [
        { id: 'listening', name: 'Listening', short: 'Listening', icon: 'headphones', official: '40 soal · 30 menit' },
        { id: 'reading', name: 'Reading', short: 'Reading', icon: 'book-open', official: '40 soal · 60 menit' },
        { id: 'writing', name: 'Writing', short: 'Writing', icon: 'pen-line', official: '2 task · 60 menit', tutor: true },
        { id: 'speaking', name: 'Speaking', short: 'Speaking', icon: 'mic', official: '3 part · 11–14 menit', booking: true },
      ],
    },
    general: {
      key: 'general', name: 'English General Test', full: 'English General Test', active: false, rgb: '5 150 105', rgbDark: '4 120 87', rgbSoft: '236 253 245', scale: '0–100',
      sections: [
        { id: 'grammar', name: 'Grammar & Vocabulary', short: 'Grammar', icon: 'spell-check', official: '30 soal · 25 menit' },
        { id: 'reading', name: 'Reading', short: 'Reading', icon: 'book-open', official: '20 soal · 30 menit' },
        { id: 'listening', name: 'Listening', short: 'Listening', icon: 'headphones', official: '20 soal · 20 menit' },
        { id: 'speaking', name: 'Speaking', short: 'Speaking', icon: 'mic', official: 'Wawancara tutor', booking: true },
      ],
    },
  },

  trialClasses: [
    { id: 'speaking', title: 'Speaking (IELTS / Umum)', icon: 'mic', desc: 'Latihan Part 1–3 langsung dengan tutor, termasuk feedback pronunciation & fluency.' },
    { id: 'writing', title: 'Writing Review', icon: 'pen-line', desc: 'Essay Task 1 & 2 dinilai tutor dengan rubrik resmi IELTS.' },
    { id: 'toefl', title: 'Strategi TOEFL ITP', icon: 'target', desc: 'Kelas intensif strategi Listening, Structure, dan Reading.' },
  ],
  trialSlots: ['09.00', '13.00', '16.00', '19.00'],

  // ---------- MATERI ----------
  chapters: [
    {
      id: 't-lis-short', exam: 'toefl', section: 'listening', title: 'Short Conversations',
      desc: 'Memahami percakapan singkat dua orang: makna tersirat, saran, dan ekspresi idiomatik.',
      status: 'done', progress: 100, minutes: 25,
      subs: [
        { title: 'Format & Strategi Part A', html: `
          <p>Part A berisi <b>30 percakapan pendek</b> antara dua pembicara, masing-masing diikuti satu pertanyaan. Pertanyaan hampir selalu menanyakan maksud <b>pembicara kedua</b>.</p>
          <table><thead><tr><th>Part</th><th>Jenis</th><th>Jumlah soal</th></tr></thead><tbody>
            <tr><td>A</td><td>Short conversations</td><td>30</td></tr>
            <tr><td>B</td><td>Longer conversations</td><td>8</td></tr>
            <tr><td>C</td><td>Talks / lectures</td><td>12</td></tr></tbody></table>
          <div class="c-tip"><b>Tips:</b> Baca sekilas keempat pilihan jawaban sebelum audio diputar. Pilihan jawaban sering memberi petunjuk topik percakapan.</div>
          <div class="c-warn"><b>Jebakan:</b> Pilihan yang mengulang kata yang <i>persis sama</i> dengan audio biasanya salah. Jawaban benar memakai sinonim/parafrase.</div>` },
        { title: 'Ekspresi Setuju & Tidak Setuju', html: `
          <p>Banyak soal menguji ekspresi idiomatik. Hafalkan maknanya, bukan arti per kata.</p>
          <table><thead><tr><th>Ekspresi</th><th>Makna</th></tr></thead><tbody>
            <tr><td>You can say that again.</td><td>Sangat setuju</td></tr>
            <tr><td>I couldn't agree more.</td><td>Sangat setuju</td></tr>
            <tr><td>Not that I know of.</td><td>Sepertinya tidak</td></tr>
            <tr><td>That's news to me.</td><td>Saya baru tahu (terkejut)</td></tr>
            <tr><td>I'll say!</td><td>Tentu saja / setuju</td></tr></tbody></table>
          <div class="c-ex"><b>Contoh:</b><br>W: "The lecture was really long today."<br>M: "<i>You can say that again.</i>"<br>→ Pria <b>setuju</b> bahwa kuliahnya panjang.</div>` },
        { title: 'Wish & Conditional', html: `
          <p>Kalimat pengandaian menyatakan <b>kebalikan dari kenyataan</b>.</p>
          <table><thead><tr><th>Yang didengar</th><th>Kenyataannya</th></tr></thead><tbody>
            <tr><td>I wish I <b>had</b> finished.</td><td>Belum selesai</td></tr>
            <tr><td>If I <b>had</b> time, I <b>would</b> go.</td><td>Tidak punya waktu, tidak pergi</td></tr>
            <tr><td>I would have called if I <b>had known</b>.</td><td>Tidak tahu, tidak menelepon</td></tr></tbody></table>
          <div class="c-tip"><b>Rumus cepat:</b> positif ↔ negatif, past ↔ present. "I wish I <u>were</u> rich" = sekarang <u>tidak</u> kaya.</div>` },
      ],
    },
    {
      id: 't-lis-talks', exam: 'toefl', section: 'listening', title: 'Longer Conversations & Talks',
      desc: 'Menangkap topik utama dan detail penting dari kuliah atau percakapan panjang.',
      status: 'progress', progress: 40, minutes: 30,
      subs: [
        { title: 'Menangkap Topik Utama', html: `
          <p>Topik utama hampir selalu disebut di <b>1–2 kalimat pertama</b>. Pembicara biasanya memakai penanda seperti <i>"Today I want to talk about…"</i> atau <i>"Let's look at…"</i>.</p>
          <div class="c-ex"><b>Contoh:</b> "Good morning. Today we'll discuss how glaciers shape valleys." → Topik: <b>pembentukan lembah oleh gletser</b>.</div>
          <div class="c-tip"><b>Tips:</b> Jangan tertipu detail menarik di tengah talk. Pertanyaan "mainly about" butuh jawaban yang mencakup <i>seluruh</i> isi.</div>` },
        { title: 'Mencatat Detail', html: `
          <p>Catat angka, nama, alasan (<i>because, since, so that</i>), dan urutan (<i>first, then, finally</i>). Soal detail biasanya muncul berurutan sesuai alur audio.</p>
          <table><thead><tr><th>Penanda</th><th>Biasanya ditanyakan</th></tr></thead><tbody>
            <tr><td>because / the reason is</td><td>Why…?</td></tr>
            <tr><td>for example / such as</td><td>Contoh / detail</td></tr>
            <tr><td>however / but</td><td>Pendapat sebenarnya pembicara</td></tr></tbody></table>` },
      ],
    },
    {
      id: 't-str-sva', exam: 'toefl', section: 'structure', title: 'Subject-Verb Agreement',
      desc: 'Kesesuaian subjek dan kata kerja — topik yang paling sering keluar di Structure.',
      status: 'progress', progress: 60, minutes: 20,
      subs: [
        { title: 'Aturan Dasar', html: `
          <p>Subjek tunggal memakai kata kerja tunggal (<i>is, was, has, -s</i>); subjek jamak memakai kata kerja jamak (<i>are, were, have</i>).</p>
          <div class="c-ex"><b>Contoh:</b><br>✔ The <u>list</u> of items <b>is</b> on the desk.<br>✘ The list of <u>items</u> <b>are</b> on the desk.</div>
          <div class="c-tip"><b>Tips:</b> Coret frasa preposisi (<i>of items, in the box</i>) untuk menemukan subjek sebenarnya.</div>` },
        { title: 'Frasa Penghubung yang Menjebak', html: `
          <p>Frasa berikut <b>tidak</b> mengubah subjek menjadi jamak:</p>
          <table><thead><tr><th>Frasa</th><th>Contoh benar</th></tr></thead><tbody>
            <tr><td>along with</td><td>The professor, along with her assistants, <b>is</b> here.</td></tr>
            <tr><td>as well as</td><td>John, as well as his friends, <b>was</b> late.</td></tr>
            <tr><td>together with</td><td>The manager, together with the staff, <b>has</b> agreed.</td></tr>
            <tr><td>in addition to</td><td>The book, in addition to the notes, <b>is</b> useful.</td></tr></tbody></table>` },
        { title: 'The Number vs A Number', html: `
          <table><thead><tr><th>Bentuk</th><th>Verb</th><th>Contoh</th></tr></thead><tbody>
            <tr><td><b>The</b> number of + plural noun</td><td>tunggal</td><td>The number of cars <b>is</b> rising.</td></tr>
            <tr><td><b>A</b> number of + plural noun</td><td>jamak</td><td>A number of cars <b>are</b> parked outside.</td></tr></tbody></table>
          <div class="c-warn"><b>Ingat:</b> "The number" = jumlahnya (satu angka). "A number of" = beberapa (banyak benda).</div>` },
      ],
    },
    {
      id: 't-str-par', exam: 'toefl', section: 'structure', title: 'Parallel Structure',
      desc: 'Menjaga bentuk kata yang setara dalam daftar dan perbandingan.',
      status: 'new', progress: 0, minutes: 15,
      subs: [
        { title: 'Paralel dalam Daftar', html: `
          <p>Unsur yang dihubungkan <i>and, or, but</i> harus memiliki bentuk gramatikal yang sama.</p>
          <div class="c-ex">✔ She enjoys swimming, hiking, and <b>riding</b> bikes.<br>✘ She enjoys swimming, hiking, and <b>to ride</b> bikes.</div>` },
        { title: 'Paired Conjunctions', html: `
          <table><thead><tr><th>Pasangan</th><th>Contoh</th></tr></thead><tbody>
            <tr><td>both … and</td><td>both <b>fast</b> and <b>accurate</b></td></tr>
            <tr><td>either … or</td><td>either <b>by bus</b> or <b>by train</b></td></tr>
            <tr><td>not only … but also</td><td>not only <b>smart</b> but also <b>kind</b></td></tr></tbody></table>` },
      ],
    },
    {
      id: 't-str-cls', exam: 'toefl', section: 'structure', title: 'Clauses, Connectors & Inversion',
      desc: 'Adjective clause, despite vs although, dan inversi setelah kata negatif.',
      status: 'new', progress: 0, minutes: 25,
      subs: [
        { title: 'Despite vs Although', html: `
          <table><thead><tr><th>Kata</th><th>Diikuti</th><th>Contoh</th></tr></thead><tbody>
            <tr><td>Despite / In spite of</td><td>noun / V-ing</td><td>Despite <b>the rain</b>, …</td></tr>
            <tr><td>Although / Even though</td><td>klausa (S + V)</td><td>Although <b>it rained</b>, …</td></tr></tbody></table>` },
        { title: 'Inversion', html: `
          <p>Jika kalimat diawali kata/frasa negatif, susunannya menjadi seperti kalimat tanya.</p>
          <div class="c-ex">Not until 1900 <b>did photography become</b> popular.<br>Never <b>have I seen</b> such a view.<br>Rarely <b>does he</b> arrive late.</div>
          <div class="c-tip"><b>Pemicu inversi:</b> never, rarely, seldom, hardly, not until, only after, not only.</div>` },
      ],
    },
    {
      id: 't-rd-main', exam: 'toefl', section: 'reading', title: 'Main Idea & Detail Questions',
      desc: 'Menemukan gagasan utama dan informasi spesifik secara cepat.',
      status: 'done', progress: 100, minutes: 30,
      subs: [
        { title: 'Main Idea', html: `
          <p>Gagasan utama passage biasanya ada di kalimat pertama paragraf pertama, atau ringkasan di paragraf terakhir.</p>
          <div class="c-tip"><b>Cek jawaban:</b> pilihan yang terlalu sempit (hanya 1 paragraf) atau terlalu luas (di luar passage) adalah jebakan.</div>` },
        { title: 'Detail & Negative Factual', html: `
          <p>Soal detail: cari kata kunci di soal, <b>scan</b> passage, lalu baca 1–2 kalimat di sekitarnya.</p>
          <p>Soal <i>NOT mentioned</i>: cek ketiga pilihan yang <b>ada</b> di passage — sisanya adalah jawaban.</p>` },
      ],
    },
    {
      id: 't-rd-vocab', exam: 'toefl', section: 'reading', title: 'Vocabulary, Reference & Inference',
      desc: 'Makna kata dari konteks, rujukan kata ganti, dan kesimpulan tersirat.',
      status: 'progress', progress: 30, minutes: 30,
      subs: [
        { title: 'Vocabulary in Context', html: `
          <p>Ganti kata yang ditanyakan dengan tiap pilihan, lalu baca ulang kalimatnya. Pilih yang maknanya tetap logis.</p>
          <table><thead><tr><th>Kata</th><th>Sinonim umum</th></tr></thead><tbody>
            <tr><td>mitigate</td><td>reduce, lessen</td></tr><tr><td>abundant</td><td>plentiful</td></tr>
            <tr><td>scarce</td><td>rare, limited</td></tr><tr><td>indicate</td><td>show, suggest</td></tr></tbody></table>` },
        { title: 'Reference & Inference', html: `
          <p><b>Reference:</b> kata ganti (<i>it, they, this</i>) biasanya merujuk ke kata benda terdekat <i>sebelumnya</i> yang cocok jumlahnya.</p>
          <p><b>Inference:</b> jawaban tidak tertulis langsung, tapi harus <b>didukung</b> oleh teks. Hindari asumsi di luar passage.</p>` },
      ],
    },

    {
      id: 'i-lis-form', exam: 'ielts', section: 'listening', title: 'Form & Note Completion',
      desc: 'Mengisi formulir dengan nama, angka, dan tanggal secara akurat.',
      status: 'progress', progress: 50, minutes: 20,
      subs: [
        { title: 'Batas Kata & Ejaan', html: `
          <p>Perhatikan instruksi seperti <b>"Write NO MORE THAN TWO WORDS AND/OR A NUMBER"</b>. Melebihi batas = salah.</p>
          <div class="c-warn"><b>Ejaan salah = jawaban salah.</b> Nama biasanya dieja huruf per huruf (H-A-R-T-L-E-Y).</div>` },
        { title: 'Angka & Tanggal', html: `
          <table><thead><tr><th>Bunyi mirip</th><th>Cara membedakan</th></tr></thead><tbody>
            <tr><td>fifteen / fifty</td><td>Tekanan suku kata: fif-<b>TEEN</b> vs <b>FIF</b>-ty</td></tr>
            <tr><td>nineteen / ninety</td><td>Sama: nine-<b>TEEN</b> vs <b>NINE</b>-ty</td></tr></tbody></table>
          <div class="c-tip">Tanggal boleh ditulis <i>14 March</i>, <i>14th March</i>, atau <i>March 14</i>.</div>` },
      ],
    },
    {
      id: 'i-lis-mc', exam: 'ielts', section: 'listening', title: 'Multiple Choice & Distractors',
      desc: 'Mengenali pengecoh: informasi yang dikoreksi atau diubah pembicara.',
      status: 'new', progress: 0, minutes: 20,
      subs: [
        { title: 'Mengenali Distractor', html: `
          <p>Pembicara sering menyebut satu informasi lalu <b>mengoreksinya</b>: <i>"It's on Monday — oh no, sorry, Tuesday."</i> Jawaban yang benar adalah informasi terakhir.</p>
          <div class="c-tip">Waspadai kata: <i>actually, sorry, I mean, rather, but</i>.</div>` },
      ],
    },
    {
      id: 'i-rd-tfng', exam: 'ielts', section: 'reading', title: 'True / False / Not Given',
      desc: 'Membedakan informasi yang bertentangan dan yang tidak dibahas.',
      status: 'progress', progress: 70, minutes: 25,
      subs: [
        { title: 'Definisi', html: `
          <table><thead><tr><th>Jawaban</th><th>Artinya</th></tr></thead><tbody>
            <tr><td><b>TRUE</b></td><td>Pernyataan sesuai dengan isi teks</td></tr>
            <tr><td><b>FALSE</b></td><td>Pernyataan <u>bertentangan</u> dengan teks</td></tr>
            <tr><td><b>NOT GIVEN</b></td><td>Teks tidak membahas informasi tersebut</td></tr></tbody></table>
          <div class="c-warn">Jangan memakai pengetahuan umum. Hanya isi teks yang dihitung.</div>` },
        { title: 'Strategi Cepat', html: `
          <p>Soal TFNG berurutan sesuai alur teks. Cari kata kunci yang sulit diparafrase (nama, angka, tahun) untuk menemukan lokasi jawaban.</p>` },
      ],
    },
    {
      id: 'i-rd-head', exam: 'ielts', section: 'reading', title: 'Matching & Sentence Completion',
      desc: 'Mencocokkan informasi ke paragraf dan melengkapi kalimat.',
      status: 'new', progress: 0, minutes: 25,
      subs: [
        { title: 'Matching Information', html: `<p>Baca kalimat pertama tiap paragraf untuk memahami fungsinya (sebab, akibat, solusi, contoh), lalu cocokkan.</p>` },
        { title: 'Sentence Completion', html: `<p>Kata yang ditulis harus diambil <b>persis</b> dari teks dan sesuai grammar kalimat.</p>` },
      ],
    },
    {
      id: 'i-wr-t1', exam: 'ielts', section: 'writing', title: 'Task 1: Describing Graphs',
      desc: 'Struktur, overview, dan kosakata tren untuk grafik, tabel, dan diagram.',
      status: 'progress', progress: 20, minutes: 35,
      subs: [
        { title: 'Struktur Jawaban', html: `
          <ol><li><b>Introduction</b> — parafrase judul grafik.</li><li><b>Overview</b> — 2 tren utama (wajib!).</li><li><b>Body 1 & 2</b> — detail dan angka pendukung.</li></ol>
          <div class="c-warn">Tanpa overview, skor Task Achievement sulit melewati band 5.</div>` },
        { title: 'Kosakata Tren', html: `
          <table><thead><tr><th>Naik</th><th>Turun</th><th>Stabil</th></tr></thead><tbody>
            <tr><td>rose, increased, climbed</td><td>fell, declined, dropped</td><td>remained stable</td></tr>
            <tr><td>soared, surged (tajam)</td><td>plummeted (tajam)</td><td>levelled off</td></tr></tbody></table>` },
      ],
    },
    {
      id: 'i-wr-t2', exam: 'ielts', section: 'writing', title: 'Task 2: Opinion Essay',
      desc: 'Membangun thesis yang jelas dan paragraf argumentatif.',
      status: 'new', progress: 0, minutes: 40,
      subs: [
        { title: 'Struktur 4 Paragraf', html: `
          <table><thead><tr><th>Paragraf</th><th>Isi</th></tr></thead><tbody>
            <tr><td>Introduction</td><td>Parafrase soal + thesis (posisi jelas)</td></tr>
            <tr><td>Body 1</td><td>Alasan utama + contoh</td></tr>
            <tr><td>Body 2</td><td>Alasan kedua / counter-argument</td></tr>
            <tr><td>Conclusion</td><td>Ulangi posisi dengan kata berbeda</td></tr></tbody></table>` },
      ],
    },
    {
      id: 'i-sp-p1', exam: 'ielts', section: 'speaking', title: 'Part 1 & 3: Answer Extension',
      desc: 'Menjawab dengan alasan dan contoh, bukan satu kata.',
      status: 'done', progress: 100, minutes: 15,
      subs: [
        { title: 'Rumus A-R-E', html: `<p><b>A</b>nswer → <b>R</b>eason → <b>E</b>xample.</p>
          <div class="c-ex">"Do you like reading?" → "Yes, I do. <i>I mostly read novels because they help me relax</i>, for example, I just finished a mystery by Agatha Christie."</div>` },
      ],
    },
    {
      id: 'i-sp-p2', exam: 'ielts', section: 'speaking', title: 'Part 2: Cue Card',
      desc: 'Memanfaatkan 1 menit persiapan untuk bicara lancar 2 menit.',
      status: 'new', progress: 0, minutes: 20,
      subs: [
        { title: 'Persiapan 1 Menit', html: `<p>Tulis <b>kata kunci</b>, bukan kalimat lengkap. Buat 1 poin untuk tiap bullet di cue card ditambah satu cerita pribadi.</p>
          <div class="c-tip">Gunakan past tense dengan konsisten jika cue card meminta pengalaman.</div>` },
      ],
    },
  ],

  // ---------- PASSAGE & AUDIO ----------
  passages: {
    't-p1': {
      title: 'Urban Heat Islands',
      html: `<p>On a summer afternoon, the center of a large city can be several degrees warmer than the surrounding countryside. This phenomenon, known as the urban heat island effect, was first documented in the early nineteenth century by the amateur meteorologist Luke Howard, who noticed that temperatures in London were consistently higher than those in nearby villages.</p>
<p>The primary cause of the effect is the replacement of natural land cover with materials such as asphalt, concrete, and brick. These surfaces absorb a large share of the sun's energy during the day and release it slowly as heat after sunset, which is why the difference between urban and rural temperatures is often greatest at night. The problem is made worse by the scarcity of vegetation in city centers. Trees and plants cool their surroundings through evapotranspiration, a process in which water evaporates from leaves and draws heat from the air. In addition, heat generated by vehicles, air conditioners, and factories adds directly to the warmth of the urban atmosphere.</p>
<p>The consequences are more than a matter of comfort. Higher temperatures increase demand for electricity, raise levels of ground-level ozone, and contribute to heat-related illness, particularly among elderly residents.</p>
<p>Fortunately, cities have several ways to <mark>mitigate</mark> the effect. Planting street trees and creating parks restores natural cooling. Roofs painted white or covered with plants reflect sunlight rather than absorb <mark>it</mark>. Some cities have even experimented with lighter-colored pavement, which can lower surface temperatures by more than ten degrees Celsius on a hot day.</p>`,
    },
    'i-p1': {
      title: 'The Rise of Urban Beekeeping',
      html: `<p><b>A</b> Over the past two decades, beekeeping has moved from the countryside to the rooftops of some of the world's busiest cities. In London alone, the number of registered hives more than doubled between 2008 and 2013, and similar growth has been reported in Paris, New York and Melbourne.</p>
<p><b>B</b> Supporters argue that urban beekeeping helps to reverse the decline of pollinators. Cities, they point out, often contain a surprising diversity of flowering plants in parks, gardens and along railway lines, and they are largely free of the agricultural pesticides that have harmed rural colonies.</p>
<p><b>C</b> However, some ecologists have raised concerns. A 2020 study of hives in central London found that the amount of available forage had not kept pace with the number of colonies. When too many honeybees compete for the same flowers, they may also deprive wild bees, such as bumblebees and solitary bees, of the nectar and pollen they need.</p>
<p><b>D</b> As a result, a number of conservation groups now recommend that city residents plant bee-friendly flowers rather than install new hives. Their message is simple: the best way to help bees in cities is to feed them, not to add more of them.</p>`,
    },
  },

  clips: {
    't-c1': { title: 'Short Conversation 1', lines: [['W', 'Did you manage to finish the lab report last night?'], ['M', 'I wish I had. I fell asleep at my desk.']] },
    't-c2': { title: 'Short Conversation 2', lines: [['M', 'This chemistry assignment is taking me forever.'], ['W', "Why don't you ask Dr. Patel during her office hours?"]] },
    't-c3': { title: 'Short Conversation 3', lines: [['W', "Professor Grant's midterm was a lot harder than I expected."], ['M', 'You can say that again.']] },
    't-c4': { title: 'Short Conversation 4', lines: [['M', 'Are you going to the career fair on Friday?'], ['W', "I would if I didn't have to work a double shift."]] },
    't-c5': {
      title: 'Talk: Biology Lecture', lines: [['Professor', "Good morning, everyone. Today I want to talk about a remarkable animal: the Arctic tern. This small seabird, weighing barely more than a hundred grams, makes the longest migration of any animal on Earth. Each year it travels from its breeding grounds in the Arctic all the way to Antarctica and back again, a round trip of roughly seventy thousand kilometers. Why travel so far? Well, by following the summer from one pole to the other, the tern experiences more daylight than any other creature, which gives it more hours to hunt for fish. Researchers using tiny tracking devices have found that the birds don't fly in a straight line. Instead, they follow a zigzag route across the Atlantic to take advantage of prevailing winds, which saves a great deal of energy."]],
    },
    'i-c1': {
      title: 'Section 1: Course Enrolment', lines: [
        ['Receptionist', 'Good morning, Riverside Community Centre. How can I help you?'],
        ['Caller', "Hi, I'd like to enrol in one of your evening courses. The photography one, I think."],
        ['Receptionist', 'Certainly. We have Digital Photography for Beginners, which runs on Tuesday evenings from seven to nine. Can I take your name?'],
        ['Caller', "Yes, it's Daniel Hartley. That's H-A-R-T-L-E-Y."],
        ['Receptionist', 'Thank you, Mr Hartley. The course starts on the fourteenth of March and lasts for eight weeks. The fee is ninety-five pounds, but if you are a member of the centre it is reduced to seventy.'],
        ['Caller', "I'm not a member yet. Is it worth joining?"],
        ['Receptionist', "Membership is twenty pounds a year, so you'd save a little and also get free use of the library. Oh, and you'll need to bring your own camera. A smartphone is fine for the first few sessions."],
        ['Caller', 'Great. Where exactly are the classes held?'],
        ['Receptionist', 'In the Garden Room, on the first floor, next to the café.'],
      ],
    },
  },

  // ---------- SOAL ----------
  // type: mc (pilihan ganda) | error (written expression, opsi = bagian bergaris bawah) | fill (isian singkat)
  questions: [
    // TOEFL Listening
    { id: 't-l1', exam: 'toefl', section: 'listening', chapter: 't-lis-short', topic: 'Wish & Conditional', difficulty: 'mudah', type: 'mc', clip: 't-c1',
      q: 'What does the man mean?', options: ['He finished the report before sleeping.', 'He has not finished the report.', 'He wants to write another report.', 'He left the report at the lab.'], answer: 1,
      explain: '"I wish I had" adalah pengandaian masa lampau, artinya kenyataannya <b>tidak</b> terjadi. Ditambah "I fell asleep at my desk", jelas pria itu <b>belum menyelesaikan</b> laporannya.' },
    { id: 't-l2', exam: 'toefl', section: 'listening', chapter: 't-lis-short', topic: 'Suggestions', difficulty: 'mudah', type: 'mc', clip: 't-c2',
      q: 'What does the woman suggest the man do?', options: ['Finish the assignment later.', 'Change to another class.', 'Get help from the professor.', 'Work in the chemistry lab.'], answer: 2,
      explain: '"Why don\'t you…?" adalah ungkapan <b>saran</b>. Wanita menyarankan bertanya ke Dr. Patel (dosen) saat office hours → <b>minta bantuan profesor</b>.' },
    { id: 't-l3', exam: 'toefl', section: 'listening', chapter: 't-lis-short', topic: 'Idiomatic Expressions', difficulty: 'sedang', type: 'mc', clip: 't-c3',
      q: 'What does the man mean?', options: ['He did not hear what the woman said.', 'He agrees that the exam was difficult.', 'He thinks the woman should retake the exam.', 'He has not taken the exam yet.'], answer: 1,
      explain: '"You can say that again" adalah idiom yang berarti <b>sangat setuju</b>, bukan meminta diulang. Jebakan ada di pilihan A yang mengartikan secara harfiah.' },
    { id: 't-l4', exam: 'toefl', section: 'listening', chapter: 't-lis-short', topic: 'Wish & Conditional', difficulty: 'sedang', type: 'mc', clip: 't-c4',
      q: 'What can be inferred about the woman?', options: ['She will go to the career fair.', 'She is looking for a second job.', 'She will not attend the career fair.', 'She has already found a new job.'], answer: 2,
      explain: '"I would if I didn\'t have to work" = conditional tipe 2 (kebalikan kenyataan). Kenyataannya ia <b>harus bekerja</b>, sehingga <b>tidak akan datang</b> ke career fair.' },
    { id: 't-l5', exam: 'toefl', section: 'listening', chapter: 't-lis-talks', topic: 'Main Topic (Talks)', difficulty: 'sedang', type: 'mc', clip: 't-c5',
      q: 'What is the talk mainly about?', options: ['How seabirds catch fish.', 'The migration of the Arctic tern.', 'The climate of Antarctica.', 'How tracking devices are made.'], answer: 1,
      explain: 'Kalimat pembuka: "Today I want to talk about… the Arctic tern" dan seluruh isi membahas <b>migrasinya</b>. Pilihan lain hanya detail kecil.' },
    { id: 't-l6', exam: 'toefl', section: 'listening', chapter: 't-lis-talks', topic: 'Detail (Talks)', difficulty: 'sulit', type: 'mc', clip: 't-c5',
      q: 'According to the speaker, why do Arctic terns follow a zigzag route?', options: ['To avoid predators.', 'To find more fish.', 'To take advantage of favorable winds.', 'To stay close to land.'], answer: 2,
      explain: 'Dosen mengatakan "…follow a zigzag route… <b>to take advantage of prevailing winds</b>, which saves a great deal of energy." Pilihan B (fish) disebut, tapi sebagai alasan mengikuti musim panas, bukan rute zigzag.' },

    // TOEFL Structure
    { id: 't-s1', exam: 'toefl', section: 'structure', chapter: 't-str-sva', topic: 'Subject-Verb Agreement', difficulty: 'mudah', type: 'mc',
      q: 'The number of international students at the university _______ increased steadily over the past decade.', options: ['have', 'has', 'are', 'having'], answer: 1,
      explain: '"<b>The number of</b> + plural noun" dianggap subjek <b>tunggal</b> → kata kerja tunggal <b>has</b>. Bandingkan: "A number of students <u>have</u>…"' },
    { id: 't-s2', exam: 'toefl', section: 'structure', chapter: 't-str-sva', topic: 'Subject-Verb Agreement', difficulty: 'sedang', type: 'mc',
      q: 'The professor, along with her research assistants, _______ preparing the laboratory for the experiment.', options: ['are', 'were', 'is', 'have been'], answer: 2,
      explain: 'Frasa "<b>along with</b> her research assistants" tidak mengubah subjek. Subjek tetap "The professor" (tunggal) → <b>is</b>.' },
    { id: 't-s3', exam: 'toefl', section: 'structure', chapter: 't-str-par', topic: 'Parallel Structure', difficulty: 'sedang', type: 'error',
      q: 'Photosynthesis {allows} plants {to convert} sunlight, water, and carbon dioxide {into} glucose, oxygen, and {producing} energy.', options: ['allows', 'to convert', 'into', 'producing'], answer: 3,
      explain: 'Daftar "glucose, oxygen, and ___" berisi kata benda, jadi unsur ketiga juga harus kata benda: "…glucose, oxygen, and <b>energy</b>". Kata <b>producing</b> merusak paralelisme.' },
    { id: 't-s4', exam: 'toefl', section: 'structure', chapter: 't-str-cls', topic: 'Connectors', difficulty: 'mudah', type: 'mc',
      q: '_______ the heavy rain, the outdoor graduation ceremony continued as planned.', options: ['Although', 'Despite', 'Because', 'Even though'], answer: 1,
      explain: '"The heavy rain" adalah <b>noun phrase</b>, bukan klausa. Yang bisa diikuti noun phrase adalah <b>Despite</b>. "Although/Even though" membutuhkan subjek + verb.' },
    { id: 't-s5', exam: 'toefl', section: 'structure', chapter: 't-str-cls', topic: 'Inversion', difficulty: 'sulit', type: 'mc',
      q: 'Not until the late nineteenth century _______ widely available to the public.', options: ['photography became', 'did photography become', 'photography did become', 'becoming photography'], answer: 1,
      explain: 'Kalimat diawali "<b>Not until</b>…" memicu <b>inversi</b>: auxiliary + subjek + verb dasar → "<b>did photography become</b>".' },
    { id: 't-s6', exam: 'toefl', section: 'structure', chapter: 't-str-sva', topic: 'Subject-Verb Agreement', difficulty: 'sedang', type: 'error',
      q: 'The Amazon River, {which} carries more water than any other river, {flow} through {several} South American countries {before} reaching the Atlantic.', options: ['which', 'flow', 'several', 'before'], answer: 1,
      explain: 'Subjek utama "The Amazon River" tunggal. Abaikan klausa sisipan "which carries…". Kata kerjanya harus <b>flows</b>, bukan flow.' },

    // TOEFL Reading
    { id: 't-r1', exam: 'toefl', section: 'reading', chapter: 't-rd-main', topic: 'Main Idea', difficulty: 'mudah', type: 'mc', passage: 't-p1',
      q: 'What does the passage mainly discuss?', options: ['The life of the meteorologist Luke Howard', 'The causes, effects, and solutions of urban heat islands', 'Why rural areas are cooler at night', 'The history of air conditioning'], answer: 1,
      explain: 'Passage membahas penyebab (paragraf 2), dampak (paragraf 3), dan solusi (paragraf 4) dari urban heat island. Pilihan A dan C hanya detail kecil.' },
    { id: 't-r2', exam: 'toefl', section: 'reading', chapter: 't-rd-vocab', topic: 'Vocabulary in Context', difficulty: 'mudah', type: 'mc', passage: 't-p1',
      q: 'The word "mitigate" in paragraph 4 is closest in meaning to', options: ['measure', 'reduce', 'explain', 'ignore'], answer: 1,
      explain: '"Mitigate" = <b>mengurangi</b> dampak. Paragraf 4 menyebut cara-cara menurunkan suhu kota → "<b>reduce</b>".' },
    { id: 't-r3', exam: 'toefl', section: 'reading', chapter: 't-rd-main', topic: 'Detail', difficulty: 'sedang', type: 'mc', passage: 't-p1',
      q: 'According to the passage, why is the temperature difference often greatest at night?', options: ['Vehicles produce more heat at night.', 'Urban surfaces release stored heat after sunset.', 'Plants stop evapotranspiration during the day.', 'Rural areas absorb more sunlight.'], answer: 1,
      explain: 'Paragraf 2: permukaan kota "absorb… during the day and <b>release it slowly as heat after sunset</b>, which is why the difference… is often greatest at night."' },
    { id: 't-r4', exam: 'toefl', section: 'reading', chapter: 't-rd-vocab', topic: 'Reference', difficulty: 'sedang', type: 'mc', passage: 't-p1',
      q: 'The word "it" in paragraph 4 refers to', options: ['roof', 'sunlight', 'the effect', 'the city'], answer: 1,
      explain: '"Roofs… reflect sunlight rather than absorb <b>it</b>." Yang dipantulkan dan diserap adalah <b>sunlight</b>. "Roofs" jamak sehingga tidak cocok dengan "it".' },
    { id: 't-r5', exam: 'toefl', section: 'reading', chapter: 't-rd-vocab', topic: 'Inference', difficulty: 'sedang', type: 'mc', passage: 't-p1',
      q: 'It can be inferred from the passage that elderly residents', options: ['are more vulnerable to extreme heat', 'use less electricity than others', 'prefer living in rural areas', 'are responsible for ground-level ozone'], answer: 0,
      explain: 'Paragraf 3 menyebut heat-related illness "<b>particularly among elderly residents</b>" → lansia <b>lebih rentan</b> terhadap panas.' },
    { id: 't-r6', exam: 'toefl', section: 'reading', chapter: 't-rd-main', topic: 'Negative Factual', difficulty: 'sulit', type: 'mc', passage: 't-p1',
      q: 'Which of the following is NOT mentioned as a way to reduce the urban heat island effect?', options: ['Planting street trees', 'Painting roofs white', 'Building taller buildings', 'Using lighter-colored pavement'], answer: 2,
      explain: 'Paragraf 4 menyebut pohon, atap putih/hijau, dan perkerasan berwarna terang. <b>Bangunan lebih tinggi tidak disebut</b> sama sekali.' },

    // IELTS Listening
    { id: 'i-l1', exam: 'ielts', section: 'listening', chapter: 'i-lis-form', topic: 'Names & Spelling', difficulty: 'mudah', type: 'fill', clip: 'i-c1',
      instr: 'Complete the form. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.', q: 'Name: Daniel _______', answer: ['hartley'],
      explain: 'Penelepon mengeja namanya: <b>H-A-R-T-L-E-Y</b>. Ejaan harus tepat, "Hartly" atau "Heartley" dianggap salah.' },
    { id: 'i-l2', exam: 'ielts', section: 'listening', chapter: 'i-lis-form', topic: 'Numbers & Dates', difficulty: 'mudah', type: 'fill', clip: 'i-c1',
      instr: 'Complete the form. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.', q: 'Course start date: _______ March', answer: ['14', '14th', 'fourteenth'],
      explain: '"The course starts on the <b>fourteenth</b> of March." Jawaban 14, 14th, atau fourteenth semuanya diterima.' },
    { id: 'i-l3', exam: 'ielts', section: 'listening', chapter: 'i-lis-form', topic: 'Numbers & Dates', difficulty: 'sedang', type: 'fill', clip: 'i-c1',
      instr: 'Complete the form. Write NO MORE THAN TWO WORDS AND/OR A NUMBER.', q: 'Fee for non-members: £_______', answer: ['95', 'ninety-five', 'ninety five'],
      explain: 'Biaya normal <b>£95</b>; £70 hanya untuk member. Penelepon belum menjadi member, jadi jawabannya 95. Hati-hati bunyi <i>ninety-five</i> vs <i>nineteen</i>.' },
    { id: 'i-l4', exam: 'ielts', section: 'listening', chapter: 'i-lis-mc', topic: 'Distractors', difficulty: 'sedang', type: 'mc', clip: 'i-c1',
      q: 'What does the receptionist say about membership?', options: ['It is free for students.', 'It costs £20 per year.', 'It includes a free camera.', 'It must be paid monthly.'], answer: 1,
      explain: '"Membership is <b>twenty pounds a year</b>." Kamera disebut, tapi peserta harus membawa sendiri, bukan gratis dari membership.' },
    { id: 'i-l5', exam: 'ielts', section: 'listening', chapter: 'i-lis-mc', topic: 'Places & Locations', difficulty: 'sedang', type: 'mc', clip: 'i-c1',
      q: 'Where are the classes held?', options: ['In the library', 'In the café', 'In the Garden Room on the first floor', 'On the ground floor next to reception'], answer: 2,
      explain: '"In the <b>Garden Room, on the first floor</b>, next to the café." Café hanya penanda lokasi (distractor).' },
    { id: 'i-l6', exam: 'ielts', section: 'listening', chapter: 'i-lis-mc', topic: 'Distractors', difficulty: 'mudah', type: 'mc', clip: 'i-c1',
      q: 'What should students bring to the first few sessions?', options: ['A professional camera', 'A camera or a smartphone', 'A printed photo', 'Their membership card'], answer: 1,
      explain: '"You\'ll need to bring your own camera. <b>A smartphone is fine</b> for the first few sessions." Jadi kamera atau smartphone.' },

    // IELTS Reading
    { id: 'i-r1', exam: 'ielts', section: 'reading', chapter: 'i-rd-tfng', topic: 'True/False/Not Given', difficulty: 'mudah', type: 'mc', passage: 'i-p1',
      q: 'The number of registered hives in London increased between 2008 and 2013.', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answer: 0,
      explain: 'Paragraf A: jumlah sarang "<b>more than doubled</b> between 2008 and 2013" → bertambah → <b>TRUE</b>.' },
    { id: 'i-r2', exam: 'ielts', section: 'reading', chapter: 'i-rd-tfng', topic: 'True/False/Not Given', difficulty: 'sedang', type: 'mc', passage: 'i-p1',
      q: 'Honey produced in cities is of higher quality than rural honey.', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answer: 2,
      explain: 'Teks tidak membahas <b>kualitas madu</b> sama sekali → <b>NOT GIVEN</b>. Jangan memakai asumsi sendiri.' },
    { id: 'i-r3', exam: 'ielts', section: 'reading', chapter: 'i-rd-tfng', topic: 'True/False/Not Given', difficulty: 'sedang', type: 'mc', passage: 'i-p1',
      q: 'Research shows that central London has more than enough flowers for its bee colonies.', options: ['TRUE', 'FALSE', 'NOT GIVEN'], answer: 1,
      explain: 'Paragraf C: forage (sumber bunga) "<b>had not kept pace</b> with the number of colonies" = tidak cukup. Bertentangan dengan pernyataan → <b>FALSE</b>.' },
    { id: 'i-r4', exam: 'ielts', section: 'reading', chapter: 'i-rd-head', topic: 'Matching Information', difficulty: 'sedang', type: 'mc', passage: 'i-p1',
      q: 'Which paragraph describes a possible negative effect on wild bees?', options: ['Paragraph A', 'Paragraph B', 'Paragraph C', 'Paragraph D'], answer: 2,
      explain: 'Paragraf C: honeybees bisa "<b>deprive wild bees</b>… of the nectar and pollen they need".' },
    { id: 'i-r5', exam: 'ielts', section: 'reading', chapter: 'i-rd-head', topic: 'Sentence Completion', difficulty: 'sulit', type: 'fill', passage: 'i-p1',
      instr: 'Write ONE WORD ONLY from the passage (hyphenated words count as one).', q: 'Conservation groups advise city residents to plant _______ flowers instead of installing hives.', answer: ['bee-friendly', 'bee friendly'],
      explain: 'Paragraf D: "…plant <b>bee-friendly</b> flowers rather than install new hives". Kata harus diambil persis dari teks.' },

    // IELTS Writing (latihan konsep)
    { id: 'i-w1', exam: 'ielts', section: 'writing', chapter: 'i-wr-t1', topic: 'Task 1 Overview', difficulty: 'sedang', type: 'mc',
      q: 'Which sentence is the best OVERVIEW for a line graph showing internet access in three countries (2000–2020)?', options: ['In 2000, Canada had 42% internet access.', 'Overall, internet access rose in all three countries, with Canada remaining the highest throughout.', 'I think internet access is very important for development.', 'The graph shows data about the internet.'], answer: 1,
      explain: 'Overview merangkum <b>tren utama</b> tanpa angka detail. A terlalu detail, C berisi opini (dilarang di Task 1), D terlalu umum.' },
    { id: 'i-w2', exam: 'ielts', section: 'writing', chapter: 'i-wr-t1', topic: 'Vocabulary of Trends', difficulty: 'mudah', type: 'mc',
      q: 'Which phrase best describes a sudden, large increase in a graph?', options: ['declined gradually', 'remained stable', 'rose dramatically', 'fluctuated slightly'], answer: 2,
      explain: '"<b>Rose dramatically</b>" = naik tajam. Variasi lain: <i>soared, surged, increased significantly</i>.' },
    { id: 'i-w3', exam: 'ielts', section: 'writing', chapter: 'i-wr-t2', topic: 'Task Requirements', difficulty: 'mudah', type: 'mc',
      q: 'What is the minimum number of words required for Writing Task 2?', options: ['150 words', '200 words', '250 words', '300 words'], answer: 2,
      explain: 'Task 2 minimal <b>250 kata</b>, Task 1 minimal 150 kata. Di bawah batas ini skor Task Response akan dikurangi.' },
    { id: 'i-w4', exam: 'ielts', section: 'writing', chapter: 'i-wr-t2', topic: 'Cohesion', difficulty: 'mudah', type: 'mc',
      q: 'Public transport reduces traffic congestion. _______, it lowers air pollution in city centres.', options: ['However', 'Furthermore', 'Instead', 'Otherwise'], answer: 1,
      explain: 'Kalimat kedua <b>menambahkan</b> manfaat lain, jadi linking word penambahan: <b>Furthermore</b>. "However" untuk kontras.' },
    { id: 'i-w5', exam: 'ielts', section: 'writing', chapter: 'i-wr-t2', topic: 'Task Response', difficulty: 'sedang', type: 'mc',
      q: '"Some people think university education should be free for everyone. To what extent do you agree?" Which is the strongest thesis statement?', options: ['There are many opinions about university education.', 'I completely agree that university should be free, as it widens access to opportunity and benefits the economy as a whole.', 'University is expensive in some countries and cheap in others.', 'This essay will talk about university.'], answer: 1,
      explain: 'Thesis yang kuat menyatakan <b>posisi yang jelas</b> (completely agree) dan <b>alasan utama</b> yang akan dikembangkan di body paragraph.' },

    // IELTS Speaking (latihan strategi)
    { id: 'i-sp1', exam: 'ielts', section: 'speaking', chapter: 'i-sp-p1', topic: 'Part 1 Answers', difficulty: 'mudah', type: 'mc',
      q: 'Examiner: "Do you like reading?" Which answer is most suitable?', options: ['Yes.', 'Yes, I do. I mostly read novels because they help me relax after a long day.', 'Reading is an activity that people do with books.', 'No comment.'], answer: 1,
      explain: 'Gunakan pola <b>Answer + Reason (+ Example)</b>. Jawaban satu kata menurunkan skor Fluency.' },
    { id: 'i-sp2', exam: 'ielts', section: 'speaking', chapter: 'i-sp-p2', topic: 'Test Format', difficulty: 'mudah', type: 'mc',
      q: 'In Speaking Part 2, how much time do you have to prepare before speaking?', options: ['30 seconds', '1 minute', '2 minutes', 'No preparation time'], answer: 1,
      explain: 'Kandidat mendapat <b>1 menit</b> persiapan (boleh mencatat), lalu berbicara hingga <b>2 menit</b>.' },
    { id: 'i-sp3', exam: 'ielts', section: 'speaking', chapter: 'i-sp-p2', topic: 'Fluency Strategies', difficulty: 'sedang', type: 'mc',
      q: 'You forget the word "microwave" while speaking. What is the best strategy?', options: ['Stop and stay silent until you remember.', 'Say the word in your first language.', 'Paraphrase: "the machine we use to heat food quickly".', 'Ask the examiner for the word.'], answer: 2,
      explain: '<b>Parafrase</b> menjaga kelancaran dan menunjukkan kemampuan Lexical Resource. Diam lama menurunkan skor Fluency.' },
    { id: 'i-sp4', exam: 'ielts', section: 'speaking', chapter: 'i-sp-p1', topic: 'Part 3 Answers', difficulty: 'sedang', type: 'mc',
      q: 'Part 3: "Why do some people prefer living in big cities?" Which response is strongest?', options: ['Because cities are big.', 'I live in a city.', 'Mainly for career opportunities. Big cities attract companies, so young graduates often move there. That said, the cost of living can be a serious drawback.', 'I don\'t know, maybe they like it.'], answer: 2,
      explain: 'Part 3 menilai kemampuan berargumen: <b>alasan + penjelasan + sudut pandang lain</b> ("That said…").' },
    { id: 'i-sp5', exam: 'ielts', section: 'speaking', chapter: 'i-sp-p1', topic: 'Fluency Strategies', difficulty: 'mudah', type: 'mc',
      q: 'Which is the most natural way to buy time when you need to think?', options: ['Ummm… ummm… ummm…', 'That\'s an interesting question. Let me think about it for a second.', 'Next question, please.', 'I can\'t answer that.'], answer: 1,
      explain: 'Ungkapan pengisi yang alami (<b>"That\'s an interesting question…"</b>) memberi waktu berpikir tanpa terdengar ragu.' },
  ],

  writingTasks: [
    { id: 'i-wt1', task: 1, minutes: 20, minWords: 150, title: 'Writing Task 1',
      prompt: 'The line graph below shows the percentage of households with internet access in three countries between 2000 and 2020.<br><br>Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
      chart: { labels: ['2000', '2005', '2010', '2015', '2020'], series: [['Canada', [42, 64, 79, 88, 94]], ['Brazil', [5, 14, 27, 48, 71]], ['India', [1, 3, 8, 22, 48]]] },
      sample: 'The line graph illustrates the proportion of households with internet access in Canada, Brazil and India over a twenty-year period from 2000. Overall, access rose considerably in all three countries, with Canada consistently recording the highest figures, while India saw the most dramatic relative growth…' },
    { id: 'i-wt2', task: 2, minutes: 40, minWords: 250, title: 'Writing Task 2',
      prompt: 'Some people believe that unpaid community service should be a compulsory part of high school programmes (for example, working for a charity, improving the neighbourhood or teaching sports to younger children).<br><br><b>To what extent do you agree or disagree?</b><br><br>Give reasons for your answer and include any relevant examples from your own knowledge or experience.',
      sample: 'It is often argued that secondary schools should require students to complete unpaid community work. I strongly agree with this view, as such programmes develop valuable life skills and strengthen the bond between young people and their communities…' },
  ],

  // ---------- PAKET TEST ----------
  packages: [
    { id: 'toefl-full', exam: 'toefl', name: 'Full Test TOEFL ITP', type: 'full', badge: 'Paling populer', desc: 'Simulasi lengkap 3 section dengan timer per section seperti ujian resmi.',
      sections: [['listening', 35], ['structure', 25], ['reading', 55]] },
    { id: 'toefl-listening', exam: 'toefl', name: 'Listening Only', type: 'section', desc: 'Short conversations dan talk. Audio hanya diputar satu kali.', sections: [['listening', 35]] },
    { id: 'toefl-structure', exam: 'toefl', name: 'Structure Only', type: 'section', desc: 'Sentence completion dan error identification.', sections: [['structure', 25]] },
    { id: 'toefl-reading', exam: 'toefl', name: 'Reading Only', type: 'section', desc: 'Passage akademik dengan soal main idea, vocabulary, dan inference.', sections: [['reading', 55]] },
    { id: 'toefl-kilat', exam: 'toefl', name: 'Tes Kilat 4 Menit', type: 'section', badge: 'Demo', desc: 'Latihan singkat Structure untuk pemanasan (timer pendek).', sections: [['structure', 4]] },
    { id: 'ielts-full', exam: 'ielts', name: 'Full Test IELTS Academic', type: 'full', badge: 'Paling populer', desc: 'Listening, Reading, dan Writing dalam satu sesi. Speaking dilakukan bersama tutor.',
      sections: [['listening', 30], ['reading', 60], ['writing', 60]] },
    { id: 'ielts-listening', exam: 'ielts', name: 'Listening Only', type: 'section', desc: 'Form completion dan multiple choice.', sections: [['listening', 30]] },
    { id: 'ielts-reading', exam: 'ielts', name: 'Reading Only', type: 'section', desc: 'True/False/Not Given, matching, dan sentence completion.', sections: [['reading', 60]] },
    { id: 'ielts-writing', exam: 'ielts', name: 'Writing Only', type: 'section', desc: 'Task 1 (grafik) dan Task 2 (essay) dengan penghitung kata. Dinilai tutor.', sections: [['writing', 60]] },
  ],

  rules: {
    toefl: ['Setiap section memiliki timer sendiri. Saat waktu habis, jawaban otomatis tersimpan dan berlanjut ke section berikutnya.', 'Audio Listening hanya dapat diputar <b>satu kali</b>.', 'Kamu bisa menandai soal ragu-ragu dan kembali sebelum section berakhir.', 'Tidak ada pengurangan nilai untuk jawaban salah, jadi jawab semua soal.'],
    ielts: ['Listening: audio diputar satu kali. Ejaan yang salah dianggap salah.', 'Writing: Task 1 minimal 150 kata, Task 2 minimal 250 kata. Jawaban dinilai tutor EnglishOn.', 'Speaking tidak diujikan online. Booking trial class untuk tes Speaking bersama tutor.'],
  },

  // ---------- RIWAYAT & HASIL ----------
  history: {
    toefl: [['12 Mei', 463], ['2 Jun', 480], ['23 Jun', 497], ['14 Jul', 503], ['4 Agu', 509], ['25 Agu', 516], ['15 Sep', 523], ['6 Okt', 537]],
    ielts: [['20 Mei', 5.0], ['10 Jun', 5.5], ['1 Jul', 5.5], ['22 Jul', 6.0], ['12 Agu', 6.0], ['2 Sep', 6.5], ['30 Sep', 6.5]],
  },

  // Dipakai di halaman hasil/review jika user belum mengerjakan test di browser ini.
  sampleAttempts: {
    toefl: {
      pkg: 'toefl-full', date: '2026-10-06T10:20:00', duration: 6420,
      answers: { 't-l1': 1, 't-l2': 2, 't-l3': 0, 't-l4': 2, 't-l5': 1, 't-l6': 1, 't-s1': 0, 't-s2': 0, 't-s3': 3, 't-s4': 1, 't-s5': 0, 't-s6': 1, 't-r1': 1, 't-r2': 1, 't-r3': 1, 't-r4': 0, 't-r5': 0 },
      flags: ['t-s5', 't-r4'],
    },
    ielts: {
      pkg: 'ielts-full', date: '2026-09-30T09:00:00', duration: 9480,
      answers: {
        'i-l1': 'Hartley', 'i-l2': '14', 'i-l3': '90', 'i-l4': 1, 'i-l5': 1, 'i-l6': 1,
        'i-r1': 0, 'i-r2': 0, 'i-r3': 1, 'i-r4': 2, 'i-r5': 'bee friendly',
        'i-wt1': 'The line graph compares the percentage of households that had access to the internet in Canada, Brazil and India between 2000 and 2020. Overall, the proportion of connected homes increased significantly in all three countries over the period. Canada had the highest level of access throughout, while India experienced the most rapid growth in the final decade. In 2000, 42% of Canadian households were online, compared with only 5% in Brazil and just 1% in India. Over the next ten years, the figure for Canada climbed steadily to 79%, whereas Brazil reached 27% and India remained below 10%. From 2010 onwards, the gap began to narrow. Access in Brazil rose sharply to 71% by 2020, and India saw a dramatic increase to 48%. Meanwhile, the Canadian figure levelled off at around 94%, suggesting that internet access there had almost reached saturation.',
        'i-wt2': 'In many countries, educators are debating whether teenagers should be required to do unpaid community service as part of their high school studies. In my opinion, such programmes are highly beneficial, and I largely agree that they should be compulsory, provided that the workload is reasonable. The main reason is that community service teaches skills that are rarely developed in a classroom. When students organise a charity event or coach younger children in sport, they learn to communicate, to manage their time and to take responsibility for other people. These abilities are valued by universities and employers, and they help young people become confident adults. For example, in Japan many schools ask pupils to clean public areas, and this is widely credited with creating a strong sense of civic duty. A second advantage is that volunteering connects teenagers with people from different backgrounds. Students who help in elderly care homes or local food banks gain a better understanding of social problems, which may encourage them to remain active citizens later in life. On the other hand, critics argue that compulsory service is no longer truly voluntary and could add stress to an already busy timetable. This concern is valid, but it can be addressed by offering a wide range of activities and by limiting the requirement to a few hours each month. In conclusion, although schools must design these programmes carefully, I believe that making community service a compulsory part of education brings clear benefits to both students and society.',
      },
      flags: ['i-l3', 'i-r2'],
    },
  },

  recentActivity: [
    { icon: 'check-circle', text: 'Menyelesaikan bab <b>Main Idea & Detail Questions</b>', time: '2 jam lalu' },
    { icon: 'timer', text: 'Simulasi <b>Full Test TOEFL ITP</b> — skor 537', time: '6 Okt' },
    { icon: 'book-open', text: 'Membuka bab <b>Subject-Verb Agreement</b>', time: '5 Okt' },
    { icon: 'flag', text: 'Menandai 3 soal di Bank Soal untuk diulang', time: '3 Okt' },
  ],

  testimonials: [
    { name: 'Dimas Pratama', role: 'Mahasiswa S2', score: 'TOEFL ITP 487 → 573', text: 'Pembahasan per soal dalam bahasa Indonesia bikin saya akhirnya paham kenapa jawaban saya salah, bukan cuma tahu kuncinya.' },
    { name: 'Nadia Putri', role: 'Pejuang beasiswa', score: 'IELTS 6.0 → 7.0', text: 'Simulasi Reading dan Listening dengan timer terasa seperti ujian sungguhan. Saya jadi tidak kaget di hari tes.' },
    { name: 'Andreas Wijaya', role: 'Karyawan swasta', score: 'TOEFL ITP 450 → 527', text: 'Analisis kelemahan per topik membantu saya fokus. Ternyata masalah utama saya di inversion dan parallel structure.' },
  ],

  // full = akses penuh (dibuka admin setelah siswa datang ke kantor / menghubungi EnglishOn)
  students: [
    { name: 'Rina Maharani', email: 'rina.maharani@email.com', exam: 'toefl', last: 537, progress: 58, tests: 8, joined: '12 Mei 2026', full: true },
    { name: 'Dimas Pratama', email: 'dimas.p@email.com', exam: 'toefl', last: 573, progress: 91, tests: 12, joined: '3 Apr 2026', full: true },
    { name: 'Nadia Putri', email: 'nadia.putri@email.com', exam: 'ielts', last: 7.0, progress: 84, tests: 6, joined: '18 Mar 2026', full: true },
    { name: 'Andreas Wijaya', email: 'andreas.w@email.com', exam: 'toefl', last: 527, progress: 66, tests: 9, joined: '9 Mei 2026', full: true },
    { name: 'Siti Rahmawati', email: 'siti.rahma@email.com', exam: 'ielts', last: 6.0, progress: 42, tests: 1, joined: '1 Jul 2026', full: false },
    { name: 'Bagus Setiawan', email: 'bagus.s@email.com', exam: 'toefl', last: 480, progress: 25, tests: 1, joined: '20 Agu 2026', full: false },
    { name: 'Clara Wibisono', email: 'clara.w@email.com', exam: 'ielts', last: 6.5, progress: 73, tests: 5, joined: '14 Jun 2026', full: true },
    { name: 'Fajar Nugroho', email: 'fajar.n@email.com', exam: 'toefl', last: null, progress: 8, tests: 0, joined: '15 Okt 2026', full: false },
  ],

  bookings: [
    { name: 'Siti Rahmawati', wa: '0813-xxxx-2210', cls: 'speaking', date: '24 Okt 2026', slot: '16.00', mode: 'Offline (kantor)', status: 'baru' },
    { name: 'Bagus Setiawan', wa: '0857-xxxx-9031', cls: 'toefl', date: '25 Okt 2026', slot: '09.00', mode: 'Online (Zoom)', status: 'dikonfirmasi' },
    { name: 'Clara Wibisono', wa: '0812-xxxx-4478', cls: 'writing', date: '26 Okt 2026', slot: '19.00', mode: 'Online (Zoom)', status: 'dikonfirmasi' },
  ],
};
