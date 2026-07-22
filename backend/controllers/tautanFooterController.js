const TautanFooter = require('../models/tautanFooterModel');
const { logActivityInternal } = require('./aktivitasAdminController');

exports.getTautanFooter = async (req, res) => {
  try {
    const data = await TautanFooter.getAll();
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error in getTautanFooter:', error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat mengambil tautan footer.' });
  }
};

exports.updateTautanFooter = async (req, res) => {
  try {
    const { links } = req.body;
    
    // links is expected to be an array of objects: { label: '...', link: '...' }
    if (!Array.isArray(links)) {
      return res.status(400).json({ success: false, pesan: 'Format data tautan tidak valid.' });
    }

    // Filter out empty links if desired (e.g., both label and link are empty)
    const validLinks = links.filter(item => item.label && item.label.trim() !== '' && item.link && item.link.trim() !== '');

    const updated = await TautanFooter.updateAll(validLinks);
    
    // Log activity
    if (req.user) {
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      await logActivityInternal(pName, pRole, 'Memperbarui informasi "Tautan" pada Footer');
    }

    res.json({
      success: true,
      pesan: 'Tautan Footer berhasil diperbarui.',
      data: updated
    });
  } catch (error) {
    console.error('Error in updateTautanFooter:', error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan server saat memperbarui tautan footer.' });
  }
};
