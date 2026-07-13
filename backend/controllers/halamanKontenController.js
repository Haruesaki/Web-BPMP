const db = require('../config/database');

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
        return res.status(201).json({ pesan: 'Konten berhasil disimpan', data: inserted });
      }
    } catch (error) {
      console.error('Error upsertKonten:', error);
      res.status(500).json({ pesan: 'Gagal menyimpan konten ke database' });
    }
  }
}

module.exports = HalamanKontenController;
