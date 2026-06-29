
exports.up = function(knex) {
  return knex.schema.createTable('pengguna', (table) => {
    table.increments('id').primary();
    table.integer('peran_id').notNullable().references('id').inTable('peran').onDelete('RESTRICT');
    table.string('nama_pengguna', 100).notNullable().unique();
    table.string('email', 150).notNullable().unique();
    table.string('kata_sandi_hash', 255).notNullable();
    table.boolean('is_aktif').notNullable().defaultTo(true);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('peran_id', 'idx_pengguna_peran_id');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('pengguna');
};
