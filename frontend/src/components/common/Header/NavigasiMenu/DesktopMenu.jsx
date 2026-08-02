import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './DesktopMenu.css'; // File CSS baru yang spesifik
import Dropdown from "../../../../assets/source/Dropdown.png";

const DesktopMenu = ({ navData, onOverflowChange }) => {
  const location = useLocation();
  const [activeDesktopDropdown, setActiveDesktopDropdown] = useState(null);
  const leaveTimeoutRef = useRef(null);
  const navbarRef = useRef(null); // Ref untuk elemen <nav> utama
  const cachedTotalItemsWidth = useRef(0);
  const isOverflowStateRef = useRef(false);

  const handleMouseEnter = (menuId) => {
    clearTimeout(leaveTimeoutRef.current);
    setActiveDesktopDropdown(menuId);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setActiveDesktopDropdown(null);
    }, 200);
  };

  const handleDropdownScrollContain = (e) => {
    e.stopPropagation();
  };

  const handleLinkClick = () => {
    setActiveDesktopDropdown(null);
  };

  // --- Effect: Active Menu Indicator ---
  useEffect(() => {
    const navbar = navbarRef.current;
    if (!navbar) return;

    const selector = navbar.querySelector('.nav-selector');
    const allLinks = navbar.querySelectorAll('[data-path-group]');

    if (!selector || allLinks.length === 0) return;

    const moveSelector = (targetElement) => {
      if (!targetElement || window.innerWidth <= 1290) {
        selector.style.opacity = '0';
        return;
      }

      const targetRect = targetElement.getBoundingClientRect();
      const navbarRect = navbar.getBoundingClientRect();
      const leftPos = targetRect.left - navbarRect.left;
      const topPos = targetRect.top - navbarRect.top;

      selector.style.opacity = '1';
      selector.style.width = `${targetRect.width}px`;
      selector.style.height = `${targetRect.height}px`;
      selector.style.transform = `translate(${leftPos}px, ${topPos}px)`;
    };

    const prevActiveLink = navbar.querySelector('.nav-link.active');
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
      newActiveLink = navbar.querySelector(`[data-path-group="${activeNav.dataPath}"]`);
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
    } else {
        selector.style.opacity = '0';
    }

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const currentActive = navbar.querySelector('.nav-link.active');
        if (currentActive) {
            moveSelector(currentActive);
        } else {
            selector.style.opacity = '0';
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);

  }, [location.pathname, navData]);

  // --- Effect: Detect Menu Items Wrapping / Overflow (With Hysteresis Cache) ---
  useEffect(() => {
    const navbar = navbarRef.current;
    if (!navbar || !onOverflowChange) return;

    const checkOverflow = () => {
      // Direct bypass on mobile/tablet screens (<= 1290px) for 0% CPU impact
      if (window.innerWidth <= 1290) {
        isOverflowStateRef.current = false;
        onOverflowChange(false);
        return;
      }

      const navContent = navbar.querySelector('.desktop-nav-content');
      if (!navContent) return;

      const navItems = Array.from(navContent.children);
      if (navItems.length === 0) {
        isOverflowStateRef.current = false;
        onOverflowChange(false);
        return;
      }

      // If currently NOT overflowed (menu is visible), measure and update cached items width
      if (!isOverflowStateRef.current) {
        let liveTotalWidth = 0;
        navItems.forEach(item => {
          const width = item.getBoundingClientRect().width || item.offsetWidth || 0;
          liveTotalWidth += width;
        });

        if (liveTotalWidth > 0) {
          const gapPx = (window.innerWidth * 1) / 100;
          liveTotalWidth += gapPx * Math.max(0, navItems.length - 1);
          cachedTotalItemsWidth.current = liveTotalWidth;
        }
      }

      // Available container width for navigation (padding 4vw left + 4vw right = 8vw)
      const paddingPx = (window.innerWidth * 8) / 100;
      const availableWidth = window.innerWidth - paddingPx;

      // Use cached width if available to avoid 0px reading while display:none
      const requiredWidth = cachedTotalItemsWidth.current > 0 
        ? cachedTotalItemsWidth.current 
        : 0;

      const isOverflow = requiredWidth > availableWidth;
      isOverflowStateRef.current = isOverflow;
      onOverflowChange(isOverflow);
    };

    checkOverflow();

    const handleWindowResize = () => {
      checkOverflow();
    };

    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [navData, onOverflowChange]);

  return (
    <nav ref={navbarRef} className="desktop-main-navbar">
      <div className="nav-selector"></div>
      <div className="desktop-nav-content">
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
                className={`nav-item has-dropdown ${activeDesktopDropdown === item.id ? 'desktop-dropdown-open' : ''}`}
                onMouseEnter={() => handleMouseEnter(item.id)}
                onMouseLeave={handleMouseLeave}
              >
                <a href={item.path} className="nav-link" data-path-group={item.dataPath} onClick={(e) => e.preventDefault()}>
                  <span>{item.title}</span> <img src={Dropdown} alt="Dropdown" className="dropdown-icon" />
                </a>
                <div className="dropdown-menu">
                  <div className="dropdown-scroll-container" onWheel={handleDropdownScrollContain} onTouchMove={handleDropdownScrollContain}>
                    {item.submenu.map((subItem, index) => {
                      const isExternal = subItem.path.startsWith('http');
                      const animationStyle = { '--animation-delay': `${index * 0.07}s` };

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
  );
};

export default DesktopMenu;