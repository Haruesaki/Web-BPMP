import React, { useEffect, useState, useRef } from 'react';
import './dashboard-admin.css';

import AdminSidebar from '../../assets/component-admin/AdminSidebar';
import AdminHeader from '../../assets/component-admin/AdminHeader';

// =========================================================================
//  IMPORT ASSET IKON UNTUK DROPDOWN "PILIH IKON" (FORM TAMBAH MENU)
//  -----------------------------------------------------------------------
//  Taruh file ikon di:  src/assets/source/icons/
//  Lalu sesuaikan import di bawah ini dengan nama file Anda.
//  (Lihat penjelasan lengkap di balasan chat.)
//
//  Contoh — buang komentar bila file ikon sudah tersedia:
//  import IcDashboard from "../../assets/source/icons/dashboard.png";
//  import IcBerita    from "../../assets/source/icons/berita.png";
//  import IcProfil    from "../../assets/source/icons/profil.png";
//  import IcSetting   from "../../assets/source/icons/setting.png";
// =========================================================================

const DashboardAdmin = () => {
  // --- 1. STATE: MENU AKTIF (dipakai AdminSidebar) ---
  const [activeMenu, setActiveMenu] = useState('beranda');

  // --- 2. STATE: MODAL TAMBAH MENU ---
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  // --- 3. STATE: FORM TAMBAH MENU ---
  const [menuName, setMenuName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const iconDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);

  // --- 4. DATA: PILIHAN IKON DROPDOWN (FORM TAMBAH MENU) ---
  // Sesuai desain: Dashboard, Berita, Profil, Setting.
  // 'fa' = kelas Font Awesome (dipakai sekarang). Bila ingin pakai gambar,
  // ganti render-nya dengan <img src={item.img} /> dan isi field 'img'.
  const iconOptions = [
    { value: 'dashboard', label: 'Dashboard', fa: 'fa-solid fa-table-cells-large' },
    { value: 'berita', label: 'Berita', fa: 'fa-solid fa-newspaper' },
    { value: 'profil', label: 'Profil', fa: 'fa-solid fa-circle-user' },
    { value: 'setting', label: 'Setting', fa: 'fa-solid fa-gear' },
  ];

  // --- 5. DATA: JENIS MENU ---
  const typeOptions = ['Page', 'Post', 'Link', 'Form Jabatan'];

  // --- 6. DATA: STATISTIK PENGUNJUNG (chart) ---
  const chartData = [
    { day: 'Mon', value: 38 },
    { day: 'Tue', value: 70 },
    { day: 'Wed', value: 45 },
    { day: 'Thu', value: 88 },
    { day: 'Fri', value: 98, highlight: true },
    { day: 'Sat', value: 60 },
    { day: 'Sun', value: 22 },
  ];

  // --- 7. DATA: AKTIVITAS TERKINI ---
  const recentActivity = [
    { dot: 'grey', title: 'Berita "Update Kurikulum" published.', time: '2 hours ago' },
    { dot: 'orange', title: 'New document uploaded to ZIWBK-WBBM.', time: '5 hours ago' },
    { dot: 'grey', title: 'System backup completed successfully.', time: 'Yesterday, 11:00 PM' },
  ];

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
  };

  const handleSaveMenu = () => {
    // TODO: integrasi ke backend (POST /api/menu) sesuai struktur backend Anda.
    console.log({ menuName, selectedIcon, selectedType });
    closeModal();
  };

  const selectedIconLabel = iconOptions.find((o) => o.value === selectedIcon)?.label;

  return (
    <div className="admin-layout">
      <AdminSidebar
        activeMenu={activeMenu}
        onMenuClick={setActiveMenu}
        onTambahMenu={() => setIsMenuModalOpen(true)}
      />

      {/* ================= MAIN AREA ================= */}
      <div className="admin-main">
        <AdminHeader />

        {/* ---------- CONTENT ---------- */}
        <main className="admin-content">
          <div className="content-heading">
            <h2>SELAMAT DATANG! Admin BPMP Lampung</h2>
            <p>Dashboard Overview</p>
          </div>

          <div className="content-grid">
            {/* ----- CARD: STATISTIK PENGUNJUNG ----- */}
            <section className="card card-chart">
              <div className="card-chart-header">
                <div className="card-chart-title">
                  <span className="chart-title-icon"><i className="fa-solid fa-chart-simple"></i></span>
                  <div>
                    <h3>Statistik Pengunjung</h3>
                    <p>Visitor traffic analysis</p>
                  </div>
                </div>
                <div className="chart-filters">
                  <button className="chart-select">June <i className="fa-solid fa-chevron-down"></i></button>
                  <button className="chart-select">2026 <i className="fa-solid fa-chevron-down"></i></button>
                </div>
              </div>

              <div className="chart-area">
                <div className="chart-yaxis">
                  <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
                </div>
                <div className="chart-bars">
                  {chartData.map((d) => (
                    <div key={d.day} className="chart-bar-col">
                      <div className="chart-bar-track">
                        <div
                          className={`chart-bar ${d.highlight ? 'highlight' : ''}`}
                          style={{ height: `${d.value}%` }}
                        ></div>
                      </div>
                      <span className="chart-bar-label">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ----- CARD: AKTIVITAS TERKINI ----- */}
            <section className="card card-activity">
              <h3>Aktivitas Terkini</h3>
              <div className="activity-list">
                {recentActivity.map((a, i) => (
                  <div key={i} className="activity-item">
                    <span className={`activity-dot ${a.dot}`}></span>
                    <div className="activity-text">
                      <div className="activity-title">{a.title}</div>
                      <div className="activity-time">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ================= MODAL: TAMBAH MENU BARU ================= */}
      {isMenuModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
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
                        {/* Render ikon Font Awesome.
                            Untuk pakai gambar: ganti <i> dengan <img src={opt.img} className="dropdown-img" /> */}
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

export default DashboardAdmin;
