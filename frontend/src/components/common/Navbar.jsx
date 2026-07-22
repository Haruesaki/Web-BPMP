import { useEffect, useState, useRef } from 'react';
import './Navbar.css';
import { Link, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

import Dropdown from "../../assets/source/Dropdown.png";
import IconTextToSpeech from "../../assets/source/Ikon-TextToSpeech.png";
import { useTTS } from "../../context/TTSContext";

// --- DATA NAVIGASI (CMS-READY) ---
// Beranda akan selalu dimasukkan secara manual sebagai elemen pertama

const Navbar = () => {
  const [navData, setNavData] = useState([
    { id: 'beranda', title: 'Beranda', path: '/', type: 'link', dataPath: 'beranda' }
  ]);
  const { isActive, toggle } = useTTS();
  const location = useLocation(); // Hook untuk mendapatkan info URL saat ini

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeDesktopDropdown, setActiveDesktopDropdown] = useState(null);
  const [headerLogoUrl, setHeaderLogoUrl] = useState(null);

  // --- STATE BARU: Untuk panel submenu di Tampilan Tablet ---
  const [isSubmenuPanelOpen, setIsSubmenuPanelOpen] = useState(false);
  const [submenuPanelContent, setSubmenuPanelContent] = useState({ title: '', items: [] });
  const [submenuPanelPosition, setSubmenuPanelPosition] = useState({ top: 0 });
  const [submenuPanelKey, setSubmenuPanelKey] = useState(0); // Kunci untuk re-animasi

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadHeaderLogo = async () => {
      try {
        const response = await axiosInstance.get('/api/beranda/header');
        const logoUrl = response.data?.data?.url_logo_header || null;
        if (isMounted) setHeaderLogoUrl(logoUrl);
      } catch (error) {
        console.error('Gagal mengambil logo header:', error);
      }
    };

    const fetchMenus = async () => {
      try {
        const response = await axiosInstance.get('/api/menus');
        if (isMounted) {
          const rawMenus = response.data || [];
          
          // Pisahkan menu utama (induk_id == null) dan submenu
          const mainMenus = rawMenus.filter(m => !m.induk_id && m.is_aktif).sort((a, b) => a.urutan_tampil - b.urutan_tampil);
          const subMenus = rawMenus.filter(m => m.induk_id && m.is_aktif).sort((a, b) => a.urutan_tampil - b.urutan_tampil);
          
          const dynamicMenus = mainMenus.map(menu => {
            const children = subMenus.filter(sub => sub.induk_id === menu.id);
            const isDropdown = children.length > 0;
            
            // Format rute berdasar jenis
            const getPath = (item) => {
              if (item.jenis_menu === 'link') return item.slug_atau_tautan || '#';
              return `/halaman/${item.id}`;
            };

            return {
              id: menu.id.toString(),
              title: menu.nama_menu,
              path: isDropdown ? '#' : getPath(menu),
              type: isDropdown ? 'dropdown' : 'link',
              dataPath: menu.id.toString(),
              submenu: isDropdown ? children.map(sub => ({
                title: sub.nama_menu,
                path: getPath(sub)
              })) : undefined
            };
          });

          setNavData([
            { id: 'beranda', title: 'Beranda', path: '/', type: 'link', dataPath: 'beranda' },
            ...dynamicMenus
          ]);
        }
      } catch (error) {
        console.error("Gagal mengambil menu navigasi:", error);
      }
    };

    loadHeaderLogo();
    fetchMenus();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchToggle = (e) => {
    if (e) e.preventDefault();
    setIsSearchActive(!isSearchActive);
    if (!isSearchActive && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 300);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearchInput = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    
    if (val.trim().length === 0) {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);
    try {
      const res = await axiosInstance.get(`/api/search?q=${encodeURIComponent(val)}`);
      console.log('Search API Response:', res.data);
      setSearchResults(res.data.data || []);
      setSearchError(null);
    } catch (err) {
      console.error('Search error', err);
      setSearchError(err.message || 'Error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  // --- FUNGSI BARU: Mengendalikan hover dropdown di desktop ---
  const handleMouseEnter = (menuName) => {
    if (window.innerWidth > 1290) {
      setActiveDesktopDropdown(menuName);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth > 1290) {
      setActiveDesktopDropdown(null);
    }
  };

  // --- FUNGSI BARU: Menutup menu setelah link di-klik ---
  const handleLinkClick = () => {
    setActiveDesktopDropdown(null);
    setIsSubmenuPanelOpen(false); // Tutup panel tablet
    if (isMobileMenuOpen) toggleMobileMenu();
  };

  // --- FUNGSI BARU: Menutup panel submenu tablet secara bersih ---
  const handleCloseSubmenuPanel = () => {
    setIsSubmenuPanelOpen(false);
    setActiveDropdown(null); // KUNCI: Reset juga menu yang aktif
  };

  // --- FUNGSI REVISI: Menggunakan 'key' untuk re-animasi yang andal ---
  const handleDropdownClick = (e, menu) => {
    e.preventDefault();
    // Abaikan jika di desktop, karena desktop pakai hover
    if (window.innerWidth > 1290) return;

    // Kasus 1: Klik menu yang sama yang sedang terbuka untuk menutupnya.
    if (activeDropdown === menu.id && isSubmenuPanelOpen) {
      handleCloseSubmenuPanel();
      return;
    }

    // Kasus 2: Klik menu baru (atau menu yang sama tapi panelnya tertutup).
    // Ini akan selalu memicu re-render dan re-animasi.
    const targetElement = e.currentTarget;
    const rect = targetElement.getBoundingClientRect();

    // 1. Update konten dan posisi untuk menu baru.
    setActiveDropdown(menu.id);
    setSubmenuPanelContent({ title: menu.title, items: menu.submenu || [] });
    setSubmenuPanelPosition({ top: rect.top });

    // 2. Pastikan panel dianggap 'tertutup' sebelum kita mengganti kuncinya.
    setIsSubmenuPanelOpen(false);

    // 3. Ganti kunci untuk memaksa React me-remount panel, yang akan memicu useEffect.
    setSubmenuPanelKey(prevKey => prevKey + 1);
  };

  // Fungsi Toggle Hamburger
  const toggleMobileMenu = () => {
    const nextState = !isMobileMenuOpen;
    setIsMobileMenuOpen(nextState);
    // Jika menu ditutup, pastikan semua sub-panel/dropdown ikut tertutup
    if (!nextState) {
      setActiveDropdown(null);
      setIsSubmenuPanelOpen(false);
    }
  };

  // Efek Klik di Luar untuk Search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchActive(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchActive]);

  // EFEK BARU: Memicu animasi buka panel setelah di-remount oleh 'key'
  useEffect(() => {
    // Jika tidak ada konten, jangan lakukan apa-apa.
    if (submenuPanelContent.items.length === 0 && activeDropdown === null) return;

    // Setelah komponen dengan key baru di-mount, tunggu sebentar lalu
    // set state 'open' menjadi true untuk memicu transisi CSS.
    const timer = setTimeout(() => {
      setIsSubmenuPanelOpen(true);
    }, 10); // Delay singkat untuk memastikan DOM sudah siap.

    return () => clearTimeout(timer);
  }, [submenuPanelKey]); // Hanya berjalan saat 'key' berubah.

  // REVISI: Logika "Klik di Luar" yang lebih cerdas dan terfokus untuk panel submenu
  useEffect(() => {
    // Hanya jalankan jika panel benar-benar terbuka.
    if (!isSubmenuPanelOpen) return;

    const handleClickOutside = (event) => {
      // Cek apakah klik terjadi di luar panel DAN di luar pemicu dropdown.
      // Ini mencegah panel tertutup jika pengguna mengklik pemicu lain.
      if (!event.target.closest('.tablet-submenu-panel') && !event.target.closest('.nav-item.has-dropdown > .nav-link')) {
        handleCloseSubmenuPanel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSubmenuPanelOpen]); // Efek ini hanya bergantung pada state panel.

  // EFEK BARU: Menjaga posisi panel submenu tetap sinkron saat window di-resize
  useEffect(() => {
    // Hanya jalankan jika panel terbuka
    if (!isSubmenuPanelOpen) return;

    let animationFrameId = null;
    const updatePanelPosition = () => {
      // Pastikan ada menu dropdown yang aktif untuk dicari
      if (!activeDropdown) return;
      
      // Temukan elemen menu induk yang sedang aktif di dalam sidebar
      const parentMenuItem = document.querySelector(`.nav-link[data-path-group="${activeDropdown}"]`);
      
      if (parentMenuItem) {
        const rect = parentMenuItem.getBoundingClientRect();
        // Update state posisi 'top' dari panel agar selalu sejajar
        setSubmenuPanelPosition({ top: rect.top });
      }
    };

    // REVISI: Gunakan requestAnimationFrame untuk update posisi yang sangat mulus.
    const handleResize = () => {
      // KUNCI PERBAIKAN: Jika layar membesar ke mode desktop, tutup panel secara otomatis.
      if (window.innerWidth > 1290) {
        handleCloseSubmenuPanel();
        // Hentikan eksekusi lebih lanjut karena panel sudah tidak relevan.
        return;
      }

      // Batalkan frame sebelumnya jika ada untuk mencegah penumpukan.
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      // Jadwalkan update posisi pada frame animasi berikutnya.
      animationFrameId = requestAnimationFrame(updatePanelPosition);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function untuk menghapus listener saat komponen unmount atau panel tertutup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isSubmenuPanelOpen, activeDropdown]); // Jalankan efek ini saat panel terbuka atau menu aktif berubah

  // EFEK BARU: Menutup sidebar/topbar secara otomatis saat resize ke desktop
  useEffect(() => {
    // Hanya jalankan jika menu mobile sedang terbuka
    if (!isMobileMenuOpen) return;

    const handleResize = () => {
      // Jika lebar layar melebihi breakpoint mobile/tablet, tutup menu
      if (window.innerWidth > 1290) {
        // Memanggil toggleMobileMenu akan menutup menu karena isMobileMenuOpen saat ini true
        toggleMobileMenu();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup: Hapus listener saat komponen unmount atau menu ditutup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]); // Efek ini hanya bergantung pada status buka/tutup menu mobile

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
      if (!targetElement || window.innerWidth <= 1290) {
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
    const currentPath = location.pathname;

    const activeNav = navData.find(item => {
      if (item.path === currentPath) return true;
      if (item.submenu) {
        return item.submenu.some(sub => sub.path === currentPath);
      }
      return false;
    });

    if (activeNav) {
      newActiveLink = document.querySelector(`[data-path-group="${activeNav.dataPath}"]`);
    }

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

  }, [location.pathname, navData]); // KUNCI: Efek ini berjalan setiap kali URL atau menu dinamis berubah

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
            {headerLogoUrl && (
              <div className="logo-container">
                <img src={headerLogoUrl} alt="Logo Kemendikdasmen BPMP Lampung" className="main-logo" />
              </div>
            )}
          </div>
        </div>

        <div className="header-actions">
          <div className="search-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }} ref={searchContainerRef}>
            <div className={`search-wrapper ${isSearchActive ? 'active' : ''}`}>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Cari informasi..." 
                ref={searchInputRef} 
                value={searchQuery}
                onChange={handleSearchInput}
                onFocus={() => { if (searchQuery.trim().length > 0) setShowSuggestions(true); }}
              />
              <button className="search-trigger" aria-label="Pencarian" onClick={handleSearchToggle}>
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>

            {/* DROPDOWN SEARCH SUGGESTIONS */}
            {showSuggestions && (
              <div 
                className="search-suggestions-dropdown"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {searchError ? (
                  <div className="search-suggestion-item empty" style={{ color: 'red' }}>Error: {searchError}</div>
                ) : isSearching ? (
                  <div className="search-suggestion-item loading">Mencari...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <Link 
                      key={idx} 
                      to={result.path} 
                      className="search-suggestion-item" 
                      onClick={() => {
                        setIsSearchActive(false);
                        setShowSuggestions(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      <div className="search-suggestion-title">{result.title}</div>
                      <div className="search-suggestion-meta">
                        <span className="search-suggestion-type">{result.type}</span>
                        {result.location && (
                          <span className="search-suggestion-location">{result.location}</span>
                        )}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="search-suggestion-item empty">
                    Pencarian tidak ditemukan.
                  </div>
                )}
              </div>
            )}
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

      {/* PANEL SUBMENU BARU UNTUK TAMPILAN TABLET */}
      <div
        className={`tablet-submenu-panel ${isSubmenuPanelOpen ? 'open' : ''}`}
        key={submenuPanelKey} // KUNCI: Menggunakan key untuk me-remount & re-animasi
        style={{ top: `${submenuPanelPosition.top}px` }}
      >
        <div className="tablet-submenu-header">
          <button onClick={handleCloseSubmenuPanel} className="tablet-submenu-back-btn">
            <i className="fa-solid fa-chevron-left"></i>
            <span>{submenuPanelContent.title}</span>
          </button>
        </div>
        <div className="tablet-submenu-list">
          {submenuPanelContent.items.map((item, index) => {
            const isExternal = item.path.startsWith('http');
            if (isExternal) {
              return <a key={index} href={item.path} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>{item.title}</a>;
            }
            return <Link key={index} to={item.path} onClick={handleLinkClick}>{item.title}</Link>;
          })}
        </div>
      </div>

      <nav ref={sidebarRef} className={`main-navbar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-selector"></div>

        {/* Tombol untuk menutup menu pada tampilan mobile */}
        <div className="mobile-nav-header">
          <button onClick={toggleMobileMenu} className="mobile-nav-close-btn">
            <i className="fa-solid fa-arrow-left"></i>
            <span>Kembali</span>
          </button>
        </div>

        {/* RENDER MENU SECARA DINAMIS DARI navData */}
        {navData.map(item => {
          if (item.type === 'link') {
            const isExternal = item.path.startsWith('http');
            if (isExternal) {
              return (
                <a key={item.id} href={item.path} target="_blank" rel="noopener noreferrer" className="nav-link" data-path-group={item.dataPath} onClick={handleLinkClick}>
                  {item.title}
                </a>
              );
            }
            return (
              <Link key={item.id} to={item.path} className="nav-link" data-path-group={item.dataPath} onClick={handleLinkClick}>
                {item.title}
              </Link>
            );
          }
          if (item.type === 'dropdown') {
            return (
              <div
                key={item.id}
                className={`nav-item has-dropdown ${activeDropdown === item.id ? 'dropdown-open' : ''} ${activeDesktopDropdown === item.id ? 'desktop-dropdown-open' : ''}`}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                <a href={item.path} className="nav-link" data-path-group={item.dataPath} onClick={(e) => handleDropdownClick(e, item)}>
                  {item.title} <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
                </a>
                <div className="dropdown-menu">
                  {item.submenu.map((subItem, index) => {
                    const isExternal = subItem.path.startsWith('http');
                    if (isExternal) {
                      return <a key={index} href={subItem.path} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick}>{subItem.title}</a>;
                    }
                    return <Link key={index} to={subItem.path} onClick={handleLinkClick}>{subItem.title}</Link>;
                  })}
                </div>
              </div>
            );
          }
          return null;
        })}
      </nav>
    </header>
  );
};

export default Navbar;
