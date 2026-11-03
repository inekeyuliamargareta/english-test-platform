-- Skema database EnglishOn (MySQL 8). Jalankan: npm run migrate
-- Kolom JSON dipakai untuk data yang selalu dibaca utuh (sub-bab, opsi soal, jawaban siswa).

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  password_hash VARCHAR(100) NOT NULL,
  role          ENUM('student','admin') NOT NULL DEFAULT 'student',
  exam          VARCHAR(20),
  target_toefl  INT DEFAULT 550,
  target_ielts  DECIMAL(2,1) DEFAULT 6.5,
  full_access   TINYINT(1) NOT NULL DEFAULT 0,   -- 0 = akun gratis (1x simulasi), 1 = dibuka admin
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Master ujian (Admin → Master Test)
CREATE TABLE IF NOT EXISTS exams (
  code      VARCHAR(20) PRIMARY KEY,
  name      VARCHAR(80) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  active    TINYINT(1) NOT NULL DEFAULT 0,
  rgb       VARCHAR(20) NOT NULL,   -- warna aksen "R G B"
  rgb_dark  VARCHAR(20) NOT NULL,
  rgb_soft  VARCHAR(20) NOT NULL,
  scale     VARCHAR(30),
  rules     JSON,                   -- aturan simulasi (array HTML)
  about     TEXT,                   -- penjelasan program untuk siswa (HTML)
  recommend JSON,                   -- rekomendasi kelas per level placement {A2,B1,B2,C1}
  sort      INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exam_sections (
  exam_key VARCHAR(20) NOT NULL,
  id       VARCHAR(30) NOT NULL,
  name     VARCHAR(80) NOT NULL,
  short    VARCHAR(40) NOT NULL,
  icon     VARCHAR(40) NOT NULL DEFAULT 'book-open',
  official VARCHAR(60),
  tutor    TINYINT(1) NOT NULL DEFAULT 0,  -- 1 = dinilai tutor (Writing)
  sort     INT NOT NULL DEFAULT 0,
  PRIMARY KEY (exam_key, id),
  FOREIGN KEY (exam_key) REFERENCES exams(code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapters (
  id       VARCHAR(40) PRIMARY KEY,
  exam     VARCHAR(20) NOT NULL,
  section  VARCHAR(30) NOT NULL,
  title    VARCHAR(160) NOT NULL,
  descr    TEXT,
  minutes  INT NOT NULL DEFAULT 20,
  subs     JSON NOT NULL,          -- [{title, html}]
  draft    TINYINT(1) NOT NULL DEFAULT 0,
  sort     INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS passages (
  id    VARCHAR(40) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  html  MEDIUMTEXT NOT NULL
);

-- Audio Listening. audio_url kosong = dibacakan text-to-speech browser dari transkrip (mode demo).
CREATE TABLE IF NOT EXISTS clips (
  id        VARCHAR(40) PRIMARY KEY,
  title     VARCHAR(160) NOT NULL,
  transcript JSON NOT NULL,        -- transkrip [[pembicara, teks]]
  audio_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS questions (
  id         VARCHAR(40) PRIMARY KEY,
  exam       VARCHAR(20) NOT NULL,
  section    VARCHAR(30) NOT NULL,
  chapter    VARCHAR(40),
  topic      VARCHAR(80),
  difficulty ENUM('mudah','sedang','sulit') NOT NULL DEFAULT 'sedang',
  type       ENUM('mc','error','fill') NOT NULL DEFAULT 'mc',
  q          TEXT NOT NULL,
  instr      VARCHAR(255),
  options    JSON,                 -- pilihan ganda
  answer     JSON NOT NULL,        -- index opsi, atau array jawaban isian
  explanation TEXT,
  clip       VARCHAR(40),
  passage    VARCHAR(40),
  pool       ENUM('bank','placement') NOT NULL DEFAULT 'bank',  -- bank = simulasi & latihan
  sort       INT NOT NULL DEFAULT 0,
  INDEX (exam, section)
);

CREATE TABLE IF NOT EXISTS writing_tasks (
  id        VARCHAR(40) PRIMARY KEY,
  exam      VARCHAR(20) NOT NULL,
  section   VARCHAR(30) NOT NULL,
  task      INT NOT NULL,
  minutes   INT NOT NULL,
  min_words INT NOT NULL,
  title     VARCHAR(80) NOT NULL,
  prompt    TEXT NOT NULL,
  chart     JSON,
  sample    TEXT
);

CREATE TABLE IF NOT EXISTS packages (
  id       VARCHAR(40) PRIMARY KEY,
  exam     VARCHAR(20) NOT NULL,
  name     VARCHAR(120) NOT NULL,
  type     ENUM('full','section','placement') NOT NULL,
  badge    VARCHAR(40),
  descr    TEXT,
  sections JSON NOT NULL,          -- [[sectionId, menit]]
  sort     INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chapter_progress (
  user_id    INT NOT NULL,
  chapter_id VARCHAR(40) NOT NULL,
  progress   INT NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, chapter_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Hasil simulasi. Skor dihitung di server saat submit.
CREATE TABLE IF NOT EXISTS attempts (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  package_id VARCHAR(40) NOT NULL,
  exam       VARCHAR(20) NOT NULL,
  answers    JSON NOT NULL,
  flags      JSON NOT NULL,
  duration   INT NOT NULL DEFAULT 0,  -- detik
  result     JSON NOT NULL,           -- {sections:[...], total}
  total      DECIMAL(5,1),            -- skor total (Full Test), null = per section
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Ebook per program. File PDF disimpan di folder storage/ebooks (tidak bisa dibuka langsung lewat URL),
-- dikirim lewat API setelah dicek: ebook berbayar hanya untuk siswa Akses Penuh.
CREATE TABLE IF NOT EXISTS ebooks (
  id         VARCHAR(40) PRIMARY KEY,
  exam       VARCHAR(20) NOT NULL,
  title      VARCHAR(160) NOT NULL,
  descr      TEXT,
  access     ENUM('free','paid') NOT NULL DEFAULT 'free',
  file       VARCHAR(255),
  size       INT,
  sort       INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
