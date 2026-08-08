const db = require('../config/database');

// =========================================================================
//  PEMERIKSA MIGRASI SAAT BOOT
//  -----------------------------------------------------------------------
//  MENGAPA BERKAS INI ADA
//
//  Pada 8 Agustus 2026 fitur berita di production mati total: daftar berita
//  kosong bagi pengunjung dan setiap penambahan berita berbalas 500. Sebabnya
//  satu migrasi belum dijalankan di peladen. Yang membuatnya berlarut-larut
//  BUKAN sulitnya perbaikan — perbaikannya satu perintah — melainkan bahwa
//  TIDAK ADA APA PUN yang memberi tahu. Peladen menyala dengan tenang,
//  mencatat "Backend berjalan di port ...", dan baru terlihat keliru sesudah
//  ada yang membuka halamannya lalu membaca log runtime.
//
//  Pemeriksaan ini menutup celah itu. Ia hanya MEMBACA daftar migrasi dan
//  membandingkannya dengan tabel `knex_migrations`; ia tidak menjalankan,
//  mengubah, ataupun menghapus apa pun. Sengaja demikian: menjalankan migrasi
//  dengan sendirinya saat boot terlalu berisiko pada shared hosting, sebab
//  proses dapat menyala berkali-kali dan sebagian migrasi bersifat merusak
//  (mis. 20260729060000_hapus_konten_yatim menghapus baris yatim).
//
//  Kegagalannya sendiri tidak pernah menjatuhkan peladen — alat pengingat
//  yang membuat situs mati jelas lebih merugikan daripada masalah yang
//  hendak diingatkannya.
// =========================================================================

const periksaMigrasi = async () => {
  let tertunda = [];
  try {
    const [, belum] = await db.migrate.list();
    tertunda = Array.isArray(belum) ? belum : [];
  } catch (e) {
    console.warn(`[migrasi] Tidak dapat memeriksa status migrasi: ${e.message}`);
    return;
  }

  if (tertunda.length === 0) {
    console.log('[migrasi] Struktur basis data sudah sesuai kode (tidak ada migrasi tertunda).');
    return;
  }

  // Bentuk anggotanya berbeda antar versi knex: kadang untai nama berkas,
  // kadang objek { file, directory }.
  const nama = tertunda.map((m) => (typeof m === 'string' ? m : m?.file || String(m)));

  console.warn('');
  console.warn('==========================================================');
  console.warn(`[migrasi] PERHATIAN: ${nama.length} MIGRASI BELUM DIJALANKAN.`);
  console.warn('  Struktur basis data peladen ini TERTINGGAL dari kodenya.');
  console.warn('  Fitur yang bergantung pada kolom baru akan berjalan dalam');
  console.warn('  mode mundur, atau gagal sama sekali.');
  console.warn('');
  nama.forEach((n) => console.warn(`    - ${n}`));
  console.warn('');
  console.warn('  Cara memperbaiki, pilih salah satu:');
  console.warn('    1. npm run migrasi            (di folder backend)');
  console.warn('    2. tempelkan isi .deploy_plan/query.txt di phpMyAdmin');
  console.warn('==========================================================');
  console.warn('');
};

module.exports = { periksaMigrasi };
