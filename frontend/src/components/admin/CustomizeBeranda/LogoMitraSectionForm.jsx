import React, { useRef, useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import PartnerSection from '../../user/partner/PartnerSection';
import ThemeAlert from '../ThemeAlert';
import './LogoMitraSectionForm.css';

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const LogoMitraSectionForm = ({ mitraList, setMitraList }) => {
  const fileInputRefs = useRef({});
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false });

  const showAlert = (type, message, title) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: () => setAlertState(prev => ({ ...prev, isOpen: false }))
    });
  };

  const requestDelete = (id) => {
    const mitra = mitraList.find((m) => m.id === id);
    if (!mitra) return;

    if (!mitra.preview) {
      setMitraList((prev) => prev.filter((m) => m.id !== id));
      return;
    }

    setAlertState({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Hapus',
      message: 'Apakah Anda yakin ingin menghapus logo ini?',
      onCancel: () => setAlertState(prev => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
        await executeDelete(id);
      }
    });
  };

  const executeDelete = async (id) => {
    try {
      setIsLoading(true);
      await axiosInstance.delete(`/api/beranda/mitra/${id}`);
      setMitraList((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error('Gagal menghapus logo:', error);
      showAlert('error', 'Gagal menghapus logo dari server.', 'Hapus Gagal');
    } finally {
      setIsLoading(false);
    }
  };

  // Menutup dropdown jika user klik di luar
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleTambahLogo = () => {
    setMitraList((prev) => [
      ...prev,
      { id: Date.now(), file: null, preview: null }
    ]);
  };

  const toggleDropdown = (e, id) => {
    e.stopPropagation();
    setActiveDropdown((prev) => (prev === id ? null : id));
  };

  const triggerUpload = (id) => {
    if (isLoading) return;
    if (fileInputRefs.current[id]) {
      fileInputRefs.current[id].click();
    }
  };

  const handleFileChange = async (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mitra = mitraList.find((m) => m.id === id);
    if (!mitra) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('upload', file);
      
      let response;
      if (!mitra.preview) {
        response = await axiosInstance.post('/api/beranda/mitra', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await axiosInstance.put(`/api/beranda/mitra/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const updatedMitra = response.data?.data;
      if (updatedMitra) {
        setMitraList((prev) =>
          prev.map((m) =>
            m.id === id
              ? { id: updatedMitra.id, file: null, preview: updatedMitra.url_logo }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Gagal mengunggah logo:', error);
      showAlert('error', error.response?.data?.error?.message || error.response?.data?.message || 'Gagal mengunggah logo.', 'Upload Gagal');
    } finally {
      setIsLoading(false);
      setActiveDropdown(null);
      if (fileInputRefs.current[id]) {
        fileInputRefs.current[id].value = '';
      }
    }
  };

  const handleLihatLogo = (e, previewUrl) => {
    e.stopPropagation();
    window.open(getFullUrl(previewUrl), '_blank');
    setActiveDropdown(null);
  };

  return (
    <div className="cb-logo-mitra-wrapper" onClick={(e) => e.stopPropagation()}>
      <div className="cb-logo-mitra-header">
        <h4 className="cb-mitra-col-title">Kelola Logo Mitra</h4>
        <span className="cb-mitra-subtitle">
          (Format yang didukung: PNG, JPG transparan. Rasio bebas)
          {isLoading && <span style={{ marginLeft: '12px', color: 'var(--primary-main)', fontWeight: 'bold' }}>Menyinkronkan...</span>}
        </span>
      </div>

      <div className="cb-logo-mitra-grid">
        {mitraList.map((mitra) => (
          <div
            key={mitra.id}
            className="cb-mitra-card"
            onClick={() => {
              if (!mitra.preview) triggerUpload(mitra.id);
            }}
            onMouseLeave={() => {
              if (activeDropdown === mitra.id) setActiveDropdown(null);
            }}
            title={!mitra.preview ? 'Klik untuk mengunggah logo' : ''}
          >
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={(el) => (fileInputRefs.current[mitra.id] = el)}
              onChange={(e) => handleFileChange(mitra.id, e)}
            />

            {mitra.preview ? (
              <img src={getFullUrl(mitra.preview)} alt={`Logo ${mitra.nama || ''}`} className="cb-mitra-img" />
            ) : (
              <>
                <button
                  className="cb-mitra-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDelete(mitra.id);
                  }}
                  title="Batal / Hapus Placeholder"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
                <div className="cb-mitra-placeholder">
                  <i className="fa-regular fa-image"></i>
                  <span>Upload Logo</span>
                </div>
              </>
            )}

            {mitra.preview && (
              <div className="cb-mitra-menu-container">
                <button
                  className="cb-mitra-menu-btn"
                  onClick={(e) => toggleDropdown(e, mitra.id)}
                  title="Opsi Logo"
                >
                  <i className="fa-solid fa-ellipsis"></i>
                </button>

                <div className={`cb-mitra-dropdown ${activeDropdown === mitra.id ? 'show' : ''}`}>
                  <button onClick={(e) => handleLihatLogo(e, mitra.preview)}>
                    <i className="fa-regular fa-eye"></i> Lihat Logo
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(null);
                      triggerUpload(mitra.id);
                    }}
                  >
                    <i className="fa-solid fa-pen"></i> Ubah Logo
                  </button>
                  <button
                    className="danger-text"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(null);
                      requestDelete(mitra.id);
                    }}
                  >
                    <i className="fa-solid fa-trash"></i> Hapus Logo
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button 
        className="cb-mitra-add-btn" 
        onClick={handleTambahLogo} 
        title="Tambah tempat logo baru"
        disabled={isLoading}
        style={isLoading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
      >
        <i className="fa-solid fa-plus"></i>
        <span>Tambah Tempat Logo Baru</span>
      </button>

      <div className="cb-mitra-preview-container">
        <div className="cb-mitra-preview-header">
          <i className="fa-solid fa-desktop"></i>
          <span>Live Preview Beranda</span>
        </div>
        <div className="cb-mitra-preview-box">
          {mitraList.filter(m => m.preview).length > 0 ? (
            <PartnerSection 
              customMitraList={mitraList.map(m => getFullUrl(m.preview)).filter(Boolean)} 
              isPreviewMode={true} 
            />
          ) : (
            <div className="cb-mitra-preview-empty">
              Unggah gambar logo untuk melihat preview animasinya di sini.
            </div>
          )}
        </div>
      </div>

      <ThemeAlert 
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
      />
    </div>
  );
};

export default LogoMitraSectionForm;
