import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const Link = () => {
  const navigate = useNavigate();
  const { menuId } = useParams();
  // ID ada di URL agar menu yang sedang diedit tetap tepat saat browser di-refresh.
  const focusId = menuId ? String(menuId) : null;
  const hasScrolledRef = useRef(false);
  const rowRefs = useRef({});
  const inputRefs = useRef({});

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      if (!focusId) {
        setRows([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Meskipun kita hanya butuh satu, API saat ini mengembalikan semua menu.
        // Kita akan filter di frontend.
        const res = await axiosInstance.get('/api/menus');
        const allMenus = res.data;
        const targetMenu = allMenus.find(m => String(m.id) === focusId);

        if (targetMenu && targetMenu.jenis_menu === 'link') {
          setRows([{
            id: targetMenu.id,
            label: targetMenu.nama_menu,
            active: targetMenu.is_aktif,
            link: targetMenu.slug_atau_tautan || '',
            level: targetMenu.induk_id === null ? 0 : 1,
            parentId: targetMenu.induk_id,
          }]);
        } else {
          setRows([]); // Menu tidak ditemukan atau bukan tipe 'link'
        }
      } catch (err) {
        console.error('Gagal memuat data menu', err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    hasScrolledRef.current = false;
    fetchMenu();
  }, [focusId]);

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
    if (!focusId || rows.length === 0) {
      setSaveError('Menu Link yang akan disimpan tidak ditemukan.');
      return;
    }
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
          <h1>{rows[0]?.label ? `Kelola Link - ${rows[0].label}` : 'Kelola Link Menu'}</h1>
          <p>Atur tautan (URL) tujuan untuk menu Link yang sedang dipilih.</p>
        </div>
        <button className="lk-btn-simpan" onClick={handleSimpan} disabled={saving || !focusId || rows.length === 0}>
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

        {!focusId ? (
          <div className="lk-empty">Pilih menu bertipe Link dari sidebar untuk mengatur tautannya.</div>
        ) : rows.length === 0 ? (
          <div className="lk-empty">Menu Link tidak ditemukan atau tidak lagi bertipe Link.</div>
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
