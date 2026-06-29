
exports.up = function(knex) {
  return knex.schema.createTable('pengaturan_tema', (table) => {
    table.increments('id').primary();
    table.string('warna_latar', 20).notNullable().defaultTo('#FFFFFF');
    table.string('warna_utama', 20).notNullable().defaultTo('#1D4ED8');
    table.string('warna_sekunder', 20).notNullable().defaultTo('#64748B');
    table.string('warna_teks', 20).notNullable().defaultTo('#111111');
    table.string('font_pilihan', 100).notNullable().defaultTo('Inter');
    table.string('url_logo_header', 500);
    table.timestamp('diperbarui_pada', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  }).then(() => {
    return knex.raw('ALTER TABLE pengaturan_tema ADD CONSTRAINT ck_pengaturan_tema_tunggal CHECK (id = 1)');
  });
};
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('pengaturan_tema');
};
