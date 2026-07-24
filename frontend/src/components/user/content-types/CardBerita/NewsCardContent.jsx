import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../../../api/axiosInstance";
import "./NewsCardContent.css";
import WOWOK from "../../../../assets/source/JanganKorupsi.png";

const NewsCard = ({ title, date, excerpt, imageSrc, link }) => (
  <Link to={link} style={{ textDecoration: 'none', display: 'block' }}>
    <div className="news-card">
    <div className="NewsCard-light-sweep"></div>
    <div className="news-shadow-wrapper">
      <div className="news-content-container">
        <div className="news-image-container">
          {imageSrc && <img src={imageSrc} alt="News Thumbnail" />}
        </div>
      </div>
    </div>

    <div className="liquid L-1"></div>
    <div className="liquid L-2"></div>
    <div className="liquid L-3"></div>
    <div className="liquid L-4"></div>
    <div className="CardNewstext">
      <h2 className="CardNewstitle">{title}</h2>
      <p className="CardNewsdate">{date}</p>
      <p className="CardNewsexcerpt">{excerpt}</p>
    </div>
  </div>
  </Link>
);

const NewsCardContent = ({ menuId, viewLayout }) => {
  const [berita, setBerita] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBerita = async () => {
      if (!menuId) return;
      try {
        const res = await axiosInstance.get(`/api/berita/${menuId}`);
        // Hanya tampilkan berita yang statusnya 'terbit'
        const published = res.data.filter(b => b.status === 'terbit');
        setBerita(published);
      } catch (err) {
        console.error("Gagal memuat berita:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBerita();
  }, [menuId]);

  if (loading) return <div style={{ padding: '100px 40px', textAlign: 'center', color: 'var(--text-main)' }}>Memuat berita...</div>;
  
  if (berita.length === 0) return <div style={{ padding: '100px 40px', textAlign: 'center', color: 'var(--text-main)' }}>Belum ada berita yang diterbitkan.</div>;

  const isVertical = viewLayout === 'Vertikal';

  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: isVertical ? 'nowrap' : 'wrap', 
      flexDirection: isVertical ? 'column' : 'row',
      alignItems: isVertical ? 'center' : 'stretch',
      gap: '30px', 
      padding: '40px', 
      justifyContent: 'center', 
      minHeight: '80vh', 
      alignContent: 'flex-start' 
    }}>
      {berita.map(b => {
        const date = new Date(b.waktu_tayang).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        // Ekstrak text polos dari HTML untuk excerpt
        const tmp = document.createElement('div');
        tmp.innerHTML = b.deskripsi_kaya || '';
        let excerpt = tmp.textContent || tmp.innerText || '';
        if (excerpt.length > 100) excerpt = excerpt.substring(0, 100) + '...';

        return (
          <NewsCard 
            key={b.id} 
            title={b.judul} 
            date={date} 
            excerpt={excerpt} 
            imageSrc={b.url_foto || WOWOK} 
            link={`/berita/berita-${b.id}`}
          />
        );
      })}
    </div>
  );
};

export default NewsCardContent;
