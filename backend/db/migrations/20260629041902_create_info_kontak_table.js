
exports.up = function(knex) {
  return knex.schema.createTable('info_kontak', (table) => {
    table.increments('id').primary();
    table.string('posel', 150);
    table.string('no_telepon', 50);
    table.text('alamat');
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  }).then(() => {
    return knex.raw('ALTER TABLE info_kontak ADD CONSTRAINT ck_info_kontak_tunggal CHECK (id = 1)');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('info_kontak');
};
