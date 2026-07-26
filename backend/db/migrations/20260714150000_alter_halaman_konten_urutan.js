exports.up = async function(knex) {
  // Gunakan raw query untuk menjatuhkan constraint unik secara aman tanpa menyebabkan error
  // jika constraint tersebut sebelumnya sudah tidak ada (IF EXISTS).
  try {
    await knex.raw('ALTER TABLE halaman_konten DROP INDEX halaman_konten_kunci_halaman_unique');
  } catch (err) {
    // Abaikan jika index sudah tidak ada
  }
  
  const hasColumn = await knex.schema.hasColumn('halaman_konten', 'urutan_tampil');
  if (!hasColumn) {
    await knex.schema.alterTable('halaman_konten', (table) => {
      table.integer('urutan_tampil').notNullable().defaultTo(0);
    });
  }
};

exports.down = async function(knex) {
  return knex.schema.alterTable('halaman_konten', (table) => {
    table.dropColumn('urutan_tampil');
    table.unique(['kunci_halaman']);
  });
};
