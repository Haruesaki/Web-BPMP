/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('statistik_pengunjung', (table) => {
    table.increments('id').primary();
    table.string('ip_address', 50).notNullable();
    table.date('tanggal').notNullable();
    table.integer('hits').defaultTo(1);
    table.text('user_agent', 'longtext');
    table.timestamps(true, true);
    table.unique(['ip_address', 'tanggal']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('statistik_pengunjung');
};
