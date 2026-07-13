import React, { useEffect, useState, useRef } from 'react';
import './Navbar.css';
import { Link, useLocation } from 'react-router-dom';

import Logo from "../../assets/source/Logo.png";
import Dropdown from "../../assets/source/Dropdown.png";
import IconTextToSpeech from "../../assets/source/Ikon-TextToSpeech.png";
import Profile from "../../assets/source/WOWOK.jpg";
import { useTTS } from "../../context/TTSContext";
import Mitra5 from '../../assets/source/Mitra (5).png';



const Navbar = ({ lenisRef }) => {
  const { isActive, toggle } = useTTS();
  const location = useLocation(); // Hook untuk mendapatkan info URL saat ini

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- STATE BARU: Mengendalikan Dropdown Aktif (onClick) ---
  const [activeDropdown, setActiveDropdown] = useState(null);

  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const overlayRef = useRef(null);

  const handleSearchToggle = (e) => {
    e.preventDefault();
    setIsSearchActive(!isSearchActive);
  };

  // --- FUNGSI BARU: Klik Dropdown Menu ---
  const handleDropdownClick = (e, menuName) => {
    e.preventDefault();
    // Jika menu yang sama diklik, tutup. Jika menu lain, buka yang baru.
    setActiveDropdown(activeDropdown === menuName ? null : menuName);
  };

  // Fungsi Toggle Hamburger
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Jika hamburger ditutup, pastikan semua sub-menu juga ikut tertutup
    if (isMobileMenuOpen) setActiveDropdown(null);
  };

  // Efek Klik di Luar untuk Search
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

  // Efek Klik di Luar untuk Dropdown Mobile
  useEffect(() => {
    if (!activeDropdown) return;
    const handleClickOutsideDropdown = (event) => {
      // Jika klik terjadi di luar area navbar, tutup dropdown
      if (!event.target.closest('.main-navbar')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideDropdown);
    return () => document.removeEventListener('mousedown', handleClickOutsideDropdown);
  }, [activeDropdown]);

  // EFEK BARU: Mengunci scroll body dan mengisolasi scroll sidebar saat menu mobile terbuka
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const overlay = overlayRef.current;

    // Handler untuk mengizinkan scroll native di dalam sidebar dengan menghentikan
    // event agar tidak "bocor" dan ditangkap oleh Lenis.
    const handleWheelSidebar = (e) => {
      e.stopPropagation();
    };

    // Handler untuk memblokir total scroll saat kursor berada di atas overlay.
    const handleWheelOverlay = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (isMobileMenuOpen) {
      document.body.classList.add('body-no-scroll');
      if (sidebar) sidebar.addEventListener('wheel', handleWheelSidebar);
      if (overlay) overlay.addEventListener('wheel', handleWheelOverlay);
    } else {
      document.body.classList.remove('body-no-scroll');
    }

    // Cleanup: Hapus semua listener dan class saat komponen unmount atau state berubah.
    return () => {
      document.body.classList.remove('body-no-scroll');
      if (sidebar) sidebar.removeEventListener('wheel', handleWheelSidebar);
      if (overlay) overlay.removeEventListener('wheel', handleWheelOverlay);
    };
  }, [isMobileMenuOpen]); // Efek ini bergantung pada status buka/tutup menu.

  // EFEK BARU: Logika selector yang sadar akan perubahan rute (URL)
  useEffect(() => {
    // --- Bagian Setup ---
    const navbar = document.querySelector('.main-navbar');
    const selector = document.querySelector('.nav-selector');
    const allLinks = document.querySelectorAll('.main-navbar [data-path-group]');

    if (!navbar || !selector || allLinks.length === 0) return;

    const moveSelector = (targetElement) => {
      // Sembunyikan selector jika tidak ada target atau di layar mobile
      if (!targetElement || window.innerWidth <= 1277) {
        selector.style.opacity = '0';
        return;
      };

      const targetRect = targetElement.getBoundingClientRect();
      const navbarRect = navbar.getBoundingClientRect();
      const leftPos = targetRect.left - navbarRect.left;
      const topPos = targetRect.top - navbarRect.top;

      selector.style.opacity = '1';
      selector.style.width = `${targetRect.width}px`;
      selector.style.height = `${targetRect.height}px`;
      selector.style.transform = `translate(${leftPos}px, ${topPos}px)`;
    };

    // --- Bagian Logika Inti ---

    // 1. Temukan link aktif sebelumnya SEBELUM mengubah kelas apa pun
    const prevActiveLink = document.querySelector('.nav-link.active');

    // 2. Hapus semua kelas 'active' untuk reset
    allLinks.forEach(link => link.classList.remove('active'));

    // 3. Tentukan link mana yang harus aktif berdasarkan URL saat ini
    let newActiveLink = null;
    if (location.pathname === '/') {
      newActiveLink = document.querySelector('[data-path-group="beranda"]');
    } else if (location.pathname.startsWith('/profil/')) {
      newActiveLink = document.querySelector('[data-path-group="profil"]');
    } // Tambahkan else if untuk grup lain di sini (e.g., /rb/, /kinerja/)

    // 4. Jika link aktif baru ditemukan, jalankan logika pergerakan
    if (newActiveLink) {
      newActiveLink.classList.add('active');

      // Jika tidak ada link aktif sebelumnya (beban halaman pertama),
      // posisikan selector secara instan tanpa animasi dari kiri.
      if (!prevActiveLink) {
        selector.classList.add('no-transition');
        moveSelector(newActiveLink);
        requestAnimationFrame(() => {
          selector.classList.remove('no-transition');
        });
      } else {
        // Jika ada, biarkan transisi CSS normal yang menangani pergerakan
        moveSelector(newActiveLink);
      }
    }

    // Handler untuk menyesuaikan posisi selector saat ukuran window berubah
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const currentActive = document.querySelector('.nav-link.active');
        if (currentActive) moveSelector(currentActive);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [location.pathname]); // KUNCI: Efek ini berjalan setiap kali URL berubah

  return (
    <header className="unified-header">
      <div className="header-top">
        <div className="header-menu">
          <button
            className="hamburger-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle Menu"
          >
            <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>

          <div className="header-logo">
            <div className="logo-container">
              <img src={Logo} alt="Logo Kemendikdasmen BPMP Lampung" className="main-logo" />
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className={`search-wrapper ${isSearchActive ? 'active' : ''}`} ref={searchWrapperRef}>
            <input type="text" className="search-input" placeholder="Cari informasi..." ref={searchInputRef} />
            <button className="search-trigger" aria-label="Pencarian" onClick={handleSearchToggle}>
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>
          <button className={`btn-voice ${isActive ? 'active' : ''}`} aria-label={isActive ? "Matikan Suara" : "Tulisan Ke Suara"} onClick={toggle}>
            <span className="voice-text">{isActive ? "Suara Aktif" : "Tulisan Ke Suara"}</span>
            <img src={IconTextToSpeech} alt="" />
          </button>
        </div>
      </div>

      <div
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        ref={overlayRef}
        onClick={toggleMobileMenu}
      ></div>

      <nav ref={sidebarRef} className={`main-navbar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-selector"></div>

        {/* Tombol untuk menutup menu pada tampilan mobile */}
        <div className="mobile-nav-header">
          <button onClick={toggleMobileMenu} className="mobile-nav-close-btn">
            <i className="fa-solid fa-arrow-left"></i>
            <span>Kembali</span>
          </button>
        </div>

        <Link to="/" className="nav-link" data-path-group="beranda" onClick={toggleMobileMenu}>Beranda</Link>

        {/* --- IMPLEMENTASI KELAS 'dropdown-open' & ONCLICK --- */}
        <div className={`nav-item has-dropdown ${activeDropdown === 'profil' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" data-path-group="profil" onClick={(e) => handleDropdownClick(e, 'profil')}>
            Profil <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#" onClick={toggleMobileMenu}>Sejarah</a>
            <Link to="/profil/visi-misi" onClick={toggleMobileMenu}>Visi & Misi</Link>
            <a href="#" onClick={toggleMobileMenu}>Tugas & Fungsi</a>
            <a href="#" onClick={toggleMobileMenu}>Struktur Organisasi</a>
            <a href="#" onClick={toggleMobileMenu}>Pejabat</a>
            <a href="#" onClick={toggleMobileMenu}>Informasi Pegawai</a>
            <a href="#" onClick={toggleMobileMenu}>Sarana dan Prasarana</a>
          </div>
        </div>

        <div className={`nav-item has-dropdown ${activeDropdown === 'rb' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" data-path-group="rb" onClick={(e) => handleDropdownClick(e, 'rb')}>
            Reformasi Birokrasi <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#" onClick={toggleMobileMenu}>Manajemen Perubahan</a>
            <a href="#" onClick={toggleMobileMenu}>Penataan Tata Laksana</a>
            <a href="#" onClick={toggleMobileMenu}>Penataan Manajemen SDM</a>
            <a href="#" onClick={toggleMobileMenu}>Penguatan Akuntabilitas</a>
            <a href="#" onClick={toggleMobileMenu}>Penguatan Pengawasan</a>
            <a href="#" onClick={toggleMobileMenu}>Peningkatan Kualitas Pelayanan Publik</a>
            <a href="#" onClick={toggleMobileMenu}>Aktivitas RBI</a>
          </div>
        </div>

        <div className={`nav-item has-dropdown ${activeDropdown === 'kinerja' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" data-path-group="kinerja" onClick={(e) => handleDropdownClick(e, 'kinerja')}>
            Dok. Kinerja <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#" onClick={toggleMobileMenu}>Perjanjian Kinerja</a>
            <a href="#" onClick={toggleMobileMenu}>Renstra</a>
            <a href="#" onClick={toggleMobileMenu}>Lakin 2024</a>
            <a href="#" onClick={toggleMobileMenu}>Lakin 2025</a>
          </div>
        </div>

        <div className={`nav-item has-dropdown ${activeDropdown === 'pelayanan' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" data-path-group="pelayanan" onClick={(e) => handleDropdownClick(e, 'pelayanan')}>
            Pelayanan <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#" onClick={toggleMobileMenu}>Maklumat Pelayanan</a>
            <a href="#" onClick={toggleMobileMenu}>Standar Pelayanan</a>
            <a href="#" onClick={toggleMobileMenu}>Unit Layanan Terpadu</a>
            <a href="#" onClick={toggleMobileMenu}>Hasil Survey SKM</a>
            <a href="#" onClick={toggleMobileMenu}>Layanan Inovatif</a>
            <a href="#" onClick={toggleMobileMenu}>Peminjaman Sarana dan Prasarana</a>
          </div>
        </div>

        <div className={`nav-item has-dropdown ${activeDropdown === 'program' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" data-path-group="program" onClick={(e) => handleDropdownClick(e, 'program')}>
            Program <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#" onClick={toggleMobileMenu}>Digitalisasi Pembelajaran</a>
            <a href="#" onClick={toggleMobileMenu}>Wajar 13 Tahun</a>
            <a href="#" onClick={toggleMobileMenu}>Revitalisasi Sekolah</a>
            <a href="#" onClick={toggleMobileMenu}>SPMB</a>
            <a href="#" onClick={toggleMobileMenu}>Penguatan Karakter</a>
            <a href="#" onClick={toggleMobileMenu}>Makan Bergizi Gratis</a>
            <a href="#" onClick={toggleMobileMenu}>Pembelajaran dan Penilaian</a>
            <a href="#" onClick={toggleMobileMenu}>Penjaminan Mutu</a>
          </div>
        </div>

        <a href="#" className="nav-link" data-path-group="ppid" onClick={toggleMobileMenu}>PPID</a>
        <a href="#" className="nav-link" data-path-group="sipers" onClick={toggleMobileMenu}>Sipers</a>
        <a href="#" className="nav-link" data-path-group="spab" onClick={toggleMobileMenu}>SPAB</a>

        <div className={`nav-item has-dropdown ${activeDropdown === 'pengaduan' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" data-path-group="pengaduan" onClick={(e) => handleDropdownClick(e, 'pengaduan')}>
            Pengaduan <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#" onClick={toggleMobileMenu}>WBS</a>
            <a href="#" onClick={toggleMobileMenu}>SP4N Lapor</a>
            <a href="#" onClick={toggleMobileMenu}>Lapor Gratifikasi</a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
