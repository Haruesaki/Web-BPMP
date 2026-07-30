// =========================================================================
//  DEFINISI TEMA HALAMAN PENGUNJUNG (single source of truth)
//  -----------------------------------------------------------------------
//  Dipakai bersama oleh:
//   - Admin CustomizeBeranda (memilih & menyimpan preset ke `pengaturan_tema`)
//   - Layout pengunjung (menerapkan `vars` sebagai CSS variable)
//
//  Backend hanya menyimpan 4 warna kanonik (warna_latar/utama/sekunder/teks).
//  Palet LENGKAP per section tinggal di `vars` — karena presetnya tetap, tak
//  perlu menambah kolom DB. Saat memuat, id preset di-infer dari warna_utama.
//
//  PENTING: nilai `vars` preset "dark-navy" HARUS sama persis dengan warna
//  hardcode lama di tiap section, sehingga tema default = tampilan sekarang.
// =========================================================================

export const THEMES = [
  {
    id: 'dark-navy',
    label: 'Dark Navy',
    hex: '#1A3C87',
    // Warna kanonik (disimpan ke DB + dipakai pratinjau kartu admin)
    warna_latar: '#01081A',
    warna_utama: '#1A3C87',
    warna_sekunder: '#172755',
    warna_teks: '#FFFFFF',
    // Palet penuh untuk CSS variable halaman pengunjung
    vars: {
      '--theme-bg-deep': '#01081a',
      '--theme-bg-darker': '#050814',
      '--theme-surface': '#0B132B',
      '--theme-surface-rgb': '11, 19, 43',
      '--theme-accent': '#1a3c87',
      '--theme-secondary': '#172755',
      '--theme-counter-a': '#00155c',
      '--theme-counter-b': '#002576',
      '--theme-band-a': '#79cbf8',
      '--theme-band-b': '#aeceff',
      // Triplet RGB untuk elemen rgba() Navbar & bingkai Hero (alpha dijaga).
      '--theme-panel-rgb': '15, 25, 55',
      '--theme-input-rgb': '30, 45, 85',
      '--theme-input-hover-rgb': '42, 60, 105',
      '--theme-highlight-rgb': '101, 127, 255',
      '--theme-highlight-deep-rgb': '3, 20, 77',
      '--theme-link-hover': '#a4dcfa',
    },
  },
  {
    id: 'saffron-gold',
    label: 'Saffron Gold',
    hex: '#FAB12F',
    warna_latar: '#140D02',
    warna_utama: '#FAB12F',
    warna_sekunder: '#3D2E0F',
    warna_teks: '#FFF7E6',
    vars: {
      '--theme-bg-deep': '#140d02',
      '--theme-bg-darker': '#0b0701',
      '--theme-surface': '#241804',
      '--theme-surface-rgb': '36, 24, 4',
      '--theme-accent': '#6e4e12',
      '--theme-secondary': '#3d2e0f',
      '--theme-counter-a': '#4a3208',
      '--theme-counter-b': '#6e4e12',
      '--theme-band-a': '#f6d48c',
      '--theme-band-b': '#fbe7bf',
      '--theme-panel-rgb': '45, 33, 12',
      '--theme-input-rgb': '61, 46, 15',
      '--theme-input-hover-rgb': '82, 62, 22',
      '--theme-highlight-rgb': '168, 116, 24',
      '--theme-highlight-deep-rgb': '46, 30, 6',
      '--theme-link-hover': '#f7dca4',
    },
  },
  {
    id: 'forest-green',
    label: 'Forest Green',
    hex: '#3FBF87',
    warna_latar: '#04140D',
    warna_utama: '#3FBF87',
    warna_sekunder: '#123528',
    warna_teks: '#EAF7F1',
    vars: {
      '--theme-bg-deep': '#04140d',
      '--theme-bg-darker': '#020c08',
      '--theme-surface': '#0a2419',
      '--theme-surface-rgb': '10, 36, 25',
      '--theme-accent': '#1c5b3f',
      '--theme-secondary': '#123528',
      '--theme-counter-a': '#0a3a28',
      '--theme-counter-b': '#10543a',
      '--theme-band-a': '#8fd9be',
      '--theme-band-b': '#beebd9',
      '--theme-panel-rgb': '15, 45, 32',
      '--theme-input-rgb': '20, 55, 40',
      '--theme-input-hover-rgb': '28, 72, 52',
      '--theme-highlight-rgb': '46, 140, 92',
      '--theme-highlight-deep-rgb': '8, 40, 26',
      '--theme-link-hover': '#a6efce',
    },
  },
];

export const DEFAULT_THEME_ID = 'dark-navy';

// Font sengaja TIDAK diubah oleh tema — nilai ini hanya melengkapi payload
// backend agar kolom font_pilihan tetap terisi.
export const THEME_FONT = 'Inter';

// Mencocokkan warna tersimpan (dari backend) kembali ke id preset dengan
// membandingkan warna_utama. Bila tak ada yang cocok (mis. data seed lama),
// jatuh ke preset default.
export const themeIdFromColors = (tema) => {
  if (!tema) return DEFAULT_THEME_ID;
  const match = THEMES.find(
    (t) => t.warna_utama.toLowerCase() === String(tema.warna_utama || '').toLowerCase()
  );
  return match ? match.id : DEFAULT_THEME_ID;
};

// Mengembalikan objek CSS variable (untuk style inline) dari warna tersimpan.
export const themeVarsFromColors = (tema) => {
  if (!tema) return undefined;
  const preset = THEMES.find((t) => t.id === themeIdFromColors(tema));
  return preset ? preset.vars : undefined;
};
