import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../../../api/axiosInstance';
import CardContent from './CardContent';
import './CardContent.css'; 
import LazyLoadWrapper from './LazyLoadWrapper';
import Pagination from './Pagination'; // Menggunakan komponen Pagination lokal

const getItemsPerPage = (width, isVertical) => {
  if (isVertical) return 8; // Default statis untuk layout vertikal satu kolom
  if (width >= 1748) return 8; // 4 kolom x 2 baris (uji coba: wrap mulai terjadi pada 1747px)
  if (width >= 1361) return 6; // 3 kolom x 2 baris (uji coba: wrap mulai terjadi pada 1378px)
  if (width >= 768) return 4; // 2 kolom x 2 baris (uji coba: wrap mulai terjadi pada 991px)
  return 4;                    // 1 kolom x 2 baris (mobile)
};

const ProfileLayout = ({ menuId, viewLayout, menuName = "Profil Pegawai" }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  const isVertical = viewLayout === 'Vertikal';
  const [itemsPerPage, setItemsPerPage] = useState(() => 
    getItemsPerPage(window.innerWidth, isVertical)
  );

  // Menangani perubahan ukuran layar (resize) secara instan untuk sinkronisasi layout yang mulus
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(getItemsPerPage(window.innerWidth, isVertical));
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isVertical]);
  
  useEffect(() => {
    if (!menuId) return;

    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/api/profil-pegawai/${menuId}`);
        setProfiles(response.data || []);
      } catch (error) {
        // TODO: Implement error state handling for better UX
        console.error("Gagal mengambil data profil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
    // Reset ke halaman 1 setiap kali menuId berubah
    setCurrentPage(1);
  }, [menuId]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    const element = document.querySelector('.profile-content-wrapper');
    if (element) {
      if (window.lenis) {
        window.lenis.scrollTo(element, { offset: -80 });
      } else {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  // Hitung total halaman (dideklarasikan sebelum Hook dan early return)
  const totalPages = Math.ceil(profiles.length / itemsPerPage);
  
  // Amankan halaman aktif jika jumlah halaman menyusut setelah resize (Harus ditaruh sebelum early return)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [itemsPerPage, totalPages, currentPage]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-main)' }}>Memuat profil...</div>;
  }

  if (profiles.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-main)' }}>Belum ada data profil untuk menu ini.</div>;
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProfiles = profiles.slice(startIndex, endIndex);

  return (
    <div className="profile-content-wrapper">
      <div className="page-content-header">
        <h1>{menuName}</h1>
      </div>

      <div 
        className="profile-layout-grid" 
        style={{ 
          flexDirection: isVertical ? 'column' : 'row', 
          flexWrap: isVertical ? 'nowrap' : 'wrap' 
        }}
      >
        {currentProfiles.map((profile, index) => (
          <LazyLoadWrapper 
            key={profile.id || profile.nama_lengkap || index}
            placeholderHeight="408.5px" // 43em * 9.5px
            placeholderWidth="323px"    // 34em * 9.5px
          >
            <CardContent 
              name={profile.nama_lengkap}
              role={profile.jabatan}
              quote={profile.quotes}
              imageSrc={profile.url_foto}
            />
          </LazyLoadWrapper>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default ProfileLayout;
