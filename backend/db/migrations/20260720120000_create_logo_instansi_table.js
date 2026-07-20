exports.up = function(knex) {
  return knex.schema.createTable('logo_instansi', (table) => {
    table.increments('id').primary();
    table.string('nama', 150).notNullable();
    table.string('url_logo', 500).notNullable();
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('logo_instansi');
};
