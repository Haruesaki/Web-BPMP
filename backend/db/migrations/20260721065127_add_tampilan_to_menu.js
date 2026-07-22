exports.up = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('menu', 'tampilan');
  if (!hasColumn) {
    await knex.schema.alterTable('menu', table => {
      table.string('tampilan').defaultTo('Vertikal');
    });
  }
};

exports.down = async function(knex) {
  const hasColumn = await knex.schema.hasColumn('menu', 'tampilan');
  if (hasColumn) {
    await knex.schema.alterTable('menu', table => {
      table.dropColumn('tampilan');
    });
  }
};
