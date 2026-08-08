const db = require('../config/database');

// =========================================================================
//  ATURAN TAMPIL MENU DI SISI PENGUNJUNG — satu sumber kebenaran
//  -----------------------------------------------------------------------
//  Sebuah menu tampil bagi pengunjung hanya bila DUA syarat terpenuhi:
//
//    1. menu itu sendiri aktif (`is_aktif`), DAN
//    2. induknya aktif — bila ia memang punya induk.
//
//  Syarat kedua itulah yang membuat penonaktifan menu induk ikut menyembunyikan
//  seluruh submenunya: submenu tidak punya jalan masuk lagi begitu induknya
//  hilang dari bilah navigasi.
//
//  YANG SENGAJA TIDAK DILAKUKAN: mengubah `is_aktif` submenu menjadi false saat
//  induknya dinonaktifkan. Penyembunyian ini bersifat TURUNAN, bukan tersimpan.
//  Bedanya menentukan — bila nilai submenunya ikut ditimpa, menyalakan kembali
//  induknya akan menyisakan seluruh submenu dalam keadaan mati, dan penyunting
//  harus mengingat sendiri mana saja yang tadinya hidup. Dengan aturan turunan,
//  menyalakan induknya mengembalikan keadaan submenunya persis seperti semula.
//
//  Kebalikannya tidak berlaku, sesuai permintaan: menonaktifkan submenu sama
//  sekali tidak berpengaruh terhadap induknya.
//
//  Dipakai bersama oleh daftar menu publik dan pencarian, supaya keduanya tidak
//  pernah menyimpang — halaman yang disembunyikan dari navigasi tidak boleh
//  muncul kembali lewat kotak pencarian.
// =========================================================================

/**
 * Menyaring daftar menu memakai aturan di atas.
 *
 * @param {Array} semua seluruh baris menu (harus memuat id, induk_id, is_aktif)
 * @returns {Array} hanya yang tampil bagi pengunjung
 */
const saringMenuTampil = (semua) => {
  const peta = new Map(semua.map((m) => [m.id, m]));
  return semua.filter((m) => {
    if (!m.is_aktif) return false;
    if (!m.induk_id) return true;
    const induk = peta.get(m.induk_id);
    // Submenu yatim — induknya sudah tidak ada sama sekali — ikut disembunyikan.
    // Menampilkannya hanya akan memunculkan butir tanpa jalan masuk.
    return Boolean(induk && induk.is_aktif);
  });
};

/**
 * Himpunan id menu yang tampil bagi pengunjung. Dipakai penyaring cepat oleh
 * pencarian, yang perlu memeriksa banyak baris sekaligus.
 *
 * @returns {Promise<Set<number>>}
 */
const idMenuTampil = async () => {
  const semua = await db('menu').select('id', 'induk_id', 'is_aktif');
  return new Set(saringMenuTampil(semua).map((m) => m.id));
};

module.exports = { saringMenuTampil, idMenuTampil };
