import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../api/axiosInstance';
import CardContent from './CardContent';
import './CardContent.css'; 

const ProfileLayout = ({ menuId }) => {
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

  return (
    <div className="profile-layout-grid">
      {profiles.map((profile, index) => (
        <CardContent 
          key={profile.id || profile.nama_lengkap || index}
          name={profile.nama_lengkap}
          role={profile.jabatan}
          quote={profile.quotes}
          imageSrc={profile.url_foto}
        />
      ))}
    </div>
  );
};

export default ProfileLayout;
