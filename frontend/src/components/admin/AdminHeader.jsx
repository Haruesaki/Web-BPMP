import React, { useEffect, useState, useRef } from 'react';
import './AdminHeader.css';

// =========================================================================
//  ADMIN HEADER (Topbar) — dipakai berulang di semua halaman Admin.
//  -----------------------------------------------------------------------
//  Cara pakai di halaman lain:
//
//    import AdminHeader from '../../assets/component-admin/AdminHeader';
//
//    <AdminHeader
//      userEmail="bpmp_lampung@gmail.co.id"
//      userRole="Super Admin"
//      searchResults={searchResults}
//    />
//
//  searchResults bersifat opsional — kalau tidak dikirim, komponen akan
//  memakai data contoh (placeholder) supaya tetap bisa langsung dipakai.
//  Nantinya bagian ini tinggal disambungkan ke endpoint pencarian backend.
// =========================================================================

const defaultSearchResults = [
  { icon: 'fa-solid fa-newspaper', title: 'Update Kurikulum 2024', sub: 'Published in Berita' },
  { icon: 'fa-solid fa-file-lines', title: 'Laporan Keuangan Januari', sub: 'Document in Dokumen Kinerja' },
  { icon: 'fa-solid fa-circle-user', title: 'Profil Sekolah Dasar', sub: 'Page in Profil' },
];

const AdminHeader = ({
  userName = 'BPMP Lampung',
  userEmail = 'bpmp_lampung@gmail.co.id',
  userRole = 'Super Admin',
  searchResults = defaultSearchResults,
  onLogout,
}) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const profileRef = useRef(null);

  // --- EFFECT: Klik di luar search untuk menutup ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setIsSearchActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchActive]);

  // --- EFFECT: Klik di luar dropdown profil untuk menutup ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="admin-topbar">
      <div className="search-wrapper" ref={searchWrapperRef}>
        <div
          className={`search-box ${isSearchActive ? 'active' : ''}`}
          onClick={() => setIsSearchActive(true)}
        >
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search..."
            className="search-input"
          />
          <span className="search-shortcut">Ctrl + K</span>
        </div>

        {isSearchActive && (
          <div className="search-dropdown">
            <div className="search-dropdown-header">PENCARIAN TERBARU</div>
            {searchResults.map((r, i) => (
              <div key={i} className="search-result-item">
                <span className="search-result-icon">
                  <i className={r.icon}></i>
                </span>
                <div className="search-result-text">
                  <div className="search-result-title">{r.title}</div>
                  <div className="search-result-sub">{r.sub}</div>
                </div>
              </div>
            ))}
            <div className="search-dropdown-footer">Lihat semua hasil</div>
          </div>
        )}
      </div>

      <div className="topbar-profile" ref={profileRef}>
        <button
          type="button"
          className={`profile-trigger ${isProfileOpen ? 'active' : ''}`}
          onClick={() => setIsProfileOpen((prev) => !prev)}
        >
          <div className="profile-text">
            <div className="profile-email">{userEmail}</div>
            <div className="profile-role">{userRole}</div>
          </div>
          <div className="profile-avatar">
            <i className="fa-solid fa-user"></i>
          </div>
        </button>

        {isProfileOpen && (
          <div className="profile-dropdown">
            <div className="profile-dropdown-user">
              <span className="profile-dropdown-avatar">
                <i className="fa-solid fa-user"></i>
              </span>
              <div className="profile-dropdown-info">
                <div className="profile-dropdown-eyebrow">User</div>
                <div className="profile-dropdown-name">{userName}</div>
                <div className="profile-dropdown-email">{userEmail}</div>
              </div>
            </div>

            <button
              type="button"
              className="profile-dropdown-logout"
              onClick={() => {
                setIsProfileOpen(false);
                onLogout?.();
              }}
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
