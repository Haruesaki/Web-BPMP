import React from 'react';
import { Link } from 'react-router-dom';
import MediaKosong from '../../../common/MediaKosong';

const CardBerita = ({ title, date, excerpt, imageSrc, link }) => (
  <Link to={link} style={{ textDecoration: 'none', display: 'block' }}>
    <div className="news-card">
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

export default CardBerita;
