// =========================================================================
//  LAYOUT META (data murni — TANPA import komponen)
//  -----------------------------------------------------------------------
//  Dipisah dari layoutRegistry.js supaya file yang cuma butuh pemetaan
//  label/key (mis. AdminLayout) tidak ikut menarik komponen editor + CKEditor
//  ke bundle utama. Registry yang berat (import komponen) tetap lazy-loaded.
// =========================================================================

// Key layout default bila tidak dikenal.
export const DEFAULT_LAYOUT_KEY = 'default';

// Peta label (di modal Tambah Menu) → key layout (dipakai di URL / data).
export const LAYOUT_LABEL_TO_KEY = {
  Default: 'default',
  'Profile Card': 'profile-card',
  'Berita Card': 'berita-card',
};
