import React from 'react';
import './LinkPreviewCard.css';

const LinkPreviewCard = ({ loading, error, data }) => {
  // --- 1. Tampilan Loading (Skeleton) ---
  if (loading) {
    return (
      <div className="preview-card loading">
        <div className="preview-skeleton-img"></div>
        <div className="preview-skeleton-text">
          <div className="preview-skeleton-line"></div>
          <div className="preview-skeleton-line short"></div>
        </div>
      </div>
    );
  }

  // --- 2. Tampilan Error ---
  if (error) {
    return (
      <div className="preview-card error">
        <i className="fa-solid fa-circle-exclamation"></i>
        <span>{error}</span>
      </div>
    );
  }

  // --- 3. Tidak ada data (tampilan default/kosong) ---
  if (!data) {
    return (
      <div className="preview-card empty">
        <i className="fa-solid fa-eye"></i>
        <span>Pratinjau link akan muncul di sini</span>
      </div>
    );
  }

  // --- 4. Tampilan Sukses dengan Data ---
  const { title, description, image, url } = data;
  const displayUrl = url ? new URL(url).hostname : '';

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="preview-card success">
      {image ? (
        <div className="preview-img-wrapper">
          <img src={image} alt={title || 'Link preview'} className="preview-img" />
        </div>
      ) : (
        <div className="preview-img-wrapper no-image">
          <i className="fa-regular fa-image"></i>
        </div>
      )}
      <div className="preview-content">
        <div className="preview-title">{title || 'Judul tidak tersedia'}</div>
        <div className="preview-desc">{description || 'Deskripsi tidak tersedia'}</div>
        <div className="preview-url">{displayUrl}</div>
      </div>
    </a>
  );
};

export default LinkPreviewCard;