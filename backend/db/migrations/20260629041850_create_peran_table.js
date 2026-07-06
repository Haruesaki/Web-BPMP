
exports.up = function(knex) {
  return knex.schema.createTable('peran', (table) => {
    table.increments('id').primary();
    table.string('nama_peran', 50).notNullable().unique();
    table.boolean('is_superadmin').notNullable().defaultTo(false);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('peran');
};
