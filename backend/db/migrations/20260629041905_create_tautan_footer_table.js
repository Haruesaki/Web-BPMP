
exports.up = function(knex) {
  return knex.schema.createTable('tautan_footer', (table) => {
    table.increments('id').primary();
    table.string('label', 150).notNullable();
    table.string('url', 500).notNullable();
    table.integer('urutan_tampil').notNullable().defaultTo(0);
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('tautan_footer');
};
