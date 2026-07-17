import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import './PengaturanMenu.css';
import TambahSubmenu from './TambahSubmenu';
import EditMenu from './EditMenu';

const PengaturanMenu = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dragIndex, setDragIndex] = useState(null);
  const [subDrag, setSubDrag] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);

  // State modal tambah submenu
  const [isModalSubmenuOpen, setIsModalSubmenuOpen] = useState(false);
  const [modalSubmenuParentId, setModalSubmenuParentId] = useState(null);

  // State modal edit menu
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [menuDataEdit, setMenuDataEdit] = useState(null);

  // State modal convert to submenu
  const [modalConvertOpen, setModalConvertOpen] = useState({ isOpen: false, menuId: null, menuName: '' });
  const [convertName, setConvertName] = useState('');
  const [convertIcon, setConvertIcon] = useState('fa-solid fa-file-lines');
  const [isConvertLoading, setIsConvertLoading] = useState(false);

  // State modal konfirmasi hapus
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, title: '' });

  // State popup konfirmasi aktif/nonaktif
  const [confirm, setConfirm] = useState(null);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/menus');
      const flatData = res.data;

      const parentMenus = flatData.filter(m => m.induk_id === null).sort((a, b) => a.urutan_tampil - b.urutan_tampil);
      const subMenusFlat = flatData.filter(m => m.induk_id !== null).sort((a, b) => a.urutan_tampil - b.urutan_tampil);

      const treeData = parentMenus.map(p => {
        return {
          ...p,
          label: p.nama_menu,
          active: p.is_aktif,
          submenus: subMenusFlat.filter(s => s.induk_id === p.id).map(s => ({
            ...s,
            label: s.nama_menu,
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

    const handleRefresh = () => {
      fetchMenus();
    };

    window.addEventListener('refreshSidebar', handleRefresh);
    return () => {
      window.removeEventListener('refreshSidebar', handleRefresh);
    };
  }, []);

  const triggerSidebarRefresh = () => {
    window.dispatchEvent(new Event('refreshSidebar'));
  };

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
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    reorder(dragIndex, index);
    setDragIndex(index);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
    saveUrutanToDB(menus);
  };

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
    saveUrutanToDB(menus);
  };

  const hapusMenuApi = async (id) => {
    try {
      const session = JSON.parse(sessionStorage.getItem('adminSession'));
      const token = session?.token;
      await axiosInstance.delete(`/api/menus/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      triggerSidebarRefresh();
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan saat menghapus menu.');
    }
  };

  const handleConvertSubmit = async () => {
    if (!convertName || !convertIcon) return;
    setIsConvertLoading(true);
    try {
      const session = JSON.parse(sessionStorage.getItem('adminSession'));
      const token = session?.token;
      await axiosInstance.post('/api/menus/convert-to-submenu', {
        idMenuUtama: modalConvertOpen.menuId,
        namaSubmenuBaru: convertName,
        ikonSubmenuBaru: convertIcon
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalConvertOpen({ isOpen: false, menuId: null, menuName: '' });
      setConvertName('');
      triggerSidebarRefresh();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.pesan || 'Gagal memindahkan konten ke submenu.';
      alert(errMsg);
    } finally {
      setIsConvertLoading(false);
    }
  };

  const handleTambahSubmenuClick = (menu) => {
    // Jika belum punya submenu dan dia bertipe post (atau selain link), minta konfirmasi pindah konten
    if (menu.submenus.length === 0 && menu.jenis_menu !== 'link') {
      setConvertName(menu.label + " (Utama)");
      setModalConvertOpen({ isOpen: true, menuId: menu.id, menuName: menu.label });
    } else {
      setModalSubmenuParentId(menu.id);
      setIsModalSubmenuOpen(true);
    }
  };

  const handleEditClick = (menu) => {
    setMenuDataEdit(menu);
    setIsModalEditOpen(true);
  };

  const toggleActive = (id) => setMenus((prev) => prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m)));
  const toggleSubActive = (parentId, subId) =>
    setMenus((prev) =>
      prev.map((m) =>
        m.id === parentId
          ? { ...m, submenus: m.submenus.map((s) => (s.id === subId ? { ...s, active: !s.active } : s)) }
          : m
      )
    );

  const askConfirm = (kind, id, willActivate, label, parentId = null) => setConfirm({ kind, id, willActivate, label, parentId });
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
      <div className="pm-heading">
        <h1>Pengaturan Menu</h1>
        <p>Kelola urutan dan status tampilan menu di halaman beranda.</p>
      </div>

      <section className="pm-card">
        <div className="pm-card-header">
          <div className="pm-card-title">
            <i className="fa-solid fa-bars"></i>
            <span>Struktur Navigasi Utama</span>
          </div>

          <div className="pm-card-header-right">
            <span className="pm-card-hint">Geser ikon titik-titik untuk mengubah urutan</span>
            <div className="pm-legend">
              <span className="pm-legend-item"><span className="pm-dot pm-dot-active"></span> Aktif</span>
              <span className="pm-legend-item"><span className="pm-dot pm-dot-inactive"></span> Non-aktif</span>
            </div>
          </div>
        </div>

        <div className="pm-list">
          {menus.map((menu, index) => {
            const hasSub = menu.submenus.length > 0;
            const isExpanded = expandedIds.includes(menu.id);

            return (
              <React.Fragment key={menu.id}>
                {/* MENU UTAMA */}
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
                  >
                    {hasSub && <i className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'} pm-caret`}></i>}
                  </span>

                  <span className="pm-number">{index + 1}</span>

                  <div className="pm-label">
                    <span
                      className={`pm-label-inner ${hasSub ? 'pm-label-clickable' : ''}`}
                      onClick={hasSub ? () => toggleExpand(menu.id) : undefined}
                    >
                      <i className={menu.ikon_menu} style={{ marginRight: '8px' }}></i>
                      <span>{menu.label}</span>
                      <span className={`pm-dot ${menu.active ? 'pm-dot-active' : 'pm-dot-inactive'}`} title={menu.active ? 'Aktif' : 'Non-aktif'}></span>
                    </span>
                  </div>

                  <div className="pm-actions">
                    <button className="pm-btn pm-btn-submenu" onClick={() => handleTambahSubmenuClick(menu)}>
                      Tambah Submenu
                    </button>

                    <button className="pm-btn pm-btn-edit" onClick={() => handleEditClick(menu)}>Edit</button>

                    {menu.active ? (
                      <button className="pm-btn pm-btn-nonaktif" onClick={() => askConfirm('menu', menu.id, false, menu.label)}>
                        Nonaktifkan
                      </button>
                    ) : (
                      <button className="pm-btn pm-btn-aktif" onClick={() => askConfirm('menu', menu.id, true, menu.label)}>
                        Aktifkan
                      </button>
                    )}

                    <button className="pm-btn pm-btn-hapus" onClick={() => setConfirmDelete({ isOpen: true, id: menu.id, title: menu.label })}>
                      Hapus
                    </button>
                  </div>
                </div>

                {/* SUBMENU */}
                {isExpanded &&
                  menu.submenus.map((sub, subIndex) => (
                    <div
                      key={sub.id}
                      className={`pm-row pm-subrow ${subDrag && subDrag.parentId === menu.id && subDrag.index === subIndex ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => handleSubDragStart(menu.id, subIndex)}
                      onDragOver={(e) => handleSubDragOver(e, menu.id, subIndex)}
                      onDragEnd={handleSubDragEnd}
                    >
                      <span className="pm-drag" title="Geser untuk mengubah urutan">
                        <i className="fa-solid fa-grip-vertical"></i>
                      </span>

                      <span className="pm-caret-slot"></span>

                      <span className="pm-number pm-subnumber">{index + 1}.{subIndex + 1}</span>

                      <div className="pm-label">
                        <i className={sub.ikon_menu} style={{ marginRight: '8px' }}></i>
                        <span>{sub.label}</span>
                        <span className={`pm-dot ${sub.active ? 'pm-dot-active' : 'pm-dot-inactive'}`} title={sub.active ? 'Aktif' : 'Non-aktif'}></span>
                      </div>

                      <div className="pm-actions">
                        <button className="pm-btn pm-btn-edit" onClick={() => handleEditClick(sub)}>Edit</button>

                        {sub.active ? (
                          <button className="pm-btn pm-btn-nonaktif" onClick={() => askConfirm('sub', sub.id, false, sub.label, menu.id)}>
                            Nonaktifkan
                          </button>
                        ) : (
                          <button className="pm-btn pm-btn-aktif" onClick={() => askConfirm('sub', sub.id, true, sub.label, menu.id)}>
                            Aktifkan
                          </button>
                        )}

                        <button className="pm-btn pm-btn-hapus" onClick={() => setConfirmDelete({ isOpen: true, id: sub.id, title: sub.label })}>
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

      <TambahSubmenu
        isOpen={isModalSubmenuOpen}
        onClose={() => setIsModalSubmenuOpen(false)}
        parentId={modalSubmenuParentId}
        onSuccess={() => {
          fetchMenus();
          triggerSidebarRefresh();
        }}
      />

      <EditMenu
        isOpen={isModalEditOpen}
        onClose={() => setIsModalEditOpen(false)}
        menuData={menuDataEdit}
        onSuccess={() => {
          fetchMenus();
          triggerSidebarRefresh();
        }}
      />

      {/* POPUP CONVERT TO SUBMENU */}
      {modalConvertOpen.isOpen && (
        <div className="pm-confirm-overlay" data-lenis-prevent="true" onClick={() => setModalConvertOpen({ isOpen: false, menuId: null, menuName: '' })}>
          <div className="pm-confirm-box" onClick={(e) => e.stopPropagation()} style={{ width: '500px', overflow: 'visible' }}>
            <div className="pm-confirm-body">
              <div className="pm-confirm-icon" style={{ color: '#ffb703' }}>
                <i className="fa-solid fa-code-merge"></i>
              </div>
              <h3 className="pm-confirm-title">Jadikan Konten Sebagai Submenu</h3>
              <p className="pm-confirm-text">
                Menu Utama <strong>{modalConvertOpen.menuName}</strong> saat ini menampung konten halamannya sendiri.
                Karena Anda ingin menambah submenu, menu utama ini akan diubah fungsinya menjadi <strong>Gerbang (Parent)</strong>.
                Konten yang sudah ada akan dipindahkan ke <strong>Submenu Pertama</strong> secara otomatis.
              </p>
              
              <div style={{ marginTop: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#fff' }}>
                  Nama Submenu Baru (untuk mewarisi konten)
                </label>
                <input 
                  type="text" 
                  value={convertName} 
                  onChange={(e) => setConvertName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#111', color: '#eee', marginBottom: '16px' }}
                />

                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#fff' }}>
                  Ikon Submenu Baru
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', maxHeight: '150px', overflowY: 'auto', padding: '10px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#111' }}>
                  {[
                    { value: 'fa-solid fa-table-cells-large', label: 'Menu utama', fa: 'fa-solid fa-table-cells-large' },
                    { value: 'fa-solid fa-pen-to-square', label: 'Customize', fa: 'fa-solid fa-pen-to-square' },
                    { value: 'fa-solid fa-sliders', label: 'Preferensi', fa: 'fa-solid fa-sliders' },
                    { value: 'fa-solid fa-file-lines', label: 'Dokumen', fa: 'fa-solid fa-file-lines' },
                    { value: 'fa-solid fa-circle-user', label: 'Profil', fa: 'fa-solid fa-circle-user' },
                    { value: 'fa-solid fa-building-columns', label: 'Institusi', fa: 'fa-solid fa-building-columns' },
                    { value: 'fa-solid fa-hands-holding-circle', label: 'Layanan', fa: 'fa-solid fa-hands-holding-circle' },
                    { value: 'fa-solid fa-calendar-check', label: 'Agenda / Tugas', fa: 'fa-solid fa-calendar-check' },
                    { value: 'fa-solid fa-circle-info', label: 'Informasi', fa: 'fa-solid fa-circle-info' },
                    { value: 'fa-solid fa-shield-halved', label: 'Privasi', fa: 'fa-solid fa-shield-halved' },
                    { value: 'fa-solid fa-comments', label: 'Pesan / Forum', fa: 'fa-solid fa-comments' },
                    { value: 'fa-solid fa-users', label: 'Daftar Pengguna', fa: 'fa-solid fa-users' },
                    { value: 'fa-solid fa-gear', label: 'Pengaturan', fa: 'fa-solid fa-gear' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      title={opt.label}
                      onClick={() => setConvertIcon(opt.value)}
                      style={{
                        padding: '10px',
                        background: convertIcon === opt.value ? '#222' : 'transparent',
                        border: convertIcon === opt.value ? '1px solid #0ea5e9' : '1px solid transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: convertIcon === opt.value ? '#0ea5e9' : '#888',
                        fontSize: '18px',
                        transition: '0.2s',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <i className={opt.fa}></i>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="pm-confirm-footer">
              <button className="pm-confirm-cancel" onClick={() => setModalConvertOpen({ isOpen: false, menuId: null, menuName: '' })}>
                Batal
              </button>
              <button className="pm-confirm-ok" onClick={handleConvertSubmit} disabled={isConvertLoading} style={{ backgroundColor: '#0284c7' }}>
                {isConvertLoading ? 'Memproses...' : 'Lanjutkan & Pindahkan'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                Apakah Anda yakin ingin menghapus menu ini? Tindakan ini bersifat permanen dan menu tidak dapat dikembalikan.
              </p>
            </div>
            <div className="pm-confirm-footer">
              <button className="pm-confirm-cancel" onClick={() => setConfirmDelete({ isOpen: false, id: null, title: '' })}>Batal</button>
              <button className="pm-confirm-ok pm-confirm-ok-danger" onClick={() => { hapusMenuApi(confirmDelete.id); setConfirmDelete({ isOpen: false, id: null, title: '' }); }}>
                Hapus Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP KONFIRMASI AKTIVASI MENU */}
      {confirm && (
        <div className="pm-confirm-overlay" data-lenis-prevent="true" onClick={cancelConfirm}>
          <div className="pm-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="pm-confirm-body">
              <div className="pm-confirm-icon">
                <i className="fa-solid fa-circle-info"></i>
              </div>
              <h3 className="pm-confirm-title">Konfirmasi Aktivasi Menu</h3>
              <p className="pm-confirm-text">
                Apakah Anda yakin ingin <strong>{confirm.willActivate ? 'mengaktifkan' : 'nonaktifkan'}</strong> menu ini? {confirm.willActivate ? 'Menu yang aktif akan langsung terlihat oleh pengguna di halaman utama.' : 'Menu yang nonaktif tidak akan terlihat oleh pengguna di halaman utama.'}
              </p>
            </div>
            <div className="pm-confirm-footer">
              <button className="pm-confirm-cancel" onClick={cancelConfirm}>Batal</button>
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