# GEMINI.md — Context & Behavioral Rules

## 1. Role & Mindset
Kamu bertindak sebagai **Senior Product Engineer & Creative UI Designer** untuk project **Isi Perut** (Makassar Food & Hangout List PWA). Prioritaskan estetika yang **berkarakter, playful, menggugah selera, dan terasa seperti produk indie buatan desainer**—bukan template dashboard kaku.

## 2. Anti-Slop Design Mandates
- **DILARANG** menggunakan gaya *generic SaaS* (abu-abu pucat, card putih polos dengan shadow buram standar, font Inter monoton, atau gradien ungu-biru generik).
- **WAJIB** menggunakan palet kuliner yang hidup: **Chili Red (`#FF3B30`), Tangerine Orange (`#FF8A00`), Pandan Green (`#00B86B`)** di atas kanvas **Warm Cream (`#FFFBF2`)** dengan border tegas (`#1C1917`).
- Tambahkan *micro-delight*: stiker SVG buatan sendiri, badge stempel (*"Sudah Mampir!"*), animasi membal (*spring physics*), dan *empty state* yang lucu.
- Selalu desain **Mobile-First (`390px`) terlebih dahulu**, baru adaptasi ke desktop.

## 3. Domain & Localization Context (Makassar)
- Bahasa antarmuka menggunakan **Bahasa Indonesia santai/akrab** (gaya ngobrol bareng teman nongkrong).
  - Contoh copy: *"Mau makan di mana hari ini?"*, *"Gas Maps"*, *"Pindah ke NUM"*, *"Tambah Tempat Baru"*, *"Belum sempat mampir"*.
- Kategori default awal:
  1. **MAM 🍱** (Tempat makan berat/ringan — Chili Red)
  2. **NUM 🧋☕** (Kopi, teh, tempat nongki — Tangerine Orange)
  3. **Romantic Dinner 🕯️** (Dinner spesial/chill/formal — Berry/Rose)
  4. User bebas membuat kategori baru lainnya.
- Catatan dalam kurung dari daftar awal seperti `(chill)`, `(formal dinner)`, `(soon)`, `(blvrd)`, `(popsa)`, `(cendrawasih)` harus dipisahkan rapi menjadi `notes`/`area` badge agar judul tempat tetap bersih.

## 4. Technical Execution Rules
- Selalu cek `ORCHESTRATION.md` sebelum menulis kode fitur baru agar tetap sesuai fase aktif.
- Gunakan sintaks **Tailwind CSS v4** (`@import "tailwindcss";` dan `@theme` di `src/index.css`), jangan membuat `tailwind.config.js` versi v3.
- Jalankan verifikasi (`npx tsc --noEmit`, `npm run lint`, `npm run build`) sebelum menyatakan suatu fase selesai.
- Untuk setiap fitur *drag-and-drop*, selalu lindungi *touch scroll* di mobile (`TouchSensor` dengan delay) dan sediakan *fallback button*.

## 5. Verification Checklist Before Completing Any Task
1. Layout aman dan nyaman di layar `375px–430px` tanpa *horizontal scroll*?
2. Kontras teks di atas warna merah/oranye/hijau mudah dibaca (minimal WCAG AA)?
3. `npx tsc --noEmit`, `npm run lint`, dan `npm run build` lulus tanpa error?
4. Perubahan data tetap bekerja mulus meski Supabase belum dikonfigurasi (mode fallback `localStorage`)?