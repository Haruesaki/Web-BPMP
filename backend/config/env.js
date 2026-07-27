// Pemuatan .env dipusatkan di muatEnv.js — lihat penjelasannya di sana,
// terutama alasan berkas .env dibuat menimpa nilai dari pengelola environment.
require('./muatEnv');

// =========================================================================
//  ENV — satu-satunya pintu pembacaan `process.env` bagi aplikasi.
//  -----------------------------------------------------------------------
//  Tujuannya dua:
//
//    1. Menyatukan konfigurasi. Sebelumnya `process.env` dibaca tersebar di
//       index.js, server.js, authController, authMiddleware, dan controller
//       lain — sehingga mustahil memastikan kelengkapannya di satu tempat.
//
//    2. Menggagalkan lebih awal (fail fast). Di production, konfigurasi yang
//       keliru dihentikan saat boot, bukan dibiarkan meledak diam-diam saat
//       pengguna sedang memakai aplikasi. Contoh nyata yang dicegah: bila
//       JWT_SECRET luput dipasang, sebelumnya aplikasi tetap berjalan memakai
//       kunci cadangan yang tertulis di kode sumber — siapa pun yang tahu
//       nilainya bisa menempa token superadmin.
//
//  Di development validasi hanya memberi peringatan supaya pengujian di
//  localhost tidak terhambat. Perbedaan perlakuan inilah yang membuat satu
//  basis kode bisa melayani dua mode tanpa mengubah struktur kode.
//
//  CATATAN: modul ini TIDAK PERNAH mencetak nilai variabel, hanya namanya.
//  Log peladen bukan tempat yang aman bagi rahasia.
// =========================================================================

const NODE_ENV = (process.env.NODE_ENV || 'development').trim().toLowerCase();
const isProduction = NODE_ENV === 'production';
const isDevelopment = !isProduction;

// Baca sebagai untai yang sudah dirapikan; `undefined` menjadi untai kosong
// agar pemeriksaan "kosong" cukup satu cara.
const baca = (nama, cadangan = '') => String(process.env[nama] ?? cadangan).trim();

const JWT_SECRET = baca('JWT_SECRET');
const CORS_ORIGIN_MENTAH = baca('CORS_ORIGIN');

const env = {
  NODE_ENV,
  isProduction,
  isDevelopment,

  // Hostinger menetapkan PORT sendiri; 5000 hanya cadangan untuk lokal.
  PORT: Number(baca('PORT', '5000')) || 5000,
  TZ: baca('TZ', 'Asia/Jakarta'),

  DB: {
    host: baca('DB_HOST'),
    port: Number(baca('DB_PORT', '3306')) || 3306,
    user: baca('DB_USER'),
    // Sengaja tidak diwajibkan: MySQL lokal lazim dipakai tanpa kata sandi.
    password: baca('DB_PASSWORD'),
    name: baca('DB_NAME'),
    // Jalur soket Unix. Bila kosong, knexfile mencari sendiri pada jalur yang
    // lazim; isi 'none' untuk memaksa TCP. Lihat penjelasan lengkap di
    // knexfile.js — ringkasnya, mysql2 selalu memakai TCP sehingga MySQL
    // mengenali sambungan sebagai @'127.0.0.1', bukan @'localhost'.
    socketPath: baca('DB_SOCKET_PATH'),
  },

  JWT_SECRET,

  // Alamat publik situs. TIDAK DIBACA oleh satu berkas kode pun saat ini, dan
  // karena itu TIDAK diwajibkan — lihat catatan pada WAJIB_PRODUCTION di bawah.
  // Tetap disediakan karena murah dan berguna bila kelak ada keperluan URL
  // absolut, misalnya tautan di dalam surel atau berkas sitemap.
  PUBLIC_BASE_URL: baca('PUBLIC_BASE_URL'),

  // Letak hasil build frontend (Tahap 7). Bila kosong, dipakai penataan baku
  // `../frontend/dist` relatif terhadap folder backend. Variabel ini menjadi
  // jalan keluar bila penataan folder di peladen tidak memungkinkan backend
  // dan frontend bersebelahan — lebih baik daripada memaksakan bentuk folder
  // yang tidak didukung panel hosting.
  FRONTEND_DIST_PATH: baca('FRONTEND_DIST_PATH'),

  // Dipecah menjadi larik agar Tahap 5 tinggal memakainya untuk menyaring origin.
  CORS_ORIGIN: CORS_ORIGIN_MENTAH
    ? CORS_ORIGIN_MENTAH.split(',').map((o) => o.trim()).filter(Boolean)
    : [],

  RESEND: {
    apiKey: baca('RESEND_API_KEY'),
    fromEmail: baca('RESEND_FROM_EMAIL'),
  },

  YOUTUBE: {
    apiKey: baca('YOUTUBE_API_KEY'),
    channelId: baca('YOUTUBE_CHANNEL_ID'),
  },

  RAPIDAPI_KEY: baca('RAPIDAPI_KEY'),

  // Rahasia bersama bagi titik akhir cron (Tahap 7). Penjadwal hPanel berada
  // di luar proses dan tidak memegang token JWT, sehingga memerlukan penjaga
  // tersendiri. Bila kosong, titik akhirnya menolak seluruh permintaan —
  // lihat middlewares/penjagaCron.js.
  CRON_SECRET: baca('CRON_SECRET'),

  // Penjaga seeder (dipakai Tahap 3). Seeder menolak jalan di production
  // kecuali variabel ini bernilai 'true' secara eksplisit.
  ALLOW_PRODUCTION_SEED: baca('ALLOW_PRODUCTION_SEED').toLowerCase() === 'true',

  // Bila bernilai 'true', server menjalankan pemeriksaan sambungan basis data
  // sekali saat boot dan mencetak hasilnya ke log. Disediakan karena sebagian
  // paket hosting tidak menyediakan akses terminal sama sekali, sehingga log
  // peladen menjadi satu-satunya saluran keluaran diagnosis yang tersedia.
  // Nyalakan seperlunya saja, lalu kembalikan ke kosong — pemeriksaan ini
  // mencetak nama pengguna dan basis data ke log.
  DIAGNOSA_DB: baca('DIAGNOSA_DB').toLowerCase() === 'true',
};

// ------------------------------------------------------------------ validasi

const PANJANG_MINIMUM_JWT = 32;

const galat = [];
const peringatan = [];

// Wajib pada kedua mode — tanpa ini aplikasi tidak dapat bekerja sama sekali.
const WAJIB_SELALU = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];

// Wajib khusus production. Di development ketiadaannya wajar: CORS longgar,
// aset memakai localhost, dan pengiriman surel jarang diuji.
//
// PUBLIC_BASE_URL SENGAJA DIKELUARKAN dari daftar ini. Semula ia diwajibkan
// karena dipakai menyusun URL absolut bagi aset, tetapi Tahap 4 mengubah URL
// aset menjadi relatif ('/uploads/...') sehingga tidak ada lagi berkas yang
// membacanya. Mewajibkan variabel yang tidak dibaca siapa pun berarti
// menghentikan proses demi sesuatu yang tidak berpengaruh apa-apa — persis yang
// terjadi saat penempatan 27 Juli 2026 dan memakan waktu berjam-jam.
//
// Kaidah yang dipetik: sebuah variabel hanya boleh masuk daftar wajib bila ada
// kode yang benar-benar membacanya. Bila kelak PUBLIC_BASE_URL dipakai kembali,
// barulah ia pantas dikembalikan ke sini.
const WAJIB_PRODUCTION = ['CORS_ORIGIN', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL'];

for (const nama of WAJIB_SELALU) {
  if (!baca(nama)) galat.push(`${nama} belum diisi.`);
}

if (isProduction) {
  for (const nama of WAJIB_PRODUCTION) {
    if (!baca(nama)) galat.push(`${nama} wajib diisi saat NODE_ENV=production.`);
  }

  // Kunci cadangan yang dulu tertulis di authController & authMiddleware.
  // Nilainya sudah tersebar di riwayat repositori, jadi tidak boleh dipakai.
  if (JWT_SECRET === 'fallback_secret_key') {
    galat.push('JWT_SECRET masih memakai nilai cadangan lama yang tertulis di kode sumber. Ganti dengan nilai acak yang kuat.');
  }

  if (JWT_SECRET && JWT_SECRET.length < PANJANG_MINIMUM_JWT) {
    galat.push(`JWT_SECRET terlalu pendek (${JWT_SECRET.length} karakter). Minimal ${PANJANG_MINIMUM_JWT} karakter.`);
  }

  // Peringatan, bukan galat: pada shared hosting Hostinger, basis data justru
  // lazim berada di mesin yang sama sehingga 'localhost' memang benar.
  if (/^(localhost|127\.0\.0\.1)$/i.test(env.DB.host)) {
    peringatan.push('DB_HOST menunjuk localhost saat production. Pastikan memang demikian pada peladen Anda.');
  }
} else {
  // Development: cukup diingatkan supaya kekurangannya diketahui sejak dini,
  // tanpa menghambat pengujian di localhost.
  for (const nama of WAJIB_PRODUCTION) {
    if (!baca(nama)) peringatan.push(`${nama} belum diisi (dibiarkan di development, tetapi WAJIB saat production).`);
  }

  if (JWT_SECRET && JWT_SECRET.length < PANJANG_MINIMUM_JWT) {
    peringatan.push(`JWT_SECRET hanya ${JWT_SECRET.length} karakter. Production menuntut minimal ${PANJANG_MINIMUM_JWT} karakter.`);
  }
}

if (peringatan.length) {
  console.warn(`[env] Peringatan konfigurasi (mode ${NODE_ENV}):`);
  peringatan.forEach((p) => console.warn(`  - ${p}`));
}

if (galat.length) {
  console.error(`[env] Konfigurasi tidak sah (mode ${NODE_ENV}):`);
  galat.forEach((g) => console.error(`  - ${g}`));

  if (isProduction) {
    console.error('[env] Proses dihentikan. Perbaiki variabel di atas pada pengelola environment, lalu jalankan ulang.');
    console.error('[env] Rujukan nama variabel: backend/.env.example');
    process.exit(1);
  }

  console.warn('[env] Mode development: proses tetap dilanjutkan, tetapi sebagian fitur dapat gagal.');
}

module.exports = env;
