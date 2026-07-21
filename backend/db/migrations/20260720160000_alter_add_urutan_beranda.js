exports.up = async function(knex) {
  await knex.schema.alterTable('berita', (table) => {
    table.integer('urutan_beranda').notNullable().defaultTo(0);
  });
  await knex.schema.alterTable('halaman_konten', (table) => {
    table.integer('urutan_beranda').notNullable().defaultTo(0);
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('berita', (table) => {
    table.dropColumn('urutan_beranda');
  });
  await knex.schema.alterTable('halaman_konten', (table) => {
    table.dropColumn('urutan_beranda');
  });
};
