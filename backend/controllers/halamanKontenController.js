const db = require('../config/database');
const { logActivityInternal } = require('./aktivitasAdminController');

class HalamanKontenController {
  // GET /api/halaman-konten/:menu_id
  static async getKonten(req, res) {
    const { menu_id } = req.params;
    try {
      const data = await db('halaman_konten')
        .leftJoin('pengguna', 'halaman_konten.dibuat_oleh', 'pengguna.id')
        .select(
          'halaman_konten.*',
          'pengguna.email as pembuat_email',
          'pengguna.nama_pengguna as pembuat_nama'
        )
        .where('halaman_konten.menu_id', menu_id)
        .orderBy('halaman_konten.urutan_tampil', 'asc');
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

      // Ambil jumlah konten lama untuk membandingkan aksi
      const oldContents = await db('halaman_konten').where('menu_id', menu_id).count('id as cnt').first();
      const oldCount = parseInt(oldContents?.cnt || 0, 10);
      const newCount = contents.length;

      // Hapus konten lama lalu insert ulang seluruh list. Dibungkus TRANSACTION
      // agar atomik: bila ada dua permintaan simpan berbarengan, keduanya
      // di-serialisasikan sehingga delete+insert tidak bisa saling menyela
      // (biang data ganda). Bila salah satu langkah gagal, seluruhnya dibatalkan.
      await db.transaction(async (trx) => {
        await trx('halaman_konten').where('menu_id', menu_id).del();

        if (newCount > 0) {
          const newRows = contents.map((c, index) => {
            // Generate unique kunci_halaman
            let finalKunci = kunci_halaman ? `${kunci_halaman}-${index}` : `post-${menu_id}-${index}`;
            return {
              menu_id,
              judul: c.judul || 'Tanpa Judul',
              deskripsi_kaya: c.konten || '',
              kunci_halaman: finalKunci,
              dibuat_oleh: req.user?.id || null,
              status: c.status || 'terbit',
              urutan_tampil: index,
              url_foto: c.coverUrl || null,
              urutan_beranda: c.urutan_beranda || 0
            };
          });
          await trx('halaman_konten').insert(newRows);
        }
      });

      const menuInfo = await db('menu').select('nama_menu').where('id', menu_id).first();
      const namaMenu = menuInfo ? menuInfo.nama_menu : `ID ${menu_id}`;
      
      let aksiKata = 'Memperbarui';
      if (oldCount === 0 && newCount > 0) aksiKata = 'Membuat';
      else if (oldCount > 0 && newCount === 0) aksiKata = 'Menghapus seluruh';
      else if (oldCount < newCount) aksiKata = 'Menambahkan';
      else if (oldCount > newCount) aksiKata = 'Menghapus beberapa';

      await logActivityInternal(pName, pRole, `${aksiKata} halaman konten pada menu "${namaMenu}"`);
      return res.status(200).json({ pesan: 'Konten berhasil disimpan' });
    } catch (error) {
      // Detail teknis cukup dicatat di log server. Mengirim error.message /
      // error.stack ke klien membocorkan struktur database (nama tabel, kolom,
      // bahkan query mentah) ke browser admin.
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
