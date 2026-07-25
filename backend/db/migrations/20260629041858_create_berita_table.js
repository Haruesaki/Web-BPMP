
exports.up = async function(knex) {
  
  return knex.schema.createTable('berita', (table) => {
    table.increments('id').primary();
    table.integer('penulis_id').unsigned().references('id').inTable('pengguna').onDelete('SET NULL');
    table.string('judul', 255).notNullable();
    table.text('deskripsi_kaya', 'longtext');
    table.string('url_foto', 500);
    table.enum('status', ['draf', 'terbit', 'arsip']).notNullable().defaultTo('draf');
    table.timestamp('waktu_tayang', { useTz: true });
    table.integer('jumlah_dilihat').notNullable().defaultTo(0);
    table.timestamp('dibuat_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.index('status', 'idx_berita_status');
    table.index('waktu_tayang', 'idx_berita_waktu_tayang');
    table.index('penulis_id', 'idx_berita_penulis_id');
  });
};
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('berita');
  
};
