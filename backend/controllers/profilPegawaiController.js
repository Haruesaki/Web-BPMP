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

      // Hitung profil lama
      const oldProfiles = await db('profil_pegawai').where('menu_id', menu_id).count('id as cnt').first();
      const oldCount = parseInt(oldProfiles?.cnt || 0, 10);
      const newCount = profiles.length;

      await db('profil_pegawai').where('menu_id', menu_id).del();

      if (newCount > 0) {
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

      const menuInfo = await db('menu').select('nama_menu').where('id', menu_id).first();
      const namaMenu = menuInfo ? menuInfo.nama_menu : `ID ${menu_id}`;
      
      let aksiKata = 'Memperbarui';
      if (oldCount === 0 && newCount > 0) aksiKata = 'Membuat';
      else if (oldCount > 0 && newCount === 0) aksiKata = 'Menghapus seluruh';
      else if (oldCount < newCount) aksiKata = 'Menambahkan';
      else if (oldCount > newCount) aksiKata = 'Menghapus beberapa';

      await logActivityInternal(pName, pRole, `${aksiKata} profil pegawai pada menu "${namaMenu}"`);
      return res.status(200).json({ pesan: 'Profil berhasil disimpan' });
    } catch (error) {
      console.error('Error upsertProfil:', error);
      res.status(500).json({ pesan: 'Gagal menyimpan profil' });
    }
  }
}

module.exports = ProfilPegawaiController;
