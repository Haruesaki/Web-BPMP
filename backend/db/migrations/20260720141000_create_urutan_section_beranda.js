exports.up = function (knex) {
  return knex.schema.createTable('urutan_section_beranda', (table) => {
    table.increments('id').primary();
    table.string('nama_section').notNullable();
    table.integer('urutan').notNullable();
    table.boolean('is_visible').defaultTo(true);
    table.timestamps(true, true);
  }).then(() => {
    // Insert initial data
    return knex('urutan_section_beranda').insert([
      { nama_section: 'Berita', urutan: 1, is_visible: true },
      { nama_section: 'Logo Mitra', urutan: 2, is_visible: true },
      { nama_section: 'Preview Media Sosial Instagram', urutan: 3, is_visible: true },
      { nama_section: 'Preview Media Sosial YouTube', urutan: 4, is_visible: true }
    ]);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('urutan_section_beranda');
};
