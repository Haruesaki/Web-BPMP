const env = require('../config/env');

// =========================================================================
//  WAKTU — perhitungan tanggal yang tidak bergantung zona waktu proses.
//  -----------------------------------------------------------------------
//  Sebelumnya "hari ini" dihitung memakai `new Date().getTimezoneOffset()`,
//  yang berarti kebenarannya bergantung pada zona waktu peladen. Komputer
//  pengembangan berada di WIB (UTC+7) sedangkan peladen Hostinger lazimnya
//  UTC — sehingga kunjungan pukul 00:00–06:59 WIB akan tercatat pada tanggal
//  SEBELUMNYA, dan angka "Pengunjung Hari Ini" keliru sepanjang tujuh jam
//  pertama setiap hari.
//
//  Di sini zona waktunya disebut eksplisit, jadi hasilnya sama saja walau
//  peladennya berjalan pada UTC.
// =========================================================================

const ZONA_BAWAAN = env.TZ || 'Asia/Jakarta';

/**
 * Tanggal hari ini dalam bentuk 'YYYY-MM-DD' menurut zona waktu aplikasi.
 * Dipakai kolom `tanggal` pada tabel statistik_pengunjung.
 */
const tanggalHariIni = (zona = ZONA_BAWAAN) => {
  // formatToParts dipakai agar penyusunan tidak bergantung pada kebiasaan
  // penulisan tanggal suatu locale — bagiannya diambil satu per satu.
  const bagian = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const ambil = (jenis) => bagian.find((b) => b.type === jenis)?.value ?? '';
  return `${ambil('year')}-${ambil('month')}-${ambil('day')}`;
};

/**
 * Menormalkan nilai waktu dari badan permintaan menjadi objek `Date` yang siap
 * dioper ke knex/mysql2 untuk kolom TIMESTAMP/DATETIME.
 *
 * MENGAPA INI PERLU
 * -----------------
 * Frontend mengirim waktu memakai `new Date().toISOString()`, yang menghasilkan
 * bentuk ISO-8601 seperti '2026-07-31T02:03:47.588Z'. Bila untai itu dioper apa
 * adanya, MySQL MENOLAKNYA:
 *
 *   ER_TRUNCATED_WRONG_VALUE (1292)
 *   Incorrect datetime value: '2026-07-31T02:03:47.588Z' for column 'waktu_tayang'
 *
 * Akibatnya kueri gagal, controller membalas 500, dan — karena pemanggilnya di
 * frontend hanya mencatat galat ke konsol — tombolnya tampak "tidak berfungsi"
 * tanpa penjelasan apa pun. Persis itu yang terjadi pada saklar "Tampilkan di
 * Beranda" pada tabel berita.
 *
 * MENGAPA MENGEMBALIKAN `Date`, BUKAN UNTAI YANG DIFORMAT SENDIRI
 * ---------------------------------------------------------------
 * `knexfile.js` menyetel `timezone: '+07:00'` pada sambungan mysql2. Dengan
 * objek `Date`, driver itulah yang melakukan konversinya, sehingga jam yang
 * tersimpan adalah jam DINDING WIB. Memformat untai sendiri justru berisiko
 * menyimpan jam UTC mentah — pada contoh di atas '02:03' padahal di Indonesia
 * saat itu pukul '09:03', meleset tujuh jam tanpa satu pun galat yang muncul.
 *
 * @param {*} nilai Nilai mentah dari badan permintaan.
 * @returns {{sah: boolean, nilai: Date|null}} `sah: false` bila nilainya ada
 *   tetapi tidak dapat diurai — pemanggil sebaiknya membalas 400, bukan diam-diam
 *   menyimpan NULL.
 */
const keWaktuDb = (nilai) => {
  // Kosong itu sah dan berarti "tidak ada waktu tayang" (kolomnya nullable).
  if (nilai === null || nilai === undefined || nilai === '') {
    return { sah: true, nilai: null };
  }

  const tanggal = nilai instanceof Date ? nilai : new Date(nilai);
  if (Number.isNaN(tanggal.getTime())) {
    return { sah: false, nilai: null };
  }

  return { sah: true, nilai: tanggal };
};

module.exports = {
  ZONA_BAWAAN,
  tanggalHariIni,
  keWaktuDb,
};
