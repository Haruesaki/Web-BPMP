const bcrypt = require('bcryptjs');
const { pastikanBolehMenjalankanSeeder, ambilSandiSeeder } = require('../../utils/penjagaSeeder');

exports.seed = async function(knex) {
  // Tolak lebih dulu bila dijalankan di production tanpa izin eksplisit.
  pastikanBolehMenjalankanSeeder();

  // Ambil data peran superadmin
  const peranSuperadmin = await knex('peran').where({ nama_peran: 'superadmin' }).first();

  if (!peranSuperadmin) {
    throw new Error('Peran superadmin tidak ditemukan. Jalankan migrasi terlebih dahulu.');
  }

  // Kata sandi diambil dari SEED_ADMIN_PASSWORD. Nilai cadangan di bawah HANYA
  // berlaku di development; di production variabel tersebut wajib diisi.
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(ambilSandiSeeder('SEED_ADMIN_PASSWORD', 'nasikejujuran'), salt);

  // Hapus pengguna lama jika sudah ada dengan email atau nama yang sama untuk menghindari duplikasi
  await knex('pengguna').where({ email: 'haruesakii@gmail.com' }).del();
  await knex('pengguna').where({ nama_pengguna: 'haruesaki' }).del();

  // Masukkan pengguna superadmin baru
  await knex('pengguna').insert({
    peran_id: peranSuperadmin.id,
    nama_pengguna: 'haruesaki',
    email: 'haruesakii@gmail.com',
    kata_sandi_hash: hash,
    is_aktif: true
  });
};
