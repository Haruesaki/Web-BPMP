exports.up = function(knex) {
  return knex.schema.alterTable('tautan_media_sosial', (table) => {
    table.string('url_logo', 500).nullable();
    table.dropUnique('platform');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('tautan_media_sosial', (table) => {
    table.dropColumn('url_logo');
    table.unique('platform');
  });
};
