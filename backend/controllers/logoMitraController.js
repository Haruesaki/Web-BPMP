const LogoMitra = require('../models/LogoMitra');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

const UPLOADS_DIR = path.join(env.UPLOAD_DIR, 'mitra');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const getLogoMitra = async (req, res) => {
  try {
    const logos = await LogoMitra.getAll();
    res.json({ success: true, data: logos });
  } catch (error) {
    console.error('Error getLogoMitra:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createLogoMitra = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(400).json({ success: false, message: req.fileValidationError });
    }
    
    let url_logo = '';
    if (req.file) {
      const filename = `mitra-${Date.now()}.webp`;
      const filepath = path.join(UPLOADS_DIR, filename);
      await sharp(req.file.buffer)
        .resize({ width: 400, withoutEnlargement: true }) // Ukuran proporsional logo mitra
        .webp({ quality: 80 })
        .toFile(filepath);
      url_logo = `/uploads/mitra/${filename}`;
    } else {
      return res.status(400).json({ success: false, message: 'Logo wajib diunggah' });
    }

    const newLogo = await LogoMitra.create({
      nama_mitra: '',
      url_logo: url_logo,
      is_tampil: true,
      urutan_tampil: 0
    });

    res.json({ success: true, data: newLogo });
  } catch (error) {
    console.error('Error createLogoMitra:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateLogoMitra = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await LogoMitra.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Logo tidak ditemukan' });
    }

    if (req.fileValidationError) {
      return res.status(400).json({ success: false, message: req.fileValidationError });
    }

    let url_logo = existing.url_logo;
    if (req.file) {
      const filename = `mitra-${Date.now()}.webp`;
      const filepath = path.join(UPLOADS_DIR, filename);
      await sharp(req.file.buffer)
        .resize({ width: 400, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filepath);
      url_logo = `/uploads/mitra/${filename}`;
      
      // Hapus file lama jika ada
      if (existing.url_logo) {
        // url_logo bentuknya "/uploads/mitra/mitra-123.webp"
        // kita ubah menjadi absolute path ke direktori backend/uploads/mitra
        const oldFile = path.join(__dirname, '..', existing.url_logo);
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
    }

    const updated = await LogoMitra.update(id, { url_logo });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updateLogoMitra:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteLogoMitra = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await LogoMitra.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Logo tidak ditemukan' });
    }

    if (existing.url_logo) {
      const oldFile = path.join(__dirname, '..', existing.url_logo);
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }

    await LogoMitra.delete(id);
    res.json({ success: true, message: 'Berhasil dihapus' });
  } catch (error) {
    console.error('Error deleteLogoMitra:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getLogoMitra,
  createLogoMitra,
  updateLogoMitra,
  deleteLogoMitra
};
