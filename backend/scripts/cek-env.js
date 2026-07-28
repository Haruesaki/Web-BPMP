require('../config/muatEnv');

// =========================================================================
//  PEMERIKSA KELENGKAPAN ENVIRONMENT
//  -----------------------------------------------------------------------
//  Dijalankan lewat `npm run cek:env`, termasuk dari tombol "Run JS script"
//  pada panel hosting yang tidak menyediakan akses SSH.
//
//  Gunanya satu: menjawab pertanyaan "mengapa proses tidak mau hidup" tanpa
//  perlu membaca log Passenger, yang pada sebagian paket hosting tidak mudah
//  dijangkau. Peladen membalas HTTP 503 ketika proses aplikasi gagal boot,
//  dan penyebab tersering pada proyek ini adalah pemberhentian yang memang
//  kita pasang sendiri di config/env.js untuk mode production.
//
//  Berkas ini TIDAK PERNAH mencetak nilai variabel — hanya namanya, status
//  terisi atau tidak, dan panjangnya bagi yang bersifat rahasia. Keluaran
//  skrip diagnosis kerap disalin ke tiket bantuan atau tangkapan layar.
// =========================================================================

const NODE_ENV = (process.env.NODE_ENV || 'development').trim().toLowerCase();
const isProduction = NODE_ENV === 'production';

const baca = (nama) => String(process.env[nama] ?? '').trim();

// Daftar ini mengikuti config/env.js. Bila daftar di sana berubah, ubah di sini.
const WAJIB_SELALU = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const WAJIB_PRODUCTION = ['CORS_ORIGIN', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL'];
const DIANJURKAN = ['TZ', 'DB_PASSWORD', 'CRON_SECRET', 'YOUTUBE_API_KEY', 'YOUTUBE_CHANNEL_ID', 'RAPIDAPI_KEY'];
// PUBLIC_BASE_URL ada di sini, bukan di daftar wajib: tidak ada berkas kode
// yang membacanya sejak URL aset diubah menjadi relatif pada Tahap 4.
const OPSIONAL = ['PORT', 'PUBLIC_BASE_URL', 'FRONTEND_DIST_PATH', 'ALLOW_PRODUCTION_SEED'];

// Variabel yang nilainya rahasia — hanya panjangnya yang boleh ditampilkan.
const RAHASIA = new Set(['JWT_SECRET', 'DB_PASSWORD', 'RESEND_API_KEY', 'CRON_SECRET', 'YOUTUBE_API_KEY', 'RAPIDAPI_KEY']);

const PANJANG_MINIMUM_JWT = 32;

const gambaran = (nama) => {
  const nilai = baca(nama);
  if (!nilai) return 'KOSONG';
  if (RAHASIA.has(nama)) return `terisi (${nilai.length} karakter)`;
  return `terisi -> ${nilai}`;
};

const cetakGolongan = (judul, daftar) => {
  console.log(`\n${judul}`);
  for (const nama of daftar) {
    console.log(`  ${baca(nama) ? '[v]' : '[ ]'} ${nama.padEnd(20)} ${gambaran(nama)}`);
  }
};

console.log('='.repeat(66));
console.log(`  PEMERIKSAAN ENVIRONMENT — mode terbaca: ${NODE_ENV}`);
console.log('='.repeat(66));

if (!isProduction) {
  console.log('\n  PERHATIAN: mode terbaca BUKAN production.');
  console.log('  Di peladen, ini berarti NODE_ENV belum dipasang dengan benar —');
  console.log('  akibatnya frontend tidak akan disajikan dan seluruh halaman 404.');
}

cetakGolongan('WAJIB pada kedua mode (kosong = proses berhenti di production):', WAJIB_SELALU);
cetakGolongan('WAJIB khusus production (kosong = proses berhenti di production):', WAJIB_PRODUCTION);
cetakGolongan('Dianjurkan (kosong tidak menghentikan proses, tetapi ada fitur mati):', DIANJURKAN);
cetakGolongan('Opsional:', OPSIONAL);

// ------------------------------------------------------------- kesimpulan

const penghalang = [];

for (const nama of WAJIB_SELALU) {
  if (!baca(nama)) penghalang.push(`${nama} belum diisi.`);
}

if (isProduction) {
  for (const nama of WAJIB_PRODUCTION) {
    if (!baca(nama)) penghalang.push(`${nama} wajib diisi saat NODE_ENV=production.`);
  }

  const jwt = baca('JWT_SECRET');
  if (jwt === 'fallback_secret_key') {
    penghalang.push('JWT_SECRET masih memakai nilai cadangan lama yang tertulis di kode sumber.');
  }
  if (jwt && jwt.length < PANJANG_MINIMUM_JWT) {
    penghalang.push(`JWT_SECRET terlalu pendek (${jwt.length} karakter). Minimal ${PANJANG_MINIMUM_JWT}.`);
  }
}

console.log('\n' + '='.repeat(66));

if (penghalang.length) {
  console.log('  KESIMPULAN: konfigurasi belum lengkap.');
  console.log(`  Inilah penyebab proses gagal hidup${isProduction ? ' dan peladen membalas 503' : ''}:`);
  penghalang.forEach((p) => console.log(`    - ${p}`));
  console.log('\n  Pasang variabel di atas pada pengelola environment, lalu Restart.');
  console.log('='.repeat(66));
  process.exit(1);
}

console.log('  KESIMPULAN: seluruh variabel wajib sudah terisi.');
console.log('  Bila peladen masih membalas 503, penyebabnya BUKAN kelengkapan');
console.log('  environment. Periksa berikutnya:');
console.log('    1. npm run cek:sharp   — apakah modul native termuat');
console.log('    2. npm run cek:db      — apakah sambungan basis data hidup');
console.log('    3. Setelan aplikasi: application root dan startup file');
console.log('='.repeat(66));
