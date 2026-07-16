exports.up = async function(knex) {
  return knex.schema.alterTable('halaman_konten', (table) => {
    table.dropUnique(['kunci_halaman']);
    table.integer('urutan_tampil').notNullable().defaultTo(0);
  });
};

exports.down = async function(knex) {
  return knex.schema.alterTable('halaman_konten', (table) => {
    table.dropColumn('urutan_tampil');
    table.unique(['kunci_halaman']);
  });
};
