exports.up = async function(knex) {
  
  
  return knex.schema.createTable('media_konten', (table) => {
    table.increments('id').primary();
    table.enum('jenis_pemilik', ['berita', 'halaman_konten', 'bagian_konten']).notNullable();
    table.integer('pemilik_id').notNullable();
    table.string('url_berkas', 500).notNullable();
    table.enum('jenis_media', ['gambar', 'dokumen', 'video']).notNullable().defaultTo('gambar');
    table.string('teks_alternatif', 255);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(['jenis_pemilik', 'pemilik_id'], 'idx_media_konten_pemilik');
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('media_konten');
  
  
};
