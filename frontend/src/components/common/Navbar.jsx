import { useEffect, useState, useRef } from 'react';
import './Navbar.css';
import { Link, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

import Dropdown from "../../assets/source/Dropdown.png";
import IconTextToSpeech from "../../assets/source/Ikon-TextToSpeech.png";
import { useTTS } from "../../context/TTSContext";
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
  const [forceMobileView, setForceMobileView] = useState(false);

  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
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
          const mainMenus = rawMenus.filter(m => !m.induk_id && m.is_aktif).sort((a, b) => a.urutan_tampil - b.urutan_tampil);
          const subMenus = rawMenus.filter(m => m.induk_id && m.is_aktif).sort((a, b) => a.urutan_tampil - b.urutan_tampil);
          
          const dynamicMenus = mainMenus.map(menu => {
            const children = subMenus.filter(sub => sub.induk_id === menu.id);
            const isDropdown = children.length > 0;
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

  // Debounce effect untuk pencarian
  useEffect(() => {
    // Jika query kosong, langsung reset state tanpa delay
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    // Tampilkan dropdown dan status loading segera saat mulai mengetik
    setShowSuggestions(true);
    setIsSearching(true);

    const searchHandler = setTimeout(async () => {
      try {
        const res = await axiosInstance.get(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data.data || []);
        setSearchError(null);
      } catch (err) {
        console.error('Search error', err);
        setSearchError(err.message || 'Error occurred');
      } finally {
        setIsSearching(false);
      }
    }, 400); // Jeda 400ms sebelum request API

    return () => clearTimeout(searchHandler); // Bersihkan timeout jika user mengetik lagi
  }, [searchQuery]);

  const handleMouseEnter = (menuName) => {
    // Batalkan timer penutupan yang mungkin sedang berjalan.
    clearTimeout(leaveTimeoutRef.current);
    
    // Langsung atur menu yang aktif. Penundaan ada pada saat 'mouseleave',
    // bukan 'mouseenter'. Ini mencegah konflik saat berpindah antar menu.
    if (window.innerWidth > 1290 && !forceMobileView) {
      setActiveDesktopDropdown(menuName);
    }
  };

  const handleMouseLeave = () => {
    // Mulai timer untuk menutup panel. Jeda ini (grace period) memberi waktu
    // bagi kursor untuk pindah ke panel submenu sebelum menu tertutup.
    leaveTimeoutRef.current = setTimeout(() => {
      if (window.innerWidth > 1290 && !forceMobileView) {
        setActiveDesktopDropdown(null);
      }
    }, 200);
  };

  const handleDropdownScrollContain = (e) => {
    if (window.innerWidth > 1290) {
      e.stopPropagation();
    }
  };

  const handleLinkClick = () => {
    setActiveDesktopDropdown(null);
    if (isMobileMenuOpen) toggleMobileMenu();
  };

  const handleDropdownClick = (e, menu) => {
    e.preventDefault();
    // KUNCI: Klik untuk dropdown hanya aktif JIKA dalam mode mobile (baik karena lebar layar maupun wrap)
    if (window.innerWidth <= 1290 || forceMobileView) {
      setActiveDropdown(prevId => (prevId === menu.id ? null : menu.id));
    }
  };

  // Fungsi Toggle Hamburger
  const toggleMobileMenu = () => {
    const nextState = !isMobileMenuOpen;
    setIsMobileMenuOpen(nextState);
    if (!nextState) {
      setActiveDropdown(null);
    }
  };

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

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleResize = () => {
      if (window.innerWidth > 1290) {
        // Memanggil toggleMobileMenu akan menutup menu karena isMobileMenuOpen saat ini true
        toggleMobileMenu();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const overlay = overlayRef.current;

    const handleWheelOverlay = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    if (isMobileMenuOpen) {
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('body-no-scroll');
      if (overlay) overlay.addEventListener('wheel', handleWheelOverlay);
    } else {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('body-no-scroll');
    }

    return () => {
      document.documentElement.classList.remove('no-scroll');
      document.body.classList.remove('body-no-scroll');
      if (overlay) overlay.removeEventListener('wheel', handleWheelOverlay);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const navbar = document.querySelector('.main-navbar');
    const selector = document.querySelector('.nav-selector');
    const allLinks = document.querySelectorAll('.main-navbar [data-path-group]');

    if (!navbar || !selector || allLinks.length === 0) return;

    const moveSelector = (targetElement) => {
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

    const prevActiveLink = document.querySelector('.nav-link.active');

    allLinks.forEach(link => link.classList.remove('active'));

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

    if (newActiveLink) {
      newActiveLink.classList.add('active');

      if (!prevActiveLink) {
        selector.classList.add('no-transition');
        moveSelector(newActiveLink);
        requestAnimationFrame(() => {
          selector.classList.remove('no-transition');
        });
      } else {
        moveSelector(newActiveLink);
      }
    }

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

  }, [location.pathname, navData]);

  // KUNCI: Efek untuk mendeteksi "wrap" pada navigasi desktop dan memaksa tampilan mobile
  useEffect(() => {
    const navContainer = sidebarRef.current;
    // Jangan jalankan jika container belum ada atau menu belum terisi
    if (!navContainer || navData.length <= 1) return;

    const checkNavWrap = () => {
      const navContainer = sidebarRef.current;
      if (!navContainer) return;

      // Kondisi 1: Layar <= 1290px, selalu non-aktifkan mode paksa.
      if (window.innerWidth <= 1290) {
        if (forceMobileView) setForceMobileView(false);
        return;
      }

      // Kondisi 2: Layar > 1290px, lakukan kalkulasi lebar.
      const navItems = navContainer.querySelectorAll('.mobile-nav-content > .nav-link, .mobile-nav-content > .nav-item');
      
      if (navItems.length < 2) {
        if (forceMobileView) setForceMobileView(false);
        return;
      }

      const gap = parseFloat(getComputedStyle(navContainer).gap) || 16; // Fallback 16px
      let totalWidth = 0;
      navItems.forEach(item => {
        totalWidth += item.offsetWidth;
      });
      totalWidth += (navItems.length - 1) * gap;

      const containerWidth = navContainer.offsetWidth;
      const shouldWrap = totalWidth > (containerWidth - 50); // Toleransi 50px

      if (shouldWrap !== forceMobileView) {
        setForceMobileView(shouldWrap);
      }
    };

    let resizeTimer;
    const debouncedCheck = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(checkNavWrap, 150);
    };

    const initialCheckTimeout = setTimeout(checkNavWrap, 100);
    window.addEventListener('resize', debouncedCheck);

    return () => { window.removeEventListener('resize', debouncedCheck); clearTimeout(resizeTimer); clearTimeout(initialCheckTimeout); };
  }, [navData, forceMobileView]); // KUNCI: Jalankan ulang jika data menu atau state wrap berubah

  return (
    <header className={`unified-header ${forceMobileView ? 'force-mobile-view' : ''}`}>
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
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={() => { if (searchQuery.trim().length > 0) setShowSuggestions(true); }}
              />
              <button className="search-trigger" aria-label="Pencarian" onClick={handleSearchToggle}>
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </div>

            {showSuggestions && (
              <div 
                className="search-suggestions-dropdown"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {searchError ? (
                  <div className="search-suggestion-item empty" style={{ color: 'red' }}>Error: {searchError}</div>
                ) : isSearching ? (
                  // --- PERUBAHAN: Gunakan Skeleton Loading, bukan teks "Mencari..." ---
                  <>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="search-suggestion-item skeleton">
                        <div className="skeleton-title"></div>
                        <div className="skeleton-meta"></div>
                      </div>
                    ))}
                  </>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result, idx) => (
                    <Link 
                      key={idx} 
                      to={result.path} 
                      className="search-suggestion-item"
                      style={{ '--animation-delay': `${idx * 0.07}s` }}
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

      <nav ref={sidebarRef} className={`main-navbar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="nav-selector"></div>
        <div className="mobile-nav-header">
          <button onClick={toggleMobileMenu} className="mobile-nav-close-btn">
            <i className="fa-solid fa-arrow-left"></i>
            <span>Kembali</span>
          </button>
        </div>

        <div
          className="mobile-nav-content"
          data-lenis-prevent
        >
          {navData.map(item => {
            if (item.type === 'link') {
              const isExternal = item.path.startsWith('http');
              if (isExternal) {
                return (
                  <a key={item.id} href={item.path} target="_blank" rel="noopener noreferrer" className="nav-link" data-path-group={item.dataPath} onClick={handleLinkClick}>
                    <span>{item.title}</span>
                  </a>
                );
              }
              return (
                <Link key={item.id} to={item.path} className="nav-link" data-path-group={item.dataPath} onClick={handleLinkClick}>
                  <span>{item.title}</span>
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
                    <span>{item.title}</span> <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
                  </a>
                  <div
                    className="dropdown-menu"
                    data-lenis-prevent
                    onWheel={handleDropdownScrollContain}
                    onTouchMove={handleDropdownScrollContain}
                    onMouseEnter={() => handleMouseEnter(item.id)}
                  >
                    {item.submenu.map((subItem, index) => {
                      const isExternal = subItem.path.startsWith('http');
                      const animationStyle = {
                        '--animation-delay': `${index * 0.07}s`
                      };

                      if (isExternal) {
                        return <a key={index} href={subItem.path} target="_blank" rel="noopener noreferrer" onClick={handleLinkClick} style={animationStyle}><span>{subItem.title}</span></a>;
                      }
                      return <Link key={index} to={subItem.path} onClick={handleLinkClick} style={animationStyle}><span>{subItem.title}</span></Link>;
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
