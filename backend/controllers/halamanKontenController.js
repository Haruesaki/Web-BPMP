const db = require('../config/database');
const { logActivityInternal } = require('./aktivitasAdminController');

class HalamanKontenController {
  // GET /api/halaman-konten/:menu_id
  static async getKonten(req, res) {
    const { menu_id } = req.params;
    try {
      const data = await db('halaman_konten')
        .where('menu_id', menu_id)
        .orderBy('urutan_tampil', 'asc');
      res.json(data);
    } catch (error) {
      console.error('Error getKonten:', error);
      res.status(500).json({ pesan: 'Gagal mengambil konten' });
    }
  }

  // POST/PUT /api/halaman-konten/:menu_id
  static async upsertKonten(req, res) {
    const { menu_id } = req.params;
    const { contents, kunci_halaman } = req.body; // contents expects an array

    if (!Array.isArray(contents)) {
      return res.status(400).json({ pesan: 'Data konten tidak valid (harus array)' });
    }

    try {
      const pName = req.user?.nama || 'System';
      const pRole = req.user?.role || 'Unknown';

      // Delete old contents for this menu
      await db('halaman_konten').where('menu_id', menu_id).del();

      if (contents.length > 0) {
        const newRows = contents.map((c, index) => {
          // Generate unique kunci_halaman
          let finalKunci = kunci_halaman ? `${kunci_halaman}-${index}` : `post-${menu_id}-${index}`;
          return {
            menu_id,
            judul: c.judul || 'Tanpa Judul',
            deskripsi_kaya: c.konten || '',
            kunci_halaman: finalKunci,
            dibuat_oleh: req.user?.id || null,
            status: 'terbit',
            urutan_tampil: index
          };
        });
        await db('halaman_konten').insert(newRows);
      }

      await logActivityInternal(pName, pRole, `Memperbarui daftar halaman konten untuk menu ID ${menu_id}`);
      return res.status(200).json({ pesan: 'Konten berhasil disimpan' });
    } catch (error) {
      console.error('Error upsertKonten:', error);
      res.status(500).json({ pesan: 'Gagal menyimpan konten ke database', detail: error.message, stack: error.stack });
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
