import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../api/axiosInstance';
import CardContent from './CardContent';
import './CardContent.css'; 
import LazyLoadWrapper from './LazyLoadWrapper';

const ProfileLayout = ({ menuId, viewLayout }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!menuId) return;

    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/api/profil-pegawai/${menuId}`);
        setProfiles(response.data || []);
      } catch (error) {
        console.error("Gagal mengambil data profil:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [menuId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-main)' }}>Memuat profil...</div>;
  }

  if (profiles.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-main)' }}>Belum ada data profil untuk menu ini.</div>;
  }

  const isVertical = viewLayout === 'Vertikal';

  return (
    <div 
      className="profile-layout-grid" 
      style={{ 
        flexDirection: isVertical ? 'column' : 'row', 
        flexWrap: isVertical ? 'nowrap' : 'wrap' 
      }}
    >
      {profiles.map((profile, index) => (
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
  );
};

export default ProfileLayout;
