import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import './AdminSidebar.css';

// --- DATA: MENU STATIS BAGIAN ATAS ---
const adminMenuItems1 = [
  { id: 'beranda', label: 'Beranda', icon: 'fa-solid fa-table-cells-large', path: '/admin' },
  { id: 'customize', label: 'Customize Beranda', icon: 'fa-solid fa-pen-to-square', path: '/admin/customize-beranda' },
  { id: 'pengaturan-menu', label: 'Pengaturan Menu', icon: 'fa-solid fa-sliders', path: '/admin/pengaturan-menu' },
];

// --- DATA: MENU STATIS BAGIAN BAWAH ---
const adminMenuItems2 = [
  { id: 'manajemen', label: 'Manajemen User', icon: 'fa-solid fa-users', path: '/admin/manajemen-user' },
  { id: 'setting', label: 'Setting', icon: 'fa-solid fa-gear' },
];

const AdminSidebar = ({ onTambahMenu, refreshTrigger }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dynamicMenus, setDynamicMenus] = useState([]);
  const [selectedId, setSelectedId] = useState('beranda');
  const [expandedMenus, setExpandedMenus] = useState([]); // Array of parent IDs yang sedang di-expand

  // Fetch menu dinamis dari backend
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await axiosInstance.get('/api/menus');
        const data = response.data;
        
        // Membentuk struktur Tree (Parent-Child)
        const parentMenus = data.filter(m => m.induk_id === null).sort((a,b) => a.urutan_tampil - b.urutan_tampil);
        const childMenus = data.filter(m => m.induk_id !== null).sort((a,b) => a.urutan_tampil - b.urutan_tampil);

        const tree = parentMenus.map(p => {
          const subs = childMenus.filter(c => c.induk_id === p.id);
          return {
            id: p.id.toString(),
            label: p.nama_menu,
            icon: p.ikon_menu,
            jenis: p.jenis_menu,
            path: p.jenis_menu === 'post'
              ? `/admin/post/${p.slug_atau_tautan || 'default'}`
              : p.jenis_menu === 'link'
                ? '/admin/link'
                : (p.slug_atau_tautan || '#'),
            submenus: subs.map(s => ({
              id: s.id.toString(),
              label: s.nama_menu,
              icon: s.ikon_menu,
              jenis: s.jenis_menu,
              path: s.jenis_menu === 'post'
                ? `/admin/post/${s.slug_atau_tautan || 'default'}`
                : s.jenis_menu === 'link'
                  ? '/admin/link'
                  : (s.slug_atau_tautan || '#')
            }))
          };
        });

        setDynamicMenus(tree);
      } catch (error) {
        console.error('Gagal fetch menus:', error);
      }
    };
    fetchMenus();
  }, [refreshTrigger]);

  const toggleExpand = (id) => {
    setExpandedMenus(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const renderStaticItem = (item) => (
    <button
      key={item.id}
      className={`nav-item ${selectedId === item.id ? 'active' : ''}`}
      onClick={() => {
        setSelectedId(item.id);
        if (item.path) navigate(item.path);
      }}
    >
      <i className={item.icon}></i>
      <span>{item.label}</span>
    </button>
  );

  const renderDynamicItem = (menu) => {
    const hasSubmenus = menu.submenus && menu.submenus.length > 0;
    const isExpanded = expandedMenus.includes(menu.id);
    
    // Jika dia punya submenu, dia berfungsi sebagai GERBANG (hanya nge-expand)
    // Jika tidak punya, dan dia tipe Post, kita passing state isPostTanpaSubmenu: true
    const handleClick = () => {
      setSelectedId(menu.id);

      if (hasSubmenus) {
        toggleExpand(menu.id);
        return;
      }

      if (menu.jenis === 'link') {
        navigate('/admin/link', { state: { menuId: Number(menu.id) } });
        return;
      }

      if (menu.path) {
        navigate(menu.path, {
          state: {
            menuName: menu.label,
            isPostTanpaSubmenu: menu.jenis === 'post'
          }
        });
      }
    };

    return (
      <React.Fragment key={menu.id}>
        <button
          className={`nav-item ${selectedId === menu.id ? 'active' : ''}`}
          onClick={handleClick}
        >
          <i className={menu.icon}></i>
          <span>{menu.label}</span>
          {hasSubmenus && (
            <i 
              className={`fa-solid fa-chevron-${isExpanded ? 'down' : 'right'}`} 
              style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.7 }}
            ></i>
          )}
        </button>

        {/* Render Submenu */}
        {hasSubmenus && isExpanded && (
          <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            {menu.submenus.map(sub => (
              <button
                key={sub.id}
                className={`nav-item ${selectedId === sub.id ? 'active' : ''}`}
                style={{ fontSize: '0.9em', padding: '0.6rem 1rem' }}
                onClick={() => {
                  setSelectedId(sub.id);

                  if (sub.jenis === 'link') {
                    navigate('/admin/link', { state: { menuId: Number(sub.id) } });
                    return;
                  }

                  if (sub.path) {
                    navigate(sub.path, { state: { menuName: sub.label, isPostTanpaSubmenu: false } });
                  }
                }}
              >
                <i className={sub.icon} style={{ fontSize: '0.9em' }}></i>
                <span>{sub.label}</span>
              </button>
            ))}
          </div>
        )}
      </React.Fragment>
    );
  };

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <h1>Content Management<br />System Website BPMP</h1>
      </div>

      <nav className="sidebar-nav" data-lenis-prevent="true">
        {adminMenuItems1.map(renderStaticItem)}

        <div className="nav-divider"></div>

        {dynamicMenus.map(renderDynamicItem)}

        <div className="nav-divider"></div>

        {adminMenuItems2.map(renderStaticItem)}
      </nav>

      <button className="btn-tambah-menu" onClick={() => onTambahMenu?.()}>
        <i className="fa-solid fa-plus"></i> Tambah Menu
      </button>
    </aside>
  );
};

export default AdminSidebar;
