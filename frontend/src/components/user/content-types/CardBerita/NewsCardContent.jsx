import React from "react";
import "./NewsCardContent.css";
import WOWOK from "../../../../assets/source/JanganKorupsi.png";

const NewsCardContent = ({
  title = "Sepanjang Jalan Kenangan, Kasus Korupsi Selalu Meningkat",
  date = "Selasa, 24 Februari 2026 12:13",
  excerpt = "Ini adalah sebuah pengingat untuk kita semua, jangan pernah korupsi ya manis ganteng cantik...... ",
  imageSrc = WOWOK, // Kosongkan jika ingin background putih seperti di gambar, atau isi path/URL gambar
}) => {
  return (
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
  );
};

export default NewsCardContent;
