
exports.up = function(knex) {
  return knex.schema.createTable('tautan_media_sosial', (table) => {
    table.increments('id').primary();
    table.string('platform', 50).notNullable().unique();
    table.string('nama_pengguna_atau_no', 150);
    table.string('url_tautan', 500);
    table.boolean('is_tampil').notNullable().defaultTo(true);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tautan_media_sosial');
};
