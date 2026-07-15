const db = require('../config/database');
const { logActivityInternal } = require('./aktivitasAdminController');

class HalamanKontenController {
  // POST/PUT /api/halaman-konten/:menu_id
  static async upsertKonten(req, res) {
    const { menu_id } = req.params;
    const { judul, deskripsi_kaya, kunci_halaman } = req.body;

    if (!judul || !deskripsi_kaya || !kunci_halaman) {
      return res.status(400).json({ pesan: 'Judul, konten, dan kunci halaman wajib diisi' });
    }

    try {
      // Cek apakah sudah ada konten untuk menu ini
      const existing = await db('halaman_konten').where('menu_id', menu_id).first();
      
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';

      if (existing) {
        // Update
        const [updated] = await db('halaman_konten')
          .where('id', existing.id)
          .update({
            judul,
            deskripsi_kaya,
            diperbarui_pada: db.fn.now()
          })
          .returning('*');
          
        await logActivityInternal(pName, pRole, `Memperbarui halaman konten: "${judul}"`);
        return res.json({ pesan: 'Konten berhasil diperbarui', data: updated });
      } else {
        // Insert
        // Cek unik kunci_halaman, jika sudah ada tambahkan random string
        let validKunci = kunci_halaman;
        const checkKunci = await db('halaman_konten').where('kunci_halaman', validKunci).first();
        if (checkKunci) {
          validKunci = `${kunci_halaman}-${Math.floor(Math.random() * 10000)}`;
        }

        const [inserted] = await db('halaman_konten')
          .insert({
            menu_id,
            judul,
            deskripsi_kaya,
            kunci_halaman: validKunci,
            dibuat_oleh: req.user?.id || null, // req.user dari authMiddleware jika ada
            status: 'terbit'
          })
          .returning('*');
          
        await logActivityInternal(pName, pRole, `Menerbitkan halaman konten baru: "${judul}"`);
        return res.status(201).json({ pesan: 'Konten berhasil disimpan', data: inserted });
      }
    } catch (error) {
      console.error('Error upsertKonten:', error);
      res.status(500).json({ pesan: 'Gagal menyimpan konten ke database' });
    }
  }

  // GET /api/halaman-konten/:menu_id
  static async getKontenByMenuId(req, res) {
    const { menu_id } = req.params;
    try {
      const konten = await db('halaman_konten').where('menu_id', menu_id).first();

      if (konten && konten.deskripsi_kaya) {
        // deskripsi_kaya disimpan sebagai string JSON, jadi kita parse
        const data = JSON.parse(konten.deskripsi_kaya);
        res.json(data);
      } else {
        // Jika tidak ada konten, kembalikan struktur kosong yang diharapkan frontend
        res.json({ profiles: [] });
      }
    } catch (error) {
      console.error(`Error getKontenByMenuId untuk menu_id ${menu_id}:`, error);
      // Jika terjadi error saat parsing JSON (mis. data korup), kembalikan juga struktur kosong
      if (error instanceof SyntaxError) {
        return res.json({ profiles: [] });
      }
      res.status(500).json({ pesan: 'Gagal mengambil data konten' });
    }
  }
}

module.exports = HalamanKontenController;
