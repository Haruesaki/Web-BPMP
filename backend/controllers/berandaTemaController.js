const PengaturanTema = require('../models/pengaturanTemaModel');
const { logActivityInternal } = require('./aktivitasAdminController');

// Nilai bawaan bila baris belum pernah diisi kolom warnanya. Diselaraskan
// dengan preset "Dark Navy" di sisi admin agar tampilan awal konsisten.
const DEFAULT_TEMA = {
  warna_latar: '#070833',
  warna_utama: '#5B5FE8',
  warna_sekunder: '#172755',
  warna_teks: '#FFFFFF',
  font_pilihan: 'Inter',
};

const normalizeTema = (tema) => ({
  warna_latar: tema?.warna_latar || DEFAULT_TEMA.warna_latar,
  warna_utama: tema?.warna_utama || DEFAULT_TEMA.warna_utama,
  warna_sekunder: tema?.warna_sekunder || DEFAULT_TEMA.warna_sekunder,
  warna_teks: tema?.warna_teks || DEFAULT_TEMA.warna_teks,
  font_pilihan: tema?.font_pilihan || DEFAULT_TEMA.font_pilihan,
});

// Penjaga sederhana: hanya menerima warna heksadesimal (#RGB / #RRGGBB).
const isHex = (v) => typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());

class BerandaTemaController {
  static async getTema(req, res) {
    try {
      const tema = await PengaturanTema.getTema();
      return res.json({ success: true, data: normalizeTema(tema) });
    } catch (error) {
      console.error('Error getTema Beranda:', error);
      return res.status(500).json({ pesan: 'Gagal mengambil pengaturan tema beranda' });
    }
  }

  static async updateTema(req, res) {
    const { warna_latar, warna_utama, warna_sekunder, warna_teks, font_pilihan } = req.body;

    const warna = { warna_latar, warna_utama, warna_sekunder, warna_teks };
    for (const [kolom, nilai] of Object.entries(warna)) {
      if (!isHex(nilai)) {
        return res.status(400).json({ pesan: `Nilai warna tidak valid pada ${kolom}` });
      }
    }

    try {
      const saved = await PengaturanTema.updateTema({
        warna_latar,
        warna_utama,
        warna_sekunder,
        warna_teks,
        font_pilihan: font_pilihan || DEFAULT_TEMA.font_pilihan,
      });

      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      await logActivityInternal(pName, pRole, 'Memperbarui Tema Beranda');

      return res.json({
        success: true,
        pesan: 'Tema beranda berhasil disimpan',
        data: normalizeTema(saved),
      });
    } catch (error) {
      console.error('Error updateTema Beranda:', error);
      return res.status(500).json({ pesan: 'Gagal menyimpan pengaturan tema beranda' });
    }
  }
}

module.exports = BerandaTemaController;
