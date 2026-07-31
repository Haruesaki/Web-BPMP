const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

// =========================================================================
//  PEMUAT .env — satu-satunya tempat dotenv dipanggil
//  -----------------------------------------------------------------------
//  Dipakai bersama oleh config/env.js dan knexfile.js. Disatukan di sini
//  karena dua alasan: supaya dotenv tidak dipanggil dua kali dalam satu
//  proses, dan supaya perlakuan terhadap berkas .env sama persis di kedua
//  jalur — termasuk saat Knex CLI dijalankan di luar konteks peladen web.
//
//  URUTAN KEMENANGAN NILAI
//  -----------------------
//  Pengelola environment (panel hosting) MENANG atas berkas .env.
//  Berkas .env hanya mengisi variabel yang belum ditetapkan platform.
//
//  Ini adalah perilaku bawaan dotenv, dan sengaja dikembalikan setelah
//  sempat dibalik. RIWAYATNYA PENTING supaya tidak dibalik lagi tanpa sebab:
//
//    27 Juli 2026 — pengelola variabel hPanel menolak menyimpan perubahan.
//      Nilai lama terus disuntikkan ke proses dan tidak ada satu pun cara
//      membetulkannya dari sisi aplikasi. Sebagai jalan keluar darurat,
//      pemuat ini dibuat MENIMPA (`override: true`) supaya berkas .env dapat
//      mengambil alih.
//
//    28 Juli 2026 — panel kembali berfungsi. Berkas .env dicabut dari paket
//      penempatan, tetapi setelan menimpanya TERTINGGAL. Sejak saat itu
//      berkas .env yang tersisa di peladen — dan ekstraksi ZIP tidak pernah
//      menghapus berkas yang tidak ada di dalam arsip — diam-diam mengalahkan
//      panel.
//
//    29 Juli 2026 — akibatnya menampakkan diri: RESEND_API_KEY diperbarui di
//      panel berkali-kali tetapi aplikasi tetap memakai kunci lama, sehingga
//      Resend membalas "API key is invalid" (HTTP 401). Setelan dikembalikan
//      ke bawaan (`override: false`).
//
//    29 Juli 2026, petang — gejala yang SAMA muncul lagi meski setelannya
//      sudah benar. Di sinilah pelajaran yang sesungguhnya: dari sisi kode
//      mustahil dibedakan mana di antara empat sebab ini yang sedang terjadi,
//      sebab keempatnya menghasilkan gejala yang identik dari luar —
//        (1) proses belum dijalankan ulang, sehingga nilai lama masih di
//            memori (menyegarkan peramban TIDAK menjalankan ulang Node);
//        (2) nama variabel di panel tidak persis sama, sehingga nilainya
//            justru dipasok berkas .env sisa lama dan panel tak berpengaruh;
//        (3) nilai di panel terapit tanda kutip atau memuat spasi — pengelola
//            environment meneruskan apa adanya, TIDAK mengurainya seperti
//            berkas .env, sehingga kunci yang sah pun menjadi tidak sah;
//        (4) paket yang berjalan di peladen memang belum memuat perbaikan.
//
//      Karena itu modul ini sekarang tidak hanya memuat nilai, tetapi juga
//      MELAPORKAN ASAL setiap nilai penting beserta sidik jarinya. Dengan
//      begitu pertanyaan "apakah panel benar-benar berkuasa" dijawab oleh
//      bukti dari peladen, bukan oleh terkaan.
//
//  Kaidah yang dipetik: nilai yang tidak dapat ditelusuri asalnya jauh lebih
//  mahal daripada kemudahan menimpa.
//
//  JALAN KELUAR DARURAT
//  --------------------
//  Bila kelak pengelola environment bermasalah lagi, setel ENV_FILE_OVERRIDE
//  menjadi true. Penyetelannya boleh diletakkan di dalam berkas .env itu
//  sendiri, sebab berkasnya diurai lebih dulu sebelum keputusan diambil —
//  penting, karena panel yang rusak justru tidak dapat dipakai memasangnya.
//  Pemakaiannya dicatat sebagai peringatan yang menyolok agar tidak terlupa
//  seperti yang sudah terjadi.
// =========================================================================

// Dua variabel ini ditetapkan PLATFORM dan tidak boleh diambil alih berkas
// .env dalam keadaan apa pun, bahkan saat ENV_FILE_OVERRIDE menyala:
//
//   NODE_ENV — penentu mode, satu-satunya variabel yang kekeliruannya tidak
//     menimbulkan galat apa pun. Situs tetap menyala, tetapi berjalan dengan
//     CORS longgar dan tanpa menyajikan frontend. Berkas .env yang tidak
//     sengaja terbawa dari komputer pengembang — isinya selalu 'development' —
//     akan mematikan mode production secara diam-diam.
//
//   PORT — di Hostinger porta ditetapkan platform. Berkas .env dari komputer
//     pengembang memuat 5000, dan bila nilai itu menimpa porta yang ditetapkan
//     platform, peladen mendengarkan di porta yang salah sehingga situs tidak
//     dapat dijangkau sama sekali.
const MILIK_PLATFORM = ['NODE_ENV', 'PORT'];

// Dicatat SEBELUM dotenv berjalan, supaya asal tiap nilai dapat dibedakan
// sesudahnya: yang sudah ada di sini berasal dari platform, sisanya dari berkas.
const adaSebelumnya = new Set(Object.keys(process.env));

// Jalur berkas .env ditetapkan RELATIF TERHADAP BERKAS INI, bukan terhadap
// direktori kerja proses.
//
// Bawaan dotenv mencari '.env' pada `process.cwd()`. Itu benar selama proses
// dijalankan dari akar aplikasi — dan menjadi salah begitu tidak. Peladen
// aplikasi seperti Passenger dan LiteSpeed tidak menjamin direktori kerjanya,
// sehingga berkas .env yang sudah terpasang dengan benar pun bisa tidak
// terbaca sama sekali. Kegagalannya senyap: tidak ada galat, hanya nilai yang
// tidak pernah muncul.
//
// Berkas ini berada di <akar aplikasi>/config/, jadi induknya adalah akar
// aplikasi — tempat .env semestinya berada, baik di lokal maupun di peladen.
const JALUR_ENV = path.join(__dirname, '..', '.env');

// `override: false` — platform menang. Variabel yang belum ada tetap diisi
// dari berkas, sehingga di localhost (yang tidak punya pengelola environment)
// perilakunya sama persis seperti sebelumnya.
const hasil = dotenv.config({ path: JALUR_ENV, override: false, quiet: true });

const adaBerkasEnv = Boolean(hasil.parsed) && !hasil.error;
const namaDariBerkas = hasil.parsed ? Object.keys(hasil.parsed) : [];

// Diisi bila ENV_FILE_OVERRIDE menyala; dipakai laporan asal di bawah agar
// tetap jujur saat jalan keluar darurat sedang dipakai.
const ditimpaOlehBerkas = new Set();

// ------------------------------------------------- keberadaan berkas .env
// Keberadaan berkasnya dilaporkan tegas. Tanpa ini, ".env tidak terbaca" dan
// ".env terbaca tetapi kosong" tampak sama persis dari luar.
if (!adaBerkasEnv) {
  console.log(`[env] Tidak ada berkas .env pada ${JALUR_ENV}. Seluruh nilai berasal dari pengelola environment.`);
} else {
  const diisi = namaDariBerkas.filter((n) => !adaSebelumnya.has(n));
  const dikalahkan = namaDariBerkas.filter((n) => adaSebelumnya.has(n));

  console.log(`[env] Berkas .env ditemukan pada ${JALUR_ENV} (${namaDariBerkas.length} variabel).`);
  if (diisi.length) {
    console.log(`      Mengisi ${diisi.length} variabel yang belum ditetapkan platform: ${diisi.join(', ')}`);
  }
  if (dikalahkan.length) {
    // Justru inilah yang perlu terbaca. Tanpa baris ini, variabel yang ada di
    // kedua tempat sekaligus tampak seperti hanya berasal dari panel — padahal
    // ketidakcocokan di antara keduanya adalah sumber kebingungan yang mahal.
    console.log(
      `      Diabaikan karena platform sudah menetapkannya (panel menang): ${dikalahkan.join(', ')}`
    );
  }
}

// ------------------------------------------------- jalan keluar darurat
// Bendera boleh datang dari platform ATAU dari dalam berkas .env. Yang kedua
// penting: keadaan yang melahirkan fitur ini justru panel yang tidak dapat
// menyimpan perubahan, sehingga bendera mustahil dipasang dari sana.
const bendera = String(
  process.env.ENV_FILE_OVERRIDE ?? hasil.parsed?.ENV_FILE_OVERRIDE ?? ''
)
  .trim()
  .toLowerCase();

if (bendera === 'true' && hasil.parsed) {
  for (const [nama, nilai] of Object.entries(hasil.parsed)) {
    if (MILIK_PLATFORM.includes(nama)) {
      if (adaSebelumnya.has(nama)) {
        console.warn(
          `[env] Berkas .env mencoba mengubah ${nama}, tetapi variabel itu milik platform. Diabaikan.`
        );
      }
      continue;
    }
    if (adaSebelumnya.has(nama) && process.env[nama] !== nilai) {
      process.env[nama] = nilai;
      ditimpaOlehBerkas.add(nama);
    }
  }

  console.warn('[env] PERHATIAN: ENV_FILE_OVERRIDE aktif — berkas .env MENIMPA pengelola environment.');
  console.warn('      Ini jalan keluar darurat. Selama menyala, perubahan di panel TIDAK berpengaruh');
  console.warn('      bagi variabel di bawah ini. Matikan segera setelah panel kembali normal.');
  if (ditimpaOlehBerkas.size) {
    console.warn(`      Variabel yang ditimpa: ${[...ditimpaOlehBerkas].join(', ')}`);
  } else {
    console.warn('      Tidak ada variabel yang benar-benar ditimpa (isinya sama atau belum ditetapkan platform).');
  }
}

// =========================================================================
//  PELACAK ASAL NILAI
//  -----------------------------------------------------------------------
//  Bagian di bawah ini tidak mengubah satu nilai pun. Tugasnya hanya menjawab
//  satu pertanyaan yang selama ini hanya bisa diterka: "nilai yang sedang
//  dipakai proses ini datang dari mana?"
// =========================================================================

/**
 * Asal sebuah variabel: 'panel' (dari pengelola environment platform),
 * '.env' (dari berkas di akar aplikasi), atau '-' (tidak ada di mana pun).
 */
const asal = (nama) => {
  if (ditimpaOlehBerkas.has(nama)) return '.env!';  // menimpa panel — keadaan darurat
  if (adaSebelumnya.has(nama)) return 'panel';
  if (namaDariBerkas.includes(nama)) return '.env';
  return '-';
};

// Hanya variabel BERENTROPI TINGGI yang boleh disidik jari.
//
// Sidik jari di sini adalah 8 digit heksadesimal pertama dari SHA-256 — hanya
// 32 bit. Bagi token acak buatan mesin (kunci API, rahasia cron), memulihkan
// nilainya dari sidik itu mustahil secara praktis. Tetapi bagi nilai yang
// DIPILIH MANUSIA — kata sandi basis data, kunci JWT buatan sendiri — sidik
// sependek itu dapat dipecahkan dengan serangan kamus di luar sistem. Karena
// itu keduanya sengaja TIDAK disidik; bagi mereka hanya panjangnya yang
// ditampilkan, dan itu sudah cukup untuk mendeteksi salah tempel.
const BOLEH_DISIDIK = new Set(['RESEND_API_KEY', 'YOUTUBE_API_KEY', 'RAPIDAPI_KEY', 'CRON_SECRET']);

const RAHASIA = new Set([
  'JWT_SECRET', 'DB_PASSWORD', 'RESEND_API_KEY', 'CRON_SECRET',
  'YOUTUBE_API_KEY', 'RAPIDAPI_KEY', 'SEED_ADMIN_PASSWORD', 'SEED_ADMIN_PASSWORD_2',
]);

/**
 * Sidik jari nilai. Nama variabel ikut diadon agar dua variabel bernilai sama
 * tidak saling membocorkan. Mengembalikan untai kosong bila tidak boleh
 * disidik atau nilainya kosong.
 */
const sidik = (nama, nilai) => {
  if (!nilai || !BOLEH_DISIDIK.has(nama)) return '';
  return crypto.createHash('sha256').update(`${nama}\0${nilai}`).digest('hex').slice(0, 8);
};

// -------------------------------------------------- pembersih bentuk nilai
//
// ASIMETRI YANG MENIPU, dan sebab lahirnya bagian ini:
//
//   Berkas .env DIURAI oleh dotenv. Menulis RESEND_API_KEY="re_abc" di sana
//   menghasilkan nilai re_abc — tanda kutipnya dibuang saat penguraian.
//
//   Pengelola environment TIDAK mengurai apa pun. Menempelkan "re_abc"
//   lengkap dengan tanda kutip ke kolom panel menghasilkan nilai yang benar
//   benar berisi tanda kutip, sehingga tajuk yang terkirim menjadi
//   `Bearer "re_abc"` dan Resend membalas 401 "API key is invalid".
//
//   Gejalanya menyesatkan sempurna: panel memperlihatkan kunci yang benar,
//   kunci itu memang sah bila diuji di tempat lain, tetapi aplikasi tetap
//   ditolak — persis seperti bila perubahan panel tidak tersampaikan. Kedua
//   sebab yang sama sekali berbeda ini tampak identik dari luar.
//
// Karena itu, bagi variabel yang tata bahasanya TIDAK MUNGKIN memuat tanda
// kutip pengapit, tanda kutipnya dibuang otomatis dan kejadiannya dilaporkan.

// Aman dibersihkan: tak satu pun format nilainya membolehkan kutip pengapit.
const TANPA_KUTIP = new Set([
  'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_NAME',
  'DB_SOCKET_PATH', 'UPLOAD_DIR', 'FRONTEND_DIST_PATH', 'CORS_ORIGIN', 'PUBLIC_BASE_URL',
  'YOUTUBE_API_KEY', 'YOUTUBE_CHANNEL_ID', 'RAPIDAPI_KEY', 'CRON_SECRET', 'TZ', 'NODE_ENV',
]);

// Nilai yang tidak boleh memuat spasi/baris baru di TENGAH. Sengaja dibatasi
// pada token dan pengenal yang formatnya pasti — bukan pada kata sandi, sebab
// spasi bisa saja memang bagian dari kata sandi yang sah.
const TANPA_SPASI = new Set([
  'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'YOUTUBE_API_KEY', 'YOUTUBE_CHANNEL_ID',
  'RAPIDAPI_KEY', 'CRON_SECRET', 'DB_PORT', 'DB_HOST', 'DB_NAME',
]);

const berkutipGanda = (t) => t.length >= 2 && t.startsWith('"') && t.endsWith('"');
const berkutipTunggal = (t) => t.length >= 2 && t.startsWith("'") && t.endsWith("'");

/**
 * Membersihkan nilai mentah dan melaporkan kejanggalan bentuknya.
 * Mengembalikan { nilai, keluhan[] }. Tidak pernah memuat nilai di keluhan.
 */
const bersihkan = (nama, mentah) => {
  const keluhan = [];
  let nilai = String(mentah ?? '').trim();

  if (berkutipGanda(nilai) || berkutipTunggal(nilai)) {
    if (TANPA_KUTIP.has(nama)) {
      nilai = nilai.slice(1, -1).trim();
      keluhan.push(
        `${nama} terapit tanda kutip. Tanda kutipnya dibuang otomatis, tetapi HAPUS JUGA di pengelola ` +
          'environment: panel meneruskan nilai apa adanya dan tidak mengurai tanda kutip seperti berkas .env.'
      );
    } else {
      // Kata sandi dan kunci JWT sengaja tidak diutak-atik: tanda kutip bisa
      // saja memang bagian sah dari nilainya, dan mengubahnya diam-diam akan
      // memutus seluruh sesi yang sedang berjalan.
      keluhan.push(
        `${nama} tampak terapit tanda kutip. Nilainya SENGAJA tidak diubah karena tanda kutip mungkin ` +
          'memang bagian dari nilai — periksa sendiri di pengelola environment.'
      );
    }
  }

  if (TANPA_SPASI.has(nama) && /\s/.test(nilai)) {
    nilai = nilai.replace(/\s+/g, '');
    keluhan.push(
      `${nama} memuat spasi atau baris baru di tengah nilai. Karakter itu dibuang otomatis — biasanya ` +
        'sisa salin-tempel yang terpotong. Periksa kembali nilainya di pengelola environment.'
    );
  }

  return { nilai, keluhan };
};

// -------------------------------------------------------- ringkasan boot
//
// Variabel yang paling sering menjadi sumber kebingungan. Ringkasan ini
// dicetak setiap kali proses hidup, sehingga Log Runtime peladen sendiri yang
// menjawab pertanyaan "panel berkuasa atau tidak" — tanpa akses terminal.
const DIPANTAU = [
  'NODE_ENV', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'CORS_ORIGIN',
  'UPLOAD_DIR', 'JWT_SECRET', 'DB_PASSWORD', 'CRON_SECRET',
];

const barisRingkasan = DIPANTAU.map((nama) => {
  const { nilai } = bersihkan(nama, process.env[nama]);
  const a = asal(nama).padEnd(6);
  if (!nilai) return `        ${nama.padEnd(18)} asal=${a} KOSONG`;

  const sj = sidik(nama, nilai);
  const rincian = RAHASIA.has(nama)
    ? `panjang=${String(nilai.length).padEnd(4)}${sj ? ` sidik=${sj}` : ''}`
    : `nilai=${nilai}`;
  return `        ${nama.padEnd(18)} asal=${a} ${rincian}`.trimEnd();
});

console.log('[env] Asal nilai variabel penting — panel = pengelola environment, .env = berkas di akar aplikasi:');
barisRingkasan.forEach((b) => console.log(b));
console.log('        Sidik jari berubah setiap kali nilainya berubah, dan BUKAN nilainya sendiri.');
console.log('        Bila Anda mengubah nilai di panel lalu Restart tetapi sidik jarinya TETAP SAMA,');
console.log('        berarti perubahan di panel tidak sampai ke proses ini. Jalankan: npm run cek:env');

// Berkas .env di peladen melanggar kaidah "satu sumber kebenaran". Ia tidak
// selalu berbahaya — selama panel menetapkan variabel yang sama, panel tetap
// menang — tetapi ia MENUTUPI variabel yang luput dipasang di panel, sehingga
// kelalaian tidak pernah ketahuan sampai nilainya perlu diubah.
if (adaBerkasEnv && String(process.env.NODE_ENV ?? '').trim().toLowerCase() === 'production') {
  const hanyaDariBerkas = namaDariBerkas.filter((n) => !adaSebelumnya.has(n));
  console.warn('[env] PERHATIAN: berkas .env ditemukan di peladen production.');
  console.warn('      Paket penempatan tidak pernah menyertakannya — ini sisa penempatan lama, dan');
  console.warn('      ekstraksi ZIP tidak menghapus berkas yang tidak ada di dalam arsip. Hapus berkasnya.');
  if (hanyaDariBerkas.length) {
    console.warn(`      Variabel berikut saat ini DIPASOK BERKAS, bukan panel: ${hanyaDariBerkas.join(', ')}`);
    console.warn('      Mengubahnya di panel memang berpengaruh (panel menang), tetapi selama berkasnya ada,');
    console.warn('      variabel yang luput dipasang di panel tidak akan pernah terlihat kosong.');
  }
}

module.exports = {
  // Hasil mentah dotenv, dipertahankan bila kelak ada yang memerlukannya.
  hasil,
  jalurEnv: JALUR_ENV,
  adaBerkasEnv,
  namaDariBerkas,
  asal,
  sidik,
  bersihkan,
  bolehDisidik: (nama) => BOLEH_DISIDIK.has(nama),
  rahasia: (nama) => RAHASIA.has(nama),
};
