import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import MediaKosong from '../../../common/MediaKosong';

const CardBerita = ({ title, date, excerpt, imageSrc, link }) => {
  const [isTapped, setIsTapped] = useState(false);
  const tapTimeoutRef = useRef(null);

  const handleTap = () => {
    // Deteksi jika perangkat menggunakan layar sentuh
    const isTouchScreen = window.matchMedia("(hover: none)").matches;
    if (isTouchScreen) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      
      setIsTapped(true);
      // Matikan status tap setelah 1000ms agar posisi hover kembali normal
      tapTimeoutRef.current = setTimeout(() => {
        setIsTapped(false);
      }, 1000);
    }
  };

  useEffect(() => {
    // Membersihkan timer saat komponen di-unmount untuk mencegah kebocoran memori
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  return (
    <Link to={link} style={{ textDecoration: 'none', display: 'block' }} onClick={handleTap}>
      <div className={`news-card ${isTapped ? "hover-active" : ""}`}>
        <div className="NewsCard-light-sweep"></div>
        <div className="news-shadow-wrapper">
          <div className="news-content-container">
            <div className="news-image-container">
              {imageSrc ? (
                <img src={imageSrc} alt="News Thumbnail" loading="lazy" decoding="async" />
              ) : (
                <MediaKosong fill label="Gambar berita belum tersedia" />
              )}
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
};

export default React.memo(CardBerita);
