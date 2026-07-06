import React, { useState } from 'react';
// Halaman ini di-render sebagai konten di dalam <AdminLayout> (yang sudah
// menyediakan sidebar, header, dan wrapper .admin-layout). Jadi cukup return
// <main className="admin-content"> saja — tanpa AdminSidebar/AdminHeader.
import './PengaturanMenu.css';

// =========================================================================
//  DATA MENU
//  -----------------------------------------------------------------------
//  Disamakan dengan daftar "menuItems" di AdminSidebar.jsx. Properti `active`
//  menyimpan status tampil/tidaknya menu di halaman beranda publik.
//  Nanti tinggal diganti fetch ke backend (GET /api/menus).
// =========================================================================
const INITIAL_MENUS = [
  { id: 'profil', label: 'Profil', active: true },
  { id: 'reformasi-birokrasi', label: 'Reformasi Birokrasi', active: true },
  { id: 'dok-kinerja', label: 'Dok. Kinerja', active: false },
  { id: 'pelayanan', label: 'Pelayanan', active: true },
  { id: 'program', label: 'Program', active: true },
  { id: 'ppid', label: 'PPID', active: false },
  { id: 'sipers', label: 'Sipers', active: true },
  { id: 'spab', label: 'SPAB', active: true },
  { id: 'pengaduan', label: 'Pengaduan', active: false },
];

const PengaturanMenu = () => {
  const [menus, setMenus] = useState(INITIAL_MENUS);
  const [dragIndex, setDragIndex] = useState(null);

  // --- Reorder via drag pada ikon grip (titik-titik) ---
  const reorder = (from, to) => {
    setMenus((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const handleDragStart = (index) => setDragIndex(index);

  const handleDragOver = (event, index) => {
    event.preventDefault(); // izinkan drop
    if (dragIndex === null || dragIndex === index) return;
    reorder(dragIndex, index);
    setDragIndex(index); // posisi item yang diseret kini di index baru
  };

  const handleDragEnd = () => setDragIndex(null);

  // --- Aksi baris ---
  const toggleActive = (id) =>
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );

  const hapusMenu = (id) =>
    setMenus((prev) => prev.filter((m) => m.id !== id));

  return (
    <main className="admin-content">
      {/* ---------- HEADING ---------- */}
      <div className="pm-heading">
        <h1>Pengaturan Menu</h1>
        <p>Kelola urutan dan status tampilan menu di halaman beranda.</p>
      </div>

      {/* ---------- CARD STRUKTUR NAVIGASI ---------- */}
      <section className="pm-card">
        <div className="pm-card-header">
          <div className="pm-card-title">
            <i className="fa-solid fa-bars"></i>
            <span>Struktur Navigasi Utama</span>
          </div>
          <span className="pm-card-hint">
            Geser ikon titik-titik untuk mengubah urutan
          </span>
        </div>

        <div className="pm-list">
              {menus.map((menu, index) => (
                <div
                  key={menu.id}
                  className={`pm-row ${dragIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="pm-drag" title="Geser untuk mengubah urutan">
                    <i className="fa-solid fa-grip-vertical"></i>
                  </span>

                  <span className="pm-number">{index + 1}</span>

                  <span className="pm-label">{menu.label}</span>

                  <div className="pm-actions">
                    <button className="pm-btn pm-btn-submenu">Tambah Submenu</button>

                    <span
                      className={`pm-status ${menu.active ? 'is-active' : 'is-inactive'}`}
                    >
                      Info: {menu.active ? 'Aktif' : 'Nonaktif'}
                    </span>

                    <button className="pm-btn pm-btn-edit">Edit</button>

                    {menu.active ? (
                      <button
                        className="pm-btn pm-btn-nonaktif"
                        onClick={() => toggleActive(menu.id)}
                      >
                        Nonaktifkan
                      </button>
                    ) : (
                      <button
                        className="pm-btn pm-btn-aktif"
                        onClick={() => toggleActive(menu.id)}
                      >
                        Aktifkan
                      </button>
                    )}

                    <button
                      className="pm-btn pm-btn-hapus"
                      onClick={() => hapusMenu(menu.id)}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ---------- FOOTER ---------- */}
            <div className="pm-card-footer">
              <div className="pm-legend">
                <span className="pm-legend-item">
                  <span className="pm-dot pm-dot-active"></span> Aktif
                </span>
                <span className="pm-legend-item">
                  <span className="pm-dot pm-dot-inactive"></span> Non-aktif
                </span>
              </div>

              <button className="pm-save">Simpan Perubahan</button>
            </div>
      </section>
    </main>
  );
};

export default PengaturanMenu;
