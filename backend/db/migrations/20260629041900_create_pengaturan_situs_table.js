
exports.up = function(knex) {
  return knex.schema.createTable('pengaturan_situs', (table) => {
    table.increments('id').primary();
    table.string('nama_situs', 150).notNullable().defaultTo('BPMP');
    table.string('teks_sambutan', 255);
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('pengaturan_situs');
};
