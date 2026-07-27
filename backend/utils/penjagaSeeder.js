const env = require('../config/env');

// =========================================================================
//  PENJAGA SEEDER
//  -----------------------------------------------------------------------
//  Seeder superadmin memakai pola hapus-lalu-sisipkan berdasarkan surel.
//  Menjalankannya di production membawa dua bahaya sekaligus:
//
//    1. Menimpa akun yang kata sandinya barangkali sudah diganti pemiliknya.
//    2. Memasang kredensial yang nilainya pernah tertulis di kode sumber,
//       sehingga tercatat pada riwayat repositori dan diketahui siapa pun
//       yang dapat membacanya.
//
//  Karena itu seeder ditolak saat production kecuali diizinkan eksplisit
//  lewat ALLOW_PRODUCTION_SEED=true — dipakai sekali saja untuk menyiapkan
//  akun admin awal, lalu variabelnya segera dikosongkan kembali.
//
//  Berkas ini sengaja diletakkan di luar direktori db/seeds, sebab Knex
//  memperlakukan SETIAP berkas di direktori itu sebagai seeder.
// =========================================================================

const pastikanBolehMenjalankanSeeder = () => {
  if (env.isProduction && !env.ALLOW_PRODUCTION_SEED) {
    throw new Error(
      'Seeder ditolak: NODE_ENV=production. Seeder ini menimpa akun superadmin ' +
      'yang sudah ada. Bila memang disengaja untuk menyiapkan akun awal, jalankan ' +
      'ulang dengan ALLOW_PRODUCTION_SEED=true lalu segera kosongkan kembali ' +
      'variabel tersebut dan ganti kata sandinya lewat menu profil.'
    );
  }
};

/**
 * Mengambil kata sandi seeder dari environment.
 * Di production nilainya WAJIB ada — nilai cadangan sengaja tidak diberlakukan
 * agar kredensial yang tertulis di kode tidak pernah sampai ke peladen.
 */
const ambilSandiSeeder = (namaVariabel, cadanganDevelopment) => {
  const dariEnv = String(process.env[namaVariabel] ?? '').trim();
  if (dariEnv) return dariEnv;

  if (env.isProduction) {
    throw new Error(
      `${namaVariabel} wajib diisi saat menjalankan seeder di production. ` +
      'Isi variabel tersebut dengan kata sandi yang kuat, jangan memakai nilai bawaan.'
    );
  }

  return cadanganDevelopment;
};

module.exports = {
  pastikanBolehMenjalankanSeeder,
  ambilSandiSeeder,
};
