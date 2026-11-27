# ORCHESTRATION.md — Execution Plan & Workflow

Dokumen ini mengatur urutan pengerjaan bertahap. **Jangan melompat ke fase berikutnya sebelum Definition of Done (DoD) fase aktif terpenuhi dan diverifikasi.**

---

## Phase 0: Project Scaffolding, Theme & PWA Foundation
**Tujuan**: Menyiapkan kerangka aplikasi *mobile-first* Vite + Tailwind v4 yang siap di-install sebagai PWA.
- **Tasks**:
  1. Konfigurasi `@tailwindcss/vite` dan `vite-plugin-pwa` di `vite.config.ts` (manifest: nama *Isi Perut*, `theme_color: '#FF3B30'`, `background_color: '#FFFBF2'`, `display: 'standalone'`).
  2. Load font `Bricolage Grotesque` & `Plus Jakarta Sans` di `index.html`, lalu definisikan token warna Pop-Art di `src/index.css` menggunakan `@theme` Tailwind v4.
  3. Buat utilitas `src/lib/utils.ts` (`cn` dengan `clsx` + `tailwind-merge`) dan layout kerangka *mobile-first* dasar di `src/App.tsx`.
- **DoD**: `npm run dev` dan `npm run build` sukses tanpa error, `npx tsc --noEmit` 0 error, manifest PWA terdeteksi di DevTools, layout mobile (`390x844`) rapi tanpa *horizontal overflow*.

---

## Phase 1: Data Schema, Makassar Seed & Local/Supabase Layer
**Tujuan**: Menyiapkan struktur data kategori dinamis, urutan (*ordering*), dan parser koordinat Google Maps.
- **Schema (`categories` & `places`)**:
  - `categories`: `id`, `name` (MAM, NUM, Romantic Dinner), `slug`, `emoji`, `color_token` (`red` | `orange` | `green` | `purple`), `sort_order`, `created_at`
  - `places`: `id`, `category_id` (FK), `name`, `notes` (e.g., `chill`, `soon`, `blvrd`, `formal dinner`), `area`, `lat` (nullable), `lng` (nullable), `maps_url` (nullable), `added_by`, `is_visited` (boolean), `sort_order`, `created_at`
- **Tasks**:
  1. Buat tipe TypeScript di `src/types/place.ts` dan migrasi SQL Supabase (`supabase/schema.sql`) + aktifkan Realtime.
  2. Buat `src/lib/supabase.ts` dengan *graceful fallback* ke `localStorage` jika `VITE_SUPABASE_URL` belum diisi (agar UI bisa langsung dites lokal).
  3. Buat `src/data/seed-makassar.json` (data awal MAM, NUM, Romantic Dinner) dan utilitas `src/lib/maps-parser.ts` untuk ekstrak `lat, lng` dari link Google Maps.
- **DoD**: Data awal tampil dengan tipe valid, parser Maps lulus tes untuk format `@lat,lng` dan `?q=lat,lng`, `npx tsc --noEmit` & `npm run lint` bersih.

---

## Phase 2: Pop-Art UI & Mobile Browsing Experience
**Tujuan**: Membangun tampilan kuliner yang menggugah selera, penuh karakter art, dan nyaman dipakai satu tangan.
- **Tasks**:
  1. **Header & Art Banner**: Aksen *mesh gradient* (`feralui.dev` style) + ilustrasi SVG stiker kuliner di `src/components/art/`.
  2. **Category Switcher**: *Pill* warna-warni yang membal saat diklik (`framer-motion` spring) + tombol `+ Kategori`.
  3. **PlaceCard**: Gaya *Neo-Brutalist Pop* (border `#1C1917`, hard shadow), badge catatan/area, toggle stempel *"Sudah Mampir!"*, dan tombol 1-tap **Gas Maps**.
  4. **Search & Quick Filter Bar**: Pencarian instan + filter (*Semua / Belum Dicoba / Sudah Dicoba*).
  5. **Add/Edit Place Bottom Sheet**: Drawer dari bawah layar untuk tambah/edit tempat & link Maps.
- **DoD**: User bisa browse semua kategori, cari tempat secara instan, tambah/edit tempat baru, dan tandai sudah dikunjungi.

---

## Phase 3: Drag-and-Drop Cross-Category & Reordering
**Tujuan**: Memindahkan tempat antar kategori dan mengurutkan prioritas dengan mulus di layar sentuh.
- **Tasks**:
  1. Implementasikan `@dnd-kit` untuk **reorder** di dalam kategori dan **move cross-category** ke *Category Drop Pill* (atau tampilan Kanban horizontal di layar desktop).
  2. Tambahkan `DragOverlay` (kartu miring `rotate-2`, shadow membesar) dan *haptic feedback* (`navigator.vibrate?.(15)`).
  3. Implementasikan **Quick Move Menu** (tombol titik tiga → pilih kategori tujuan) sebagai fallback non-drag.
- **DoD**: Drag-and-drop mulus di mobile touch & desktop tanpa mengganggu scroll, perubahan langsung tersimpan dengan Optimistic UI.

---

## Phase 4: Collaboration, Maps View & PWA Polish
**Tujuan**: Siap dipakai bareng teman-teman sehari-hari dan di-deploy ke Vercel.
- **Tasks**:
  1. **Lightweight Friend Identity**: Prompt singkat saat pertama buka (*"Siapa namamu?"* disimpan di `localStorage`) untuk tag `by [Nama]`.
  2. **Realtime Sync**: Subscribe ke perubahan Supabase + tampilkan *toast* saat teman menambah/memindah tempat.
  3. **Toggle List / Map View**: Tampilkan pin tempat yang punya `lat, lng` di peta Makassar dengan warna pin sesuai kategori.
  4. **Offline & Install Prompt**: Pastikan daftar terakhir tetap terbaca saat offline + banner halus *"Install Isi Perut ke Home Screen"*.
- **DoD**: `npm run build`, `npx tsc --noEmit`, dan `npm run lint` bersih tanpa error; siap deploy ke Vercel.