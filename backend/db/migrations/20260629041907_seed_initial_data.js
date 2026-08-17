// =========================================================================
//  BENIH DATA AWAL
//  -----------------------------------------------------------------------
//  CATATAN 17 Agustus 2026 — penyemaian `pengaturan_situs` DIBUANG dari sini.
//  Tabelnya sendiri sudah dihapus karena tidak pernah dibaca satu baris kode
//  pun (kolom `nama_situs` dan `teks_sambutan` tidak muncul di mana-mana);
//  nama situs dan teks sambutan sesungguhnya diambil dari `pengaturan_tema`
//  beserta `banner_beranda`.
//
//  Menyunting migrasi yang SUDAH pernah berjalan biasanya terlarang, dan di
//  sini pun tidak mengubah apa pun pada basis data yang sudah ada — barisnya
//  telanjur tercatat di `knex_migrations` sehingga tidak akan dijalankan lagi.
//  Yang diselamatkan adalah pemasangan dari NOL: tanpa suntingan ini, migrasi
//  akan berhenti dengan galat "Table 'pengaturan_situs' doesn't exist" karena
//  berkas pembuat tabelnya sudah tidak ada lagi.
// =========================================================================

exports.up = async function(knex) {
  await knex('peran').insert([
    { nama_peran: 'superadmin', is_superadmin: true },
    { nama_peran: 'admin', is_superadmin: false }
  ]);
  await knex('pengaturan_tema').insert({ id: 1, warna_latar: '#FFFFFF', warna_utama: '#1D4ED8', warna_teks: '#111111', font_pilihan: 'Inter' });
  await knex('info_kontak').insert({ id: 1, posel: null, no_telepon: null, alamat: null });
};
exports.down = async function(knex) {
  await knex('info_kontak').where({ id: 1 }).del();
  await knex('pengaturan_tema').where({ id: 1 }).del();
  await knex('peran').whereIn('nama_peran', ['superadmin', 'admin']).del();
};
