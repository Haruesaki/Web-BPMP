const db = require('../config/database');

class MenuModel {
  // Ambil semua menu, bisa difilter untuk aktif saja
  static async getAll(onlyActive = false) {
    let query = db('menu').orderBy('urutan_tampil', 'asc').orderBy('id', 'asc');
    if (onlyActive) {
      query = query.where('is_aktif', true);
    }
    return await query;
  }

  // Buat menu baru
  static async create(data) {
    const [result] = await db('menu').insert(data).returning('*');
    return result;
  }

  // Update menu
  static async update(id, data) {
    const [result] = await db('menu')
      .where('id', id)
      .update({ ...data, diperbarui_pada: db.fn.now() })
      .returning('*');
    return result;
  }

  // Update urutan secara batch
  static async updateUrutan(updates) {
    // updates adalah array of { id, urutan_tampil }
    const trx = await db.transaction();
    try {
      for (let item of updates) {
        await trx('menu').where('id', item.id).update({ urutan_tampil: item.urutan_tampil });
      }
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  // Hapus menu beserta sub-menunya
  static async delete(id) {
    const trx = await db.transaction();
    try {
      // Hapus submenus terlebih dahulu (kalau ada)
      await trx('menu').where('induk_id', id).del();
      // Baru hapus menu utama
      await trx('menu').where('id', id).del();
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}

module.exports = MenuModel;
