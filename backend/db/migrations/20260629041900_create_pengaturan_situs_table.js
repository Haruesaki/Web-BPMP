
exports.up = function(knex) {
  return knex.schema.createTable('pengaturan_situs', (table) => {
    table.increments('id').primary();
    table.string('nama_situs', 150).notNullable().defaultTo('BPMP');
    table.string('teks_sambutan', 255);
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  }).then(() => {
    return knex.raw('ALTER TABLE pengaturan_situs ADD CONSTRAINT ck_pengaturan_situs_tunggal CHECK (id = 1)');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('pengaturan_situs');
};
