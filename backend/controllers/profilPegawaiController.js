const db = require('../config/database');
const { logActivityInternal } = require('./aktivitasAdminController');

class ProfilPegawaiController {
  static async getProfilByMenu(req, res) {
    const { menu_id } = req.params;
    try {
      const data = await db('profil_pegawai')
        .where('menu_id', menu_id)
        .orderBy('urutan_tampil', 'asc');
      res.json(data);
    } catch (error) {
      console.error('Error getProfil:', error);
      res.status(500).json({ pesan: 'Gagal mengambil data profil' });
    }
  }

  static async upsertProfil(req, res) {
    const { menu_id } = req.params;
    const { profiles } = req.body;

    if (!Array.isArray(profiles)) {
      return res.status(400).json({ pesan: 'Data profiles tidak valid' });
    }

    try {
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';

      await db('profil_pegawai').where('menu_id', menu_id).del();

      if (profiles.length > 0) {
        const rows = profiles.map((p, i) => ({
          menu_id,
          nama_lengkap: p.nama || 'Tanpa Nama',
          jabatan: p.jabatan || '',
          url_foto: p.gambar || '',
          quotes: p.quotes || '',
          urutan_tampil: i
        }));
        await db('profil_pegawai').insert(rows);
      }

      await logActivityInternal(pName, pRole, `Memperbarui daftar profil pegawai untuk menu ID ${menu_id}`);
      return res.status(200).json({ pesan: 'Profil berhasil disimpan' });
    } catch (error) {
      console.error('Error upsertProfil:', error);
      res.status(500).json({ pesan: 'Gagal menyimpan profil' });
    }
  }
}

module.exports = ProfilPegawaiController;
