
exports.up = function(knex) {
  return knex.schema.createTable('logo_mitra', (table) => {
    table.increments('id').primary();
    table.string('nama_mitra', 150);
    table.string('url_logo', 500).notNullable();
    table.boolean('is_tampil').notNullable().defaultTo(true);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('logo_mitra');
};
