const db = require('../config/database');

class BerandaBeritaController {
  static async getBeritaBeranda(req, res) {
    try {
      // 1. Ambil data dari tabel berita yang statusnya 'terbit'
      const beritaRaw = await db('berita')
        .leftJoin('menu', 'berita.menu_id', 'menu.id')
        .select(
          'berita.id',
          'berita.judul',
          'berita.deskripsi_kaya as konten',
          'berita.url_foto as coverUrl',
          'berita.waktu_tayang as tanggal',
          'berita.urutan_beranda',
          'menu.nama_menu as kategori',
          'menu.id as menu_id',
          'menu.jenis_menu',
          'menu.slug_atau_tautan as layout'
        )
        .where('berita.status', 'terbit');

      // 2. Ambil data dari tabel halaman_konten yang statusnya 'terbit'
      const kontenRaw = await db('halaman_konten')
        .leftJoin('menu', 'halaman_konten.menu_id', 'menu.id')
        .select(
          'halaman_konten.id',
          'halaman_konten.judul',
          'halaman_konten.deskripsi_kaya as konten',
          'halaman_konten.url_foto',
          'halaman_konten.tanggal_terbit as tanggal', // bisa null, fallback ke diperbarui_pada
          'halaman_konten.diperbarui_pada',
          'halaman_konten.urutan_beranda',
          'menu.nama_menu as kategori',
          'menu.id as menu_id',
          'menu.jenis_menu',
          'menu.slug_atau_tautan as layout'
        )
        .where('halaman_konten.status', 'terbit');

      // 3. Format & Gabungkan
      const formattedBerita = beritaRaw.map(b => ({
        id: `berita-${b.id}`,
        judul: b.judul,
        konten: b.konten,
        coverUrl: b.coverUrl,
        tanggal: b.tanggal,
        urutan_beranda: b.urutan_beranda || 0,
        kategori: b.kategori || 'Berita',
        sumber: 'berita',
        menu_id: b.menu_id,
        jenis_menu: b.jenis_menu,
        layout: b.layout
      }));

      const formattedKonten = kontenRaw.map(k => {
        // Gunakan url_foto jika ada, jika tidak ekstrak URL gambar pertama dari deskripsi_kaya
        let coverUrl = k.url_foto || null;
        if (!coverUrl && k.konten) {
          const imgMatch = k.konten.match(/<img[^>]+src="([^">]+)"/);
          if (imgMatch) {
            coverUrl = imgMatch[1];
          }
        }
        return {
          id: `konten-${k.id}`,
          judul: k.judul,
          konten: k.konten,
          coverUrl: coverUrl,
          tanggal: k.tanggal || k.diperbarui_pada,
          urutan_beranda: k.urutan_beranda || 0,
          kategori: k.kategori || 'Konten',
          sumber: 'halaman_konten',
          menu_id: k.menu_id,
          jenis_menu: k.jenis_menu,
          layout: k.layout
        };
      });

      // Gabungkan dan urutkan berdasarkan urutan_beranda (ASC), lalu tanggal terbaru (DESC)
      const combined = [...formattedBerita, ...formattedKonten].sort((a, b) => {
        if (a.urutan_beranda !== b.urutan_beranda) {
          return a.urutan_beranda - b.urutan_beranda;
        }
        const dateA = new Date(a.tanggal || 0).getTime();
        const dateB = new Date(b.tanggal || 0).getTime();
        return dateB - dateA;
      });

      res.json({ success: true, data: combined });
    } catch (error) {
      console.error('Error getBeritaBeranda:', error);
      res.status(500).json({ success: false, pesan: 'Gagal mengambil berita beranda' });
    }
  }

  static async updateThumbnail(req, res) {
    const { sumber, id } = req.params;
    const { coverUrl } = req.body;
    try {
      if (sumber === 'berita') {
        await db('berita').where('id', id).update({ url_foto: coverUrl });
      } else if (sumber === 'halaman_konten') {
        await db('halaman_konten').where('id', id).update({ url_foto: coverUrl });
      } else {
        return res.status(400).json({ success: false, pesan: 'Sumber tidak valid' });
      }
      res.json({ success: true, pesan: 'Thumbnail berhasil diperbarui' });
    } catch (error) {
      console.error('Error updateThumbnail:', error);
      res.status(500).json({ success: false, pesan: 'Gagal memperbarui thumbnail' });
    }
  }

  static async removeFromBeranda(req, res) {
    const { sumber, id } = req.params;
    try {
      if (sumber === 'berita') {
        await db('berita').where('id', id).update({ status: 'draf' });
      } else if (sumber === 'halaman_konten') {
        await db('halaman_konten').where('id', id).update({ status: 'draf' });
      } else {
        return res.status(400).json({ success: false, pesan: 'Sumber tidak valid' });
      }
      res.json({ success: true, pesan: 'Berhasil dihapus dari beranda' });
    } catch (error) {
      console.error('Error removeFromBeranda:', error);
      res.status(500).json({ success: false, pesan: 'Gagal menghapus dari beranda' });
    }
  }

  static async reorderBerita(req, res) {
    const { orderData } = req.body; // array of { id: 'berita-1', urutan_beranda: 1 }
    try {
      await db.transaction(async (trx) => {
        for (const item of orderData) {
          const actualId = item.id.split('-').pop();
          if (item.id.startsWith('berita-')) {
            await trx('berita').where('id', actualId).update({ urutan_beranda: item.urutan_beranda });
          } else if (item.id.startsWith('konten-')) {
            await trx('halaman_konten').where('id', actualId).update({ urutan_beranda: item.urutan_beranda });
          }
        }
      });
      res.json({ success: true, pesan: 'Urutan berhasil disimpan' });
    } catch (error) {
      console.error('Error reorderBerita:', error);
      res.status(500).json({ success: false, pesan: 'Gagal menyimpan urutan' });
    }
  }
}

module.exports = BerandaBeritaController;
