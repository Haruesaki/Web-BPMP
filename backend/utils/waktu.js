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

module.exports = {
  ZONA_BAWAAN,
  tanggalHariIni,
};
