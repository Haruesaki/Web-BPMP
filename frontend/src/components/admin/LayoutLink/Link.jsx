import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Halaman ini di-render sebagai konten di dalam <AdminLayout> (yang sudah
// menyediakan sidebar, header, dan wrapper .admin-layout). Jadi cukup return
// <main className="admin-content"> saja — tanpa AdminSidebar/AdminHeader.
import axiosInstance from '../../../api/axiosInstance';
import '../../../pages/Admin/DashboardAdmin/dashboard-admin.css';
import './Link.css';

// Catatan:
// Data menu diambil dari endpoint yang sama dengan PengaturanMenu.jsx
// (GET /api/menus), supaya id menu/submenu di sini selalu cocok dengan
// yang ada di Pengaturan Menu. Nilai URL disimpan di kolom backend
// `slug_atau_tautan`, jadi halaman ini menggunakannya sebagai sumber data.

// Ratakan menu utama + submenu jadi satu list datar, sambil menyimpan level
// (0 = menu utama, 1 = submenu) dan parentId (khusus submenu).
// Field yang benar di backend saat ini adalah `slug_atau_tautan`, jadi `link`
// pada state frontend kita isi dari nilai kolom tersebut.
const flattenMenus = (menus) =>
  menus.flatMap((menu) => [
    {
      id: menu.id,
      label: menu.label,
      active: menu.active,
      link: menu.link || '',
      level: 0,
      parentId: null,
    },
    ...menu.submenus.map((sub) => ({
      id: sub.id,
      label: sub.label,
      active: sub.active,
      link: sub.link || '',
      level: 1,
      parentId: menu.id,
    })),
  ]);

const Link = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const triggerSidebarRefresh = () => { window.dispatchEvent(new Event('refreshSidebar')); };

  // Jika halaman ini dibuka lewat tombol "Edit" di Pengaturan Menu, id menu
  // yang ingin langsung disorot/di-scroll dikirim lewat navigate(..., { state }).
  const focusId = location.state?.menuId ?? null;
  const hasScrolledRef = useRef(false);
  const rowRefs = useRef({});
  const inputRefs = useRef({});

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/menus');
      const flatData = res.data;

      const onlyLinkMenus = flatData.filter((m) => m.jenis_menu === 'link');

      const parentMenus = onlyLinkMenus
        .filter((m) => m.induk_id === null)
        .sort((a, b) => a.urutan_tampil - b.urutan_tampil);
      const subMenusFlat = onlyLinkMenus
        .filter((m) => m.induk_id !== null)
        .sort((a, b) => a.urutan_tampil - b.urutan_tampil);

      const treeData = parentMenus.map((p) => ({
        id: p.id,
        label: p.nama_menu,
        jenis_menu: p.jenis_menu,
        active: p.is_aktif,
        link: p.slug_atau_tautan || '',
        submenus: subMenusFlat
          .filter((s) => s.induk_id === p.id)
          .map((s) => ({
            id: s.id,
            label: s.nama_menu,
            active: s.is_aktif,
            jenis_menu: s.jenis_menu,
            link: s.slug_atau_tautan || '',
          })),
      }));

      setRows(flattenMenus(treeData));
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

  const handleSimpan = async () => {
    try {
      setSaving(true);

      const session = JSON.parse(sessionStorage.getItem('adminSession') || '{}');
      const token = session?.token;

      if (!token) {
        alert('Sesi admin tidak ditemukan. Silakan login kembali.');
        return;
      }

      const updates = rows.map((row) => ({
        id: row.id,
        link: row.link.trim(),
      }));

      await axiosInstance.put('/api/menus/links', { updates }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      triggerSidebarRefresh();
      navigate('/admin/pengaturan-menu');
      alert('Link menu berhasil disimpan!');
    } catch (error) {
      console.error('Gagal menyimpan link menu:', error);
      alert('Gagal menyimpan link menu!');
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

  if (rows.length === 0) {
    return (
      <main className="admin-content">
        <div className="lk-header">
          <div className="lk-heading">
            <h1>Kelola Link Menu</h1>
            <p>Belum ada menu dengan tipe Link yang bisa diedit.</p>
          </div>
          <button className="lk-btn-batal" onClick={() => navigate('/admin/pengaturan-menu')}>
            Kembali
          </button>
        </div>

        <section className="lk-card">
          <div className="lk-empty-state">
            <i className="fa-solid fa-link lk-empty-icon"></i>
            <div>
              <h3 className="lk-empty-title">Belum ada data link menu</h3>
              <p className="lk-empty-text">
                Buat menu baru dengan jenis Link di Pengaturan Menu terlebih dahulu agar halaman ini bisa menampung URL tujuan.
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-content">
      {/* ---------- HEADING + AKSI ---------- */}
      <div className="lk-header">
        <div className="lk-heading">
          <h1>Kelola Link Menu</h1>
          <p>Atur tautan (URL) tujuan untuk setiap menu Link yang sudah dibuat di Pengaturan Menu.</p>
        </div>

        <div className="lk-header-actions">
          <button className="lk-btn-batal" onClick={() => navigate('/admin/pengaturan-menu')}>
            Kembali
          </button>
          <button className="lk-btn-simpan" onClick={handleSimpan} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* ---------- CARD DAFTAR LINK MENU ---------- */}
      <section className="lk-card">
        <div className="lk-card-header">
          <div className="lk-card-title">
            <i className="fa-solid fa-link"></i>
            <span>Tautan Menu</span>
          </div>
          <span className="lk-card-hint">Isi link tujuan untuk masing-masing menu</span>
        </div>

        <div className="lk-list">
          {rows.map((row) => (
            <div
              className={`lk-row ${row.level === 1 ? 'lk-row-sub' : ''} ${
                row.id === focusId ? 'lk-row-highlight' : ''
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
                placeholder="https://bpmplampung.go.id/..."
                onChange={(e) => updateLink(row.id, e.target.value)}
                ref={(el) => (inputRefs.current[row.id] = el)}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Link;
