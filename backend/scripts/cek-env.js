const muatEnv = require('../config/muatEnv');

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

// Dibersihkan dengan aturan yang sama persis seperti aplikasi, supaya yang
// dilaporkan pemeriksa ini adalah nilai yang BENAR-BENAR dipakai aplikasi —
// bukan nilai mentah yang bisa berbeda karena tanda kutip atau spasi.
const baca = (nama) => muatEnv.bersihkan(nama, process.env[nama]).nilai;
const keluhanBentuk = new Set();

// Daftar ini mengikuti config/env.js. Bila daftar di sana berubah, ubah di sini.
const WAJIB_SELALU = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const WAJIB_PRODUCTION = ['CORS_ORIGIN', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL'];
// UPLOAD_DIR sengaja masuk golongan ini: kosongnya tidak menghentikan proses,
// tetapi di peladen berarti berkas unggahan tersimpan di dalam folder aplikasi
// dan ikut tersapu setiap penempatan ulang — seluruh gambar situs rusak.
const DIANJURKAN = ['TZ', 'DB_PASSWORD', 'UPLOAD_DIR', 'CRON_SECRET', 'YOUTUBE_API_KEY', 'YOUTUBE_CHANNEL_ID', 'RAPIDAPI_KEY'];
// PUBLIC_BASE_URL ada di sini, bukan di daftar wajib: tidak ada berkas kode
// yang membacanya sejak URL aset diubah menjadi relatif pada Tahap 4.
// ENV_FILE_OVERRIDE sengaja ikut ditampilkan walau bukan konfigurasi aplikasi:
// selama menyala, berkas .env mengalahkan panel, sehingga nilai yang terlihat di
// panel bisa berbeda dari yang benar-benar dipakai proses. Itu persis kebingungan
// yang terjadi pada 29 Juli 2026, dan pemeriksa inilah tempat pertama orang
// mencarinya.
const OPSIONAL = ['PORT', 'PUBLIC_BASE_URL', 'FRONTEND_DIST_PATH', 'ALLOW_PRODUCTION_SEED', 'ENV_FILE_OVERRIDE'];

// Variabel yang nilainya rahasia — hanya panjangnya yang boleh ditampilkan.
const RAHASIA = new Set(['JWT_SECRET', 'DB_PASSWORD', 'RESEND_API_KEY', 'CRON_SECRET', 'YOUTUBE_API_KEY', 'RAPIDAPI_KEY']);

const PANJANG_MINIMUM_JWT = 32;

const gambaran = (nama) => {
  const { nilai, keluhan } = muatEnv.bersihkan(nama, process.env[nama]);
  keluhan.forEach((k) => keluhanBentuk.add(k));
  if (!nilai) return 'KOSONG';
  if (RAHASIA.has(nama)) {
    const sj = muatEnv.sidik(nama, nilai);
    return `terisi (${nilai.length} karakter)${sj ? ` sidik=${sj}` : ''}`;
  }
  return `terisi -> ${nilai}`;
};

// Kolom "asal" adalah inti pemeriksa ini. Tanpanya, variabel yang diam-diam
// dipasok berkas .env sisa penempatan lama tampak sama persis dengan variabel
// yang benar-benar dipasang di panel — dan perbedaan itulah yang menentukan
// apakah mengubah nilai di panel akan berpengaruh atau tidak.
const cetakGolongan = (judul, daftar) => {
  console.log(`\n${judul}`);
  for (const nama of daftar) {
    const tanda = baca(nama) ? '[v]' : '[ ]';
    const asal = muatEnv.asal(nama).padEnd(5);
    console.log(`  ${tanda} ${nama.padEnd(21)} asal=${asal}  ${gambaran(nama)}`);
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

// ------------------------------------------------- kendali environment
//
// Bagian ini menjawab satu pertanyaan yang berulang kali memakan waktu berjam-
// jam: "mengapa mengubah nilai di panel tidak berpengaruh?" Selama ini
// pertanyaan itu hanya bisa diterka, sebab empat sebab yang berbeda
// menghasilkan gejala yang identik dari luar. Kolom `asal` di atas dan
// ringkasan di bawah menjadikannya dapat dijawab dengan bukti.

const SEMUA = [...WAJIB_SELALU, ...WAJIB_PRODUCTION, ...DIANJURKAN, ...OPSIONAL];
const dariBerkas = SEMUA.filter((n) => muatEnv.asal(n) === '.env');
const ditimpaBerkas = SEMUA.filter((n) => muatEnv.asal(n) === '.env!');

console.log('\n' + '-'.repeat(66));
console.log('  KENDALI ENVIRONMENT');
console.log('-'.repeat(66));

if (muatEnv.adaBerkasEnv) {
  console.log(`  Berkas .env DITEMUKAN di ${muatEnv.jalurEnv}`);
  if (isProduction) {
    console.log('  Di peladen berkas ini seharusnya TIDAK ADA. Paket penempatan tidak pernah');
    console.log('  menyertakannya, dan mengekstrak ZIP tidak menghapus berkas yang tidak ada di');
    console.log('  dalam arsip — jadi ini sisa penempatan lama. Hapus berkasnya.');
  }
} else {
  console.log('  Berkas .env tidak ada. Seluruh nilai berasal dari pengelola environment.');
}

if (ditimpaBerkas.length) {
  console.log('');
  console.log('  [!] ENV_FILE_OVERRIDE sedang AKTIF. Berkas .env MENIMPA panel untuk:');
  console.log(`      ${ditimpaBerkas.join(', ')}`);
  console.log('      Selama ini menyala, mengubah nilai di panel TIDAK akan berpengaruh.');
  console.log('      Inilah jawabannya bila panel terasa tidak berkuasa. Matikan bendera itu.');
} else if (dariBerkas.length) {
  console.log('');
  console.log('  [!] Variabel berikut TIDAK ditemukan pada pengelola environment, sehingga');
  console.log('      nilainya dipasok berkas .env:');
  console.log(`      ${dariBerkas.join(', ')}`);
  console.log('      Bila salah satunya yang sedang Anda ubah di panel, periksa ejaan namanya —');
  console.log('      nama yang tidak persis sama membuat panel menambah variabel BARU, sementara');
  console.log('      aplikasi tetap membaca nilai lama dari berkas.');
} else {
  console.log('');
  console.log('  [v] Seluruh variabel yang terisi berasal dari pengelola environment.');
  console.log('      Panel berkuasa penuh. Bila nilai yang dipakai masih terasa keliru,');
  console.log('      sebabnya BUKAN urutan kemenangan nilai — periksa dua hal ini:');
  console.log('        1. Apakah aplikasi sudah di-Restart? Menyegarkan peramban TIDAK');
  console.log('           menjalankan ulang proses Node; nilai lama tetap di memori.');
  console.log('        2. Bandingkan sidik jari di atas sebelum dan sesudah Restart.');
  console.log('           Sidik yang tidak berubah berarti nilainya memang belum berganti.');
}

if (keluhanBentuk.size) {
  console.log('');
  console.log('  [!] Bentuk nilai yang mencurigakan:');
  keluhanBentuk.forEach((k) => console.log(`      - ${k}`));
}

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
