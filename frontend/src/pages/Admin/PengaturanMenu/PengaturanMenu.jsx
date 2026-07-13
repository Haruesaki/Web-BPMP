import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import './PengaturanMenu.css';
import TambahSubmenu from './TambahSubmenu';

const PengaturanMenu = () => {
  const navigate = useNavigate();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dragIndex, setDragIndex] = useState(null);
  const [subDrag, setSubDrag] = useState(null); // { parentId, index } | null
  const [expandedIds, setExpandedIds] = useState([]); // menu utama yang terbuka

  // State modal tambah submenu
  const [isModalSubmenuOpen, setIsModalSubmenuOpen] = useState(false);
  const [modalSubmenuParentId, setModalSubmenuParentId] = useState(null);

  // State modal konfirmasi hapus
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, title: '' });

  // State popup konfirmasi aktif/nonaktif. null = tertutup.
  // { kind: 'menu'|'sub', id, parentId, willActivate, label }
  const [confirm, setConfirm] = useState(null);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/menus');
      const flatData = res.data;

      // Parse flat data jadi parent-child
      const parentMenus = flatData.filter(m => m.induk_id === null).sort((a, b) => a.urutan_tampil - b.urutan_tampil);
      const subMenusFlat = flatData.filter(m => m.induk_id !== null).sort((a, b) => a.urutan_tampil - b.urutan_tampil);

      const treeData = parentMenus.map(p => {
        return {
          ...p,
          label: p.nama_menu,
          jenis_menu: p.jenis_menu, // Pastikan jenis_menu tersedia
          slug_atau_tautan: p.slug_atau_tautan, // Pastikan slug_atau_tautan tersedia
          active: p.is_aktif,
          submenus: subMenusFlat.filter(s => s.induk_id === p.id).map(s => ({
            ...s,
            label: s.nama_menu,
            jenis_menu: s.jenis_menu, // Pastikan jenis_menu tersedia
            slug_atau_tautan: s.slug_atau_tautan, // Pastikan slug_atau_tautan tersedia
            active: s.is_aktif
          }))
        };
      });
      setMenus(treeData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const triggerSidebarRefresh = () => {
    window.dispatchEvent(new Event('refreshSidebar'));
  };

  // Simpan urutan ke database
  const saveUrutanToDB = async (newMenus) => {
    try {
      let updates = [];
      newMenus.forEach((parent, pIndex) => {
        updates.push({ id: parent.id, urutan_tampil: pIndex });
        parent.submenus.forEach((sub, sIndex) => {
          updates.push({ id: sub.id, urutan_tampil: sIndex });
        });
      });

      const session = JSON.parse(sessionStorage.getItem('adminSession'));
      const token = session?.token;

      await axiosInstance.patch('/api/menus/reorder', { updates }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerSidebarRefresh();
    } catch (error) {
      console.error('Gagal menyimpan urutan', error);
      alert('Gagal menyimpan urutan menu!');
    }
  };

  const toggleExpand = (id) =>
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  // --- Reorder MENU UTAMA ---
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
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    saveUrutanToDB(menus); // simpan dan refresh sidebar
  };

  // --- Reorder SUBMENU ---
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

  const handleSubDragEnd = () => {
    setSubDrag(null);
    saveUrutanToDB(menus); // simpan dan refresh sidebar
  };

  // --- Aksi Hapus ---
  const hapusMenuApi = async (id) => {
    try {
      const session = JSON.parse(sessionStorage.getItem('adminSession'));
      const token = session?.token;

      await axiosInstance.delete(`/api/menus/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state and sidebar
      fetchMenus();
      triggerSidebarRefresh();
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menghapus menu.');
    }
  };

  // Biarkan toggle active tidak ke DB dulu sesuai instruksi (dibiarin dummy/local saja sementara)
  const toggleActive = (id) =>
    setMenus((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
    );

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

  // --- Konfirmasi aktif/nonaktif (popup) ---
  const askConfirm = (kind, id, willActivate, label, parentId = null) =>
    setConfirm({ kind, id, willActivate, label, parentId });

  const cancelConfirm = () => setConfirm(null);

  const runConfirm = () => {
    if (!confirm) return;
    if (confirm.kind === 'menu') toggleActive(confirm.id);
    else toggleSubActive(confirm.parentId, confirm.id);
    setConfirm(null);
  };

  if (loading) {
    return <main className="admin-content"><p>Memuat data menu...</p></main>;
  }

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

                  <div
                    className={`pm-label ${hasSub ? 'pm-label-clickable' : ''}`}
                    onClick={hasSub ? () => toggleExpand(menu.id) : undefined}
                  >
                    <i className={menu.ikon_menu} style={{ marginRight: '8px' }}></i>
                    <span>{menu.label}</span>
                    <span
                      className={`pm-dot ${menu.active ? 'pm-dot-active' : 'pm-dot-inactive'}`}
                      title={menu.active ? 'Aktif' : 'Non-aktif'}
                    ></span>
                  </div>

                  <div className="pm-actions">
                    <button
                      className="pm-btn pm-btn-submenu"
                      onClick={() => {
                        setModalSubmenuParentId(menu.id);
                        setIsModalSubmenuOpen(true);
                      }}
                    >
                      Tambah Submenu
                    </button>

                    <button
                      className="pm-btn pm-btn-edit"
                      onClick={() => {
                        if (menu.jenis_menu === 'post') {
                          navigate(`/admin/post/${menu.slug_atau_tautan || 'default'}`, {
                            state: { menuName: menu.label, isPostTanpaSubmenu: menu.submenus.length === 0 },
                          });
                        } else if (menu.jenis_menu === 'link') {
                          navigate('/admin/link', { state: { menuId: menu.id } });
                        }
                      }}
                    >
                      Edit
                    </button>

                    {menu.active ? (
                      <button
                        className="pm-btn pm-btn-nonaktif"
                        onClick={() => askConfirm('menu', menu.id, false, menu.label)}
                      >
                        Nonaktifkan
                      </button>
                    ) : (
                      <button
                        className="pm-btn pm-btn-aktif"
                        onClick={() => askConfirm('menu', menu.id, true, menu.label)}
                      >
                        Aktifkan
                      </button>
                    )}

                    <button
                      className="pm-btn pm-btn-hapus"
                      onClick={() => setConfirmDelete({ isOpen: true, id: menu.id, title: menu.label })}
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {/* ===== DROPDOWN BARIS SUBMENU ===== */}
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

                      <span className="pm-caret-slot"></span>

                      <span className="pm-number pm-subnumber">
                        {index + 1}.{subIndex + 1}
                      </span>

                      <div className="pm-label">
                        <i className={sub.ikon_menu} style={{ marginRight: '8px' }}></i>
                        <span>{sub.label}</span>
                        <span
                          className={`pm-dot ${sub.active ? 'pm-dot-active' : 'pm-dot-inactive'}`}
                          title={sub.active ? 'Aktif' : 'Non-aktif'}
                        ></span>
                      </div>

                      <div className="pm-actions">
                        <button
                          className="pm-btn pm-btn-edit"
                          onClick={() => {
                            if (sub.jenis_menu === 'post') {
                              navigate(`/admin/post/${sub.slug_atau_tautan || 'default'}`, {
                                state: { menuName: sub.label, isPostTanpaSubmenu: false },
                              });
                            } else if (sub.jenis_menu === 'link') {
                              navigate('/admin/link', { state: { menuId: sub.id } });
                            }
                          }}
                        >
                          Edit
                        </button>

                        {sub.active ? (
                          <button
                            className="pm-btn pm-btn-nonaktif"
                            onClick={() => askConfirm('sub', sub.id, false, sub.label, menu.id)}
                          >
                            Nonaktifkan
                          </button>
                        ) : (
                          <button
                            className="pm-btn pm-btn-aktif"
                            onClick={() => askConfirm('sub', sub.id, true, sub.label, menu.id)}
                          >
                            Aktifkan
                          </button>
                        )}

                        <button
                          className="pm-btn pm-btn-hapus"
                          onClick={() => setConfirmDelete({ isOpen: true, id: sub.id, title: sub.label })}
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
      </section>

      {/* Modal Tambah Submenu */}
      <TambahSubmenu
        isOpen={isModalSubmenuOpen}
        onClose={() => setIsModalSubmenuOpen(false)}
        parentId={modalSubmenuParentId}
        onSuccess={() => {
          fetchMenus();
          triggerSidebarRefresh();
        }}
      />

      {/* Modal Konfirmasi Hapus */}
      {confirmDelete.isOpen && (
        <div className="pm-confirm-overlay" data-lenis-prevent="true" onClick={() => setConfirmDelete({ isOpen: false, id: null, title: '' })}>
          <div className="pm-confirm-box pm-confirm-danger" onClick={(e) => e.stopPropagation()}>
            <div className="pm-confirm-body">
              <div className="pm-confirm-icon">
                <i className="fa-solid fa-trash-can"></i>
              </div>
              <h3 className="pm-confirm-title">Konfirmasi Hapus Menu</h3>
              <p className="pm-confirm-text">
                Apakah Anda yakin ingin menghapus menu ini? Tindakan ini bersifat permanen
                dan menu tidak dapat dikembalikan.
              </p>
            </div>
            <div className="pm-confirm-footer">
              <button
                className="pm-confirm-cancel"
                onClick={() => setConfirmDelete({ isOpen: false, id: null, title: '' })}
              >
                Batal
              </button>
              <button
                className="pm-confirm-ok pm-confirm-ok-danger"
                onClick={() => {
                  hapusMenuApi(confirmDelete.id);
                  setConfirmDelete({ isOpen: false, id: null, title: '' });
                }}
              >
                Hapus Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- POPUP KONFIRMASI AKTIVASI MENU ---------- */}
      {confirm && (
        <div className="pm-confirm-overlay" data-lenis-prevent="true" onClick={cancelConfirm}>
          <div className="pm-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="pm-confirm-body">
              <div className="pm-confirm-icon">
                <i className="fa-solid fa-circle-info"></i>
              </div>
              <h3 className="pm-confirm-title">Konfirmasi Aktivasi Menu</h3>
              <p className="pm-confirm-text">
                Apakah Anda yakin ingin{' '}
                <strong>{confirm.willActivate ? 'mengaktifkan' : 'nonaktifkan'}</strong> menu ini?{' '}
                {confirm.willActivate
                  ? 'Menu yang aktif akan langsung terlihat oleh pengguna di halaman utama.'
                  : 'Menu yang nonaktif tidak akan terlihat oleh pengguna di halaman utama.'}
              </p>
            </div>
            <div className="pm-confirm-footer">
              <button className="pm-confirm-cancel" onClick={cancelConfirm}>
                Batal
              </button>
              <button className="pm-confirm-ok" onClick={runConfirm}>
                {confirm.willActivate ? 'Aktifkan Menu' : 'Nonaktifkan Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default PengaturanMenu;
