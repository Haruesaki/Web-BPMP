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
// Setiap menu utama punya array `submenus`. Hanya menu utama yang boleh
// menambah submenu; submenu tidak bisa punya submenu lagi (satu tingkat saja).
// Sebagai contoh, hanya "Pelayanan" yang diisi submenu.
const INITIAL_MENUS = [
  { id: 'profil', label: 'Profil', active: true, submenus: [] },
  { id: 'reformasi-birokrasi', label: 'Reformasi Birokrasi', active: true, submenus: [] },
  { id: 'dok-kinerja', label: 'Dok. Kinerja', active: false, submenus: [] },
  {
    id: 'pelayanan',
    label: 'Pelayanan',
    active: true,
    submenus: [
      { id: 'standar-pelayanan', label: 'Standar Pelayanan', active: false },
      { id: 'maklumat-pelayanan', label: 'Maklumat Pelayanan', active: false },
      { id: 'unit-layanan-terpadu', label: 'Unit Layanan Terpadu', active: false },
      { id: 'survey-kepuasan', label: 'Survey Kepuasan Masyarakat', active: false },
      { id: 'hasil-survey-skm', label: 'Hasil Survey SKM', active: false },
    ],
  },
  { id: 'program', label: 'Program', active: true, submenus: [] },
  { id: 'ppid', label: 'PPID', active: false, submenus: [] },
  { id: 'sipers', label: 'Sipers', active: true, submenus: [] },
  { id: 'spab', label: 'SPAB', active: true, submenus: [] },
  { id: 'pengaduan', label: 'Pengaduan', active: false, submenus: [] },
];

const PengaturanMenu = () => {
  const [menus, setMenus] = useState(INITIAL_MENUS);
  const [dragIndex, setDragIndex] = useState(null);
  const [subDrag, setSubDrag] = useState(null); // { parentId, index } | null
  const [expandedIds, setExpandedIds] = useState([]); // menu utama yang terbuka

  // --- Expand/collapse dropdown submenu ---
  const toggleExpand = (id) =>
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // --- Reorder MENU UTAMA via drag pada ikon grip (titik-titik) ---
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

  // --- Reorder SUBMENU (dibatasi hanya di dalam induk yang sama) ---
  const reorderSub = (parentId, from, to) =>
    setMenus((prev) =>
      prev.map((m) => {
        if (m.id !== parentId) return m;
        const subs = [...m.submenus];
        const [moved] = subs.splice(from, 1);
        subs.splice(to, 0, moved);
        return { ...m, submenus: subs };
      })
    );

  const handleSubDragStart = (parentId, index) => setSubDrag({ parentId, index });

  const handleSubDragOver = (event, parentId, index) => {
    event.preventDefault();
    if (!subDrag || subDrag.parentId !== parentId || subDrag.index === index) return;
    reorderSub(parentId, subDrag.index, index);
    setSubDrag({ parentId, index });
  };

  const handleSubDragEnd = () => setSubDrag(null);

  // --- Aksi baris MENU UTAMA ---
  const toggleActive = (id) =>
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );

  const hapusMenu = (id) =>
    setMenus((prev) => prev.filter((m) => m.id !== id));

  // --- Aksi baris SUBMENU ---
  const toggleSubActive = (parentId, subId) =>
    setMenus((prev) =>
      prev.map((m) =>
        m.id === parentId
          ? {
              ...m,
              submenus: m.submenus.map((s) =>
                s.id === subId ? { ...s, active: !s.active } : s
              ),
            }
          : m
      )
    );

  const hapusSub = (parentId, subId) =>
    setMenus((prev) =>
      prev.map((m) =>
        m.id === parentId
          ? { ...m, submenus: m.submenus.filter((s) => s.id !== subId) }
          : m
      )
    );

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

          <div className="pm-card-header-right">
            <span className="pm-card-hint">
              Geser ikon titik-titik untuk mengubah urutan
            </span>
            <div className="pm-legend">
              <span className="pm-legend-item">
                <span className="pm-dot pm-dot-active"></span> Aktif
              </span>
              <span className="pm-legend-item">
                <span className="pm-dot pm-dot-inactive"></span> Non-aktif
              </span>
            </div>
          </div>
        </div>

        <div className="pm-list">
          {menus.map((menu, index) => {
            const hasSub = menu.submenus.length > 0;
            const isExpanded = expandedIds.includes(menu.id);

            return (
              <React.Fragment key={menu.id}>
                {/* ===== BARIS MENU UTAMA ===== */}
                <div
                  className={`pm-row ${dragIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="pm-drag" title="Geser untuk mengubah urutan">
                    <i className="fa-solid fa-grip-vertical"></i>
                  </span>

                  {/* Panah dropdown di paling kiri, tepat di samping grip.
                      Selalu dirender (kosong bila tak punya submenu) agar nomor
                      antar-baris tetap sejajar. */}
                  <span
                    className={`pm-caret-slot ${hasSub ? 'pm-caret-clickable' : ''}`}
                    onClick={hasSub ? () => toggleExpand(menu.id) : undefined}
                    title={hasSub ? 'Buka/tutup submenu' : undefined}
                  >
                    {hasSub && (
                      <i
                        className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'} pm-caret`}
                      ></i>
                    )}
                  </span>

                  <span className="pm-number">{index + 1}</span>

                  {/* Label juga bisa diklik untuk buka/tutup submenu.
                      Dot di kanan nama menandakan status aktif (hijau) / nonaktif (abu). */}
                  <div
                    className={`pm-label ${hasSub ? 'pm-label-clickable' : ''}`}
                    onClick={hasSub ? () => toggleExpand(menu.id) : undefined}
                  >
                    <span>{menu.label}</span>
                    <span
                      className={`pm-dot ${menu.active ? 'pm-dot-active' : 'pm-dot-inactive'}`}
                      title={menu.active ? 'Aktif' : 'Non-aktif'}
                    ></span>
                  </div>

                  <div className="pm-actions">
                    <button className="pm-btn pm-btn-submenu">Tambah Submenu</button>

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

                {/* ===== DROPDOWN BARIS SUBMENU (tanpa tombol "Tambah Submenu") ===== */}
                {isExpanded &&
                  menu.submenus.map((sub, subIndex) => (
                    <div
                      key={sub.id}
                      className={`pm-row pm-subrow ${
                        subDrag &&
                        subDrag.parentId === menu.id &&
                        subDrag.index === subIndex
                          ? 'dragging'
                          : ''
                      }`}
                      draggable
                      onDragStart={() => handleSubDragStart(menu.id, subIndex)}
                      onDragOver={(e) => handleSubDragOver(e, menu.id, subIndex)}
                      onDragEnd={handleSubDragEnd}
                    >
                      <span className="pm-drag" title="Geser untuk mengubah urutan">
                        <i className="fa-solid fa-grip-vertical"></i>
                      </span>

                      {/* Slot panah kosong: submenu tak bisa punya submenu lagi,
                          tapi tetap disisakan agar nomor sejajar dengan induk. */}
                      <span className="pm-caret-slot"></span>

                      <span className="pm-number pm-subnumber">
                        {index + 1}.{subIndex + 1}
                      </span>

                      <div className="pm-label">
                        <span>{sub.label}</span>
                        <span
                          className={`pm-dot ${sub.active ? 'pm-dot-active' : 'pm-dot-inactive'}`}
                          title={sub.active ? 'Aktif' : 'Non-aktif'}
                        ></span>
                      </div>

                      <div className="pm-actions">
                        <button className="pm-btn pm-btn-edit">Edit</button>

                        {sub.active ? (
                          <button
                            className="pm-btn pm-btn-nonaktif"
                            onClick={() => toggleSubActive(menu.id, sub.id)}
                          >
                            Nonaktifkan
                          </button>
                        ) : (
                          <button
                            className="pm-btn pm-btn-aktif"
                            onClick={() => toggleSubActive(menu.id, sub.id)}
                          >
                            Aktifkan
                          </button>
                        )}

                        <button
                          className="pm-btn pm-btn-hapus"
                          onClick={() => hapusSub(menu.id, sub.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
              </React.Fragment>
            );
          })}
        </div>

            {/* ---------- FOOTER ---------- */}
            <div className="pm-card-footer">
              <button className="pm-save">Simpan Perubahan</button>
            </div>
      </section>
    </main>
  );
};

export default PengaturanMenu;
