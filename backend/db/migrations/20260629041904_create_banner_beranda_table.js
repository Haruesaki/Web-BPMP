
exports.up = async function(knex) {
  
  return knex.schema.createTable('banner_beranda', (table) => {
    table.increments('id').primary();
    table.enum('jenis_banner', ['banner_1', 'banner_2']).notNullable();
    table.string('judul', 255);
    table.string('subjudul', 255);
    table.string('url_gambar', 500);
    table.string('warna_latar_override', 20);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.boolean('is_aktif').notNullable().defaultTo(true);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('banner_beranda');
  
};
