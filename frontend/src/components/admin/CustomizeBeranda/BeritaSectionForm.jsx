import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';
import CustomAlert from '../CustomAlert';
import NewsSection from '../../user/berita/NewsSection';
import './BeritaSectionForm.css';

const PAGE_SIZE = 4;

const htmlToText = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
};

const formatWaktu = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

const BeritaSectionForm = () => {
  const [beritaList, setBeritaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isDraggable, setIsDraggable] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false });
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleRowClick = (b, e) => {
    // Abaikan klik jika pada elemen interaktif seperti tombol/input
    if (e.target.closest('button') || e.target.closest('.bs-thumb') || e.target.closest('td:first-child')) return;
    if (!b.menu_id) return;
    
    let layoutType = 'default';
    if (b.jenis_menu === 'post' || b.jenis_menu === 'profil' || b.jenis_menu === 'berita') {
      layoutType = b.layout || 'berita-card'; 
    } else if (b.jenis_menu === 'page') {
      layoutType = 'default';
    }

    const actualId = b.id.split('-').pop();
    
    if (layoutType === 'profile-card') {
      navigate(`/admin/kelola-profil/${b.menu_id}`, {
        state: { highlightId: actualId, highlightSumber: b.sumber, menuId: b.menu_id }
      });
    } else {
      navigate(`/admin/post/${layoutType}/${b.menu_id}`, { 
        state: { highlightId: actualId, highlightSumber: b.sumber, menuId: b.menu_id } 
      });
    }
  };

  const showAlert = (type, message, title) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: () => setAlertState(prev => ({ ...prev, isOpen: false }))
    });
  };

  useEffect(() => {
    const fetchBerita = async () => {
      try {
        const res = await axiosInstance.get('/api/beranda/berita');
        if (res.data?.success) {
          setBeritaList(res.data.data);
        }
      } catch (err) {
        console.error('Gagal mengambil berita beranda:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBerita();
  }, []);

  const handleThumbClick = (item) => {
    setUploadTarget(item);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !uploadTarget) return;
    
    const formData = new FormData();
    formData.append('upload', file); // API upload/gambar expects 'upload'

    try {
      const uploadRes = await axiosInstance.post('/api/upload/gambar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (uploadRes.data && uploadRes.data.url) {
         const newUrl = uploadRes.data.url;
         const actualId = uploadTarget.id.split('-').pop();
         
         await axiosInstance.patch(`/api/beranda/berita/${uploadTarget.sumber}/${actualId}/thumbnail`, {
           coverUrl: newUrl
         });
         
         setBeritaList(prev => prev.map(b => b.id === uploadTarget.id ? { ...b, coverUrl: newUrl } : b));
      }
    } catch (err) {
      console.error('Upload failed:', err);
      showAlert('error', 'Gagal mengunggah gambar thumbnail.', 'Upload Gagal');
    } finally {
      setUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const requestDelete = (item) => {
    setAlertState({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Hapus',
      message: `Apakah Anda yakin ingin menghapus "${item.judul}" dari tampilan Beranda?`,
      onCancel: () => setAlertState(prev => ({ ...prev, isOpen: false })),
      onConfirm: async () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
        await executeDelete(item);
      }
    });
  };

  const executeDelete = async (item) => {
    const actualId = item.id.split('-').pop();
    try {
      await axiosInstance.delete(`/api/beranda/berita/${item.sumber}/${actualId}`);
      setBeritaList(prev => prev.filter(b => b.id !== item.id));
      // Jika halaman saat ini kosong setelah dihapus, mundur 1 halaman
      if (visible.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      showAlert('success', `Berita berhasil dihapus dari beranda.`, 'Berhasil');
    } catch (err) {
      console.error(err);
      showAlert('error', 'Gagal menghapus dari beranda.', 'Hapus Gagal');
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const sourceIndex = startIdx + draggedIndex;
    const destIndex = startIdx + targetIndex;

    const newList = [...beritaList];
    const [draggedItem] = newList.splice(sourceIndex, 1);
    newList.splice(destIndex, 0, draggedItem);

    // Assign urutan_beranda = index
    const updatedList = newList.map((item, idx) => ({ ...item, urutan_beranda: idx }));
    setBeritaList(updatedList);
    setDraggedIndex(null);
    setIsDraggable(false);

    try {
      const orderData = updatedList.map((item) => ({ id: item.id, urutan_beranda: item.urutan_beranda }));
      await axiosInstance.patch('/api/beranda/berita/reorder', { orderData });
    } catch (err) {
      console.error(err);
      showAlert('error', 'Gagal menyimpan urutan beranda', 'Reorder Gagal');
    }
  };

  const totalPages = Math.max(1, Math.ceil(beritaList.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * PAGE_SIZE;
  const visible = beritaList.slice(startIdx, startIdx + PAGE_SIZE);

  if (loading) {
    return <div style={{ padding: '16px', color: '#888' }}>Memuat daftar berita...</div>;
  }

  return (
    <div className="bs-form">
      <div className="bs-form-header">
        <p className="bs-form-desc">
          Berikut adalah daftar konten berita dan artikel yang saat ini ditampilkan di halaman Beranda pengunjung. Daftar ini terhubung langsung dengan status "Tampilkan di Beranda" pada menu Kelola Berita & Konten.
        </p>
      </div>

      <div className="bs-table-container">
        <table className="bs-table">
          <thead>
            <tr>
              <th style={{ width: '30px', textAlign: 'center' }}></th>
              <th style={{ width: '40px' }}>No.</th>
              <th style={{ width: '80px' }}>Thumb</th>
              <th>Judul</th>
              <th>Deskripsi</th>
              <th style={{ width: '100px' }}>Sumber</th>
              <th style={{ width: '130px' }}>Tanggal</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#666' }}>
                  Tidak ada konten yang ditampilkan di Beranda.
                </td>
              </tr>
            ) : (
              visible.map((b, i) => {
                const isDragging = i === draggedIndex;
                return (
                <tr 
                  key={b.id}
                  draggable={isDraggable}
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={() => { setDraggedIndex(null); setIsDraggable(false); }}
                  onDrop={(e) => handleDrop(e, i)}
                  onClick={(e) => handleRowClick(b, e)}
                  style={{ cursor: 'pointer' }}
                  className={isDragging ? 'bs-row-dragging' : ''}
                >
                  <td 
                    style={{ textAlign: 'center', color: '#666', cursor: 'grab' }}
                    onMouseEnter={() => setIsDraggable(true)}
                    onMouseLeave={() => setIsDraggable(false)}
                    title="Seret untuk memindah urutan"
                  >
                    <i className="fa-solid fa-grip-vertical"></i>
                  </td>
                  <td>{startIdx + i + 1}</td>
                  <td>
                    <div 
                      className="bs-thumb" 
                      onClick={() => handleThumbClick(b)} 
                      title="Klik untuk mengubah thumbnail"
                      style={{ cursor: 'pointer', position: 'relative' }}
                    >
                      {b.coverUrl ? (
                        <img src={b.coverUrl} alt={b.judul} style={{ transition: 'opacity 0.2s' }} />
                      ) : (
                        <div className="bs-thumb-empty" style={{ transition: 'background 0.2s' }}>
                          <i className="fa-regular fa-image"></i>
                        </div>
                      )}
                      <div className="bs-thumb-hover-overlay">
                        <i className="fa-solid fa-camera"></i>
                      </div>
                    </div>
                  </td>
                  <td><div className="bs-text-ellipsis" title={b.judul}>{b.judul}</div></td>
                  <td><div className="bs-text-ellipsis" title={htmlToText(b.konten)}>{htmlToText(b.konten) || '-'}</div></td>
                  <td><span className="bs-badge">{b.kategori}</span></td>
                  <td style={{ fontSize: '13px', color: '#aaa' }}>{formatWaktu(b.tanggal)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="bs-btn-delete" 
                      title="Hapus dari Beranda"
                      onClick={() => requestDelete(b)}
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {beritaList.length > 0 && (
        <div className="bs-pagination">
          <span className="bs-page-info">
            Menampilkan {startIdx + 1}-{Math.min(startIdx + PAGE_SIZE, beritaList.length)} dari {beritaList.length} data
          </span>
          <div className="bs-page-controls">
            <button 
              className="bs-page-btn" 
              disabled={page === 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <span className="bs-page-current">Halaman {page} dari {totalPages}</span>
            <button 
              className="bs-page-btn" 
              disabled={page === totalPages} 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {/* Live Preview Section */}
      <div className="bs-preview-container">
        <div className="bs-preview-header">
          <i className="fa-solid fa-desktop"></i>
          <span>Live Preview Beranda</span>
        </div>
        <div className="bs-preview-box">
          {beritaList.length > 0 ? (
            <NewsSection previewData={beritaList} />
          ) : (
            <div className="bs-preview-empty">
              Belum ada berita yang ditampilkan di beranda.
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/png, image/jpeg, image/jpg, image/webp" 
        onChange={handleFileChange} 
      />

      <CustomAlert 
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

export default BeritaSectionForm;
