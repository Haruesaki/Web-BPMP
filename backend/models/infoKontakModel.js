const db = require('../config/database');

class InfoKontak {
  static async getInfo() {
    return await db('info_kontak').where('id', 1).first();
  }

  static async updateInfo(data) {
    const existing = await this.getInfo();
    if (!existing) {
      return await db('info_kontak').insert({ id: 1, ...data, diperbarui_pada: db.fn.now() }).returning('*');
    }
    return await db('info_kontak').where('id', 1).update({ ...data, diperbarui_pada: db.fn.now() }).returning('*');
  }
}

module.exports = InfoKontak;
