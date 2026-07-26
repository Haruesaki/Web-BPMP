/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('aktivitas_admin', (table) => {
    table.increments('id').primary();
    table.string('nama_admin').notNullable();
    table.string('role_admin').notNullable();
    table.text('aksi', 'longtext').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('aktivitas_admin');
};
