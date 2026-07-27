require('dotenv').config();

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

const sambungan = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
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

module.exports = {
  development: {
    client: 'mysql2',
    connection: sambungan,
    pool: {
      afterCreate: samakanZonaWaktu
    },
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
    pool: {
      min: 2,
      max: 10,
      afterCreate: samakanZonaWaktu
    },
    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  }
};
