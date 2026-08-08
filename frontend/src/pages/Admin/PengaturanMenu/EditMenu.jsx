import React, { useEffect, useState, useRef } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import { bacaSesi } from '../../../utils/sesiAdmin';
import { LAYOUT_LABEL_TO_KEY } from '../../../components/admin/LayoutPost/layoutMeta';

const EditMenu = ({ isOpen, onClose, menuData, onSuccess }) => {
  const [formError, setFormError] = useState('');
  const [menuName, setMenuName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPostLayout, setSelectedPostLayout] = useState('');
  const [selectedPostView, setSelectedPostView] = useState('Vertikal');
  const [menuLink, setMenuLink] = useState('');
  const [isIconDropdownOpen, setIsIconDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  const iconDropdownRef = useRef(null);
  const typeDropdownRef = useRef(null);

  const iconOptions = [
    { value: 'fa-solid fa-table-cells-large', label: 'Menu utama', fa: 'fa-solid fa-table-cells-large' },
    { value: 'fa-solid fa-pen-to-square', label: 'Customize', fa: 'fa-solid fa-pen-to-square' },
    { value: 'fa-solid fa-sliders', label: 'Preferensi', fa: 'fa-solid fa-sliders' },
    { value: 'fa-solid fa-file-lines', label: 'Dokumen', fa: 'fa-solid fa-file-lines' },
    { value: 'fa-solid fa-circle-user', label: 'Profil', fa: 'fa-solid fa-circle-user' },
    { value: 'fa-solid fa-building-columns', label: 'Institusi', fa: 'fa-solid fa-building-columns' },
    { value: 'fa-solid fa-hands-holding-circle', label: 'Layanan', fa: 'fa-solid fa-hands-holding-circle' },
    { value: 'fa-solid fa-calendar-check', label: 'Agenda / Tugas', fa: 'fa-solid fa-calendar-check' },
    { value: 'fa-solid fa-circle-info', label: 'Informasi', fa: 'fa-solid fa-circle-info' },
    { value: 'fa-solid fa-shield-halved', label: 'Privasi', fa: 'fa-solid fa-shield-halved' },
    { value: 'fa-solid fa-comments', label: 'Pesan / Forum', fa: 'fa-solid fa-comments' },
    { value: 'fa-solid fa-users', label: 'Daftar Pengguna', fa: 'fa-solid fa-users' },
    { value: 'fa-solid fa-gear', label: 'Pengaturan', fa: 'fa-solid fa-gear' },
  ];

  const typeOptions = ['Post', 'Link'];
  const postLayoutOptions = ['Default', 'Profile Card', 'Berita Card'];
  const postViewOptions = ['Vertikal', 'Horizontal'];

  useEffect(() => {
    if (menuData && isOpen) {
      setMenuName(menuData.label || '');
      setSelectedIcon(menuData.ikon_menu || '');
      const type = menuData.jenis_menu === 'link' ? 'Link' : 'Post';
      setSelectedType(type);
      
      if (type === 'Link') {
        setMenuLink(menuData.slug_atau_tautan || '');
      } else {
        // Tentukan layout berdasarkan slug_atau_tautan
        const slug = menuData.slug_atau_tautan;
        let layout = 'Default';
        Object.keys(LAYOUT_LABEL_TO_KEY).forEach(key => {
          if (LAYOUT_LABEL_TO_KEY[key] === slug) layout = key;
        });
        setSelectedPostLayout(layout);
        setSelectedPostView(menuData.tampilan || 'Vertikal');
      }
    }
  }, [menuData, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (iconDropdownRef.current && !iconDropdownRef.current.contains(event.target)) {
        setIsIconDropdownOpen(false);
      }
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClose = () => {
    setFormError('');
    onClose();
  };

  const handleSaveMenu = async () => {
    setFormError('');
    if (!menuName || !selectedIcon || !selectedType) {
      setFormError("Nama menu, ikon, dan jenis menu wajib diisi!");
      return;
    }

    try {
      const session = bacaSesi();
      const token = session?.token;

      const res = await axiosInstance.patch(`/api/menus/${menuData.id}`, {
        nama_menu: menuName,
        ikon_menu: selectedIcon,
        jenis_menu: selectedType.toLowerCase(),
        slug_atau_tautan: selectedType === 'Link' ? menuLink : (LAYOUT_LABEL_TO_KEY[selectedPostLayout] || 'default'),
        tampilan: selectedType === 'Link' ? null : selectedPostView
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 200 || res.status === 201) {
        handleClose();
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.pesan || "Terjadi kesalahan jaringan. Gagal memperbarui menu.";
      setFormError(errMsg);
    }
  };

  if (!isOpen || !menuData) return null;

  const selectedIconLabel = iconOptions.find((o) => o.value === selectedIcon)?.label;

  return (
    <div className="modal-overlay" data-lenis-prevent="true" onClick={handleClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit {menuData.induk_id ? 'Submenu' : 'Menu'}</h3>
          <button className="modal-close" onClick={handleClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal-body">
          {formError && (
            <div style={{ color: '#ff4d4d', backgroundColor: '#331111', padding: '10px 14px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px', border: '1px solid #ff4d4d', display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '10px', fontSize: '16px' }}></i>
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label>Nama {menuData.induk_id ? 'Submenu' : 'Menu'}</label>
            <input
              type="text"
              className="form-input"
              placeholder="Masukkan nama..."
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
            />
          </div>

          <div className="form-group" ref={iconDropdownRef}>
            <label>Ikon</label>
            <button
              className="form-select"
              onClick={() => {
                setIsIconDropdownOpen((v) => !v);
                setIsTypeDropdownOpen(false);
              }}
            >
              <span className={selectedIcon ? '' : 'placeholder'}>
                {selectedIconLabel || 'Pilih Ikon'}
              </span>
              <i className={`fa-solid fa-chevron-${isIconDropdownOpen ? 'up' : 'down'}`}></i>
            </button>
            {isIconDropdownOpen && (
              <div className="form-dropdown">
                {iconOptions.map((opt) => (
                  <button
                    key={opt.value}
                    className={`form-dropdown-item ${selectedIcon === opt.value ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedIcon(opt.value);
                      setIsIconDropdownOpen(false);
                    }}
                  >
                    <i className={opt.fa}></i>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-group" ref={typeDropdownRef}>
            <label>Jenis</label>
            <button
              className="form-select"
              onClick={() => {
                setIsTypeDropdownOpen((v) => !v);
                setIsIconDropdownOpen(false);
              }}
            >
              <span className={selectedType ? '' : 'placeholder'}>
                {selectedType || 'Pilih jenis...'}
              </span>
              <i className={`fa-solid fa-chevron-${isTypeDropdownOpen ? 'up' : 'down'}`}></i>
            </button>
            {isTypeDropdownOpen && (
              <div className="form-dropdown">
                {typeOptions.map((opt) => (
                  <button
                    key={opt}
                    className={`form-dropdown-item ${selectedType === opt ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedType(opt);
                      setIsTypeDropdownOpen(false);
                    }}
                  >
                    <span>{opt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedType === 'Post' && (
            <div className="form-group">
              <label>Layout Post</label>
              <div className="form-radio-group">
                {postLayoutOptions.map((opt) => (
                  <label key={opt} className="form-radio-item">
                    <input
                      type="radio"
                      name="postLayout"
                      value={opt}
                      checked={selectedPostLayout === opt}
                      onChange={() => setSelectedPostLayout(opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {selectedType === 'Post' && (
            <div className="form-group">
              <label>Tampilan Post</label>
              <div className="form-radio-group">
                {postViewOptions.map((opt) => (
                  <label key={opt} className="form-radio-item">
                    <input
                      type="radio"
                      name="postView"
                      value={opt}
                      checked={selectedPostView === opt}
                      onChange={() => setSelectedPostView(opt)}
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {selectedType === 'Link' && (
            <div className="form-group">
              <label>URL / Link Tujuan</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://contoh.com/halaman"
                value={menuLink}
                onChange={(e) => setMenuLink(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-batal" onClick={handleClose}>Batal</button>
          <button className="btn-simpan" onClick={handleSaveMenu}>Simpan Perubahan</button>
        </div>
      </div>
    </div>
  );
};

export default EditMenu;
