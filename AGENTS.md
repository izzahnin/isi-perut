# AGENTS.md — Isi Perut (Makassar Food & Hangout PWA)

## 1. Project Overview
**Isi Perut** adalah aplikasi web kolaboratif (*mobile-first PWA*) untuk mencatat, mengelompokkan, dan membagikan daftar tempat makan (**MAM**), tempat nongki/minum (**NUM**), **Romantic Dinner**, dan kategori kustom lainnya di Makassar. Teman-teman bisa menambah tempat baru, menyematkan koordinat/link Google Maps, serta memindahkan kategori via *drag-and-drop*.

## 2. Tech Stack
- **Build & Runtime**: Vite + React + TypeScript (Strict Mode)
- **Linter**: Oxlint (`npm run lint`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`) + `clsx` + `tailwind-merge`
- **Animation & UI Primitives**: Framer Motion, Lucide React, dengan pola komponen dari `reactbits.dev`, `motion-primitives.com`, `21st.dev`, dan `ruixen.com`
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (wajib konfigurasi `TouchSensor` & `PointerSensor`)
- **Backend & Realtime**: Supabase (`@supabase/supabase-js` — PostgreSQL + Realtime Subscriptions)
- **PWA**: `vite-plugin-pwa` (Service Worker + `manifest.webmanifest` di `vite.config.ts`)
- **Maps**: Deep-link Google Maps (`https://www.google.com/maps/search/?api=1&query=LAT,LNG`) + opsi tampilan peta interaktif (Leaflet / OpenStreetMap)

## 3. Visual & Art Direction ("Appetizing Pop-Art")
Memadukan **Playful Editorial / Neo-Brutalism ringan** dengan nuansa **ilustrasi/stiker karakter makanan** (seperti menu kafe independen atau zine kuliner).

### Color Palette Tokens
- **Canvas / Background**: Warm Cream `#FFFBF2` (hindari putih polos `#FFFFFF`)
- **Surface / Card**: Soft Paper `#FFFFFF` dengan border tegas Soft Black `#1C1917` (`1.5px–2px`) + hard offset shadow kecil (`3px 3px 0px #1C1917`)
- **Primary (MAM / Appetite Red)**: Chili Red `#FF3B30` / Tomato `#E63946`
- **Secondary (NUM / Zesty Orange)**: Tangerine `#FF8A00` / Mango `#FFB703`
- **Accent (Fresh / Verified / Maps)**: Pandan Green `#00B86B` / Matcha `#2A9D8F`
- **Special Category (Romantic / Vibes)**: Berry Plum `#9B5DE5` atau Rose `#FF4D6D`
- **Gradients**: Mesh/aura gradient halus ala `feralui.dev/gradients` khusus untuk header kategori atau banner hero.

### Typography
- **Display / Headings**: `Bricolage Grotesque` (ekspresif, pop, berkarakter)
- **Body / UI**: `Plus Jakarta Sans` (bersih, sangat terbaca di layar HP)

### UI Reference & Skill Mapping
- `impeccable.style`: Disiplin *spacing*, hirarki visual, kontras warna, *anti-slop*.
- `reactbits.dev` & `motion-primitives.com`: *Micro-interactions* (tab pill meluncur, kartu membal/spring, *staggered list*).
- `21st.dev` & `ruixen.com`: Pola komponen fungsional (search bar, filter chips, bottom sheet/drawer, toast).
- `landingfolio.com`, `styles.refero.design`, `reeoo.com`: Referensi komposisi *color-blocking* dan karakter visual *bold*.

## 4. Mobile-First & UX Guardrails
1. **Thumb-Zone Ergonomics**: Navigasi kategori utama, pencarian, dan tombol tambah (`+ Tambah Tempat`) wajib mudah dijangkau ibu jari.
2. **Touch-Safe Drag & Drop**:
   - Konfigurasikan `TouchSensor` dengan `activationConstraint: { delay: 200, tolerance: 8 }` agar *scrolling* vertikal di HP tidak bentrok dengan *drag*.
   - Sediakan **drag handle** eksplisit (`GripVertical`) pada setiap kartu.
   - Wajib sediakan **fallback cepat** (menu titik tiga → *"Pindah Kategori"*) bagi pengguna yang tidak ingin *drag* di layar kecil.
3. **Art & Character Elements**: Custom SVG *doodles*/stiker kuliner sebagai aksen header kategori dan *empty state*. Catatan dalam kurung (`chill`, `soon`, `formal dinner`, `blvrd`) ditampilkan sebagai *tag pill* warna-warni.
4. **Google Maps Handling**: Input menerima koordinat (`lat, lng`) ATAU link Google Maps mentah (otomatis ekstrak koordinat jika ada, atau simpan sebagai `maps_url`). Setiap kartu punya tombol 1-tap **Maps** berwarna Pandan Green.

## 5. Folder Structure
```text
src/
├── components/
│   ├── ui/        # Primitives (Button, Pill, BottomSheet, Sticker, Toast)
│   ├── board/     # CategoryTabs, PlaceCard, DraggableList, DropZone
│   ├── modals/    # AddPlaceDrawer, EditCategoryModal, MapPreviewModal
│   └── art/       # Custom SVG doodles & stiker kuliner
├── lib/           # supabase.ts, maps-parser.ts, dnd-config.ts, utils.ts
├── data/          # seed-makassar.json
├── types/         # database.ts, place.ts
├── App.tsx
└── index.css      # Tailwind v4 @import "tailwindcss" + @theme tokens