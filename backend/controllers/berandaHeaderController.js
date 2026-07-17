const db = require('../config/database');
const { logActivityInternal } = require('./aktivitasAdminController');

const normalizeHeader = (settings) => ({
  url_logo_header: settings?.url_logo_header ?? null,
});

class BerandaHeaderController {
  static async getHeader(req, res) {
    try {
      const settings = await db('pengaturan_tema').where({ id: 1 }).first();
      return res.json({ data: normalizeHeader(settings) });
    } catch (error) {
      console.error('Error getHeader Beranda:', error);
      return res.status(500).json({ pesan: 'Gagal mengambil pengaturan header beranda' });
    }
  }

  static async updateHeader(req, res) {
    const { url_logo_header } = req.body;

    try {
      const payload = {
        url_logo_header: url_logo_header || null,
        diperbarui_pada: db.fn.now(),
      };

      const existing = await db('pengaturan_tema').where({ id: 1 }).first();

      let savedSettings;
      if (existing) {
        const [updated] = await db('pengaturan_tema')
          .where({ id: 1 })
          .update(payload)
          .returning('*');
        savedSettings = updated;
      } else {
        const [inserted] = await db('pengaturan_tema')
          .insert({ id: 1, ...payload })
          .returning('*');
        savedSettings = inserted;
      }

      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      await logActivityInternal(pName, pRole, 'Memperbarui Header Beranda');

      return res.json({
        pesan: 'Header beranda berhasil disimpan',
        data: normalizeHeader(savedSettings),
      });
    } catch (error) {
      console.error('Error updateHeader Beranda:', error);
      return res.status(500).json({
        pesan: 'Gagal menyimpan pengaturan header beranda',
        detail: error.message,
      });
    }
  }
}

module.exports = BerandaHeaderController;
