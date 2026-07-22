const db = require('../config/database');

class UrutanSectionBeranda {
  static async getAll() {
    return await db('urutan_section_beranda').orderBy('urutan', 'asc');
  }

  static async updateOrder(sections) {
    const trx = await db.transaction();
    try {
      // Clear existing records completely to avoid conflicts, or update them.
      // Since it's exactly 4 records, updating is safer.
      for (const section of sections) {
        // Find by nama_section or ID
        // The payload from frontend will likely send the menu name as `nama_section`
        const updateData = {
          urutan: section.urutan,
          is_visible: section.is_visible !== undefined ? section.is_visible : true,
          updated_at: new Date()
        };
        
        const existing = await trx('urutan_section_beranda').where('nama_section', section.nama_section).first();
        if (existing) {
          await trx('urutan_section_beranda').where('id', existing.id).update(updateData);
        } else {
          // If not exist, insert
          await trx('urutan_section_beranda').insert({
            nama_section: section.nama_section,
            ...updateData
          });
        }
      }
      await trx.commit();
      return true;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}

module.exports = UrutanSectionBeranda;
