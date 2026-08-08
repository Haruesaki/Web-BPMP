import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosInstance';

// Import layout components
import ProfileLayout from '../../../components/user/content-types/CardProfile/ProfileLayout';
import NewsCardContent from '../../../components/user/content-types/CardBerita/NewsCardContent';
import DefaultContent from '../../../components/user/content-types/Default/DefaultContent';
import BeritaDetail from '../BeritaDetail/BeritaDetail';
import "./GenericPage.css";

const GenericPage = ({ lenisRef }) => {
  const { menuId, id } = useParams();
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // Jika ini rute berita detail, langsung set data layout semu tanpa fetch API menu
      setMenuData({
        jenis_menu: 'post',
        slug_atau_tautan: 'berita-detail',
        nama_menu: 'Detail Berita',
        id: null
      });
      setLoading(false);
      return;
    }

    const fetchMenuType = async () => {
      setLoading(true);
      try {
        // `?publik=1` sekaligus menjadi penjaga URL langsung: menu yang
        // dinonaktifkan — atau yang induknya dinonaktifkan — tidak ada di
        // daftar ini, sehingga pencariannya gagal dan halaman "tidak
        // ditemukan" di bawah yang tampil. Tanpa itu, menu tersembunyi masih
        // dapat dibuka siapa pun yang mengetahui atau menebak alamatnya.
        const res = await axiosInstance.get('/api/menus', { params: { publik: 1 } });
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
  }, [menuId, id]);

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
        <NewsCardContent menuId={menuData.id} viewLayout={menuData.tampilan} menuName={menuData.nama_menu} />
      )}

      {/* Detail Berita */}
      {menuData.jenis_menu === 'post' && menuData.slug_atau_tautan === 'berita-detail' && (
        <BeritaDetail lenisRef={lenisRef} />
      )}
    </div>
  );
};

export default GenericPage;
