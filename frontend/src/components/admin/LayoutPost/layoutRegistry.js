// =========================================================================
//  REGISTRY LAYOUT POST (sisi ADMIN / editor)
//  -----------------------------------------------------------------------
//  Memetakan "key layout" (yang disimpan di data menu) ke komponen EDITOR-nya.
//  Saat Super Admin membuat menu bertipe Post dan memilih layout tertentu,
//  MenuContentEditor memakai peta ini untuk menampilkan editor yang sesuai.
//
//  PENTING: file ini meng-import komponen editor (menarik CKEditor). Impor
//  hanya dari kode yang di-lazy-load (mis. MenuContentEditor), JANGAN dari
//  bundle utama. Untuk sekadar label→key, pakai layoutMeta.js.
//
//  Menambah layout baru = tambah 1 baris di sini + buat komponennya.
// =========================================================================

import PostDefault from './PostDefault';
import { DEFAULT_LAYOUT_KEY } from './layoutMeta';

export const LAYOUT_EDITORS = {
  default: PostDefault,
  // 'profile-card': ProfileCard,
  // 'berita-card': BeritaCard,
};

// Ambil komponen editor untuk sebuah key layout (fallback ke Default).
export const getLayoutEditor = (key) =>
  LAYOUT_EDITORS[key] || LAYOUT_EDITORS[DEFAULT_LAYOUT_KEY];
