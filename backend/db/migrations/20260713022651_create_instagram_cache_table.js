/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('instagram_cache', (table) => {
    table.increments('id').primary();
    table.jsonb('profile_data').notNullable(); // Menyimpan { username, full_name, profile_pic_url_hd, followers, following, posts_count }
    table.timestamp('diperbarui_pada').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('instagram_cache');
};
