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
      '--theme-bg-deep-rgb': '1, 8, 26',
      '--theme-bg-darker': '#050814',
      '--theme-surface': '#0B132B',
      '--theme-surface-rgb': '11, 19, 43',
      '--theme-accent': '#1a3c87',
      '--theme-accent-rgb': '26, 60, 135',
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
    id: 'indigo-violet',
    label: 'Indigo Violet',
    hex: '#8A6BFF',
    warna_latar: '#0C0A24',
    warna_utama: '#4A38A6',
    warna_sekunder: '#251C5E',
    warna_teks: '#F1EEFF',
    vars: {
      '--theme-bg-deep': '#0c0a24',
      '--theme-bg-deep-rgb': '12, 10, 36',
      '--theme-bg-darker': '#06041a',
      '--theme-surface': '#17103f',
      '--theme-surface-rgb': '23, 16, 63',
      '--theme-accent': '#4a38a6',
      '--theme-accent-rgb': '74, 56, 166',
      '--theme-secondary': '#251c5e',
      '--theme-counter-a': '#1e1566',
      '--theme-counter-b': '#33249e',
      '--theme-band-a': '#b7a6f7',
      '--theme-band-b': '#d8cffb',
      '--theme-panel-rgb': '30, 22, 78',
      '--theme-input-rgb': '48, 38, 112',
      '--theme-input-hover-rgb': '66, 54, 145',
      '--theme-highlight-rgb': '138, 107, 255',
      '--theme-highlight-deep-rgb': '28, 18, 82',
      '--theme-link-hover': '#cdbcff',
    },
  },
  {
    id: 'fresh-green',
    label: 'Fresh Green',
    hex: '#33C489',
    warna_latar: '#061A15',
    warna_utama: '#1C7D52',
    warna_sekunder: '#0F4030',
    warna_teks: '#EAFBF3',
    vars: {
      '--theme-bg-deep': '#061a15',
      '--theme-bg-deep-rgb': '6, 26, 21',
      '--theme-bg-darker': '#030f0b',
      '--theme-surface': '#0b2a20',
      '--theme-surface-rgb': '11, 42, 32',
      '--theme-accent': '#1c7d52',
      '--theme-accent-rgb': '28, 125, 82',
      '--theme-secondary': '#0f4030',
      '--theme-counter-a': '#0d4a34',
      '--theme-counter-b': '#167a54',
      '--theme-band-a': '#8fe6c4',
      '--theme-band-b': '#c2f2de',
      '--theme-panel-rgb': '16, 54, 42',
      '--theme-input-rgb': '22, 66, 52',
      '--theme-input-hover-rgb': '32, 90, 70',
      '--theme-highlight-rgb': '51, 196, 137',
      '--theme-highlight-deep-rgb': '6, 46, 33',
      '--theme-link-hover': '#a8f0d0',
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
