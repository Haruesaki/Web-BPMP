import { useEffect, useState, useRef } from 'react';
import './Navbar.css';
import { Link, useLocation } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import ButtonSearch from './ButtonSearch/ButtonSearch';
import DesktopMenu from './NavigasiMenu/DesktopMenu';
import TextToSpeechButton from './TextToSpeech/TextToSpeechButton';
import HeaderLogo from './LogoHeader/HeaderLogo';
import HamburgerIcon from './HamburgerIcon/HamburgerIcon';
import MobileMenu from './MobileMenu/MobileMenu';

const Navbar = () => {
  // --- State Management & Refs ---
  const [navData, setNavData] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuOverflowed, setIsMenuOverflowed] = useState(false);
  const location = useLocation();

  // State untuk data dinamis dari API
  const [headerLogoUrl, setHeaderLogoUrl] = useState(null);

  const headerRef = useRef(null);

  // --- Effect: Initial Data Fetching ---
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
              id: sub.id.toString(),
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

  // --- Effect: Dynamic Header Height Measurement (ResizeObserver) ---
  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        '--header-height',
        `${headerEl.offsetHeight}px`
      );
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    resizeObserver.observe(headerEl);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <header ref={headerRef} className={`unified-header ${isMenuOverflowed ? 'menu-overflowed' : ''}`}>
        <div className="header-top">
          <div className="header-menu">
            <HamburgerIcon onClick={() => setIsSidebarOpen(prev => !prev)} />
            <HeaderLogo logoUrl={headerLogoUrl} />
          </div>

          <div className="header-actions">
            <ButtonSearch />
            <TextToSpeechButton />
          </div>
        </div>

        <DesktopMenu navData={navData} onOverflowChange={setIsMenuOverflowed} />
      </header>
      <MobileMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} navData={navData} isOverflowed={isMenuOverflowed} />
    </>
  );
};

export default Navbar;
