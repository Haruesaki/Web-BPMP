exports.up = function(knex) {
  return knex.schema.alterTable('info_kontak', (table) => {
    table.text('url_google_map');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('info_kontak', (table) => {
    table.dropColumn('url_google_map');
  });
};
