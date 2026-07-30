import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../api/axiosInstance';
import CardContent from './CardContent';
import './CardContent.css'; 
import LazyLoadWrapper from './LazyLoadWrapper';
import Pagination from './Pagination'; // Menggunakan komponen Pagination lokal

const ProfileLayout = ({ menuId, viewLayout, menuName = "Profil Pegawai" }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Konfigurasi untuk pagination
  const ITEMS_PER_PAGE = 8;
  
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

  // Fungsi untuk mengubah halaman
  const handlePageChange = (page) => setCurrentPage(page);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-main)' }}>Memuat profil...</div>;
  }

  if (profiles.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-main)' }}>Belum ada data profil untuk menu ini.</div>;
  }

  const isVertical = viewLayout === 'Vertikal';
  
  // Logika untuk memotong data sesuai halaman saat ini
  const totalPages = Math.ceil(profiles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
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
