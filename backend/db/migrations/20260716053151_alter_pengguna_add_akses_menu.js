exports.up = function(knex) {
  return knex.schema.alterTable('pengguna', (table) => {
    table.jsonb('akses_menu').notNullable().defaultTo('[]');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('pengguna', (table) => {
    table.dropColumn('akses_menu');
  });
};
