---
name: frontend-refactor
description: Komprehensif approach untuk refactor monolithic React SPA menjadi component-based architecture dengan perbaikan layout, interaktivitas, dan animasi.
source: auto-skill
extracted_at: '2026-06-24T05:05:40.526Z'
---

# Frontend Refactoring Approach

Prosedur ini digunakan ketika user meminta perbaikan atau pengembangan tampilan web React secara menyeluruh — dari monolitik menuju arsitektur komponen yang terstruktur, interaktif, dan responsif.

## 1. Initial Codebase Analysis

Lakukan analisis menyeluruh sebelum memulai refactor:

```
frontend/src/
  App.jsx          — jumlah baris & apakah monolitik
  App.css          — total baris CSS, metodologi (plain / BEM / Tailwind)
  components/      — apakah sudah ada pemisahan komponen
  pages/           — apakah ada routing
  hooks/           — custom hooks
  assets/          — asset yang digunakan vs tidak digunakan
```

**Checklist temuan kritis:**
- [ ] **Monolitik**: semua JSX dalam 1 file (`App.jsx`)
- [ ] **No routing**: navigasi hanya visual, tidak ada react-router / scroll-to-section
- [ ] **Dead interactivity**: tombol search, TTS, pagination, subscribe — tanpa handler
- [ ] **Hardcoded data**: berita, statistik, konten palsu
- [ ] **Layout imbalance**: padding berlebihan, grid tidak proporsional
- [ ] **Visual inconsistency**: warna tema tidak konsisten (contoh: merah YouTube vs biru tema)
- [ ] **Placeholder palsu**: map/fitur yang belum diimplementasi
- [ ] **Missing metadata**: `<title>`, `lang`, meta tags
- [ ] **CSS duplication**: button hover/active pattern di-copy paste
- [ ] **Unused CSS classes**: didefinisikan tapi tidak dipakai JSX

## 2. Planning & Todo Management

Buat todo terstruktur menggunakan `todo_write`:

```json
[
  {"id": "1", "content": "Extract components (Header, Hero, Berita, ...)", "status": "pending"},
  {"id": "2", "content": "Add routing / navigation", "status": "pending"},
  {"id": "3", "content": "Fix layout proportions", "status": "pending"},
  {"id": "4", "content": "Implement interactivity", "status": "pending"},
  {"id": "5", "content": "Add animations (scroll reveal, hover effects)", "status": "pending"},
  {"id": "6", "content": "Improve responsive breakpoints", "status": "pending"},
  {"id": "7", "content": "Verify build", "status": "pending"}
]
```

## 3. Component Extraction Pattern

Setiap komponen harus memiliki struktur 3 file (JSX + CSS + imports):

```
components/
  Header.jsx          — JSX + state logic
  Header.css          — component-scoped styles
  Berita.jsx
  Berita.css
  ...
```

**Aturan ekstraksi:**
1. Setiap `section` dalam App → komponen terpisah
2. Setiap komponen mengelola state-nya sendiri (no global state)
3. Gunakan `export default function ComponentName()`
4. Import assets relatif ke komponen (bukan dari App)
5. CSS dipindahkan ke file komponen masing-masing

**Contoh Header.jsx:**
```jsx
import { useState, useRef, useCallback, useLayoutEffect } from 'react'
import mainLogo from '../assets/source/Logo.png'
import searchIcon from '../assets/source/Ikon-Search.png'
import './Header.css'

export default function Header({ onNavigate }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  // ...
}
```

## 4. Visual Consistency & Theming

- **Define CSS custom properties** di root `.site-shell` (untuk tema gelap/terang)
- **Konsistensi warna**: ganti warna asing dengan warna tema (`#ff0000` → `#36c2ff`)
- **Gunakan gradient** untuk depth (buttons, cards, headers) — `linear-gradient(135deg, ...)`
- **Typography**: gunakan `clamp()` untuk ukuran font responsif: `font-size: clamp(1.5rem, 4vw, 3.8rem)`
- **Spacing**: gunakan system spacing (8px, 12px, 16px, 20px, 24px, 40px, 56px, 80px)

## 5. Adding Interactivity

Setiap fitur interaktif yang tadinya "dead" di-refactor:

| Fitur | Implementation |
|-------|---------------|
| Search | Modal dengan form + `useState` toggle |
| Dropdown | `useState(activeDropdown)` + click handler + CSS animation |
| Pagination | `currentPage` state + dynamic range logic (1 ... n-1 n n+1 ... total) |
| Subscribe | Toggle button state + CSS class switching |
| Video play | `isPlaying` + `currentVideo` state |
| Visitor count | `useEffect` interval + `Intl.NumberFormat` |
| News selection | `activeNews` state + keyboard accessibility |

**Dynamic Pagination Logic:**
```jsx
const getPaginationRange = (currentPage, totalPages) => {
  const range = []
  for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
    range.push(i)
  }
  // Add 1 ... ... total with proper dots
}
```

## 6. Layout Proportion Fixes

Before/after pattern untuk layout perbaikan:

| Area | Before | After |
|------|--------|-------|
| Hero padding-bottom | `220px` | `120px` atau `min-height: 85vh` |
| Berita grid | `1.5fr 1fr` (gambar mendominasi) | `1.2fr 0.8fr` (lebih seimbang) |
| Video section | `#ff0000` (merah YouTube) | `#36c2ff` (tema biru konsisten) |
| Footer map | placeholder image palsu | Google Maps `<iframe>` asli |
| Thumbnail overlay | tidak ada | muncul saat hover dengan gradient |

## 7. Animasi & Micro-interactions

### ScrollReveal Component (reusable)
```jsx
export default function ScrollReveal({ children, animation='fadeUp', delay=0, duration=600 }) {
  const ref = useRef(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsInView(true); observer.unobserve(element); } },
      { threshold: 0.1 }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} className={`scroll-reveal--${animation} ${isInView ? 'in-view' : ''}`}
    style={{ '--reveal-delay': `${delay}ms`, '--reveal-duration': `${duration}ms` }}>{children}</div>
}
```

**Animations CSS (5 variants):**
- `fadeUp`: `translateY(40px) → 0` + opacity
- `fadeLeft`/`fadeRight`: `translateX(±40px) → 0`
- `fadeIn`: `scale(0.95) → 1`
- `zoomIn`: `scale(0.8) → 1`

**Staggered text animation** untuk hero titles menggunakan `animation-delay` per child:
```css
.hero-title-line:nth-child(1) { animation-delay: 0.3s; }
.hero-title-line:nth-child(2) { animation-delay: 0.4s; }
```

**Parallax effect** pada gambar background:
```jsx
style={{ transform: `translateY(${scrollY * 0.15}px)` }}
```

## 8. Responsive Breakpoints

Gunakan 3 breakpoints konsisten di semua komponen:

```css
/* Desktop */
@media (max-width: 1180px) { padding: 0 34px; }

/* Tablet */
@media (max-width: 820px) {
  grid-template-columns: 1fr;  /* stack columns */
  flex-direction: column;
}

/* Mobile */
@media (max-width: 540px) {
  font-size: clamp(); 
  flex-wrap: wrap;
}
```

## 9. Build Verification

Selalu verify build setelah selesai:
```bash
cd frontend && npx vite build
```

Periksa output:
- ✅ No errors
- ✅ Semua modules ter-transform
- ✅ File CSS/JS dihasilkan
- ✅ Assets ter-copy ke `dist/`

## 10. Reference Design Image Matching

When user provides a reference design image (PNG/JPG mockup) and asks to match the current project to it, use this systematic pixel-analysis approach:

### Step 1: Image Analysis with Python/Pillow

Since LLMs cannot directly view images, use Python + Pillow to extract quantitative data:

```bash
pip install Pillow
```

Create an analysis script that:
- **Dimensions & aspect ratio**: `img.size` → determine viewport scale
- **Horizontal strip analysis**: Divide image into ~20 horizontal strips, compute average RGB per strip to identify section boundaries and background types (DARK, WHITE/LIGHT, BLUE, etc.)
- **Section detection**: Track color transitions across strips → group into contiguous regions (e.g., "DARK BLUE y:0-242", "BLUE y:484-2662")
- **Color palette**: Quantize center-column pixels (divide by 32) → top 10 dominant colors with percentages
- **Column analysis**: Average color of Left 0-25%, Left 25-50%, Right 50-75%, Right 75-100% → identify two-column vs full-width layouts
- **Edge detection**: Scan horizontal brightness changes (diff > 40) → find layout dividers, section boundaries
- **White section detection**: Scan center column for brightness > 200 → locate white/light content areas with start/end y-coordinates
- **Specific region checks**: Sample top-left (logo), top-right (buttons), social dock, navigation bar, etc.

### Step 2: Map Analysis Data to Sections

Convert pixel positions to section identification:

| Pixel range | % of height | Section |
|-------------|-------------|---------|
| 0-5% | Header | Logo + buttons, dark bg |
| 5-6% | Navigation | Nav bar with indicators |
| 6-20% | Hero | Text left, image right, social dock far right |
| 20-40% | Berita | White bg → dark card inset |
| 40-50% | Mitra | White bg, logo row |
| 50-70% | Social Media | White curve → dark bg, Instagram grid |
| 70-85% | Video | Dark bg, YouTube-style header |
| 85-100% | Footer | White links → dark bottom bar |

### Step 3: Create Task List from Discrepancies

Compare each measurement against current code:

- **Background color**: exact hex match (e.g., `#0a0d42` vs `#070833`)
- **Section proportions**: padding, height ratios, gap sizes
- **Grid ratios**: column fr values
- **Typography**: font sizes, margins, weights
- **Borders/separators**: presence/absence, thickness, color
- **Component positioning**: absolute offsets, widths, z-order

### Step 4: Apply Targeted Fixes

Batch all CSS/JSX edits systematically:
1. Fix all color hex values first (search & replace across project)
2. Fix layout proportions (padding, margins, grid ratios)
3. Fix section-specific styling (backgrounds, borders, shadows)
4. Verify build after all changes

### Key Analysis Pattern (reusable script structure)

```python
from PIL import Image

def analyze_image(path):
    img = Image.open(path).convert('RGB')
    w, h = img.size
    
    # 1. Horizontal strips → section boundaries
    for i in range(20):
        strip = img.crop((0, i*h//20, w, (i+1)*h//20))
        avg_rgb = sample_avg_color(strip)
        classify: DARK/WHITE/BLUE/MEDIUM
    
    # 2. Edge detection → find dividers
    for y in range(0, h, 2):
        brightness_diff > 40 → record transition
    
    # 3. White region detection
    scan center column for brightness > 200 → white section coords
    
    # 4. Specific regions → logo, nav, dock, footer
```

### Important Notes

- **Image path**: User may provide absolute path outside project dir — handle it directly
- **Quantize colors**: Divide RGB by 32 before counting → reduces noise from gradients
- **Sample step**: Use `step = max(1, w // 100)` to avoid sampling every pixel (too slow)
- **Center column**: Best for detecting section backgrounds (avoids edge effects)
- **Brightness threshold**: > 200 for "white", < 80 for "dark", blue = b > r and b > g
- **Always grep** for old color values after fixes to catch all references
- **Build verify** after batch edits — single vite build catches all import/color issues

## 11. Common Pitfalls

- **Jangan overwrite file tanpa read_file dulu** — selalu baca file yang ada sebelum menulis
- **CSS conflicts**: pastikan old styles di App.css sudah dihapus setelah dipindah ke component CSS
- **Image imports**: path relatif harus benar setelah dipindah ke subfolder komponen
- **Focus styles**: jangan lupa `:focus-visible` untuk keyboard accessibility
- **Mobile layout**: cek semua section di viewport 375px sebelum selesai
- **Color grep**: after fixing primary bg color, always `grep` for ALL remaining old hex references across the entire src directory — missed refs break visual consistency