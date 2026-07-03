
exports.up = function(knex) {
  return knex.schema.createTable('youtube_cache', (table) => {
    table.increments('id').primary();
    table.jsonb('videos_data').notNullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('youtube_cache');
};
