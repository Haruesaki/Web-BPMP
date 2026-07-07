const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Ambil data peran superadmin
  const peranSuperadmin = await knex('peran').where({ nama_peran: 'superadmin' }).first();
  
  if (!peranSuperadmin) {
    throw new Error('Peran superadmin tidak ditemukan. Jalankan migrasi terlebih dahulu.');
  }

  // Hash kata sandi "oysterizer"
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('oysterizer', salt);

  // Hapus pengguna lama jika sudah ada dengan email yang sama untuk menghindari duplikasi
  await knex('pengguna').where({ email: 'ahmaddonijalaludin@gmail.com' }).del();

  // Masukkan pengguna superadmin baru
  await knex('pengguna').insert({
    peran_id: peranSuperadmin.id,
    nama_pengguna: 'haruki gengseter',
    email: 'ahmaddonijalaludin@gmail.com',
    kata_sandi_hash: hash,
    is_aktif: true
  });
};
