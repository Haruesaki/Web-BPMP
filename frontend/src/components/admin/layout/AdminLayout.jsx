import React, { useEffect, useState, useRef, Suspense, lazy } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import '../../../pages/Admin/DashboardAdmin/dashboard-admin.css';

import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useAuth } from '../../../hooks/useAuth';
import { LAYOUT_LABEL_TO_KEY } from '../LayoutPost/layoutMeta';
import axiosInstance from '../../../api/axiosInstance';
import { bacaSesi } from '../../../utils/sesiAdmin';

import DashboardAdmin from '../../../pages/Admin/DashboardAdmin/dashboard-admin';
import CustomizeBeranda from '../../../pages/Admin/CustomizeBeranda/CustomizeBeranda';
import PengaturanMenu from '../../../pages/Admin/PengaturanMenu/PengaturanMenu';
import ManajemenUser from '../../../pages/Admin/ManajemenUser/ManajemenUser';
import Link from '../LayoutLink/Link';
const MenuContentEditor = lazy(() => import('../LayoutPost/MenuContentEditor'));

const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Kita akan menggunakan <Outlet /> bawaan React Router untuk render konten.

  // --- STATE: MODAL TAMBAH MENU ---
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [refreshSidebarTrigger, setRefreshSidebarTrigger] = useState(0); // trigger untuk refresh sidebar
  const [formError, setFormError] = useState(''); // state untuk error message di form

  // --- STATE: DRAWER SIDEBAR (mobile) ---
  // Di HP sidebar bukan lagi panel yang mendorong konten, melainkan drawer yang
  // muncul saat tombol hamburger di header ditekan. Di desktop tidak dipakai
  // (sidebar selalu tampil; CSS mengabaikan class ini di >768px).
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tutup drawer otomatis setiap ganti halaman agar tidak "menyangkut" terbuka
  // setelah pengguna memilih menu.
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // --- 3. STATE: FORM TAMBAH MENU ---
  const [menuName, setMenuName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPostLayout, setSelectedPostLayout] = useState('');
  const [selectedPostView, setSelectedPostView] = useState('Vertikal'); // orientasi card berita di halaman user
  const [menuLink, setMenuLink] = useState(''); // diisi bila jenis menu = Link
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const iconDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);

  // --- 4. DATA: PILIHAN IKON DROPDOWN (FORM TAMBAH MENU) ---
  const iconOptions = [
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
  ];

  // --- 5. DATA: JENIS MENU ---
  const typeOptions = ['Post', 'Link'];
  const postLayoutOptions = ['Default', 'Profile Card', 'Berita Card'];
  const postViewOptions = ['Vertikal', 'Horizontal']; // orientasi tampilan card berita

  // --- EFFECT: Klik di luar dropdown form untuk menutup ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target)) {
        setIsIconDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- EFFECT: Listen to custom event for sidebar refresh ---
  useEffect(() => {
    const handleRefreshSidebar = () => {
      setRefreshSidebarTrigger(prev => prev + 1);
    };
    window.addEventListener('refreshSidebar', handleRefreshSidebar);
    return () => window.removeEventListener('refreshSidebar', handleRefreshSidebar);
  }, []);

  // --- HANDLER: Tutup modal & reset form ---
  const closeModal = () => {
    setIsMenuModalOpen(false);
    setIsIconDropdownOpen(false);
    setIsTypeDropdownOpen(false);
    setFormError('');
    setMenuName('');
    setSelectedIcon('');
    setSelectedType('');
    setSelectedPostLayout('');
    setSelectedPostView('Vertikal');
    setMenuLink('');
  };

  const handleSaveMenu = async () => {
    setFormError(''); // Reset error message
    // Validasi
    if (!menuName || !selectedIcon || !selectedType) {
      setFormError("Nama menu, ikon, dan jenis menu wajib diisi!");
      return;
    }

    try {
      const session = bacaSesi();
      const token = session?.token;

      // POST data ke backend menggunakan axiosInstance
      const res = await axiosInstance.post('/api/menus', {
        nama_menu: menuName,
        ikon_menu: selectedIcon,
        jenis_menu: selectedType.toLowerCase(), // post / link
        slug_atau_tautan: selectedType === 'Link' ? menuLink : (LAYOUT_LABEL_TO_KEY[selectedPostLayout] || 'default'),
        tampilan: selectedType === 'Link' ? null : selectedPostView
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 200 || res.status === 201) {
        setRefreshSidebarTrigger(prev => prev + 1); // trigger reload sidebar
        window.dispatchEvent(new Event('refreshSidebar')); // Beri tahu komponen lain (seperti PengaturanMenu)
        closeModal(); // tutup modal, TIDAK ADA redirect
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.pesan || "Terjadi kesalahan jaringan. Gagal menyimpan menu.";
      setFormError(errMsg);
    }
  };

  const selectedIconLabel = iconOptions.find((o) => o.value === selectedIcon)?.label;

  return (
    <div
      className={`admin-layout ${isSidebarOpen ? 'admin-sidebar-is-open' : ''}`}
      onClick={(e) => {
        // Tutup drawer saat menyentuh area gelap di luar drawer. Karena `zoom:0.7`
        // membuat backdrop `position:fixed` di-hit-test di belakang konten, tap di
        // area itu "jatuh" ke elemen root ini. e.target === e.currentTarget
        // memastikan hanya tap di area kosong (bukan drawer/konten) yang menutup.
        if (isSidebarOpen && e.target === e.currentTarget) setIsSidebarOpen(false);
      }}
    >
      <AdminSidebar
        onTambahMenu={() => setIsMenuModalOpen(true)}
        refreshTrigger={refreshSidebarTrigger}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* ================= MAIN AREA ================= */}
      <div className="admin-main">
        <AdminHeader
          onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
          onLogout={() => {
            logout();
            navigate('/admin/login');
          }} />
        <div key={location.pathname}>
          <Outlet />
        </div>
      </div>

      {/* ================= MODAL: TAMBAH MENU BARU ================= */}
      {isMenuModalOpen && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tambah Menu Baru</h3>
              <button className="modal-close" onClick={closeModal}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              {/* Notifikasi Error jika ada */}
              {formError && (
                <div style={{ color: '#ff4d4d', backgroundColor: '#331111', padding: '10px 14px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', border: '1px solid #ff4d4d', display: 'flex', alignItems: 'center' }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '10px', fontSize: '16px' }}></i>
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Menu */}
              <div className="form-group">
                <label>Nama Menu</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Masukkan nama menu..."
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                />
              </div>

              {/* Ikon Menu (dropdown custom) */}
              <div className="form-group" ref={iconDropdownRef}>
                <label>Ikon Menu</label>
                <button
                  className="form-select"
                  onClick={() => {
                    setIsIconDropdownOpen((v) => !v);
                    setIsTypeDropdownOpen(false);
                  }}
                >
                  <span className={selectedIcon ? '' : 'placeholder'}>
                    {selectedIconLabel || 'Pilih Ikon'}
                  </span>
                  <i className={`fa-solid fa-chevron-${isIconDropdownOpen ? 'up' : 'down'}`}></i>
                </button>

                {isIconDropdownOpen && (
                  <div className="form-dropdown">
                    {iconOptions.map((opt) => (
                      <button
                        key={opt.value}
                        className={`form-dropdown-item ${selectedIcon === opt.value ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedIcon(opt.value);
                          setIsIconDropdownOpen(false);
                        }}
                      >
                        <i className={opt.fa}></i>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Jenis Menu (dropdown custom) */}
              <div className="form-group" ref={typeDropdownRef}>
                <label>Jenis Menu</label>
                <button
                  className="form-select"
                  onClick={() => {
                    setIsTypeDropdownOpen((v) => !v);
                    setIsIconDropdownOpen(false);
                  }}
                >
                  <span className={selectedType ? '' : 'placeholder'}>
                    {selectedType || 'Pilih jenis menu...'}
                  </span>
                  <i className={`fa-solid fa-chevron-${isTypeDropdownOpen ? 'up' : 'down'}`}></i>
                </button>

                {isTypeDropdownOpen && (
                  <div className="form-dropdown">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt}
                        className={`form-dropdown-item ${selectedType === opt ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedType(opt);
                          setIsTypeDropdownOpen(false);
                        }}
                      >
                        <span>{opt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-pilihan Layout */}
              {selectedType === 'Post' && (
                <div className="form-group">
                  <label>Layout Post</label>
                  <div className="form-radio-group">
                    {postLayoutOptions.map((opt) => (
                      <label key={opt} className="form-radio-item">
                        <input
                          type="radio"
                          name="postLayout"
                          value={opt}
                          checked={selectedPostLayout === opt}
                          onChange={() => setSelectedPostLayout(opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-pilihan Tampilan Post: orientasi card berita di halaman user */}
              {selectedType === 'Post' && (
                <div className="form-group">
                  <label>Tampilan Post</label>
                  <div className="form-radio-group">
                    {postViewOptions.map((opt) => (
                      <label key={opt} className="form-radio-item">
                        <input
                          type="radio"
                          name="postView"
                          value={opt}
                          checked={selectedPostView === opt}
                          onChange={() => setSelectedPostView(opt)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Jika jenis menu = Link, tampilkan form isian URL */}
              {selectedType === 'Link' && (
                <div className="form-group">
                  <label>URL / Link Tujuan</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://contoh.com/halaman"
                    value={menuLink}
                    onChange={(e) => setMenuLink(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-batal" onClick={closeModal}>Batal</button>
              <button className="btn-simpan" onClick={handleSaveMenu}>Simpan Menu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
