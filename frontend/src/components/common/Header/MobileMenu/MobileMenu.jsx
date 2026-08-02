import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MobileMenu.css';

const MobileMenuItem = ({ item, onItemClick, isOpen, onToggleSubmenu }) => {
  // Local state for submenu has been lifted up to the parent MobileMenu component.

  const handleLocalToggle = (e) => {
    e.preventDefault();
    // Call the handler passed from the parent to update the centralized state
    onToggleSubmenu(item.id);
  };

  if (item.type === 'dropdown') {
    return (
      <div className={`mobile-menu-item ${isOpen ? 'submenu-open' : ''}`}>
        <a href="#" className="mobile-menu-link" onClick={handleLocalToggle}>
          <span>{item.title}</span>
          <i className="fa-solid fa-chevron-down dropdown-indicator"></i>
        </a>
        <div className="mobile-submenu">
          {item.submenu.map((subItem, index) => (
            <Link key={index} to={subItem.path} className="mobile-submenu-link" onClick={onItemClick}>
              <i className="fa-solid fa-circle fa-2xs"></i> {subItem.title}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const isExternal = item.path.startsWith('http');
  if (isExternal) {
    return (
      <div className="mobile-menu-item">
        <a href={item.path} className="mobile-menu-link" target="_blank" rel="noopener noreferrer" onClick={onItemClick}>
          <span>{item.title}</span>
        </a>
      </div>
    );
  }

  return (
    <div className="mobile-menu-item">
      <Link to={item.path} className="mobile-menu-link" onClick={onItemClick}>
        <span>{item.title}</span>
      </Link>
    </div>
  );
};

const MobileMenu = ({ isOpen, onClose, navData, isOverflowed }) => {
  // Centralized state to track the ID of the currently open submenu.
  const [openSubmenuId, setOpenSubmenuId] = useState(null);

  // Handler to toggle submenus. Ensures only one is open at a time.
  const handleToggleSubmenu = (id) => {
    setOpenSubmenuId(openSubmenuId === id ? null : id);
  };

  const handleClose = () => {
    setOpenSubmenuId(null);
    onClose();
  };

  useEffect(() => {
    const htmlElement = document.documentElement;

    if (isOpen) {
      htmlElement.classList.add('lenis-stopped');
      return () => {
        htmlElement.classList.remove('lenis-stopped');
      };
    }

    htmlElement.classList.remove('lenis-stopped');
  }, [isOpen]);

  const handleBackdropScroll = (e) => {
    e.preventDefault();
    handleClose();
  };

  // Effect to automatically close any open submenu when the main sidebar is closed.
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenSubmenuId(null);
    }
  }, [isOpen]);

  // Effect to automatically close MobileMenu when viewport width reaches desktop breakpoint (>= 1290px), UNLESS menu is in overflowed mode!
  useEffect(() => {
    if (!isOpen || isOverflowed) return;

    const mediaQuery = window.matchMedia('(min-width: 1290px)');

    const handleBreakpointChange = (e) => {
      if (e.matches && !isOverflowed) {
        onClose();
      }
    };

    if (mediaQuery.matches && !isOverflowed) {
      onClose();
    }

    mediaQuery.addEventListener('change', handleBreakpointChange);
    return () => mediaQuery.removeEventListener('change', handleBreakpointChange);
  }, [isOpen, onClose, isOverflowed]);

  return (
    <>
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={handleClose}
        onWheel={handleBackdropScroll}
        onTouchMove={handleBackdropScroll}
      ></div>
      <div className={`mobile-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="mobile-sidebar-content" data-lenis-prevent>
          {navData.map(item => (
            <MobileMenuItem
              key={item.id}
              item={item}
              onItemClick={handleClose}
              // Pass down the open status (is this item's submenu the one that's open?)
              isOpen={openSubmenuId === item.id}
              // Pass down the handler to allow child components to update the state
              onToggleSubmenu={handleToggleSubmenu}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileMenu;
