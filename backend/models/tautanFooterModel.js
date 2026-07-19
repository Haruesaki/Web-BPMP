const db = require('../config/database');

class TautanFooter {
  static async getAll() {
    return await db('tautan_footer').orderBy('urutan_tampil', 'asc');
  }

  static async updateAll(links) {
    return await db.transaction(async trx => {
      // Delete all existing links
      await trx('tautan_footer').del();
      
      // Insert new links
      if (links && links.length > 0) {
        const insertData = links.map((item, index) => ({
          label: item.label,
          url: item.link,
          urutan_tampil: index
        }));
        return await trx('tautan_footer').insert(insertData).returning('*');
      }
      return [];
    });
  }
}

module.exports = TautanFooter;
