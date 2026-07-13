const knex = require('../config/database');

const updateCache = async (profileData) => {
  // Hanya ada satu baris di cache instagram
  const existing = await knex('instagram_cache').first();
  
  if (existing) {
    return await knex('instagram_cache')
      .where({ id: existing.id })
      .update({
        profile_data: JSON.stringify(profileData),
        diperbarui_pada: knex.fn.now()
      });
  } else {
    return await knex('instagram_cache').insert({
      profile_data: JSON.stringify(profileData),
      diperbarui_pada: knex.fn.now()
    });
  }
};

const getCache = async () => {
  return await knex('instagram_cache').first();
};

module.exports = {
  updateCache,
  getCache
};
