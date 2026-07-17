const db = require('../config/database');
const { logActivityInternal } = require('./aktivitasAdminController');

const DEFAULT_HERO = {
  judul: '',
  subjudul: '',
  url_gambar: null,
  logo_1: 'Kemendikdasmen',
  logo_2: 'BPMP Lampung',
  is_aktif: true,
};

const normalizeHero = (hero) => ({
  ...DEFAULT_HERO,
  ...hero,
  judul: hero?.judul ?? DEFAULT_HERO.judul,
  subjudul: hero?.subjudul ?? DEFAULT_HERO.subjudul,
  logo_1: hero?.logo_1 || DEFAULT_HERO.logo_1,
  logo_2: hero?.logo_2 || DEFAULT_HERO.logo_2,
});

class BerandaHeroController {
  static async getHero(req, res) {
    try {
      const hero = await db('banner_beranda')
        .where({ jenis_banner: 'banner_1', is_aktif: true })
        .orderBy('urutan_tampil', 'asc')
        .first();

      return res.json({ data: normalizeHero(hero) });
    } catch (error) {
      console.error('Error getHero Beranda:', error);
      return res.status(500).json({ pesan: 'Gagal mengambil pengaturan hero beranda' });
    }
  }

  static async updateHero(req, res) {
    const { judul, subjudul, url_gambar, logo_1, logo_2, is_aktif } = req.body;

    try {
      const payload = {
        jenis_banner: 'banner_1',
        judul: judul?.trim() || null,
        subjudul: subjudul?.trim() || null,
        url_gambar: url_gambar || null,
        logo_1: logo_1 || null,
        logo_2: logo_2 || null,
        urutan_tampil: 0,
        is_aktif: is_aktif !== undefined ? Boolean(is_aktif) : true,
      };

      const existing = await db('banner_beranda')
        .where({ jenis_banner: 'banner_1' })
        .orderBy('id', 'asc')
        .first();

      let savedHero;
      if (existing) {
        const [updated] = await db('banner_beranda')
          .where({ id: existing.id })
          .update(payload)
          .returning('*');
        savedHero = updated;
      } else {
        const [inserted] = await db('banner_beranda').insert(payload).returning('*');
        savedHero = inserted;
      }

      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      await logActivityInternal(pName, pRole, 'Memperbarui Hero Beranda');

      return res.json({
        pesan: 'Hero beranda berhasil disimpan',
        data: normalizeHero(savedHero),
      });
    } catch (error) {
      console.error('Error updateHero Beranda:', error);
      return res.status(500).json({
        pesan: 'Gagal menyimpan pengaturan hero beranda',
        detail: error.message,
      });
    }
  }
}

module.exports = BerandaHeroController;
