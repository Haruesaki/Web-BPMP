const db = require('../config/database');

class InfoKontak {
  static async getInfo() {
    return await db('info_kontak').where('id', 1).first();
  }

  // Tabel ini hanya berisi satu baris konfigurasi (id = 1).
  // MySQL tidak mendukung RETURNING, jadi baris terbaru diambil ulang setelah simpan.
  static async updateInfo(data) {
    const existing = await this.getInfo();
    if (!existing) {
      await db('info_kontak').insert({ id: 1, ...data, diperbarui_pada: db.fn.now() });
    } else {
      await db('info_kontak').where('id', 1).update({ ...data, diperbarui_pada: db.fn.now() });
    }
    return await this.getInfo();
  }
}

module.exports = InfoKontak;
