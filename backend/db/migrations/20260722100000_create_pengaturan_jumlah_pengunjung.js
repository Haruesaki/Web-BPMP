exports.up = async function(knex) {
  // Tambahkan section Jumlah Pengunjung jika belum ada
  const hasSection = await knex('urutan_section_beranda').where('nama_section', 'Jumlah Pengunjung').first();
  if (!hasSection) {
    const maxUrutan = await knex('urutan_section_beranda').max('urutan as max').first();
    await knex('urutan_section_beranda').insert({
      nama_section: 'Jumlah Pengunjung',
      urutan: (maxUrutan.max || 4) + 1,
      is_visible: true
    });
  }

  const hasTable = await knex.schema.hasTable('pengaturan_jumlah_pengunjung');
  if (!hasTable) {
    await knex.schema.createTable('pengaturan_jumlah_pengunjung', (table) => {
      table.increments('id').primary();
      table.integer('pengunjung_hari_ini').defaultTo(0);
      table.integer('total_pengunjung').defaultTo(0);
      table.boolean('is_synced').defaultTo(true);
      table.timestamps(true, true);
    });

    // Seed initial setting
    await knex('pengaturan_jumlah_pengunjung').insert({
      pengunjung_hari_ini: 123,
      total_pengunjung: 107030,
      is_synced: true
    });
  }
};

exports.down = async function(knex) {
  await knex('urutan_section_beranda').where('nama_section', 'Jumlah Pengunjung').del();
  await knex.schema.dropTableIfExists('pengaturan_jumlah_pengunjung');
};
