exports.up = async function(knex) {
  const hasUrutanBerita = await knex.schema.hasColumn('berita', 'urutan_beranda');
  if (!hasUrutanBerita) {
    await knex.schema.alterTable('berita', (table) => {
      table.integer('urutan_beranda').notNullable().defaultTo(0);
    });
  }

  const hasUrutanHalaman = await knex.schema.hasColumn('halaman_konten', 'urutan_beranda');
  if (!hasUrutanHalaman) {
    await knex.schema.alterTable('halaman_konten', (table) => {
      table.integer('urutan_beranda').notNullable().defaultTo(0);
    });
  }
};

exports.down = async function(knex) {
  await knex.schema.alterTable('berita', (table) => {
    table.dropColumn('urutan_beranda');
  });
  await knex.schema.alterTable('halaman_konten', (table) => {
    table.dropColumn('urutan_beranda');
  });
};
