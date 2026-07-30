require('./config/muatEnv');

// Berkas ini sengaja membaca `process.env` langsung, TIDAK lewat config/env.js.
// Alasannya: knexfile dibaca juga oleh Knex CLI (`npx knex migrate:latest`) di
// luar konteks peladen web. Validasi yang menghentikan proses di sana akan
// memblokir perintah migrasi hanya karena variabel yang tak ada hubungannya
// (misal RESEND_API_KEY) belum diisi.

// Offset WIB dipakai sebagai angka, bukan nama zona ('Asia/Jakarta'), karena
// nama zona menuntut tabel zona waktu MySQL terpasang — kerap tidak tersedia di
// shared hosting. WIB tidak mengenal daylight saving, jadi offsetnya tetap.
const OFFSET_WIB = '+07:00';

// Menyamakan zona waktu SESI MySQL dengan aplikasi. Tanpa ini, di peladen yang
// berjalan pada UTC, `NOW()` dan `CURRENT_TIMESTAMP` menghasilkan waktu tujuh
// jam lebih lambat daripada perhitungan tanggal di sisi Node — sehingga
// kunjungan pukul 00:00–07:00 WIB tercatat pada tanggal sebelumnya.
const samakanZonaWaktu = (conn, done) => {
  conn.query(`SET time_zone = '${OFFSET_WIB}';`, (err) => done(err, conn));
};

// =========================================================================
//  PEMILIHAN JALAN SAMBUNGAN: SOKET UNIX ATAU TCP
//  -----------------------------------------------------------------------
//  MySQL mengenali pengguna sebagai PASANGAN (nama, host). Karena itu
//  'pengguna'@'localhost' dan 'pengguna'@'127.0.0.1' adalah DUA AKUN BERBEDA,
//  masing-masing dengan izinnya sendiri.
//
//  Peladen bersama seperti Hostinger lazimnya hanya membuat akun untuk
//  @'localhost'. Di situlah letak jebakannya: berbeda dari PHP dan perkakas
//  baris perintah mysql — yang memakai soket Unix ketika host bernilai
//  'localhost' — pustaka mysql2 pada Node SELALU menyambung lewat TCP. Nilai
//  'localhost' diresolusi menjadi 127.0.0.1, dan MySQL pun melihat sambungan
//  itu datang dari alamat IP, bukan dari 'localhost'.
//
//  Akibatnya sambungan ditolak dengan bunyi "Access denied for user
//  'x'@'127.0.0.1'" walaupun nama pengguna dan sandinya benar sepenuhnya —
//  dan phpMyAdmin pada peladen yang sama tetap bisa masuk, sehingga
//  kredensialnya tampak tidak bersalah. Mengubah DB_HOST menjadi 'localhost'
//  tidak menolong sama sekali, sebab mysql2 tetap memakai TCP.
//
//  Sambungan lewat soket menyelesaikannya: MySQL selalu mengenali sambungan
//  soket sebagai berasal dari 'localhost', sehingga akun @'localhost' cocok.
// =========================================================================

const fs = require('fs');

// Jalur soket yang lazim dipakai pemasangan MySQL/MariaDB di Linux.
const JALUR_SOKET_LAZIM = [
  '/var/lib/mysql/mysql.sock',
  '/var/run/mysqld/mysqld.sock',
  '/tmp/mysql.sock',
];

const ada = (jalur) => {
  try {
    return fs.existsSync(jalur);
  } catch (e) {
    return false;
  }
};

const cariSoket = () => {
  const eksplisit = String(process.env.DB_SOCKET_PATH ?? '').trim();

  // Nilai 'none' memaksa TCP — jalan keluar bila kelak ada pemasangan yang
  // justru hanya memberi izin bagi alamat IP.
  if (eksplisit.toLowerCase() === 'none') return null;

  if (eksplisit) {
    if (!ada(eksplisit)) {
      // Sengaja tetap dipakai, tidak diam-diam dialihkan ke TCP: bila jalur
      // yang ditetapkan pengelola ternyata keliru, galatnya harus terang.
      console.warn(`[db] DB_SOCKET_PATH menunjuk "${eksplisit}" yang tidak ditemukan. Tetap dicoba.`);
    }
    return eksplisit;
  }

  // Basis data di mesin lain tidak mungkin dijangkau lewat soket.
  const host = String(process.env.DB_HOST ?? '').trim().toLowerCase();
  if (host && host !== 'localhost' && host !== '127.0.0.1') return null;

  return JALUR_SOKET_LAZIM.find(ada) || null;
};

const soket = cariSoket();

const sambunganDasar = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Wajib disebut eksplisit: basis data yang dibuat lewat hPanel belum tentu
  // memakai utf8mb4 sebagai bawaan, dan tanpa ini emoji beserta tanda baca
  // tipografis (kerap ikut tersalin dari Word ke CKEditor) tersimpan rusak.
  charset: 'utf8mb4',
  // Menyelaraskan konversi DATETIME antara mysql2 dan aplikasi.
  timezone: OFFSET_WIB,
};

const sambungan = soket
  ? { ...sambunganDasar, socketPath: soket }
  : { ...sambunganDasar, host: process.env.DB_HOST, port: process.env.DB_PORT };

// Dicetak sekali saat modul dimuat. Tanpa keterangan ini, jalan mana yang
// dipakai hanya dapat diterka — padahal justru itulah yang menentukan akun
// MySQL mana yang dicocokkan.
console.log(
  soket
    ? `[db] Menyambung lewat soket ${soket} (MySQL akan mengenalinya sebagai @'localhost')`
    : `[db] Menyambung lewat TCP ${process.env.DB_HOST || '(DB_HOST kosong)'}:${process.env.DB_PORT || 3306}`
);

// =========================================================================
//  KOLAM SAMBUNGAN (CONNECTION POOL)
//  -----------------------------------------------------------------------
//  Setelan ini menyembuhkan galat yang berbulan-bulan berulang di Log Runtime:
//
//    Connection Error: Error: Connection lost: The server closed the connection.
//
//  MENGAPA `min: 0` — INI POKOK PERBAIKANNYA
//  -----------------------------------------
//  Sebelumnya `min: 2`. Nilai itu memerintahkan kolam SELALU menjaga dua
//  sambungan tetap hidup walaupun tidak ada yang memakainya. Di peladen
//  bersama, MySQL memutus sambungan yang menganggur melewati `wait_timeout`
//  (lazimnya beberapa menit saja, jauh lebih pendek daripada bawaan 8 jam).
//
//  Di sinilah jebakannya: pemulung sambungan menganggur milik kolam TIDAK AKAN
//  melepas sambungan sampai jumlahnya di bawah `min`. Jadi kedua sambungan
//  cadangan itu tidak pernah dilepas oleh kolam, dibiarkan menganggur sampai
//  MySQL sendiri yang memutusnya, lalu kolam menyadarinya sebagai galat. Selama
//  `min` lebih besar dari nol, siklus ini mustahil dihentikan.
//
//  Buktinya terbaca telak di log 30 Juli 2026: galatnya selalu datang
//  BERPASANGAN dengan selisih 1–2 milidetik (08:22:08.231/.233,
//  08:26:50.774/.775, 08:43:15.343/.344, dan seterusnya) — tepat sebanyak
//  `min`, yaitu dua sambungan cadangan yang mati bersamaan.
//
//  Dengan `min: 0`, tidak ada lagi sambungan yang dipaksa hidup menganggur,
//  sehingga tidak ada yang bisa dibunuh MySQL. Sambungan dibuat saat diperlukan
//  dan dilepas sendiri sesudahnya. Ongkosnya sepadan: menyambung ke MySQL lokal
//  lewat soket Unix hanya beberapa milidetik, sedangkan 500 acak yang dialami
//  pengunjung tidak punya ongkos yang bisa dibenarkan.
//
//  MENGAPA `max` DITURUNKAN DARI 10 MENJADI 5
//  ------------------------------------------
//  Angka ini berlaku PER PROSES, bukan per aplikasi — dan itu mudah terlewat.
//  Passenger menjalankan beberapa worker sekaligus; log 30 Juli memperlihatkan
//  EMPAT proses hidup berbarengan, masing-masing melapor "Backend berjalan di
//  port 5000". Dengan `max: 10`, keempatnya bersama-sama dapat menuntut sampai
//  40 sambungan, sementara peladen bersama membatasi `max_user_connections`
//  jauh di bawah itu. Kelebihannya ditolak MySQL, dan penolakan itu muncul di
//  hadapan pengunjung sebagai galat 500 yang datang dan pergi tanpa pola.
//
//  Nilai lain sengaja disebut eksplisit walau kebetulan sama dengan bawaan
//  Knex: setelan kolam adalah tempat yang sudah sekali menipu kita, dan nilai
//  yang tertulis terang lebih murah daripada nilai yang harus ditebak.
const KOLAM = {
  // Jangan pernah memaksa ada sambungan menganggur. Lihat penjelasan di atas.
  min: 0,
  // Batas per proses; ingat Passenger menjalankan beberapa proses sekaligus.
  max: 5,
  // Lepaskan sambungan menganggur LEBIH DULU daripada MySQL memutusnya.
  // Bersama `min: 0`, inilah yang membuat kolam tidak pernah lagi memegang
  // sambungan yang sudah mati diam-diam.
  idleTimeoutMillis: 30000,
  // Batas menunggu sambungan tersedia saat kolam sedang penuh. Tanpa batas yang
  // jelas, permintaan menggantung tanpa kabar dan tampak seperti situs hang.
  acquireTimeoutMillis: 30000,
  afterCreate: samakanZonaWaktu,
};

// Setelan kolam disamakan pada kedua mode DENGAN SENGAJA. Sebelumnya mode
// development tidak menyebut `min` maupun `max` sama sekali, sehingga memakai
// bawaan Knex — yang kebetulan `min: 2`, persis nilai yang menjadi sumber
// masalah di production. Akibatnya perilaku kolam yang diuji di localhost tidak
// pernah sama dengan yang berjalan di peladen, padahal justru itu yang perlu
// diuji. Menyamakannya membuat pengujian lokal bermakna.
module.exports = {
  development: {
    client: 'mysql2',
    connection: sambungan,
    pool: KOLAM,
    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  },
  production: {
    client: 'mysql2',
    connection: sambungan,
    pool: KOLAM,
    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  }
};
