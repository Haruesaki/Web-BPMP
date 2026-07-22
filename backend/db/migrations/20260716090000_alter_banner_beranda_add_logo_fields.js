exports.up = async function(knex) {
  const hasLogo1 = await knex.schema.hasColumn('banner_beranda', 'logo_1');
  const hasLogo2 = await knex.schema.hasColumn('banner_beranda', 'logo_2');

  return knex.schema.alterTable('banner_beranda', (table) => {
    if (!hasLogo1) table.string('logo_1', 150);
    if (!hasLogo2) table.string('logo_2', 150);
  });
};

exports.down = async function(knex) {
  const hasLogo1 = await knex.schema.hasColumn('banner_beranda', 'logo_1');
  const hasLogo2 = await knex.schema.hasColumn('banner_beranda', 'logo_2');

  return knex.schema.alterTable('banner_beranda', (table) => {
    if (hasLogo1) table.dropColumn('logo_1');
    if (hasLogo2) table.dropColumn('logo_2');
  });
};
