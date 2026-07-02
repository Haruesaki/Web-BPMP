import React, { useEffect, useState, useRef } from 'react';
import './Navbar.css';

import Logo from "../../assets/source/Logo.png";
import Dropdown from "../../assets/source/Dropdown.png";
import IconTextToSpeech from "../../assets/source/Ikon-TextToSpeech.png";
import Gedung from "../../assets/source/Section-Landing.png";
import Profile from "../../assets/source/WOWOK.jpg";
import { useTTS } from "../../context/TTSContext";



const Navbar = ({ lenisRef }) => {
  const { isActive, toggle } = useTTS();

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- STATE BARU: Mengendalikan Dropdown Aktif (onClick) ---
  const [activeDropdown, setActiveDropdown] = useState(null);

  const searchWrapperRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Efek Menutup Dropdown saat di-Scroll
  useEffect(() => {
    if (!activeDropdown) return;
    const lenis = lenisRef?.current;
    const handleScroll = () => setActiveDropdown(null);

    if (lenis) {
      lenis.on('scroll', handleScroll, { passive: true });
      return () => lenis.off('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeDropdown, lenisRef]);

  // Logika Smooth Selector Animasi
  useEffect(() => {
    const navbar = document.querySelector('.main-navbar');
    const selector = document.querySelector('.nav-selector');
    const navLinks = document.querySelectorAll('.main-navbar > .nav-link, .main-navbar .nav-item > .nav-link');

    if (navbar && selector) {
      function moveSelector(targetElement) {
        if (window.innerWidth <= 1277) return;

        const targetRect = targetElement.getBoundingClientRect();
        const navbarRect = navbar.getBoundingClientRect();
        const leftPos = targetRect.left - navbarRect.left;
        const topPos = targetRect.top - navbarRect.top;

        selector.style.width = `${targetRect.width}px`;
        selector.style.height = `${targetRect.height}px`;
        selector.style.transform = `translate(${leftPos}px, ${topPos}px)`;
      }

      const initialActive = document.querySelector('.nav-link.active');
      if (initialActive) requestAnimationFrame(() => moveSelector(initialActive));

      navLinks.forEach((link) => {
        link.addEventListener('click', function () {
          navLinks.forEach((item) => item.classList.remove('active'));
          this.classList.add('active');
          moveSelector(this);

          if (!this.closest('.has-dropdown')) {
            setIsMobileMenuOpen(false);
            setActiveDropdown(null);
          }
        });
      });

      const dropdownLinks = document.querySelectorAll('.dropdown-menu a');
      dropdownLinks.forEach((subLink) => {
        subLink.addEventListener('click', function (e) {
          e.preventDefault();
          const parentNavItem = this.closest('.nav-item');
          if (parentNavItem) {
            const parentNavLink = parentNavItem.querySelector('.nav-link');
            if (parentNavLink) {
              navLinks.forEach((item) => item.classList.remove('active'));
              parentNavLink.classList.add('active');
              moveSelector(parentNavLink);
              setIsMobileMenuOpen(false);
              setActiveDropdown(null);
            }
          }
        });
      });

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const currentActive = document.querySelector('.nav-link.active');
          if (currentActive) moveSelector(currentActive);
        }, 100);
      });
    }
  }, []);

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
        onClick={toggleMobileMenu}
      ></div>

      <nav className={`main-navbar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-selector"></div>

        <a href="#" className="nav-link active">Beranda</a>

        {/* --- IMPLEMENTASI KELAS 'dropdown-open' & ONCLICK --- */}
        <div className={`nav-item has-dropdown ${activeDropdown === 'profil' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" onClick={(e) => handleDropdownClick(e, 'profil')}>
            Profil <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#">Sejarah</a>
            <a href="#">Visi & Misi</a>
            <a href="#">Tugas & Fungsi</a>
            <a href="#">Struktur Organisasi</a>
            <a href="#">Pejabat</a>
            <a href="#">Informasi Pegawai</a>
            <a href="#">Sarana dan Prasarana</a>
          </div>
        </div>

        <div className={`nav-item has-dropdown ${activeDropdown === 'rb' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" onClick={(e) => handleDropdownClick(e, 'rb')}>
            Reformasi Birokrasi <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#">Manajemen Perubahan</a>
            <a href="#">Penataan Tata Laksana</a>
            <a href="#">Penataan Manajemen SDM</a>
            <a href="#">Penguatan Akuntabilitas</a>
            <a href="#">Penguatan Pengawasan</a>
            <a href="#">Peningkatan Kualitas Pelayanan Publik</a>
            <a href="#">Aktivitas RBI</a>
          </div>
        </div>

        <div className={`nav-item has-dropdown ${activeDropdown === 'kinerja' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" onClick={(e) => handleDropdownClick(e, 'kinerja')}>
            Dok. Kinerja <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#">Perjanjian Kinerja</a>
            <a href="#">Renstra</a>
            <a href="#">Lakin 2024</a>
            <a href="#">Lakin 2025</a>
          </div>
        </div>

        <div className={`nav-item has-dropdown ${activeDropdown === 'pelayanan' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" onClick={(e) => handleDropdownClick(e, 'pelayanan')}>
            Pelayanan <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#">Maklumat Pelayanan</a>
            <a href="#">Standar Pelayanan</a>
            <a href="#">Unit Layanan Terpadu</a>
            <a href="#">Hasil Survey SKM</a>
            <a href="#">Layanan Inovatif</a>
            <a href="#">Peminjaman Sarana dan Prasarana</a>
          </div>
        </div>

        <div className={`nav-item has-dropdown ${activeDropdown === 'program' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" onClick={(e) => handleDropdownClick(e, 'program')}>
            Program <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#">Digitalisasi Pembelajaran</a>
            <a href="#">Wajar 13 Tahun</a>
            <a href="#">Revitalisasi Sekolah</a>
            <a href="#">SPMB</a>
            <a href="#">Penguatan Karakter</a>
            <a href="#">Makan Bergizi Gratis</a>
            <a href="#">Pembelajaran dan Penilaian</a>
            <a href="#">Penjaminan Mutu</a>
          </div>
        </div>

        <a href="#" className="nav-link">PPID</a>
        <a href="#" className="nav-link">Sipers</a>
        <a href="#" className="nav-link">SPAB</a>

        <div className={`nav-item has-dropdown ${activeDropdown === 'pengaduan' ? 'dropdown-open' : ''}`}>
          <a href="#" className="nav-link" onClick={(e) => handleDropdownClick(e, 'pengaduan')}>
            Pengaduan <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
          </a>
          <div className="dropdown-menu">
            <a href="#">WBS</a>
            <a href="#">SP4N Lapor</a>
            <a href="#">Lapor Gratifikasi</a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
