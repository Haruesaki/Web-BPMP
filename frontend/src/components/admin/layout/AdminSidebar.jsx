import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import './AdminSidebar.css';

// --- DATA: MENU STATIS BAGIAN ATAS ---
const adminMenuItems1 = [
  { id: 'beranda', label: 'Beranda', icon: 'fa-solid fa-table-cells-large', path: '/admin' },
  { id: 'customize', label: 'Customize Beranda', icon: 'fa-solid fa-pen-to-square', path: '/admin/customize-beranda' },
  { id: 'pengaturan-menu', label: 'Pengaturan Menu', icon: 'fa-solid fa-sliders', path: '/admin/pengaturan-menu' },
];

// --- DATA: MENU STATIS BAGIAN BAWAH ---
const adminMenuItems2 = [
  { id: 'manajemen', label: 'Manajemen User', icon: 'fa-solid fa-users', path: '/admin/manajemen-user' },
  { id: 'setting', label: 'Setting', icon: 'fa-solid fa-gear', path: '/admin/setting' },
];

const AdminSidebar = ({ onTambahMenu, refreshTrigger }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dynamicMenus, setDynamicMenus] = useState([]);
  const [isMenusLoading, setIsMenusLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(() => {
    // Saat halaman pertama kali dibuka, ambil menu yang terakhir dipilih agar
    // highlight sidebar tidak kembali ke Beranda saat user melakukan refresh.
    const savedSelection = sessionStorage.getItem('adminSidebarSelectedId');
    return savedSelection || 'beranda';
  });
  const [expandedMenus, setExpandedMenus] = useState(() => {
    // Restore expanded menus from sessionStorage agar tetap terbuka
    // setelah AdminLayout remount (key pada ProtectedRoute Outlet).
    try {
      const saved = sessionStorage.getItem('adminSidebarExpandedMenus');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Peta route statis yang memang punya satu halaman tujuan jelas.
  const staticRouteMap = {
    '/admin': 'beranda',
    '/admin/customize-beranda': 'customize',
    '/admin/pengaturan-menu': 'pengaturan-menu',
    '/admin/manajemen-user': 'manajemen',
    '/admin/setting': 'setting',
  };

  // Helper kecil untuk menjaga state aktif tetap sinkron dengan URL saat ini.
  const persistSelectedId = (menuId) => {
    setSelectedId(menuId);
    sessionStorage.setItem('adminSidebarSelectedId', menuId);
  };

  const resolveActiveIdFromPath = (pathname, menus) => {
    // 1. Rute statis (peta route)
    if (staticRouteMap[pathname]) {
      return staticRouteMap[pathname];
    }

    // 2. Jika ada state navigasi yang membawa menuId, itu adalah sumber kebenaran paling akurat
    if (location.state?.menuId) {
      return location.state.menuId.toString();
    }

    // 3. Cari dari dynamic menus
    const flatMenus = menus.flatMap((menu) => [
      { id: menu.id.toString(), path: menu.path },
      ...(menu.submenus || []).map((sub) => ({ id: sub.id.toString(), path: sub.path })),
    ]);

    // Cari semua menu yang path-nya sama persis dengan pathname saat ini
    const exactMatches = flatMenus.filter((item) => item.path === pathname);
    
    if (exactMatches.length > 0) {
      const persistedId = sessionStorage.getItem('adminSidebarSelectedId');
      // Jika ada beberapa menu dengan path yang sama (misal /admin/post/default),
      // kita cek apakah salah satunya adalah yang saat ini sedang disimpan di session.
      // Jika ya, prioritaskan itu agar tidak lompat ke menu lain.
      const matchPersisted = exactMatches.find((item) => item.id === persistedId);
      if (matchPersisted) {
        return matchPersisted.id;
      }
      return exactMatches[0].id;
    }

    // 4. Jika pathname adalah prefix editor (misal /admin/post/...) tapi belum exact match
    if (pathname.startsWith('/admin/post/')) {
       const postMatches = flatMenus.filter(item => item.path?.startsWith('/admin/post/'));
       if (postMatches.length > 0) {
         const persistedId = sessionStorage.getItem('adminSidebarSelectedId');
         const matchPersisted = postMatches.find(item => item.id === persistedId);
         if (matchPersisted) return matchPersisted.id;
       }
    }

    return null;
  };

  // Fetch menu dinamis dari backend
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setIsMenusLoading(true);
        const response = await axiosInstance.get('/api/menus');
        const data = response.data;

        // Membentuk struktur Tree (Parent-Child)
        const parentMenus = data.filter(m => m.induk_id === null).sort((a,b) => a.urutan_tampil - b.urutan_tampil);
        const childMenus = data.filter(m => m.induk_id !== null).sort((a,b) => a.urutan_tampil - b.urutan_tampil);

        const tree = parentMenus.map(p => {
          const generatePath = (item) => {
            if (item.jenis_menu === 'link') return `/admin/link/${item.id}`;
            if (item.jenis_menu === 'post') {
              if (item.slug_atau_tautan === 'profile-card') return `/admin/kelola-profil/${item.id}`;
              return `/admin/post/${item.slug_atau_tautan || 'default'}/${item.id}`;
            }
            return item.slug_atau_tautan || '#';
          };

          const subs = childMenus.filter(c => c.induk_id === p.id);
          return {
            id: p.id.toString(),
            label: p.nama_menu,
            icon: p.ikon_menu,
            jenis: p.jenis_menu,
            path: generatePath(p),
            submenus: subs.map(s => ({
              id: s.id.toString(),
              label: s.nama_menu,
              icon: s.ikon_menu,
              jenis: s.jenis_menu,
              path: generatePath(s)
            }))
          };
        });

        setDynamicMenus(tree);
      } catch (error) {
        console.error('Gagal fetch menus:', error);
      } finally {
        setIsMenusLoading(false);
      }
    };
    fetchMenus();
  }, [refreshTrigger]);

  // Sinkronisasi state aktif ke rute yang sesungguhnya sedang ditampilkan.
  // Ini penting karena saat refresh, React akan mount ulang component dan
  // tanpa sync ini state akan kembali ke default 'beranda'.
  useEffect(() => {
    const routeMatchedId = resolveActiveIdFromPath(location.pathname, dynamicMenus);
    const persistedId = sessionStorage.getItem('adminSidebarSelectedId');
    const nextSelectedId = routeMatchedId || persistedId || 'beranda';

    setSelectedId(nextSelectedId);
    sessionStorage.setItem('adminSidebarSelectedId', nextSelectedId);
  }, [location.pathname, location.state, dynamicMenus]);

  const toggleExpand = (id) => {
    setExpandedMenus(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      sessionStorage.setItem('adminSidebarExpandedMenus', JSON.stringify(next));
      return next;
    });
  };

  const renderStaticItem = (item) => (
    <button
      key={item.id}
      className={`nav-item ${selectedId === item.id ? 'active' : ''}`}
      onClick={() => {
        // Klik item statis akan menyimpan ID aktif untuk dipakai lagi saat refresh.
        persistSelectedId(item.id);
        if (item.path) navigate(item.path);
      }}
    >
      <i className={item.icon}></i>
      <span>{item.label}</span>
    </button>
  );

  const renderDynamicItem = (menu) => {
    const hasSubmenus = menu.submenus && menu.submenus.length > 0;
    const isExpanded = expandedMenus.includes(menu.id);

    // Jika dia punya submenu, dia berfungsi sebagai GERBANG (hanya nge-expand).
    // Untuk item tanpa submenu, klik langsung navigate ke halaman editor / post.
    const handleClick = () => {
      persistSelectedId(menu.id);
      if (hasSubmenus) {
        toggleExpand(menu.id);
      } else {
        if (menu.path) {
          navigate(menu.path, {
            state: {
              menuName: menu.label,
              menuId: menu.id,
              isPostTanpaSubmenu: menu.jenis === 'post'
            }
          });
        }
      }
    };

    return (
      <React.Fragment key={menu.id}>
        <button
          className={`nav-item ${selectedId === menu.id ? 'active' : ''}`}
          onClick={handleClick}
        >
          <i className={menu.icon}></i>
          <span>{menu.label}</span>
          {hasSubmenus && (
            <i
              className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}`}
              style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.7 }}
            ></i>
          )}
        </button>

        {/* Render Submenu */}
        {hasSubmenus && isExpanded && (
          <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            {menu.submenus.map(sub => (
              <button
                key={sub.id}
                className={`nav-item ${selectedId === sub.id ? 'active' : ''}`}
                style={{ fontSize: '0.9em', padding: '0.6rem 1rem' }}
                onClick={() => {
                  // Submenu menyimpan ID anaknya sendiri agar highlight tetap tepat
                  // meskipun halaman yang ditampilkan adalah route generik dari editor.
                  persistSelectedId(sub.id);
                  if (sub.path) {
                    navigate(sub.path, { state: { menuName: sub.label, menuId: sub.id, isPostTanpaSubmenu: false } });
                  }
                }}
              >
                <i className={sub.icon} style={{ fontSize: '0.9em' }}></i>
                <span>{sub.label}</span>
              </button>
            ))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <h1>Content Management<br />System Website BPMP</h1>
      </div>

      <nav className="sidebar-nav" data-lenis-prevent="true">
        {adminMenuItems1.map(renderStaticItem)}

        <div className="nav-divider"></div>

        {isMenusLoading ? (
          <div className="sidebar-menu-status" role="status">
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
            <span>Memuat menu...</span>
          </div>
        ) : dynamicMenus.length === 0 ? (
          <div className="sidebar-empty-menu">
            <div className="sidebar-empty-menu-icon" aria-hidden="true">
              <i className="fa-solid fa-folder-plus"></i>
            </div>
            <p>Belum ada menu tambahan</p>
            <span>Tambahkan menu baru untuk ditampilkan di sidebar.</span>
          </div>
        ) : (
          dynamicMenus.map(renderDynamicItem)
        )}

        <div className="nav-divider"></div>

        {adminMenuItems2.map(renderStaticItem)}
      </nav>

      <button className="btn-tambah-menu" onClick={() => onTambahMenu?.()}>
        <i className="fa-solid fa-plus"></i> Tambah Menu
      </button>
    </aside>
  );
};

export default AdminSidebar;