const knex = require('../config/database');

const updateCache = async (profileData) => {
  // Hanya ada satu baris di cache instagram
  const existing = await knex('instagram_cache').first();
  
  if (existing) {
    let existingData = {};
    if (existing.profile_data) {
      existingData = typeof existing.profile_data === 'string' ? JSON.parse(existing.profile_data) : existing.profile_data;
    }
    const newData = { ...existingData, ...profileData };

    return await knex('instagram_cache')
      .where({ id: existing.id })
      .update({
        profile_data: JSON.stringify(newData),
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

const updateEmbedLinks = async (links) => {
  const existing = await knex('instagram_cache').first();
  if (existing) {
    let existingData = {};
    if (existing.profile_data) {
      existingData = typeof existing.profile_data === 'string' ? JSON.parse(existing.profile_data) : existing.profile_data;
    }
    const newData = { ...existingData, embed_links: links };
    return await knex('instagram_cache')
      .where({ id: existing.id })
      .update({
        profile_data: JSON.stringify(newData),
        diperbarui_pada: knex.fn.now()
      });
  } else {
    return await knex('instagram_cache').insert({
      profile_data: JSON.stringify({ embed_links: links }),
      diperbarui_pada: knex.fn.now()
    });
  }
};

module.exports = {
  updateCache,
  getCache,
  updateEmbedLinks
};
