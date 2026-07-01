
exports.up = async function(knex) {
  await knex('peran').insert([
    { nama_peran: 'superadmin', is_superadmin: true },
    { nama_peran: 'admin', is_superadmin: false }
  ]);
  await knex('pengaturan_tema').insert({ id: 1, warna_latar: '#FFFFFF', warna_utama: '#1D4ED8', warna_teks: '#111111', font_pilihan: 'Inter' });
  await knex('pengaturan_situs').insert({ id: 1, nama_situs: 'BPMP', teks_sambutan: 'Selamat datang di Website BPMP' });
  await knex('info_kontak').insert({ id: 1, posel: null, no_telepon: null, alamat: null });
};
exports.down = async function(knex) {
  await knex('info_kontak').where({ id: 1 }).del();
  await knex('pengaturan_situs').where({ id: 1 }).del();
  await knex('pengaturan_tema').where({ id: 1 }).del();
  await knex('peran').whereIn('nama_peran', ['superadmin', 'admin']).del();
};
