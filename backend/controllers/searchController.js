const db = require('../config/database');

class SearchController {
  static async globalSearch(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.trim().length === 0) {
        return res.json({ success: true, data: [] });
      }

      const keyword = `%${q.trim().toLowerCase()}%`;
      const results = [];

      // 1. Cari di nama menu (induk atau submenu)
      const menus = await db('menu')
        .whereRaw('LOWER(nama_menu) LIKE ?', [keyword])
        .andWhere('is_aktif', true);

      for (let m of menus) {
        let typeVal = '';
        let locationVal = '';

        if (m.induk_id) {
          const parent = await db('menu').where('id', m.induk_id).first();
          if (parent) {
            typeVal = `Menu: ${parent.nama_menu}`;
            locationVal = `Sub Menu: ${m.nama_menu}`;
          }
        } else {
          typeVal = `Menu: ${m.nama_menu}`;
          locationVal = '';
        }

        let link = `/halaman/${m.id}`;
        if (m.jenis_menu === 'link') {
            link = m.slug_atau_tautan || '#';
        } else if (m.jenis_menu === 'default') {
            link = `/halaman/${m.id}`;
        } else {
            link = `/halaman/${m.id}`; // default
        }

        // Jika ini adalah submenu, dropdown tidak punya path yang bisa diklik.
        const isParent = !m.induk_id;
        const hasChildren = await db('menu').where('induk_id', m.id).first();
        if (isParent && hasChildren) {
          link = '#';
        }

        results.push({
          title: m.nama_menu,
          type: typeVal,
          location: locationVal,
          path: link
        });
      }

      // 2. Cari di halaman_konten
      const halamanKonten = await db('halaman_konten')
        .join('menu', 'halaman_konten.menu_id', 'menu.id')
        .whereRaw('LOWER(halaman_konten.judul) LIKE ? OR LOWER(halaman_konten.deskripsi_kaya) LIKE ?', [keyword, keyword])
        .andWhere('menu.is_aktif', true)
        .select('halaman_konten.*', 'menu.nama_menu', 'menu.induk_id', 'menu.jenis_menu');

      for (let hk of halamanKonten) {
        let typeVal = '';
        let locationVal = '';

        if (hk.induk_id) {
          const parent = await db('menu').where('id', hk.induk_id).first();
          if (parent) {
            typeVal = `Menu: ${parent.nama_menu}`;
            locationVal = `Sub Menu: ${hk.nama_menu}`;
          }
        } else {
          typeVal = `Menu: ${hk.nama_menu}`;
          locationVal = '';
        }

        results.push({
          title: hk.judul,
          type: typeVal,
          location: locationVal,
          path: `/halaman/${hk.menu_id}`
        });
      }

      // 3. Cari di berita
      const beritaList = await db('berita')
        .join('menu', 'berita.menu_id', 'menu.id')
        .whereRaw('LOWER(berita.judul) LIKE ? OR LOWER(berita.deskripsi_kaya) LIKE ?', [keyword, keyword])
        .andWhere('menu.is_aktif', true)
        .select('berita.*', 'menu.nama_menu', 'menu.induk_id');

      for (let b of beritaList) {
        let typeVal = '';
        let locationVal = '';

        if (b.induk_id) {
          const parent = await db('menu').where('id', b.induk_id).first();
          if (parent) {
            typeVal = `Menu: ${parent.nama_menu}`;
            locationVal = `Sub Menu: ${b.nama_menu}`;
          }
        } else {
          typeVal = `Menu: ${b.nama_menu}`;
          locationVal = '';
        }

        results.push({
          title: b.judul,
          type: typeVal,
          location: locationVal,
          path: `/halaman/${b.menu_id}`
        });
      }

      // 4. Cari di profil_pegawai
      const pegawaiList = await db('profil_pegawai')
        .join('menu', 'profil_pegawai.menu_id', 'menu.id')
        .whereRaw('LOWER(profil_pegawai.nama_lengkap) LIKE ? OR LOWER(profil_pegawai.jabatan) LIKE ? OR LOWER(profil_pegawai.quotes) LIKE ?', [keyword, keyword, keyword])
        .andWhere('menu.is_aktif', true)
        .select('profil_pegawai.*', 'menu.nama_menu', 'menu.induk_id');

      for (let p of pegawaiList) {
        let typeVal = '';
        let locationVal = '';

        if (p.induk_id) {
          const parent = await db('menu').where('id', p.induk_id).first();
          if (parent) {
            typeVal = `Menu: ${parent.nama_menu}`;
            locationVal = `Sub Menu: ${p.nama_menu}`;
          }
        } else {
          typeVal = `Menu: ${p.nama_menu}`;
          locationVal = '';
        }

        results.push({
          title: p.nama_lengkap,
          type: typeVal,
          location: locationVal,
          path: `/halaman/${p.menu_id}`
        });
      }

      // Hapus duplikat agar tidak menunjuk ke halaman (path) yang persis sama berkali-kali
      const uniqueResults = [];
      const seen = new Set();
      for (const res of results) {
        // Jika path adalah '#' (Dropdown Menu), bedakan berdasarkan judulnya.
        // Jika path adalah URL spesifik (misal /halaman/5), jadikan path tersebut sebagai kunci tunggal.
        const key = res.path === '#' ? `#-${res.title}` : res.path;
        
        if (!seen.has(key)) {
          seen.add(key);
          uniqueResults.push(res);
        }
      }

      res.json({ success: true, data: uniqueResults });
    } catch (error) {
      console.error('[SearchController Error]', error);
      res.status(500).json({ success: false, pesan: 'Server error' });
    }
  }
}

module.exports = SearchController;
