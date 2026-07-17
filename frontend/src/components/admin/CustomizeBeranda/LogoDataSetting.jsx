import React from 'react';
import './LogoDataSetting.css';

const LogoDataSetting = ({
  logoNama,
  setLogoNama,
  logoFileName,
  logoPreview,
  handleLogoFileChange,
  handleSimpanLogo,
  savedLogo,
  setSavedLogo,
  savedLogoOptions,
}) => {
  return (
    <section className="cb-card">
      <div className="cb-card-header-row">
        <div className="cb-card-title">
          <i className="fa-solid fa-gem"></i>
          <span>Data Logo</span>
        </div>
        <div className="cb-card-header-icons">
          <button className="cb-icon-btn" title="Edit">
            <i className="fa-solid fa-pen"></i>
          </button>
          <button className="cb-icon-btn cb-icon-btn-danger" title="Hapus">
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>

      <label className="cb-field-label cb-field-label-caps">Tambahkan Logo</label>

      <div className="cb-logo-form-row">
        <div className="cb-logo-form-fields">
          <input
            type="text"
            className="cb-input"
            placeholder="Nama Logo"
            value={logoNama}
            onChange={(e) => setLogoNama(e.target.value)}
          />

          <div className="cb-upload-row">
            <label className="cb-btn-upload" htmlFor="data-logo-input">
              Telusuri
            </label>
            <input
              id="data-logo-input"
              type="file"
              accept="image/*"
              className="cb-hidden-input"
              onChange={handleLogoFileChange}
            />
            <span className="cb-upload-filename">{logoFileName || 'Upload logo...'}</span>
          </div>
        </div>

        <div className="cb-logo-preview-box">
          {logoPreview ? (
            <img src={logoPreview} alt="Preview logo" className="cb-logo-preview-img" />
          ) : (
            <i className="fa-regular fa-image"></i>
          )}
          <span>PREVIEW LOGO</span>
        </div>
      </div>

      <button className="cb-btn-simpan-logo" onClick={handleSimpanLogo}>
        Simpan Logo
      </button>

      <label className="cb-field-label cb-field-label-caps">Lihat Logo Tersimpan</label>
      <div className="cb-select-wrap">
        <select
          className="cb-select"
          value={savedLogo}
          onChange={(e) => setSavedLogo(e.target.value)}
        >
          {savedLogoOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <i className="fa-solid fa-chevron-down cb-select-caret"></i>
      </div>
    </section>
  );
};

export default LogoDataSetting;
