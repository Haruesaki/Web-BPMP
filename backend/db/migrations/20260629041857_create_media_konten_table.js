
exports.up = async function(knex) {
  await knex.raw("CREATE TYPE jenis_pemilik_media_enum AS ENUM ('berita', 'halaman_konten', 'bagian_konten')");
  await knex.raw("CREATE TYPE jenis_media_enum AS ENUM ('gambar', 'dokumen', 'video')");
  return knex.schema.createTable('media_konten', (table) => {
    table.increments('id').primary();
    table.specificType('jenis_pemilik', 'jenis_pemilik_media_enum').notNullable();
    table.integer('pemilik_id').notNullable();
    table.string('url_berkas', 500).notNullable();
    table.specificType('jenis_media', 'jenis_media_enum').notNullable().defaultTo('gambar');
    table.string('teks_alternatif', 255);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index(['jenis_pemilik', 'pemilik_id'], 'idx_media_konten_pemilik');
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('media_konten');
  await knex.raw("DROP TYPE IF EXISTS jenis_media_enum");
  await knex.raw("DROP TYPE IF EXISTS jenis_pemilik_media_enum");
};
