exports.up = async function(knex) {
  await knex('hak_akses_menu').del();
  
  return knex.schema.alterTable('hak_akses_menu', (table) => {
    table.dropUnique(['peran_id', 'menu_id']);
    table.dropForeign('peran_id');
    table.dropColumn('peran_id');
    
    table.integer('pengguna_id').notNullable().references('id').inTable('pengguna').onDelete('CASCADE');
    table.unique(['pengguna_id', 'menu_id']);
  });
};

exports.down = async function(knex) {
  await knex('hak_akses_menu').del();
  
  return knex.schema.alterTable('hak_akses_menu', (table) => {
    table.dropUnique(['pengguna_id', 'menu_id']);
    table.dropForeign('pengguna_id');
    table.dropColumn('pengguna_id');
    
    table.integer('peran_id').notNullable().references('id').inTable('peran').onDelete('CASCADE');
    table.unique(['peran_id', 'menu_id']);
  });
};
