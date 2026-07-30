import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';

// Import layout components
import ProfileLayout from '../../../components/user/content-types/CardProfile/ProfileLayout';
import NewsCardContent from '../../../components/user/content-types/CardBerita/NewsCardContent';
import DefaultContent from '../../../components/user/content-types/Default/DefaultContent';
import "./GenericPage.css";

const GenericPage = () => {
  const { menuId } = useParams();
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenuType = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get('/api/menus');
        // Cari menu yang sesuai dengan ID di parameter URL
        const foundMenu = res.data.find(m => m.id === parseInt(menuId));
        setMenuData(foundMenu);
      } catch (err) {
        console.error("Gagal mengambil data menu:", err);
      } finally {
        setLoading(false);
      }
    };

    if (menuId) {
      fetchMenuType();
    } else {
      setLoading(false);
    }
  }, [menuId]);

  if (loading) {
    return (
      <div className="generic-page-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h3 style={{ color: 'var(--text-main)' }}>Memuat halaman...</h3>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="generic-page-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h3 style={{ color: 'var(--text-main)' }}>Halaman tidak ditemukan (ID: {menuId || 'Kosong'})</h3>
      </div>
    );
  }

  // Render berdasarkan jenis_menu dan layout (slug_atau_tautan)
  return (
    <div className="generic-page-container">
      {/* Jika menu tersebut bertipe post dan layout-nya profil */}
      {menuData.jenis_menu === 'post' && menuData.slug_atau_tautan === 'profile-card' && (
        <ProfileLayout menuId={menuData.id} viewLayout={menuData.tampilan} menuName={menuData.nama_menu} />
      )}

      {/* Placeholder untuk layout default */}
      {menuData.jenis_menu === 'post' && menuData.slug_atau_tautan === 'default' && (
        <DefaultContent menuId={menuData.id} viewLayout={menuData.tampilan} menuName={menuData.nama_menu} />
      )}

      {/* Placeholder untuk layout berita */}
      {menuData.jenis_menu === 'post' && menuData.slug_atau_tautan === 'berita-card' && (
        <NewsCardContent menuId={menuData.id} viewLayout={menuData.tampilan} />
      )}
    </div>
  );
};

export default GenericPage;
