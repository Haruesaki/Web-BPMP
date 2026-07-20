const UrutanSectionBeranda = require('../models/urutanSectionBerandaModel');

class UrutanSectionBerandaController {
  static async getOrder(req, res) {
    try {
      const sections = await UrutanSectionBeranda.getAll();
      return res.status(200).json({ success: true, data: sections });
    } catch (error) {
      console.error('Error in getOrder:', error);
      return res.status(500).json({ success: false, pesan: 'Gagal mengambil urutan section beranda.' });
    }
  }

  static async updateOrder(req, res) {
    try {
      const { sections } = req.body;
      if (!sections || !Array.isArray(sections)) {
        return res.status(400).json({ success: false, pesan: 'Data sections tidak valid.' });
      }

      await UrutanSectionBeranda.updateOrder(sections);
      return res.status(200).json({ success: true, pesan: 'Urutan section berhasil diperbarui.' });
    } catch (error) {
      console.error('Error in updateOrder:', error);
      return res.status(500).json({ success: false, pesan: 'Gagal memperbarui urutan section beranda.' });
    }
  }
}

module.exports = UrutanSectionBerandaController;
