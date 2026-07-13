import React from 'react';
import './HeroSetting.css';

const HeroSetting = ({
  judulBeranda,
  setJudulBeranda,
  deskripsi,
  setDeskripsi,
  backgroundName,
  backgroundPreview,
  handleBackgroundChange,
  tampilanLogo1,
  setTampilanLogo1,
  tampilanLogo2,
  setTampilanLogo2,
  logoUtamaOptions,
}) => {
  return (
    <section className="cb-card">
      <div className="cb-card-title">
        <i className="fa-solid fa-table-columns"></i>
        <span>Landing Page</span>
      </div>

      <label className="cb-field-label">Judul Beranda</label>
      <input
        type="text"
        className="cb-input"
        placeholder="Masukkan judul utama..."
        value={judulBeranda}
        onChange={(e) => setJudulBeranda(e.target.value)}
      />

      <label className="cb-field-label">Deskripsi</label>
      <textarea
        className="cb-textarea"
        placeholder="Masukkan deskripsi..."
        rows={3}
        value={deskripsi}
        onChange={(e) => setDeskripsi(e.target.value)}
      />

      <div className="cb-grid-2 cb-grid-2-tight">
        <div>
          <label className="cb-field-label">Upload Gambar Background</label>
          <div className="cb-upload-row">
            <label className="cb-btn-upload" htmlFor="bg-input">
              Upload
            </label>
            <input
              id="bg-input"
              type="file"
              accept="image/*"
              className="cb-hidden-input"
              onChange={handleBackgroundChange}
            />
            <span className="cb-upload-filename">{backgroundName || 'Pilih aset latar belakang...'}</span>
          </div>

          <span className="cb-field-label cb-preview-caption">PREVIEW GAMBAR BACKGROUND</span>
          <div className="cb-bg-preview">
            {backgroundPreview ? (
              <img src={backgroundPreview} alt="Preview background" />
            ) : (
              <i className="fa-regular fa-image"></i>
            )}
          </div>
        </div>

        <div className="cb-side-fields">
          <div>
            <label className="cb-field-label">Tampilkan Logo 1</label>
            <div className="cb-select-wrap">
              <select
                className="cb-select"
                value={tampilanLogo1}
                onChange={(e) => setTampilanLogo1(e.target.value)}
              >
                {logoUtamaOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down cb-select-caret"></i>
            </div>
          </div>

          <div>
            <label className="cb-field-label">Tampilkan Logo 2</label>
            <div className="cb-select-wrap">
              <select
                className="cb-select"
                value={tampilanLogo2}
                onChange={(e) => setTampilanLogo2(e.target.value)}
              >
                {logoUtamaOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down cb-select-caret"></i>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSetting;
