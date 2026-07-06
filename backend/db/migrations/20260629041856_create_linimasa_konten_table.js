
exports.up = function(knex) {
  return knex.schema.createTable('linimasa_konten', (table) => {
    table.increments('id').primary();
    table.integer('halaman_konten_id').notNullable().references('id').inTable('halaman_konten').onDelete('CASCADE');
    table.date('tanggal_terbit').notNullable();
    table.text('catatan_versi');
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('halaman_konten_id', 'idx_linimasa_konten_halaman_id');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('linimasa_konten');
};
