const db = require('../config/database');

// --- HELPER: Mengambil dan memetakan hierarki menu untuk pencarian cepat ---
const getMenuHierarchy = async () => {
  const allMenus = await db('menu').where('is_aktif', true);
  const menuMap = new Map(allMenus.map(m => [m.id, m]));
  return menuMap;
};

// --- HELPER: Menentukan lokasi menu dari ID ---
const getMenuLocation = (menuId, menuMap) => {
  const menu = menuMap.get(menuId);
  if (!menu) return { menu_location: null, submenu_location: null };

  if (menu.induk_id) {
    const parent = menuMap.get(menu.induk_id);
    return {
      menu_location: parent ? parent.nama_menu : null,
      submenu_location: menu.nama_menu,
    };
  }
  return {
    menu_location: menu.nama_menu,
    submenu_location: null,
  };
};

// --- HELPER: Menentukan path/link dari sebuah item menu ---
const getMenuPath = (menu, menuMap) => {
  if (menu.jenis_menu === 'link') return menu.slug_atau_tautan || '#';

  // Cek apakah menu ini adalah parent dari submenu lain
  const hasChildren = [...menuMap.values()].some(m => m.induk_id === menu.id);
  if (!menu.induk_id && hasChildren) {
    return '#'; // Menu dropdown utama tidak bisa diklik
  }
  return `/halaman/${menu.id}`;
};

class SearchController {
  static async globalSearch(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.trim().length === 0) {
        return res.json({ success: true, data: [] });
      }

      const keyword = `%${q.trim().toLowerCase()}%`;
      const results = [];

      // OPTIMASI: Ambil semua menu sekali saja, hindari N+1 query
      const menuMap = await getMenuHierarchy();

      // 1. Cari di nama menu (induk atau submenu)
      const menus = await db.from('menu')
        .whereRaw('LOWER(nama_menu) LIKE ?', [keyword])
        .andWhere('is_aktif', true);

      for (let m of menus) {
        const location = getMenuLocation(m.id, menuMap);

        // Jika hasil pencarian adalah sebuah submenu, jangan tampilkan
        // lokasi submenu-nya lagi karena sudah terwakili oleh judul.
        if (m.induk_id) {
          location.submenu_location = null;
        }

        results.push({
          title: m.nama_menu,
          type: 'Menu',
          path: getMenuPath(m, menuMap),
          ...location,
        });
      }

      // 2. Cari di halaman_konten
      const halamanKonten = await db('halaman_konten')
        .whereRaw('LOWER(halaman_konten.judul) LIKE ? OR LOWER(halaman_konten.deskripsi_kaya) LIKE ?', [keyword, keyword])
        .select('judul', 'menu_id');

      for (let hk of halamanKonten) {
        const location = getMenuLocation(hk.menu_id, menuMap);
        results.push({
          title: hk.judul,
          type: 'Halaman',
          path: `/halaman/${hk.menu_id}`,
          ...location,
        });
      }

      // 3. Cari di berita
      const beritaList = await db('berita')
        .whereRaw('LOWER(berita.judul) LIKE ? OR LOWER(berita.deskripsi_kaya) LIKE ?', [keyword, keyword])
        .select('judul', 'menu_id');

      for (let b of beritaList) {
        const location = getMenuLocation(b.menu_id, menuMap);
        results.push({
          title: b.judul,
          type: 'Berita',
          path: `/halaman/${b.menu_id}`,
          ...location,
        });
      }

      // 4. Cari di profil_pegawai
      const pegawaiList = await db('profil_pegawai')
        .whereRaw('LOWER(profil_pegawai.nama_lengkap) LIKE ? OR LOWER(profil_pegawai.jabatan) LIKE ? OR LOWER(profil_pegawai.quotes) LIKE ?', [keyword, keyword, keyword])
        .select('nama_lengkap', 'menu_id');

      for (let p of pegawaiList) {
        const location = getMenuLocation(p.menu_id, menuMap);
        results.push({
          title: p.nama_lengkap,
          type: 'Pegawai',
          path: `/halaman/${p.menu_id}`,
          ...location,
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
