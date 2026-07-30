import { useEffect, useState, useRef } from 'react';
import './Navbar.css';
import { Link, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

import Dropdown from "../../assets/source/Dropdown.png";
import IconTextToSpeech from "../../assets/source/Ikon-TextToSpeech.png";
import { useTTS } from "../../context/TTSContext";
const Navbar = () => {
  // --- State Management & Refs ---
  // State untuk data navigasi, status TTS, dan info lokasi/URL
  const [navData, setNavData] = useState([
    { id: 'beranda', title: 'Beranda', path: '/', type: 'link', dataPath: 'beranda' }
  ]);
  const { isActive, toggle } = useTTS();
  const location = useLocation();

  // State untuk fungsionalitas pencarian
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState(null);
  
  // State untuk menu mobile dan dropdown
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeDesktopDropdown, setActiveDesktopDropdown] = useState(null);

  // State untuk data dinamis dari API dan UI responsif
  const [headerLogoUrl, setHeaderLogoUrl] = useState(null);

  // Refs untuk interaksi DOM dan manajemen timeout
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const leaveTimeoutRef = useRef(null);
  const overlayRef = useRef(null);
  const headerRef = useRef(null);
  

  // --- Effect: Initial Data Fetching ---
  // Mengambil data logo dan menu dari API saat komponen pertama kali dimuat.
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadHeaderLogo = async () => {
      try {
        const response = await axiosInstance.get('/api/beranda/header', { signal });
        const logoUrl = response.data?.data?.url_logo_header || null;
        setHeaderLogoUrl(logoUrl);
      } catch (error) {
        if (error.name !== 'CanceledError') console.error('Gagal mengambil logo header:', error);
      }
    };
    const fetchMenus = async () => {
      try {
        const response = await axiosInstance.get('/api/menus', { signal });
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
      } catch (error) {
        if (error.name !== 'CanceledError') console.error("Gagal mengambil menu navigasi:", error);
      }
    };

    loadHeaderLogo();
    fetchMenus();

    return () => {
      controller.abort();
    };
  }, []);

  // --- Search Functionality ---
  // Mengelola state, debounce, dan interaksi UI untuk fitur pencarian.
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

  // --- Effect: Search Query Handling ---
  // Debounces input, fetches search results from the API, filters them for relevance,
  // and handles race conditions using an AbortController.
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setShowSuggestions(true);
    setIsSearching(true);
    setSearchError(null);

    const searchHandler = setTimeout(async () => {
      try {
        const response = await axiosInstance.get(
          `/api/search?q=${encodeURIComponent(searchQuery)}`,
          { signal }
        );
        const backendResults = response.data.data || [];
        
        // Filter results client-side to ensure the title is relevant to the query.
        // This provides a better user experience by removing items that match on
        // content but not on the visible title.
        const filteredResults = backendResults.filter(result =>
          result.title && result.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setSearchResults(filteredResults);

      } catch (error) {
        if (error.name !== 'CanceledError') {
          console.error('Search error:', error);
          setSearchError('Gagal melakukan pencarian.');
        }
      } finally {
        if (!signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 400); // Debounce time

    return () => {
      clearTimeout(searchHandler);
      controller.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchActive(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Desktop Dropdown Logic ---
  // Mengelola interaksi hover (mouseenter/mouseleave) untuk dropdown di mode desktop.
  const handleMouseEnter = (menuName) => {
    clearTimeout(leaveTimeoutRef.current);
    if (window.innerWidth > 1290) {
      setActiveDesktopDropdown(menuName);
    }
  };
  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      if (window.innerWidth > 1290) {
        setActiveDesktopDropdown(null);
      }
    }, 200);
  };
  const handleDropdownScrollContain = (e) => {
    if (window.innerWidth > 1290) {
      e.stopPropagation();
    }
  };

  // --- Mobile Menu & Navigation Handlers ---
  // Mengelola pembukaan/penutupan menu mobile, klik link, dan scroll lock.
  const handleLinkClick = () => {
    setActiveDesktopDropdown(null);
    if (isMobileMenuOpen) toggleMobileMenu();
  };

  const handleDropdownClick = (e, menu) => {
    e.preventDefault();
    if (window.innerWidth <= 1290) {
      setActiveDropdown(prevId => (prevId === menu.id ? null : menu.id));
    }
  };

  const toggleMobileMenu = () => {
    const nextState = !isMobileMenuOpen;
    setIsMobileMenuOpen(nextState);
    if (!nextState) {
      setActiveDropdown(null);
    }
  };

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleResize = () => {
      if (window.innerWidth > 1290) {
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

  // --- Effect: Active Menu Indicator ---
  // Mengatur dan menganimasikan indikator menu aktif berdasarkan URL saat ini.
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

  // --- Helper: Search Result Highlighter ---
  // Highlights the search query within a given text, case-insensitively.
  // Returns the text with matching parts wrapped in a <strong> tag.
  const getHighlightedText = (text, highlight) => {
    if (!highlight.trim() || !text) {
      return text || ''; // Return empty string if text is null/undefined
    }
    const escapedHighlight = highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <strong key={i} className="highlighted-text">
              {part}
            </strong>
          ) : (
            part
          )
        )}
      </>
    );
  };
  // --- Component Render ---
  return (
    <header ref={headerRef} className="unified-header">

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
                      <div className="search-suggestion-title">
                        {getHighlightedText(result.title, searchQuery)}
                      </div>
                      <div className="search-suggestion-meta">
                        {result.menu_location && (
                          <div className="location-row">
                            <span className="location-label">Menu :</span>
                            <span className="location-value menu">{result.menu_location}</span>
                          </div>
                        )}
                        {result.submenu_location && (
                          <div className="location-row">
                            <span className="location-label">SubMenu :</span>
                            <span className="location-value submenu">{result.submenu_location}</span>
                          </div>
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
                  >
                    <div className="dropdown-scroll-container" onWheel={handleDropdownScrollContain} onTouchMove={handleDropdownScrollContain}>
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
