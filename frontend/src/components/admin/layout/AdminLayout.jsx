import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import '../../../pages/Admin/DashboardAdmin/dashboard-admin.css';

import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { useAuth } from '../../../hooks/useAuth';
import { LAYOUT_LABEL_TO_KEY } from '../LayoutPost/layoutMeta';

const AdminLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // --- STATE: MODAL TAMBAH MENU ---
  // (Sorotan menu aktif kini ditangani sendiri oleh AdminSidebar via URL.)
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

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
    { value: 'beranda', label: 'Menu utama', fa: 'fa-solid fa-table-cells-large' },
    { value: 'customize', label: 'Customize', fa: 'fa-solid fa-pen-to-square' },
    { value: 'pengaturan-menu', label: 'Preferensi', fa: 'fa-solid fa-sliders' },
    { value: 'berita', label: 'Dokumen', fa: 'fa-solid fa-file-lines' },
    { value: 'profil', label: 'Profil', fa: 'fa-solid fa-circle-user' },
    { value: 'reformasi-birokrasi', label: 'Institusi', fa: 'fa-solid fa-building-columns' },
    { value: 'pelayanan', label: 'Layanan', fa: 'fa-solid fa-hands-holding-circle' },
    { value: 'program', label: 'Agenda / Tugas', fa: 'fa-solid fa-calendar-check' },
    { value: 'ppid', label: 'informasi', fa: 'fa-solid fa-circle-info' },
    { value: 'spab', label: 'Privasi', fa: 'fa-solid fa-shield-halved' },
    { value: 'pengaduan', label: 'Pesan / Forum', fa: 'fa-solid fa-comments' },
    { value: 'manajemen', label: 'Daftar Pengguna', fa: 'fa-solid fa-users' },
    { value: 'setting', label: 'Pengaturan', fa: 'fa-solid fa-gear' },
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

  // --- HANDLER: Tutup modal & reset form ---
  const closeModal = () => {
    setIsMenuModalOpen(false);
    setIsIconDropdownOpen(false);
    setIsTypeDropdownOpen(false);
    setSelectedPostLayout('');
    setSelectedPostView('Vertikal');
    setMenuLink('');
  };

  const handleSaveMenu = () => {
    // TODO: simpan menu ke backend (POST /api/menus) → dapatkan slug/id.
    console.log({ menuName, selectedIcon, selectedType, selectedPostLayout, selectedPostView, menuLink });

    const nama = menuName;
    const isPost = selectedType === 'Post';
    const layoutKey = LAYOUT_LABEL_TO_KEY[selectedPostLayout] || 'default';
    const view = selectedPostView;

    closeModal();

    // Untuk menu bertipe Post → langsung buka editor konten sesuai layout.
    // `view` (Vertikal/Horizontal) dibawa untuk dipakai tampilan publik nanti.
    if (isPost) {
      navigate(`/admin/post/${layoutKey}`, { state: { menuName: nama, postView: view } });
    }
  };

  const selectedIconLabel = iconOptions.find((o) => o.value === selectedIcon)?.label;

  return (
    <div className="admin-layout">
      <AdminSidebar onTambahMenu={() => setIsMenuModalOpen(true)} />

      {/* ================= MAIN AREA ================= */}
      <div className="admin-main">
        <AdminHeader onLogout={() => {
          logout();
          navigate('/admin/login');
        }} />
        <Outlet />
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
