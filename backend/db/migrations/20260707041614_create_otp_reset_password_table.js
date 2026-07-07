/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('otp_reset_password', function(table) {
    table.increments('id').primary();
    table.string('email').notNullable().index();
    table.string('otp_code', 6).notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('last_sent_at').notNullable();
    table.integer('cooldown_seconds').defaultTo(30).notNullable();
    table.integer('attempts').defaultTo(0).notNullable();
    table.boolean('is_verified').defaultTo(false).notNullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('otp_reset_password');
};
