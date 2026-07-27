const db = require('../config/database');
const { logActivityInternal } = require('./aktivitasAdminController');

class BerandaPengunjungController {
  static async getPengaturan(req, res) {
    try {
      let pengaturan = await db('pengaturan_jumlah_pengunjung').first();
      
      if (!pengaturan) {
        // MySQL tidak mendukung RETURNING, jadi baris baru dibaca ulang lewat insertId.
        const [insertId] = await db('pengaturan_jumlah_pengunjung').insert({
          pengunjung_hari_ini: 123,
          total_pengunjung: 107030,
          is_synced: true
        });
        pengaturan = await db('pengaturan_jumlah_pengunjung').where('id', insertId).first();
      }

      // Simpan nilai manual murni sebelum di-override (untuk UI admin)
      pengaturan.manual_pengunjung_hari_ini = pengaturan.pengunjung_hari_ini;
      pengaturan.manual_total_pengunjung = pengaturan.total_pengunjung;

      // Jika is_synced aktif, ambil data real dari tabel statistik_pengunjung
      if (pengaturan.is_synced) {
        // Ambil data total pengunjung (unik)
        const totalPengunjungData = await db('statistik_pengunjung')
          .count('id as total')
          .first();
        const realTotal = totalPengunjungData.total ? parseInt(totalPengunjungData.total, 10) : 0;

        // Ambil data hari ini (waktu server local/UTC)
        // Kita sesuaikan dengan timezone offset lokal seperti di statistikPengunjungModel
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const hariIni = new Date(now - offset).toISOString().split('T')[0];
        
        const hariIniData = await db('statistik_pengunjung')
          .where('tanggal', hariIni)
          .count('id as total_hari_ini')
          .first();
        const realHariIni = hariIniData.total_hari_ini ? parseInt(hariIniData.total_hari_ini, 10) : 0;

        pengaturan.pengunjung_hari_ini = realHariIni;
        pengaturan.total_pengunjung = realTotal;
      }

      res.json({ data: pengaturan });
    } catch (error) {
      console.error('Error getPengaturan pengunjung:', error);
      res.status(500).json({ pesan: 'Gagal mengambil data pengaturan pengunjung' });
    }
  }

  static async updatePengaturan(req, res) {
    try {
      const { pengunjung_hari_ini, total_pengunjung, is_synced } = req.body;
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';

      const updateData = {
        is_synced: !!is_synced,
        updated_at: db.fn.now()
      };

      if (pengunjung_hari_ini !== undefined && pengunjung_hari_ini !== '') {
        updateData.pengunjung_hari_ini = parseInt(pengunjung_hari_ini, 10) || 0;
      }
      
      if (total_pengunjung !== undefined && total_pengunjung !== '') {
        updateData.total_pengunjung = parseInt(total_pengunjung, 10) || 0;
      }

      // MySQL tidak mendukung RETURNING, jadi baris disimpan dulu lalu dibaca ulang.
      let pengaturan = await db('pengaturan_jumlah_pengunjung').first();
      let idPengaturan;
      if (pengaturan) {
        await db('pengaturan_jumlah_pengunjung')
          .where('id', pengaturan.id)
          .update(updateData);
        idPengaturan = pengaturan.id;
      } else {
        const [insertId] = await db('pengaturan_jumlah_pengunjung').insert(updateData);
        idPengaturan = insertId;
      }
      const updated = await db('pengaturan_jumlah_pengunjung').where('id', idPengaturan).first();

      await logActivityInternal(pName, pRole, 'Memperbarui pengaturan jumlah pengunjung di beranda');

      res.json({ pesan: 'Berhasil menyimpan pengaturan pengunjung', data: updated });
    } catch (error) {
      console.error('Error updatePengaturan pengunjung:', error);
      res.status(500).json({ pesan: 'Gagal menyimpan pengaturan pengunjung' });
    }
  }
}

module.exports = BerandaPengunjungController;
