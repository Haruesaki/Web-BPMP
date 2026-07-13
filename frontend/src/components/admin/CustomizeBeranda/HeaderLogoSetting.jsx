import React from 'react';
import './HeaderLogoSetting.css';

const HeaderLogoSetting = ({ headerLogoPreview, headerLogoName, handleHeaderLogoChange }) => {
  return (
    <section className="cb-card">
      <div className="cb-card-title">
        <i className="fa-solid fa-heading"></i>
        <span>Header</span>
      </div>

      <label className="cb-field-label">Logo Utama Website</label>
      <label className="cb-logo-drop" htmlFor="header-logo-input">
        {headerLogoPreview ? (
          <img src={headerLogoPreview} alt="Preview logo header" className="cb-logo-drop-img" />
        ) : (
          <span className="cb-logo-drop-placeholder">
            <i className="fa-regular fa-file"></i>
          </span>
        )}
        <span className="cb-logo-drop-overlay">
          <i className="fa-solid fa-pen"></i> Ganti Logo
        </span>
      </label>
      <input
        id="header-logo-input"
        type="file"
        accept="image/*"
        className="cb-hidden-input"
        onChange={handleHeaderLogoChange}
      />

      <div className="cb-upload-row">
        <label className="cb-btn-upload" htmlFor="header-logo-input-2">
          Telusuri...
        </label>
        <input
          id="header-logo-input-2"
          type="file"
          accept="image/*"
          className="cb-hidden-input"
          onChange={handleHeaderLogoChange}
        />
        <span className="cb-upload-filename">{headerLogoName || 'Tidak ada berkas dipilih.'}</span>
      </div>
    </section>
  );
};

export default HeaderLogoSetting;
