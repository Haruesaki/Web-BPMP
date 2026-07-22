/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('profil_pegawai');
  if (!exists) {
    return knex.schema.createTable('profil_pegawai', function(table) {
      table.increments('id').primary();
      table.integer('menu_id').unsigned().notNullable().references('id').inTable('menu').onDelete('CASCADE');
      table.string('nama_lengkap', 150).notNullable();
      table.string('jabatan', 150);
      table.string('url_foto', 500);
      table.integer('urutan_tampil').notNullable().defaultTo(0);
      table.timestamp('dibuat_pada').defaultTo(knex.fn.now());
      table.timestamp('diperbarui_pada').defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('profil_pegawai');
};
