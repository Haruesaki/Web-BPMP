import React from 'react';
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
const adminMenuItems1 = [
  { id: 'beranda', label: 'Beranda', icon: 'fa-solid fa-table-cells-large' },
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
  { id: 'manajemen', label: 'Manajemen User', icon: 'fa-solid fa-users' },
  { id: 'setting', label: 'Setting', icon: 'fa-solid fa-gear' },
];

const AdminSidebar = ({ activeMenu, onMenuClick, onTambahMenu }) => {
  const renderNavItem = (item) => (
    <button
      key={item.id}
      className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
      onClick={() => onMenuClick?.(item.id)}
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

      <nav className="sidebar-nav">
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
