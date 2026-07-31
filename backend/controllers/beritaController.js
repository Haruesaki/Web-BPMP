const db = require('../config/database');
const { logActivityInternal } = require('./aktivitasAdminController');
// Menormalkan waktu dari badan permintaan. Lihat penjelasan lengkap di sana:
// untai ISO-8601 yang dikirim frontend ditolak MySQL, dan memformatnya sendiri
// berisiko menyimpan jam UTC alih-alih jam WIB.
const { keWaktuDb } = require('../utils/waktu');

class BeritaController {
  static async getBeritaByMenu(req, res) {
    const { menu_id } = req.params;
    try {
      const data = await db('berita')
        .leftJoin('pengguna', 'berita.penulis_id', 'pengguna.id')
        .select(
          'berita.*',
          'pengguna.email as pembuat_email',
          'pengguna.nama_pengguna as pembuat_nama'
        )
        .where('berita.menu_id', menu_id)
        // `waktu_tayang` hanya terisi saat berita diaktifkan tayang di Beranda,
        // sehingga bernilai NULL untuk berita biasa dan membuat urutannya tidak
        // menentu. Pakai tanggal pembuatan sebagai cadangan agar berita terbaru
        // tetap berada di urutan teratas.
        .orderByRaw('COALESCE(berita.waktu_tayang, berita.dibuat_pada) DESC');
      res.json(data);
    } catch (error) {
      console.error('Error getBerita:', error);
      res.status(500).json({ pesan: 'Gagal mengambil data berita' });
    }
  }

  static async createBerita(req, res) {
    const { menu_id } = req.params;
    const { judul, deskripsi_kaya, statusTayang, waktuTayang, coverUrl } = req.body;
    
    if (!judul) return res.status(400).json({ pesan: 'Judul berita wajib diisi' });

    try {
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';

      const status = statusTayang ? 'terbit' : 'draf';

      const waktu = keWaktuDb(waktuTayang);
      if (!waktu.sah) return res.status(400).json({ pesan: 'Format waktu tayang tidak dikenali' });

      // MySQL tidak mendukung RETURNING, jadi baris baru dibaca ulang lewat insertId.
      const [insertId] = await db('berita').insert({
        menu_id,
        penulis_id: req.user?.id || null,
        judul,
        deskripsi_kaya: deskripsi_kaya || '',
        url_foto: coverUrl || null,
        status,
        waktu_tayang: waktu.nilai
      });
      const inserted = await db('berita').where({ id: insertId }).first();

      await logActivityInternal(pName, pRole, `Menambahkan berita baru: "${judul}"`);
      res.status(201).json({ pesan: 'Berita berhasil dibuat', data: inserted });
    } catch (error) {
      console.error('Error createBerita:', error);
      res.status(500).json({ pesan: 'Gagal membuat berita' });
    }
  }

  static async updateBerita(req, res) {
    const { id } = req.params;
    const { judul, deskripsi_kaya, statusTayang, waktuTayang, coverUrl } = req.body;

    try {
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';
      
      const updateData = { diperbarui_pada: db.fn.now() };
      if (judul !== undefined) updateData.judul = judul;
      if (deskripsi_kaya !== undefined) updateData.deskripsi_kaya = deskripsi_kaya;
      if (statusTayang !== undefined) updateData.status = statusTayang ? 'terbit' : 'draf';
      if (waktuTayang !== undefined) {
        const waktu = keWaktuDb(waktuTayang);
        if (!waktu.sah) return res.status(400).json({ pesan: 'Format waktu tayang tidak dikenali' });
        updateData.waktu_tayang = waktu.nilai;
      }
      if (coverUrl !== undefined) updateData.url_foto = coverUrl;

      // Pastikan beritanya ada sebelum diperbarui, karena MySQL tidak bisa
      // mengembalikan baris hasil update (tidak mendukung RETURNING).
      const existing = await db('berita').where({ id }).first();
      if (!existing) return res.status(404).json({ pesan: 'Berita tidak ditemukan' });

      await db('berita').where({ id }).update(updateData);
      const updated = await db('berita').where({ id }).first();

      await logActivityInternal(pName, pRole, `Memperbarui berita: "${updated.judul}"`);
      res.json({ pesan: 'Berita berhasil diperbarui', data: updated });
    } catch (error) {
      console.error('Error updateBerita:', error);
      res.status(500).json({ pesan: 'Gagal memperbarui berita' });
    }
  }

  static async deleteBerita(req, res) {
    const { id } = req.params;
    try {
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';

      const berita = await db('berita').where({ id }).first();
      if (!berita) return res.status(404).json({ pesan: 'Berita tidak ditemukan' });

      await db('berita').where({ id }).del();
      await logActivityInternal(pName, pRole, `Menghapus berita: "${berita.judul}"`);
      
      res.json({ pesan: 'Berita berhasil dihapus' });
    } catch (error) {
      console.error('Error deleteBerita:', error);
      res.status(500).json({ pesan: 'Gagal menghapus berita' });
    }
  }
}

module.exports = BeritaController;
