const rateLimit = require('express-rate-limit');
const env = require('../config/env');

// =========================================================================
//  PEMBATAS LAJU (rate limit)
//  -----------------------------------------------------------------------
//  Dipasang terarah pada titik yang benar-benar rawan, BUKAN pada seluruh
//  aplikasi — supaya pemakaian wajar tidak ikut terhambat.
//
//  Perlu dicatat, sebagian peredam sudah ada sebelumnya dan tetap
//  dipertahankan: `requestOtp` menerapkan cooldown berlipat ganda per surel,
//  dan `verifyOtp` mencatat jumlah percobaan. Keduanya bersandar pada SUREL,
//  sehingga penyerang masih bisa berpindah-pindah alamat. Pembatas di sini
//  bersandar pada ALAMAT IP, jadi keduanya menutup celah yang berbeda dan
//  saling melengkapi, bukan menggantikan.
//
//  Ketepatan pembacaan IP bergantung pada `trust proxy` yang dinyalakan di
//  index.js untuk mode production. Tanpa itu seluruh pengunjung akan terlihat
//  sebagai satu IP (IP proxy) dan pembatas menjadi salah sasaran.
// =========================================================================

const MENIT = 60 * 1000;

// Di development batas dilonggarkan drastis supaya audit CRUD (55 skenario)
// dan pengujian berulang tidak tersandung limit.
const kali = env.isProduction ? 1 : 100;

const buat = ({ jendela, maksimum, pesan }) =>
  rateLimit({
    windowMs: jendela,
    limit: maksimum * kali,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Pesan dibuat berbahasa Indonesia agar dapat langsung dipahami pengguna
    // panel admin, bukan sekadar kode status.
    message: { pesan },
    handler: (req, res, next, opsi) => res.status(opsi.statusCode).json(opsi.message),
  });

// Menahan penebakan kata sandi. Angkanya sengaja tidak terlalu ketat supaya
// admin yang salah ketik beberapa kali tidak langsung terkunci.
const batasLogin = buat({
  jendela: 15 * MENIT,
  maksimum: 10,
  pesan: 'Terlalu banyak percobaan masuk. Silakan coba lagi dalam beberapa menit.',
});

// Paling ketat: setiap permintaan di sini memicu pengiriman surel sungguhan,
// sehingga penyalahgunaannya menguras kuota Resend sekaligus membanjiri kotak
// masuk pemilik alamat.
const batasOtp = buat({
  jendela: 60 * MENIT,
  maksimum: 5,
  pesan: 'Terlalu banyak permintaan kode OTP. Silakan coba lagi satu jam lagi.',
});

// Menahan penebakan OTP enam digit dari banyak alamat surel sekaligus.
const batasVerifikasiOtp = buat({
  jendela: 15 * MENIT,
  maksimum: 15,
  pesan: 'Terlalu banyak percobaan verifikasi. Silakan coba lagi dalam beberapa menit.',
});

// Longgar: titik ini dipanggil setiap pengunjung membuka Beranda. Tujuannya
// sekadar menahan penggelembungan kolom `hits`, bukan membatasi lalu lintas
// wajar. Perlu diingat pencatatannya berupa UPSERT satu baris per IP per hari,
// sehingga kerusakan terparah pun terbatas pada angka hits.
const batasPengunjung = buat({
  jendela: 15 * MENIT,
  maksimum: 60,
  pesan: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
});

// Titik akhir cron (Tahap 7). Pemakaian sahnya hanya dua kali sehari, sehingga
// angka ini sudah sangat longgar. Tujuannya menahan penebakan CRON_SECRET
// secara beruntun — penjaganya sendiri sudah membandingkan secara setara waktu,
// tetapi membatasi laju percobaan membuat penebakan menjadi tidak praktis.
const batasCron = buat({
  jendela: 15 * MENIT,
  maksimum: 20,
  pesan: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
});

// Proksi berkas eksternal. Titik ini PUBLIK tanpa token dan menyuruh peladen
// mengunduh berkas sampai 60 MB atas perintah siapa pun — tanpa pembatas, ia
// dapat dipakai sebagai proksi terbuka: pihak lain memakai pita dan alamat IP
// peladen kita untuk mengambil berkas besar berulang kali, dan pada shared
// hosting itu cukup untuk menghabiskan kuota.
//
// Angkanya dihitung dari pemakaian yang sah: satu permintaan untuk satu
// dokumen yang dipratinjau. Empat puluh dokumen eksternal dalam seperempat jam
// jauh melampaui yang mungkin dibaca seorang pengunjung, sekaligus menutup
// pengambilan beruntun.
const batasProksiBerkas = buat({
  jendela: 15 * MENIT,
  maksimum: 40,
  pesan: 'Terlalu banyak permintaan pratinjau berkas. Silakan coba lagi nanti.',
});

module.exports = {
  batasLogin,
  batasOtp,
  batasVerifikasiOtp,
  batasPengunjung,
  batasCron,
  batasProksiBerkas,
};
