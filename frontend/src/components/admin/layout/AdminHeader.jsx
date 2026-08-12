import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import { bacaSesi } from '../../../utils/sesiAdmin';
import './AdminHeader.css';

// =========================================================================
//  ADMIN HEADER (Topbar) — dipakai berulang di semua halaman Admin.
//  -----------------------------------------------------------------------
//  Cara pakai di halaman lain:
//
//    import AdminHeader from '../../assets/component-admin/AdminHeader';
//
//    <AdminHeader
//      userEmail="bpmp_lampung@gmail.co.id"
//      userRole="Super Admin"
//      searchResults={searchResults}
//    />
//
//  searchResults bersifat opsional — kalau tidak dikirim, komponen akan
//  memakai data contoh (placeholder) supaya tetap bisa langsung dipakai.
//  Nantinya bagian ini tinggal disambungkan ke endpoint pencarian backend.
// =========================================================================

// Menu statis sidebar (selaras dengan AdminSidebar). 'always' = selalu bisa
// diakses tanpa cek hak akses (Beranda & Setting).
const STATIC_MENU_ITEMS = [
  { id: 'beranda', label: 'Beranda', icon: 'fa-solid fa-table-cells-large', path: '/admin', always: true },
  { id: 'customize', label: 'Customize Beranda', icon: 'fa-solid fa-pen-to-square', path: '/admin/customize-beranda' },
  { id: 'pengaturan-menu', label: 'Pengaturan Menu', icon: 'fa-solid fa-sliders', path: '/admin/pengaturan-menu' },
  { id: 'manajemen', label: 'Manajemen User', icon: 'fa-solid fa-users', path: '/admin/manajemen-user' },
  { id: 'setting', label: 'Setting', icon: 'fa-solid fa-gear', path: '/admin/setting', always: true },
];

// Bentuk path tujuan menu dinamis — selaras dengan generatePath di AdminSidebar.
const buildMenuPath = (item) => {
  if (item.jenis_menu === 'link') return `/admin/link/${item.id}`;
  if (item.jenis_menu === 'post') {
    if (item.slug_atau_tautan === 'profile-card') return `/admin/kelola-profil/${item.id}`;
    return `/admin/post/${item.slug_atau_tautan || 'default'}/${item.id}`;
  }
  return item.slug_atau_tautan || '#';
};

const AdminHeader = ({
  // nama, email, & role diambil dari sessionStorage (data user yang login,
  // bersumber dari backend/DB). Bukan lagi prop hardcoded.
  onLogout,
  // Toggle drawer sidebar (dipakai tombol hamburger di HP). Di desktop tombol
  // hamburger disembunyikan lewat CSS sehingga prop ini tak terpakai.
  onToggleSidebar,
}) => {
  const navigate = useNavigate();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menus, setMenus] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const profileRef = useRef(null);

  const [session, setSession] = useState({ nama: 'Admin BPMP', role: 'admin', email: '' });

  useEffect(() => {
    const tersimpan = bacaSesi();
    if (tersimpan) setSession(tersimpan);
  }, []);

  const userName = session.nama;
  const userRole = session.role;
  const userEmail = session.email;

  // --- Ambil daftar menu (dinamis) dari backend untuk pencarian sidebar ---
  useEffect(() => {
    let mounted = true;
    const fetchMenus = () => {
      axiosInstance
        .get('/api/menus')
        .then((res) => { if (mounted) setMenus(res.data || []); })
        .catch((err) => console.error('Gagal memuat menu untuk pencarian:', err));
    };

    fetchMenus();
    // Muat ulang saat ada menu dibuat/diubah/dihapus. Memakai event global yang
    // sama dengan refresh sidebar (di-dispatch AdminLayout), agar pencarian
    // langsung sinkron tanpa perlu refresh halaman.
    window.addEventListener('refreshSidebar', fetchMenus);
    return () => {
      mounted = false;
      window.removeEventListener('refreshSidebar', fetchMenus);
    };
  }, []);

  // Susun seluruh item sidebar yang bisa dicari (statis + dinamis + submenu),
  // dengan cek hak akses yang sama seperti AdminSidebar.
  const searchItems = useMemo(() => {
    const hasAccess = (label) => {
      if (session.role === 'superadmin' || session.is_superadmin) return true;
      return session.access?.includes(label) || false;
    };

    const items = [];

    STATIC_MENU_ITEMS.forEach((it) => {
      if (it.always || hasAccess(it.label)) {
        items.push({ key: `static-${it.id}`, label: it.label, icon: it.icon, sub: 'Menu Admin', path: it.path, isStatic: true });
      }
    });

    const parents = menus.filter((m) => m.induk_id === null).sort((a, b) => a.urutan_tampil - b.urutan_tampil);
    const children = menus.filter((m) => m.induk_id !== null).sort((a, b) => a.urutan_tampil - b.urutan_tampil);

    parents.forEach((p) => {
      if (hasAccess(p.nama_menu)) {
        items.push({ key: `menu-${p.id}`, id: p.id, label: p.nama_menu, icon: p.ikon_menu, sub: 'Menu', path: buildMenuPath(p) });
      }
      children
        .filter((c) => c.induk_id === p.id)
        .forEach((c) => {
          if (hasAccess(c.nama_menu)) {
            items.push({ key: `submenu-${c.id}`, id: c.id, label: c.nama_menu, icon: c.ikon_menu, sub: `Submenu • ${p.nama_menu}`, path: buildMenuPath(c) });
          }
        });
    });

    return items;
  }, [menus, session]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return searchItems;
    return searchItems.filter((it) => it.label.toLowerCase().includes(q));
  }, [searchQuery, searchItems]);

  const handleSelectResult = (item) => {
    setIsSearchActive(false);
    setSearchQuery('');
    if (item.isStatic) {
      navigate(item.path);
    } else {
      navigate(item.path, { state: { menuName: item.label, menuId: item.id } });
    }
  };

  // --- EFFECT: Klik di luar search untuk menutup ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setIsSearchActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchActive]);

  // --- EFFECT: Klik di luar dropdown profil untuk menutup ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- EFFECT: Pintasan papan ketik Ctrl/Cmd + K untuk membuka & fokus
  //     pencarian (sesuai label "Ctrl + K" di kotak pencarian). Escape menutup. ---
  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
        // Cegah pintasan bawaan peramban (mis. fokus address bar di sebagian
        // peramban) agar fokus benar-benar jatuh ke kotak pencarian ini.
        event.preventDefault();
        setIsSearchActive(true);
        searchInputRef.current?.focus();
      } else if (event.key === 'Escape' && isSearchActive) {
        setIsSearchActive(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [isSearchActive]);

  return (
    <header className="admin-topbar">
      {/* Tombol hamburger — hanya tampil di HP (CSS). Membuka/menutup drawer
          sidebar. */}
      <button
        type="button"
        className="admin-hamburger"
        onClick={onToggleSidebar}
        aria-label="Buka menu navigasi"
      >
        <i className="fa-solid fa-bars"></i>
      </button>

      <div className="search-wrapper" ref={searchWrapperRef}>
        <div
          className={`search-box ${isSearchActive ? 'active' : ''}`}
          onClick={() => setIsSearchActive(true)}
        >
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Cari menu di sidebar..."
            className="search-input"
            value={searchQuery}
            onFocus={() => setIsSearchActive(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchActive(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length > 0) {
                handleSelectResult(searchResults[0]);
              }
            }}
          />
          <span className="search-shortcut">Ctrl + K</span>
        </div>

        {isSearchActive && searchQuery.trim() && (
          <div className="search-dropdown">
            <div className="search-dropdown-header">HASIL PENCARIAN</div>
            {searchResults.length === 0 ? (
              <div className="search-result-item" style={{ cursor: 'default' }}>
                <span className="search-result-icon">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
                <div className="search-result-text">
                  <div className="search-result-title">Menu tidak ditemukan</div>
                  <div className="search-result-sub">Coba kata kunci lain.</div>
                </div>
              </div>
            ) : (
              searchResults.map((r) => (
                <div
                  key={r.key}
                  className="search-result-item"
                  onClick={() => handleSelectResult(r)}
                >
                  <span className="search-result-icon">
                    <i className={r.icon}></i>
                  </span>
                  <div className="search-result-text">
                    <div className="search-result-title">{r.label}</div>
                    <div className="search-result-sub">{r.sub}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="topbar-profile" ref={profileRef}>
        <button
          type="button"
          className={`profile-trigger ${isProfileOpen ? 'active' : ''}`}
          onClick={() => setIsProfileOpen((prev) => !prev)}
        >
          <div className="profile-text">
            <div className="profile-name">{userEmail}</div>
            <div className="profile-role">{userRole}</div>
          </div>
          <div className="profile-avatar">
            <i className="fa-solid fa-user"></i>
          </div>
        </button>

        {isProfileOpen && (
          <div className="profile-dropdown">
            <div className="profile-dropdown-user">
              <span className="profile-dropdown-avatar">
                <i className="fa-solid fa-user"></i>
              </span>
              <div className="profile-dropdown-info">
                <div className="profile-dropdown-eyebrow">User</div>
                <div className="profile-dropdown-name">{userName}</div>
                <div className="profile-dropdown-email">{userEmail}</div>
              </div>
            </div>

            <button
              type="button"
              className="profile-dropdown-logout"
              onClick={() => {
                setIsProfileOpen(false);
                onLogout?.();
              }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
