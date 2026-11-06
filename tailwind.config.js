// Dipakai "npm run css" untuk membuat public/assets/app.css dari kelas di HTML & app.js
module.exports = {
  content: ['public/**/*.html', 'public/assets/*.js', 'src/**/*.js'], // src: isi HTML bawaan (materi, deskripsi program)
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
