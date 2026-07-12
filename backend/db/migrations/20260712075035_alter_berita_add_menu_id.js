/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('berita', function(table) {
    table.integer('menu_id').unsigned().references('id').inTable('menu').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('berita', function(table) {
    table.dropColumn('menu_id');
  });
};
