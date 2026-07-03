
exports.up = function(knex) {
  return knex.schema.createTable('bagian_konten', (table) => {
    table.increments('id').primary();
    table.integer('halaman_konten_id').notNullable().references('id').inTable('halaman_konten').onDelete('CASCADE');
    table.string('jenis_bagian', 50).notNullable().defaultTo('default');
    table.string('judul', 255);
    table.text('deskripsi');
    table.string('warna_latar_override', 20);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('halaman_konten_id', 'idx_bagian_konten_halaman_id');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('bagian_konten');
};
