exports.up = async function(knex) {
  const hasUrlFoto = await knex.schema.hasColumn('halaman_konten', 'url_foto');
  if (!hasUrlFoto) {
    await knex.schema.alterTable('halaman_konten', (table) => {
      table.string('url_foto', 500);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.alterTable('halaman_konten', (table) => {
    table.dropColumn('url_foto');
  });
};
