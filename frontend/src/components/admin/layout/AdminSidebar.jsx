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
  { id: 'setting', label: 'Setting', icon: 'fa-solid fa-gear' },
];

const AdminSidebar = ({ onTambahMenu, refreshTrigger }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dynamicMenus, setDynamicMenus] = useState([]);
  const [selectedId, setSelectedId] = useState('beranda');
  const [expandedMenus, setExpandedMenus] = useState([]); // Array of parent IDs yang sedang di-expand

  // Peta route statis agar klik item sidebar tetap cocok dengan URL halaman aktif.
  // Ini dipakai untuk mengembalikan highlight sidebar saat halaman dimuat ulang.
  const staticRouteMap = {
    '/admin': 'beranda',
    '/admin/customize-beranda': 'customize',
    '/admin/pengaturan-menu': 'pengaturan-menu',
    '/admin/manajemen-user': 'manajemen',
    '/admin/setting': 'setting',
  };

  // Simpan item yang sedang aktif agar setelah refresh, sidebar tetap tahu
  // menu mana yang harus diberi highlight sesuai halaman yang sedang dibuka.
  const persistSelection = (id) => {
    setSelectedId(id);
    if (id) {
      sessionStorage.setItem('activeSidebarId', String(id));
    }
  };

  // Fetch menu dinamis dari backend
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await axiosInstance.get('/api/menus');
        const data = response.data;
        
        // Membentuk struktur Tree (Parent-Child)
        const parentMenus = data.filter(m => m.induk_id === null).sort((a,b) => a.urutan_tampil - b.urutan_tampil);
        const childMenus = data.filter(m => m.induk_id !== null).sort((a,b) => a.urutan_tampil - b.urutan_tampil);

        const tree = parentMenus.map(p => {
          const subs = childMenus.filter(c => c.induk_id === p.id);
          return {
            id: p.id.toString(),
            label: p.nama_menu,
            icon: p.ikon_menu,
            jenis: p.jenis_menu,
            path: p.jenis_menu === 'post'
              ? `/admin/post/${p.slug_atau_tautan || 'default'}`
              : p.jenis_menu === 'link'
                ? '/admin/link'
                : (p.slug_atau_tautan || '#'),
            submenus: subs.map(s => ({
              id: s.id.toString(),
              label: s.nama_menu,
              icon: s.ikon_menu,
              jenis: s.jenis_menu,
              path: s.jenis_menu === 'post'
                ? `/admin/post/${s.slug_atau_tautan || 'default'}`
                : s.jenis_menu === 'link'
                  ? '/admin/link'
                  : (s.slug_atau_tautan || '#')
            }))
          };
        });

        setDynamicMenus(tree);
      } catch (error) {
        console.error('Gagal fetch menus:', error);
      }
    };
    fetchMenus();
  }, [refreshTrigger]);

  // Sync state aktif sidebar dengan URL sekarang. Tujuannya agar highlight menu
  // selalu mengikuti halaman yang benar-benar ditampilkan, termasuk saat refresh.
  useEffect(() => {
    const resolveActiveId = () => {
      // 1) Untuk route statis, langsung ambil id mapping-nya.
      const staticId = staticRouteMap[location.pathname];
      if (staticId) {
        persistSelection(staticId);
        return;
      }

      // 2) Cek item parent dan submenu dinamis yang path-nya cocok dengan route saat ini.
      for (const menu of dynamicMenus) {
        if (menu.path === location.pathname) {
          persistSelection(menu.id);
          return;
        }

        const matchedSubmenu = menu.submenus.find(sub => sub.path === location.pathname);
        if (matchedSubmenu) {
          persistSelection(matchedSubmenu.id);
          // Pastikan parent menu tetap terbuka kalau submenu aktif.
          setExpandedMenus(prev => (prev.includes(menu.id) ? prev : [...prev, menu.id]));
          return;
        }
      }

      // 3) Khusus route /admin/link, gunakan selection yang terakhir disimpan
      //    karena halaman editor link tidak punya path unik dari menu item.
      if (location.pathname === '/admin/link') {
        const savedId = sessionStorage.getItem('activeSidebarId');
        const fallbackId = dynamicMenus.find(menu => menu.id === savedId || menu.submenus.some(sub => sub.id === savedId))?.id;

        if (savedId && fallbackId) {
          persistSelection(savedId);
          return;
        }
      }

      // 4) Untuk route /admin/post/:slug, cari parent menu yang cocok.
      if (location.pathname.startsWith('/admin/post/')) {
        const fallbackId = dynamicMenus.find(menu => menu.path === location.pathname)?.id;
        if (fallbackId) {
          persistSelection(fallbackId);
        }
      }
    };

    resolveActiveId();
  }, [location.pathname, dynamicMenus]);

  // Toggle expand/collapse parent menu agar submenu bisa dibuka dan ditutup.
  const toggleExpand = (id) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Render item statis seperti Beranda / Customize / Pengaturan Menu / Manajemen User.
  const renderStaticItem = (item) => (
    <button
      key={item.id}
      className={`nav-item ${selectedId === item.id ? 'active' : ''}`}
      onClick={() => {
        // Saat item statis diklik, update state aktif dan simpan ke session storage.
        persistSelection(item.id);
        if (item.path) navigate(item.path);
      }}
    >
      <i className={item.icon}></i>
      <span>{item.label}</span>
    </button>
  );

  // Render item dinamis dari backend. Item ini bisa punya submenu atau langsung arah ke route.
  const renderDynamicItem = (menu) => {
    const hasSubmenus = menu.submenus && menu.submenus.length > 0;
    const isExpanded = expandedMenus.includes(menu.id);
    
    // Parent menu yang punya submenu berfungsi sebagai gerbang expand.
    // Kalau tidak punya submenu, ia langsung membuka halaman target.
    const handleClick = () => {
      persistSelection(menu.id);

      if (hasSubmenus) {
        toggleExpand(menu.id);
        return;
      }

      if (menu.jenis === 'link') {
        navigate('/admin/link', { state: { menuId: Number(menu.id) } });
        return;
      }

      if (menu.path) {
        navigate(menu.path, {
          state: {
            menuName: menu.label,
            isPostTanpaSubmenu: menu.jenis === 'post'
          }
        });
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
                  // Submenu juga menyimpan pilihannya sendiri agar active state tetap cocok
                  // saat halaman dikunjungi dari route yang menampilkan submenu tersebut.
                  persistSelection(sub.id);

                  if (sub.jenis === 'link') {
                    navigate('/admin/link', { state: { menuId: Number(sub.id) } });
                    return;
                  }

                  if (sub.path) {
                    navigate(sub.path, { state: { menuName: sub.label, isPostTanpaSubmenu: false } });
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

        {dynamicMenus.map(renderDynamicItem)}

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
