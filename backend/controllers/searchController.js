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

// --- HELPER: Apakah konten masih dapat dijangkau lewat menunya? ---
//
// Konten hanya layak muncul di hasil pencarian bila menu induknya masih ada
// dan masih aktif, sebab tautan hasil pencarian selalu berbentuk
// `/halaman/<menu_id>`. Tanpa penjagaan ini:
//
//   - Konten yatim (sisa menu yang sudah dihapus, `menu_id` bernilai NULL)
//     menghasilkan tautan `/halaman/null` yang berujung pada halaman kosong
//     bertuliskan "Halaman tidak ditemukan (ID: null)".
//   - Konten milik menu yang dinonaktifkan tetap dapat ditemukan pengunjung,
//     padahal menunya sengaja disembunyikan dari navigasi.
//
// `menuMap` hanya memuat menu aktif (lihat getMenuHierarchy), sehingga satu
// pemeriksaan ini menutup kedua keadaan tersebut sekaligus.
const menuDapatDijangkau = (menuId, menuMap) =>
  menuId !== null && menuId !== undefined && menuMap.has(menuId);

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
      let { q } = req.query;
      if (!q || q.trim().length === 0) {
        return res.json({ success: true, data: [] });
      }

      // Pertahanan Layer 1: Batasi panjang input maksimal 100 karakter untuk mencegah serangan DoS kueri panjang
      const queryCleaned = q.trim().slice(0, 100);

      // Pertahanan Layer 2: Loloskan karakter khusus SQL LIKE (%, _, \) untuk mencegah eksploitasi wildcard
      const sanitizedQ = queryCleaned.replace(/[%_\\]/g, '\\$&');
      const keyword = `%${sanitizedQ.toLowerCase()}%`;
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
          induk_id: m.induk_id || null,
          path: getMenuPath(m, menuMap),
          ...location,
        });
      }

      // 2. Cari di halaman_konten
      const halamanKonten = await db('halaman_konten')
        .where(function() {
          this.whereRaw('LOWER(halaman_konten.judul) LIKE ?', [keyword])
              .orWhereRaw('LOWER(halaman_konten.deskripsi_kaya) LIKE ?', [keyword]);
        })
        // Catatan: Tidak memfilter status 'terbit' pada halaman_konten karena API publik /api/halaman-konten
        // juga menyajikan semua halaman di bawah menu aktif tanpa memandang statusnya di database.
        .select('judul', 'menu_id');

      for (let hk of halamanKonten) {
        if (!menuDapatDijangkau(hk.menu_id, menuMap)) continue;
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
        .where(function() {
          this.whereRaw('LOWER(berita.judul) LIKE ?', [keyword])
              .orWhereRaw('LOWER(berita.deskripsi_kaya) LIKE ?', [keyword]);
        })
        .andWhere('berita.status', 'terbit') // Berita memiliki filter status rilis aktif di CMS
        .select('id', 'judul', 'menu_id'); // Menyeleksi kolom 'id' berita untuk merakit URL detail yang sah

      for (let b of beritaList) {
        if (!menuDapatDijangkau(b.menu_id, menuMap)) continue;
        const location = getMenuLocation(b.menu_id, menuMap);
        results.push({
          title: b.judul,
          type: 'Berita',
          path: `/berita/berita-${b.id}`, // Mengarahkan ke rute artikel detail berita yang benar
          ...location,
        });
      }

      // 4. Cari di profil_pegawai
      const pegawaiList = await db('profil_pegawai')
        .whereRaw('LOWER(profil_pegawai.nama_lengkap) LIKE ? OR LOWER(profil_pegawai.jabatan) LIKE ? OR LOWER(profil_pegawai.quotes) LIKE ?', [keyword, keyword, keyword])
        .select('nama_lengkap', 'menu_id');

      for (let p of pegawaiList) {
        if (!menuDapatDijangkau(p.menu_id, menuMap)) continue;
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
        // Gabungkan path, title, dan type sebagai kunci unik agar Menu, Halaman Konten, dan Pegawai yang memiliki rute sama tidak saling bertabrakan
        const key = res.path === '#' ? `#-${res.title}` : `${res.path}-${res.title}-${res.type}`;
        
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
