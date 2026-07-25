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

      // MySQL tidak mendukung RETURNING, jadi baris disimpan dulu lalu dibaca ulang.
      if (existing) {
        await db('pengaturan_tema').where({ id: 1 }).update(payload);
      } else {
        await db('pengaturan_tema').insert({ id: 1, ...payload });
      }
      const savedSettings = await db('pengaturan_tema').where({ id: 1 }).first();

      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      await logActivityInternal(pName, pRole, 'Memperbarui Header Beranda');

      return res.json({
        pesan: 'Header beranda berhasil disimpan',
        data: normalizeHeader(savedSettings),
      });
    } catch (error) {
      // Detail teknis cukup di log server, tidak dikirim ke klien.
      console.error('Error updateHeader Beranda:', error);
      return res.status(500).json({
        pesan: 'Gagal menyimpan pengaturan header beranda',
      });
    }
  }
}

module.exports = BerandaHeaderController;
