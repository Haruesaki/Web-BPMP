import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axiosInstance from "../../../../api/axiosInstance";
import "./NewsCardContent.css";
import LazyLoadWrapper from "../CardProfile/LazyLoadWrapper";
import CardBerita from "./CardBerita";
import Pagination from "../CardProfile/Pagination";

const getItemsPerPage = (width, isVertical) => {
  if (isVertical) return 8;    // Default statis untuk layout vertikal 1 kolom
  if (width >= 1775) return 8; // Desktop lebar: 4 kolom x 2 baris = 8 card (baris pertama 4 card, baris kedua 4 card)
  if (width >= 1385) return 6; // Desktop standar: 1 baris 3 card = 3 card
  if (width >= 768) return 4;  // Tablet: 1 baris 2 card = 2 card
  return 4;                    // Mobile: 1 baris 1 card = 1 card
};

const NewsCardContent = ({ menuId, viewLayout, menuName }) => {
  const [berita, setBerita] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const location = useLocation();

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

  // Fungsi untuk hitung total halaman
  const totalPages = Math.ceil(berita.length / itemsPerPage);

  // Otomatis reset ke halaman 1 setiap kali kapasitas per halaman (itemsPerPage)
  // berubah akibat resize layar agar susunan kartu kembali segar dari awal.
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Handler perpindahan halaman otomatis jika target hash berada di halaman ke-2, ke-3, dst.
  useEffect(() => {
    const targetId = location.hash.substring(1);
    if (targetId && berita.length > 0 && !loading) {
      const parts = targetId.split('-');
      const actualId = parseInt(parts[2]); // format targetId: 'content-berita-ID'
      
      if (!isNaN(actualId)) {
        const targetIndex = berita.findIndex(b => b.id === actualId);
        if (targetIndex !== -1) {
          const targetPage = Math.floor(targetIndex / itemsPerPage) + 1;
          if (currentPage !== targetPage) {
            setCurrentPage(targetPage);
          }
        }
      }
    }
  }, [location.hash, berita, loading, itemsPerPage]);

  // Efek Auto-Scroll setelah data berita berhasil dimuat secara dinamis
  useEffect(() => {
    const targetId = location.hash.substring(1);
    
    // Pastikan kita sudah berada di halaman yang tepat sebelum men-scroll
    const parts = targetId.split('-');
    const actualId = parseInt(parts[2]);
    let isOnCorrectPage = true;
    
    if (targetId && berita.length > 0 && !isNaN(actualId)) {
      const targetIndex = berita.findIndex(b => b.id === actualId);
      if (targetIndex !== -1) {
        const targetPage = Math.floor(targetIndex / itemsPerPage) + 1;
        if (currentPage !== targetPage) {
          isOnCorrectPage = false;
        }
      }
    }

    if (targetId && berita.length > 0 && !loading && isOnCorrectPage) {
      let attempts = 0;
      const maxAttempts = 15; // Coba selama 1.5 detik
      
      const tryScroll = () => {
        const element = document.getElementById(targetId);
        if (element) {
          // Ambil tinggi header secara dinamis dari root CSS
          const headerHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 80;
          const rect = element.getBoundingClientRect();
          const targetOffset = rect.top + window.scrollY - headerHeight;
          
          if (window.lenis) {
            // Paksa Lenis memperbarui dimensi halaman secara instan
            window.lenis.resize();
            window.lenis.scrollTo(element, { offset: -headerHeight, immediate: false });
          } else {
            // Fallback koordinat absolut jika Lenis tidak aktif
            window.scrollTo({ top: targetOffset, behavior: 'smooth' });
          }
          
          attempts++;
          
          // DETEKSI KEMACETAN: Jika setelah 2 kali percobaan (sekitar 300ms) posisi scroll masih tertahan di atas (0)
          // padahal target berada di bawah (targetOffset > 50), paksa lompatan instan menggunakan browser native
          // agar posisi scroll terjamin berpindah ke target konten.
          if (attempts >= 2 && window.scrollY === 0 && targetOffset > 50) {
            element.scrollIntoView({ behavior: 'auto', block: 'center' });
            return;
          }

          // Coba lagi beberapa kali secara berkala untuk menangani pergeseran layout akibat pemuatan gambar
          if (attempts < 5) {
            setTimeout(tryScroll, 150);
          }
        } else {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(tryScroll, 100);
          }
        }
      };

      const timer = setTimeout(tryScroll, 200);
      return () => clearTimeout(timer);
    }
  }, [location.hash, berita, loading, currentPage, itemsPerPage]);

  useEffect(() => {
    const fetchBerita = async () => {
      if (!menuId) return;
      try {
        const res = await axiosInstance.get(`/api/berita/${menuId}`);
        setBerita(res.data || []);
      } catch (err) {
        console.error("Gagal memuat berita:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBerita();
    setCurrentPage(1); // Reset ke halaman 1 setiap kali kategori menu berubah
  }, [menuId]);

  // Fungsi untuk mengubah halaman
  const handlePageChange = (page) => setCurrentPage(page);

  if (loading) return <div style={{ padding: '100px 40px', textAlign: 'center', color: 'var(--text-main)' }}>Memuat berita...</div>;
  
  if (berita.length === 0) return <div style={{ padding: '100px 40px', textAlign: 'center', color: 'var(--text-main)' }}>Belum ada berita pada halaman ini.</div>;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBerita = berita.slice(startIndex, endIndex);

  return (
    <div className="news-content-wrapper">
      {menuName && (
        <div className="page-content-header">
          <h1>{menuName}</h1>
        </div>
      )}

      <div 
        className="news-layout-grid" 
        style={{ 
          flexDirection: isVertical ? 'column' : 'row', 
          flexWrap: isVertical ? 'nowrap' : 'wrap' 
        }}
      >
        {currentBerita.map((b, index) => {
          // `waktu_tayang` baru terisi ketika berita diaktifkan tayang di Beranda,
          // sehingga berita biasa bernilai null. Tanpa cadangan, `new Date(null)`
          // akan jatuh ke epoch dan tertulis "1 Januari 1970" pada kartu.
          const sumberTanggal = b.waktu_tayang || b.dibuat_pada;
          const date = sumberTanggal
            ? new Date(sumberTanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '';
          
          // Ekstrak text polos dari HTML untuk excerpt secara aman tanpa memicu rendering DOM memori
          const plainText = (b.deskripsi_kaya || '').replace(/<[^>]*>/g, '');
          let excerpt = plainText;
          if (excerpt.length > 100) excerpt = excerpt.substring(0, 100) + '...';

          return (
            <LazyLoadWrapper 
              key={b.id || index}
              placeholderHeight="408.5px"
              placeholderWidth="323px"
            >
              <div id={`content-berita-${b.id}`} style={{ width: isVertical ? '100%' : 'auto', display: 'flex', justifyContent: 'center' }}>
                <CardBerita 
                  title={b.judul} 
                  date={date} 
                  excerpt={excerpt} 
                  imageSrc={b.url_foto || null}
                  link={`/berita/berita-${b.id}`}
                />
              </div>
            </LazyLoadWrapper>
          );
        })}
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

export default NewsCardContent;
