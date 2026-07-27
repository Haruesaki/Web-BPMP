const crypto = require('crypto');
const env = require('../config/env');

// =========================================================================
//  PENJAGA TITIK AKHIR CRON
//  -----------------------------------------------------------------------
//  Titik akhir cron tidak dapat memakai `authMiddleware` biasa, sebab
//  penjadwal hPanel bukan manusia yang bisa masuk dan memegang token JWT.
//  Penjaganya berupa rahasia bersama yang dikirim lewat tajuk permintaan.
//
//  Tiga keputusan yang perlu dijelaskan:
//
//  1. RAHASIA DIBACA DARI TAJUK, BUKAN QUERY STRING. Query string lazim
//     tercatat utuh pada log akses peladen dan log proxy — rahasia yang
//     tertulis di sana sama saja dengan bocor.
//
//  2. TANPA RAHASIA, TITIK AKHIR DITUTUP — BUKAN DIBUKA. Bila CRON_SECRET
//     belum dipasang, permintaan ditolak. Perilaku sebaliknya (membuka akses
//     saat konfigurasi kurang) adalah pola kegagalan yang berbahaya: fitur
//     tampak berjalan padahal siapa pun dapat memicunya.
//
//  3. PERBANDINGAN DIBUAT SETARA WAKTU. Perbandingan untai biasa berhenti
//     pada karakter pertama yang berbeda, sehingga lama prosesnya membocorkan
//     seberapa banyak awalan yang sudah tertebak benar. Keduanya diringkas
//     lebih dulu dengan SHA-256 supaya panjangnya selalu sama — `timingSafeEqual`
//     melempar galat bila panjang masukannya berbeda.
// =========================================================================

const NAMA_TAJUK = 'x-cron-secret';

const ringkas = (nilai) => crypto.createHash('sha256').update(String(nilai)).digest();

const penjagaCron = (req, res, next) => {
  const rahasia = env.CRON_SECRET;

  if (!rahasia) {
    console.warn('[cron] Permintaan ditolak: CRON_SECRET belum dipasang pada environment.');
    return res.status(503).json({
      pesan: 'Titik akhir cron belum dikonfigurasi pada peladen ini.',
    });
  }

  const dikirim = req.get(NAMA_TAJUK) || '';

  if (!dikirim || !crypto.timingSafeEqual(ringkas(dikirim), ringkas(rahasia))) {
    // Alamat IP dicatat agar percobaan berulang dapat dikenali. Nilai rahasia
    // yang dikirim TIDAK PERNAH dicatat — log peladen bukan tempat menyimpan
    // tebakan kredensial.
    console.warn(`[cron] Rahasia tidak cocok. Permintaan ditolak. IP: ${req.ip}`);
    return res.status(401).json({ pesan: 'Akses ditolak.' });
  }

  return next();
};

module.exports = penjagaCron;
