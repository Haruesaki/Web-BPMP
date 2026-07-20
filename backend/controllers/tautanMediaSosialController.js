const TautanMediaSosial = require('../models/tautanMediaSosialModel');

const TautanMediaSosialController = {
  getSemua: async (req, res) => {
    try {
      const data = await TautanMediaSosial.getAll();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error get tautan media sosial:', error);
      return res.status(500).json({ success: false, pesan: 'Gagal mengambil tautan media sosial' });
    }
  },

  updateSemua: async (req, res) => {
    try {
      const { socials } = req.body;
      if (!Array.isArray(socials)) {
        return res.status(400).json({ success: false, pesan: 'Format data tidak valid' });
      }

      await TautanMediaSosial.updateAll(socials);
      return res.status(200).json({ success: true, pesan: 'Tautan media sosial berhasil diperbarui' });
    } catch (error) {
      console.error('Error update tautan media sosial:', error);
      return res.status(500).json({ success: false, pesan: 'Gagal memperbarui tautan media sosial' });
    }
  }
};

module.exports = TautanMediaSosialController;
