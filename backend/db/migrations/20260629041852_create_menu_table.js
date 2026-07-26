
exports.up = async function(knex) {
  
  return knex.schema.createTable('menu', (table) => {
    table.increments('id').primary();
    table.integer('induk_id').unsigned().references('id').inTable('menu').onDelete('CASCADE');
    table.string('nama_menu', 150).notNullable();
    table.string('ikon_menu', 100);
    table.enum('jenis_menu', ['post', 'page', 'link']).notNullable().defaultTo('page');
    table.string('slug_atau_tautan', 255);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.boolean('is_aktif').notNullable().defaultTo(true);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('induk_id', 'idx_menu_induk_id');
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('menu');
  
};
