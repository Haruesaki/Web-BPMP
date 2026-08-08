const db = require('../config/database');

// =========================================================================
//  PEMERIKSA SKEMA — apakah sebuah kolom sudah ada di basis data?
//  -----------------------------------------------------------------------
//  MENGAPA BERKAS INI ADA
//
//  Kode aplikasi dan struktur basis data ditempatkan pada dua waktu yang
//  BERBEDA. Kode berpindah ke peladen lewat paket penempatan; struktur basis
//  data hanya berubah bila seseorang menjalankan migrasi atau menempelkan SQL
//  di phpMyAdmin. Di antara kedua saat itu ada jeda, dan pada jeda itu kode
//  baru berhadapan dengan basis data lama.
//
//  Akibatnya pernah terjadi sungguhan pada 8 Agustus 2026: kolom
//  `berita.urutan_tampil` belum ada di production, sedangkan kode barunya
//  mengurutkan dan menyisipkan memakai kolom itu. MySQL membatalkan SELURUH
//  pernyataan begitu menemui kolom yang tidak dikenal, sehingga:
//    - daftar berita pengunjung kosong sama sekali ("Belum ada berita"),
//      padahal datanya utuh di basis data; dan
//    - setiap penambahan berita berbalas 500.
//  Satu kolom yang tertinggal mematikan seluruh fitur berita.
//
//  Dengan pemeriksaan ini, kolom yang belum ada tidak lagi mematikan apa pun:
//  fiturnya mundur ke perilaku lama sampai kolomnya benar-benar dibuat.
//
//  ATURAN SINGGAHAN (cache) — sengaja tidak simetris:
//    - hasil `true`  disinggahkan SELAMANYA. Kolom yang sudah ada praktis
//      tidak pernah hilang lagi, dan menanyakannya berulang kali hanya
//      membebani basis data pada jalur yang paling sering dilalui.
//    - hasil `false` disinggahkan SEBENTAR saja. Inilah bagian yang penting:
//      sesudah pemilik menempelkan SQL-nya di phpMyAdmin, aplikasi memulihkan
//      dirinya sendiri dalam hitungan detik TANPA perlu dinyalakan ulang —
//      pada shared hosting, menyalakan ulang proses Node tidak selalu mudah.
// =========================================================================

const UMUR_SANGKALAN_MS = 30 * 1000;

// kunci "tabel.kolom" → { ada: boolean, sampai: number|null }
const singgahan = new Map();

/**
 * Memeriksa keberadaan sebuah kolom, dengan singgahan.
 * TIDAK PERNAH melempar: kegagalan pemeriksaan dianggap "belum ada", sebab
 * jalur mundurnya selalu aman sedangkan melempar akan menjatuhkan permintaan
 * yang sebetulnya masih dapat dilayani.
 */
const adaKolom = async (tabel, kolom) => {
  const kunci = `${tabel}.${kolom}`;
  const tersimpan = singgahan.get(kunci);
  if (tersimpan && (tersimpan.sampai === null || Date.now() < tersimpan.sampai)) {
    return tersimpan.ada;
  }

  let ada = false;
  try {
    ada = await db.schema.hasColumn(tabel, kolom);
  } catch (e) {
    // Basis data sedang tidak dapat dihubungi, atau tabelnya belum ada.
    console.warn(`[skema] Gagal memeriksa kolom ${kunci}: ${e.message}`);
    ada = false;
  }

  singgahan.set(kunci, { ada, sampai: ada ? null : Date.now() + UMUR_SANGKALAN_MS });
  if (!ada) {
    console.warn(
      `[skema] Kolom ${kunci} BELUM ADA di basis data. Fitur yang bergantung padanya ` +
      'berjalan dalam mode mundur. Jalankan migrasi (npm run migrasi) atau tempelkan ' +
      '.deploy_plan/query.txt di phpMyAdmin untuk mengaktifkannya sepenuhnya.'
    );
  }
  return ada;
};

/** Mengosongkan singgahan. Dipakai pengujian, bukan jalur produksi. */
const lupakanSinggahan = () => singgahan.clear();

module.exports = { adaKolom, lupakanSinggahan };
