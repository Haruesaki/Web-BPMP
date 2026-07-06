
exports.up = function(knex) {
  return knex.schema.createTable('hak_akses_menu', (table) => {
    table.increments('id').primary();
    table.integer('peran_id').notNullable().references('id').inTable('peran').onDelete('CASCADE');
    table.integer('menu_id').notNullable().references('id').inTable('menu').onDelete('CASCADE');
    table.boolean('bisa_lihat').notNullable().defaultTo(true);
    table.boolean('bisa_edit').notNullable().defaultTo(false);
    table.unique(['peran_id', 'menu_id']);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('hak_akses_menu');
};
