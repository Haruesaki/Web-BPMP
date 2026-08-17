import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { bacaSesi } from '../../../utils/sesiAdmin';
import { AKAR_ADMIN, jAdmin } from '../../../config/jalurAdmin';
import './AdminSidebar.css';

// --- DATA: MENU STATIS BAGIAN ATAS ---
const adminMenuItems1 = [
  { id: 'beranda', label: 'Beranda', icon: 'fa-solid fa-table-cells-large', path: AKAR_ADMIN },
  { id: 'customize', label: 'Customize Beranda', icon: 'fa-solid fa-pen-to-square', path: jAdmin('customize-beranda') },
  { id: 'pengaturan-menu', label: 'Pengaturan Menu', icon: 'fa-solid fa-sliders', path: jAdmin('pengaturan-menu') },
];

// --- DATA: MENU STATIS BAGIAN BAWAH ---
const adminMenuItems2 = [
  { id: 'manajemen', label: 'Manajemen User', icon: 'fa-solid fa-users', path: jAdmin('manajemen-user') },
  { id: 'setting', label: 'Setting', icon: 'fa-solid fa-gear', path: jAdmin('setting') },
];

// Awalan editor konten, dipakai dua kali di bawah.
const AWALAN_POST = jAdmin('post/');

const AdminSidebar = ({ onTambahMenu, refreshTrigger, isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dynamicMenus, setDynamicMenus] = useState([]);
  const [isMenusLoading, setIsMenusLoading] = useState(true);
  const [isLimitPopupOpen, setIsLimitPopupOpen] = useState(false);
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

  const currentUser = useMemo(() => bacaSesi(), []);

  const hasAccess = (label) => {
    if (!currentUser) return false;
    if (currentUser.role === 'superadmin' || currentUser.is_superadmin) return true;
    return currentUser.access?.includes(label) || false;
  };

  // Peta route statis yang memang punya satu halaman tujuan jelas.
  // Kuncinya disusun dari jAdmin(), BUKAN ditulis tangan. Peta yang tertinggal
  // tidak menimbulkan galat apa pun — hanya menu sidebar yang berhenti menyala
  // pada halaman yang sedang dibuka, gejala yang sukar dilacak ke sini.
  const staticRouteMap = {
    [AKAR_ADMIN]: 'beranda',
    [jAdmin('customize-beranda')]: 'customize',
    [jAdmin('pengaturan-menu')]: 'pengaturan-menu',
    [jAdmin('manajemen-user')]: 'manajemen',
    [jAdmin('setting')]: 'setting',
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

    // 4. Jika pathname adalah prefix editor (misal <akar-admin>/post/...) tapi belum exact match
    if (pathname.startsWith(AWALAN_POST)) {
       const postMatches = flatMenus.filter(item => item.path?.startsWith(AWALAN_POST));
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
            if (item.jenis_menu === 'link') return jAdmin(`link/${item.id}`);
            if (item.jenis_menu === 'post') {
              if (item.slug_atau_tautan === 'profile-card') return jAdmin(`kelola-profil/${item.id}`);
              return jAdmin(`post/${item.slug_atau_tautan || 'default'}/${item.id}`);
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

    // -- URL PROTECTION LOGIC --
    // Jika current route terdeteksi di sidebar, cek apakah punya akses.
    if (routeMatchedId && routeMatchedId !== 'beranda' && routeMatchedId !== 'setting') {
      let matchedLabel = null;
      const staticItem = [...adminMenuItems1, ...adminMenuItems2].find(m => m.id === routeMatchedId);
      
      if (staticItem) {
        matchedLabel = staticItem.label;
      } else {
        for (const m of dynamicMenus) {
          if (m.id === routeMatchedId) {
            matchedLabel = m.label; break;
          }
          if (m.submenus) {
            const sub = m.submenus.find(s => s.id === routeMatchedId);
            if (sub) { matchedLabel = sub.label; break; }
          }
        }
      }

      if (matchedLabel && !hasAccess(matchedLabel)) {
        // Akses ditolak karena URL diketik manual, lemparkan kembali ke Beranda!
        navigate(AKAR_ADMIN, { replace: true });
        return;
      }
    }

    setSelectedId(nextSelectedId);
    sessionStorage.setItem('adminSidebarSelectedId', nextSelectedId);
  }, [location.pathname, location.state, dynamicMenus, navigate]);

  const toggleExpand = (id) => {
    setExpandedMenus(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      sessionStorage.setItem('adminSidebarExpandedMenus', JSON.stringify(next));
      return next;
    });
  };

  const renderStaticItem = (item) => {
    // Bypass 'Beranda' and 'Setting' since they are always accessible
    const isAlwaysAccessible = item.label === 'Beranda' || item.label === 'Setting';
    const accessible = isAlwaysAccessible || hasAccess(item.label);

    return (
      <button
        key={item.id}
        className={`nav-item ${selectedId === item.id ? 'active' : ''} ${!accessible ? 'locked' : ''}`}
        onClick={(e) => {
          if (!accessible) {
            e.preventDefault();
            return;
          }
          // Klik item statis akan menyimpan ID aktif untuk dipakai lagi saat refresh.
          persistSelectedId(item.id);
          if (item.path) navigate(item.path);
          onClose?.(); // tutup drawer (mobile) setelah memilih menu
        }}
        style={{ opacity: accessible ? 1 : 0.6, cursor: accessible ? 'pointer' : 'not-allowed' }}
        title={!accessible ? "Anda tidak memiliki hak akses" : ""}
      >
        <i className={item.icon}></i>
        <span>{item.label}</span>
        {!accessible && <i className="fa-solid fa-lock" style={{ marginLeft: 'auto', fontSize: '12px', color: '#ff4d4f' }}></i>}
      </button>
    );
  };

  const renderDynamicItem = (menu) => {
    const hasSubmenus = menu.submenus && menu.submenus.length > 0;
    const isExpanded = expandedMenus.includes(menu.id);
    const accessible = hasAccess(menu.label);

    // Jika dia punya submenu, dia berfungsi sebagai GERBANG (hanya nge-expand).
    // Untuk item tanpa submenu, klik langsung navigate ke halaman editor / post.
    const handleClick = (e) => {
      if (!accessible) {
        e.preventDefault();
        return;
      }
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
          onClose?.(); // tutup drawer (mobile) setelah navigasi
        }
      }
    };

    return (
      <React.Fragment key={menu.id}>
        <button
          className={`nav-item ${selectedId === menu.id ? 'active' : ''} ${!accessible ? 'locked' : ''}`}
          onClick={handleClick}
          style={{ opacity: accessible ? 1 : 0.6, cursor: accessible ? 'pointer' : 'not-allowed' }}
          title={!accessible ? "Anda tidak memiliki hak akses" : ""}
        >
          <i className={menu.icon}></i>
          <span>{menu.label}</span>
          {!accessible ? (
            <i className="fa-solid fa-lock" style={{ marginLeft: 'auto', fontSize: '12px', color: '#ff4d4f' }}></i>
          ) : hasSubmenus ? (
            <i
              className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}`}
              style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.7 }}
            ></i>
          ) : null}
        </button>

        {/* Render Submenu */}
        {hasSubmenus && isExpanded && (
          <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            {menu.submenus.map(sub => {
              const subAccessible = hasAccess(sub.label);
              return (
                <button
                  key={sub.id}
                  className={`nav-item ${selectedId === sub.id ? 'active' : ''} ${!subAccessible ? 'locked' : ''}`}
                  style={{ fontSize: '0.9em', padding: '0.6rem 1rem', opacity: subAccessible ? 1 : 0.6, cursor: subAccessible ? 'pointer' : 'not-allowed' }}
                  onClick={(e) => {
                    if (!subAccessible) {
                      e.preventDefault();
                      return;
                    }
                    // Submenu menyimpan ID anaknya sendiri agar highlight tetap tepat
                    // meskipun halaman yang ditampilkan adalah route generik dari editor.
                    persistSelectedId(sub.id);
                    if (sub.path) {
                      navigate(sub.path, { state: { menuName: sub.label, menuId: sub.id, isPostTanpaSubmenu: false } });
                      onClose?.(); // tutup drawer (mobile) setelah navigasi
                    }
                  }}
                  title={!subAccessible ? "Anda tidak memiliki hak akses" : ""}
                >
                  <i className={sub.icon} style={{ fontSize: '0.9em' }}></i>
                  <span>{sub.label}</span>
                  {!subAccessible && <i className="fa-solid fa-lock" style={{ marginLeft: 'auto', fontSize: '12px', color: '#ff4d4f' }}></i>}
                </button>
              );
            })}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <>
      {/* Latar gelap di belakang drawer (hanya tampil saat terbuka di HP).
          Klik untuk menutup. Di desktop disembunyikan via CSS.

          Kelasnya berawalan `admin-` dengan sengaja: nama polos
          `sidebar-backdrop` dipakai juga oleh menu mobile sisi pengunjung, dan
          keduanya sempat saling merusak. Penjelasan lengkapnya di
          AdminSidebar.css. */}
      <div
        className={`admin-sidebar-backdrop ${isOpen ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar ${isOpen ? 'admin-sidebar--open' : ''}`}>
      <div className="sidebar-brand">
        <h1>Content Management<br />System Website BPMP</h1>
        {/* Tombol tutup drawer — hanya tampil di HP (CSS). */}
        <button className="sidebar-close" onClick={onClose} aria-label="Tutup menu">
          <i className="fa-solid fa-xmark"></i>
        </button>
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

      <button className="btn-tambah-menu" onClick={() => {
        if (dynamicMenus.length >= 9) {
          setIsLimitPopupOpen(true);
        } else {
          onTambahMenu?.();
        }
      }}>
        <i className="fa-solid fa-plus"></i> Tambah Menu
      </button>

      {/* POPUP: BATES MAKSIMAL MENU */}
      {isLimitPopupOpen && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setIsLimitPopupOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', padding: '30px', textAlign: 'center' }}>
            <div style={{
              width: '70px', height: '70px', margin: '0 auto 20px',
              backgroundColor: '#3b1818', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #ff4d4f', color: '#ff4d4f', fontSize: '28px'
            }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            
            <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '12px' }}>Batas Maksimum Menu</h3>
            <p style={{ color: '#bbb', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '25px' }}>
              Anda tidak dapat menambahkan menu utama baru karena telah mencapai batas maksimum <strong>(9 Menu Utama)</strong>. Hal ini diterapkan untuk menjaga kerapian dan kenyamanan navigasi pengguna pada tampilan *Header* website.
            </p>
            
            <button 
              onClick={() => setIsLimitPopupOpen(false)}
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                border: 'none', backgroundColor: '#0284c7', color: '#fff',
                fontSize: '14px', fontWeight: '500', cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
            >
              Oke, Saya Mengerti
            </button>
          </div>
        </div>
      )}
      </aside>
    </>
  );
};

export default AdminSidebar;