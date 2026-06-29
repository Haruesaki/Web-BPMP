
exports.up = async function(knex) {
  await knex.raw("CREATE TYPE status_konten_enum AS ENUM ('draf', 'terbit', 'arsip')");
  return knex.schema.createTable('halaman_konten', (table) => {
    table.increments('id').primary();
    table.integer('menu_id').references('id').inTable('menu').onDelete('SET NULL');
    table.string('kunci_halaman', 100).notNullable().unique();
    table.string('judul', 255).notNullable();
    table.text('deskripsi_kaya');
    table.specificType('status', 'status_konten_enum').notNullable().defaultTo('draf');
    table.timestamp('tanggal_terbit', { useTz: true });
    table.integer('dibuat_oleh').references('id').inTable('pengguna').onDelete('SET NULL');
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('menu_id', 'idx_halaman_konten_menu_id');
    table.index('status', 'idx_halaman_konten_status');
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('halaman_konten');
  await knex.raw("DROP TYPE IF EXISTS status_konten_enum");
};
