import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

// =========================================================================
//  ADMIN SIDEBAR — dipakai berulang di semua halaman Admin (Dashboard,
//  Berita, Profil, Setting, dll).
//  -----------------------------------------------------------------------
//  Cara pakai di halaman lain:
//
//    import AdminSidebar from '../../assets/component-admin/AdminSidebar';
//
//    <AdminSidebar
//      activeMenu={activeMenu}
//      onMenuClick={(id) => setActiveMenu(id)}
//      onTambahMenu={() => setIsMenuModalOpen(true)}
//    />
//
//  Catatan: parent page WAJIB membungkus seluruh layout-nya dengan
//  <div className="admin-layout"> ... </div> karena warna, font, dan
//  variabel CSS (--bg-app, --bg-sidebar, dst.) dideklarasikan di scope
//  ".admin-layout" pada dashboard-admin.css.
// =========================================================================

// --- DATA: MENU STATIS BAGIAN ATAS ---
// Item dengan properti `path` akan bernavigasi antar-halaman admin
// (routing). Item tanpa `path` tetap memakai state `activeMenu` seperti semula.
const adminMenuItems1 = [
  { id: 'beranda', label: 'Beranda', icon: 'fa-solid fa-table-cells-large', path: '/admin' },
  { id: 'customize', label: 'Customize Beranda', icon: 'fa-solid fa-pen-to-square' },
  { id: 'pengaturan-menu', label: 'Pengaturan Menu', icon: 'fa-solid fa-sliders' },
  { id: 'berita', label: 'Berita', icon: 'fa-solid fa-file-lines' },
];

// --- DATA: MENU KONTEN (bisa nantinya diganti sumber dinamis dari backend) ---
const menuItems = [
  { id: 'profil', label: 'Profil', icon: 'fa-solid fa-circle-user' },
  { id: 'reformasi-birokrasi', label: 'Reformasi Birokrasi', icon: 'fa-solid fa-building-columns' },
  { id: 'dok-kinerja', label: 'Dok. Kinerja', icon: 'fa-solid fa-file-lines' },
  { id: 'pelayanan', label: 'Pelayanan', icon: 'fa-solid fa-hands-holding-circle' },
  { id: 'program', label: 'Program', icon: 'fa-solid fa-calendar-check' },
  { id: 'ppid', label: 'PPID', icon: 'fa-solid fa-circle-info' },
  { id: 'sipers', label: 'Sipers', icon: 'fa-solid fa-file-lines' },
  { id: 'spab', label: 'SPAB', icon: 'fa-solid fa-shield-halved' },
  { id: 'pengaduan', label: 'Pengaduan', icon: 'fa-solid fa-comments' },
];

// --- DATA: MENU STATIS BAGIAN BAWAH ---
const adminMenuItems2 = [
  { id: 'manajemen', label: 'Manajemen User', icon: 'fa-solid fa-users', path: '/admin/manajemen-user' },
  { id: 'setting', label: 'Setting', icon: 'fa-solid fa-gear' },
];

// Semua item digabung untuk mencocokkan rute aktif saat awal mount.
const allMenuItems = [...adminMenuItems1, ...menuItems, ...adminMenuItems2];

const AdminSidebar = ({ activeMenu, onMenuClick, onTambahMenu }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Satu sumber kebenaran untuk item yang tersorot. Diinisialisasi dari rute
  // yang sedang dibuka (item ber-`path` yang cocok), lalu fallback ke prop
  // activeMenu, lalu 'beranda'. Karena hanya satu state, tidak mungkin ada
  // dua menu aktif bersamaan.
  const routeMatch = allMenuItems.find((it) => it.path === location.pathname);
  const [selectedId, setSelectedId] = useState(routeMatch?.id || activeMenu || 'beranda');

  const renderNavItem = (item) => (
    <button
      key={item.id}
      className={`nav-item ${selectedId === item.id ? 'active' : ''}`}
      onClick={() => {
        setSelectedId(item.id);
        if (item.path) navigate(item.path);
        onMenuClick?.(item.id);
      }}
    >
      <i className={item.icon}></i>
      <span>{item.label}</span>
    </button>
  );

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <h1>Content Management<br />System Website BPMP</h1>
      </div>

      <nav className="sidebar-nav" data-lenis-prevent="true">
        {adminMenuItems1.map(renderNavItem)}

        <div className="nav-divider"></div>

        {menuItems.map(renderNavItem)}

        <div className="nav-divider"></div>

        {adminMenuItems2.map(renderNavItem)}
      </nav>

      <button className="btn-tambah-menu" onClick={() => onTambahMenu?.()}>
        <i className="fa-solid fa-plus"></i> Tambah Menu
      </button>
    </aside>
  );
};

export default AdminSidebar;
