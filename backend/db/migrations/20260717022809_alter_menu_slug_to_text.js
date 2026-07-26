exports.up = function(knex) {
  return knex.schema.alterTable('menu', function(table) {
    table.text('slug_atau_tautan', 'longtext').alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('menu', function(table) {
    table.string('slug_atau_tautan', 255).alter();
  });
};
