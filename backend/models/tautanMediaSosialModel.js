const db = require('../config/database');

const TautanMediaSosial = {
  getAll: async () => {
    return await db('tautan_media_sosial').orderBy('urutan_tampil', 'asc');
  },

  updateAll: async (dataList) => {
    return await db.transaction(async (trx) => {
      // Hapus data lama
      await trx('tautan_media_sosial').del();

      if (dataList && dataList.length > 0) {
        // Masukkan data baru
        const insertData = dataList.map((item, index) => ({
          platform: item.platform || 'Platform',
          url_tautan: item.url_tautan || '',
          url_logo: item.url_logo || null,
          urutan_tampil: index,
          is_tampil: true
        }));
        await trx('tautan_media_sosial').insert(insertData);
      }
      return true;
    });
  }
};

module.exports = TautanMediaSosial;
