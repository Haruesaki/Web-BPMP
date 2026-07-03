
exports.up = async function(knex) {
  await knex.raw("CREATE TYPE jenis_banner_enum AS ENUM ('banner_1', 'banner_2')");
  return knex.schema.createTable('banner_beranda', (table) => {
    table.increments('id').primary();
    table.specificType('jenis_banner', 'jenis_banner_enum').notNullable();
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
  await knex.raw("DROP TYPE IF EXISTS jenis_banner_enum");
};
