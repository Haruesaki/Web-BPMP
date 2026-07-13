import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Halaman ini di-render sebagai konten di dalam <AdminLayout> (yang sudah
// menyediakan sidebar, header, dan wrapper .admin-layout). Jadi cukup return
// <main className="admin-content"> saja — tanpa AdminSidebar/AdminHeader.
import axiosInstance from '../../../api/axiosInstance';
import '../../../pages/Admin/DashboardAdmin/dashboard-admin.css';
import './Link.css';

// =========================================================================
//  CATATAN
//  -----------------------------------------------------------------------
//  Data diambil dari endpoint yang SAMA dengan PengaturanMenu.jsx / AdminSidebar.jsx
//  (GET /api/menus), lalu difilter hanya menu/submenu dengan jenis_menu === 'link'.
//  Kolom `slug_atau_tautan` di tabel `menu` MEMANG dipakai untuk menyimpan URL
//  tujuan saat jenis_menu = 'link' (lihat migrasi create_menu_table & form
//  Tambah Menu di AdminLayout.jsx) — jadi TIDAK ADA kolom baru yang dibutuhkan
//  untuk menampilkan/menyimpan data ini.
//
//  Endpoint PATCH /api/menus/:id SUDAH tersedia di backend, dipakai oleh
//  tombol "Simpan" di bawah untuk benar-benar menyimpan perubahan link.
// =========================================================================

// Ratakan menu utama + submenu jadi satu list datar, HANYA yang jenis_menu
// = 'link'. Tetap simpan level (0 = menu utama, 1 = submenu) untuk tampilan.
const flattenLinkMenus = (menus) =>
  menus.flatMap((menu) => {
    const rows = [];
    if (menu.jenis_menu === 'link') {
      rows.push({
        id: menu.id,
        label: menu.nama_menu,
        active: menu.is_aktif,
        link: menu.slug_atau_tautan || '',
        level: 0,
        parentId: null,
      });
    }
    menu.submenus
      .filter((sub) => sub.jenis_menu === 'link')
      .forEach((sub) => {
        rows.push({
          id: sub.id,
          label: sub.nama_menu,
          active: sub.is_aktif,
          link: sub.slug_atau_tautan || '',
          level: 1,
          parentId: menu.id,
        });
      });
    return rows;
  });

const Link = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Dikirim dari AdminSidebar.jsx saat menu bertipe 'link' diklik:
  // navigate('/admin/link', { state: { menuId } })
  // ID menu dari sidebar dikirim sebagai string (lihat AdminSidebar.jsx: p.id.toString()),
  // sedangkan id dari GET /api/menus di sini masih number. Samakan ke string
  // supaya perbandingan highlight tidak meleset.
  const focusId = location.state?.menuId != null ? String(location.state.menuId) : null;
  const hasScrolledRef = useRef(false);
  const rowRefs = useRef({});
  const inputRefs = useRef({});

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/menus');
      const flatData = res.data;

      const parentMenus = flatData
        .filter((m) => m.induk_id === null)
        .sort((a, b) => a.urutan_tampil - b.urutan_tampil);
      const subMenusFlat = flatData
        .filter((m) => m.induk_id !== null)
        .sort((a, b) => a.urutan_tampil - b.urutan_tampil);

      const treeData = parentMenus.map((p) => ({
        ...p,
        submenus: subMenusFlat.filter((s) => s.induk_id === p.id),
      }));

      setRows(flattenLinkMenus(treeData));
    } catch (err) {
      console.error('Gagal memuat data menu', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // Setelah data selesai dimuat, scroll ke baris menu yang dituju (kalau ada)
  // dan langsung fokus ke input link-nya. Hanya dijalankan sekali per
  // kunjungan halaman supaya tidak berulang-ulang scroll saat rows berubah.
  useEffect(() => {
    if (loading || !focusId || hasScrolledRef.current) return;
    const rowEl = rowRefs.current[focusId];
    const inputEl = inputRefs.current[focusId];
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (inputEl) {
      inputEl.focus();
    }
    hasScrolledRef.current = true;
  }, [loading, focusId]);

  const updateLink = (id, value) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, link: value } : row)));

  const triggerSidebarRefresh = () => {
    window.dispatchEvent(new Event('refreshSidebar'));
  };

  const handleSimpan = async () => {
    setSaveError('');
    setSaving(true);
    try {
      const session = JSON.parse(sessionStorage.getItem('adminSession'));
      const token = session?.token;

      // Endpoint PATCH /api/menus/:id sudah tersedia di backend, kirim
      // slug_atau_tautan (kolom yang menyimpan URL untuk menu tipe 'link')
      // untuk setiap baris yang ditampilkan di halaman ini.
      await Promise.all(
        rows.map((row) =>
          axiosInstance.patch(
            `/api/menus/${row.id}`,
            { slug_atau_tautan: row.link },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      triggerSidebarRefresh();
      navigate('/admin/pengaturan-menu');
    } catch (error) {
      console.error('Gagal menyimpan link menu', error);
      setSaveError(error.response?.data?.pesan || 'Gagal menyimpan perubahan link. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-content">
        <p>Memuat data menu...</p>
      </main>
    );
  }

  return (
    <main className="admin-content">
      {/* ---------- HEADING + AKSI ---------- */}
      <div className="lk-header">
        <div className="lk-heading">
          <h1>Kelola Link Menu</h1>
          <p>Atur tautan (URL) tujuan untuk setiap menu bertipe Link yang sudah dibuat.</p>
        </div>
        <button className="lk-btn-simpan" onClick={handleSimpan} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>

      {saveError && <div className="lk-error">{saveError}</div>}

      {/* ---------- CARD DAFTAR LINK MENU ---------- */}
      <section className="lk-card">
        <div className="lk-card-header">
          <div className="lk-card-title">
            <i className="fa-solid fa-link"></i>
            <span>Tautan Menu</span>
          </div>
          <span className="lk-card-hint">Isi link tujuan untuk masing-masing menu</span>
        </div>

        {rows.length === 0 ? (
          <div className="lk-empty">Belum ada menu bertipe Link. Tambahkan lewat "Tambah Menu" di sidebar.</div>
        ) : (
          <div className="lk-list">
            {rows.map((row) => (
              <div
                className={`lk-row ${row.level === 1 ? 'lk-row-sub' : ''} ${
                  String(row.id) === focusId ? 'lk-row-highlight' : ''
                }`}
                key={row.id}
                ref={(el) => (rowRefs.current[row.id] = el)}
              >
                <div className="lk-menu-label">
                  {row.level === 1 && <i className="fa-solid fa-turn-up lk-sub-icon"></i>}
                  <span>{row.label}</span>
                  <span
                    className={`lk-dot ${row.active ? 'lk-dot-active' : 'lk-dot-inactive'}`}
                    title={row.active ? 'Aktif' : 'Non-aktif'}
                  ></span>
                </div>

                <input
                  type="text"
                  className="lk-input"
                  value={row.link}
                  placeholder="https://contoh.com/halaman"
                  onChange={(e) => updateLink(row.id, e.target.value)}
                  ref={(el) => (inputRefs.current[row.id] = el)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Link;