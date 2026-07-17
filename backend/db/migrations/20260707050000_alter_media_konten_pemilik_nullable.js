
// Saat gambar di-upload dari CKEditor, halaman_konten pemiliknya sering BELUM
// ada (admin masih membuat post baru). Maka `pemilik_id` dibuat nullable agar
// media bisa direkam lebih dulu sebagai "belum tertaut" (unattached), lalu
// ditautkan belakangan ketika konten disimpan.
exports.up = function (knex) {
  return knex.schema.alterTable('media_konten', (table) => {
    table.integer('pemilik_id').nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('media_konten', (table) => {
    table.integer('pemilik_id').notNullable().alter();
  });
};
