import './HeroSetting.css';

const HeroSetting = ({
  judulBeranda,
  setJudulBeranda,
  deskripsi,
  setDeskripsi,
  backgroundName,
  backgroundPreview,
  backgroundInputKey,
  handleBackgroundChange,
  handleBackgroundRemove,
  logo1Preview,
  logo1InputKey,
  handleLogo1Change,
  handleLogo1Remove,
  logo2Preview,
  logo2InputKey,
  handleLogo2Change,
  handleLogo2Remove,
  onSave,
  isSaving,
  isDirty,
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
        placeholder="Masukan Teks"
        value={judulBeranda}
        onChange={(e) => setJudulBeranda(e.target.value)}
      />

      <label className="cb-field-label">Deskripsi</label>
      <textarea
        className="cb-textarea"
        placeholder="Masukan Teks"
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
              key={backgroundInputKey}
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
              <>
                <button
                  type="button"
                  className="cb-bg-remove"
                  aria-label="Hapus gambar background"
                  title="Hapus gambar background"
                  onClick={handleBackgroundRemove}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                </button>
                <img src={backgroundPreview} alt="Preview background" />
              </>
            ) : (
              <i className="fa-regular fa-image"></i>
            )}
          </div>
        </div>

        <div className="cb-side-fields">
          <div>
            <label className="cb-field-label">Tampilkan Logo 1</label>
            <div className="hero-logo-upload">
              <div className="hero-logo-preview">
                {logo1Preview ? (
                  <>
                    <img src={logo1Preview} alt="Preview logo 1" />
                    <button
                      type="button"
                      className="hero-logo-remove"
                      aria-label="Hapus logo 1"
                      title="Hapus logo 1"
                      onClick={handleLogo1Remove}
                    >
                      <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                  </>
                ) : (
                  <i className="fa-regular fa-image"></i>
                )}
              </div>
              <label className="cb-btn-upload hero-logo-btn" htmlFor="logo1-input">
                <i className="fa-solid fa-upload"></i> Upload
              </label>
              <input
                key={logo1InputKey}
                id="logo1-input"
                type="file"
                accept="image/*"
                className="cb-hidden-input"
                onChange={handleLogo1Change}
              />
            </div>
          </div>

          <div>
            <label className="cb-field-label">Tampilkan Logo 2</label>
            <div className="hero-logo-upload">
              <div className="hero-logo-preview">
                {logo2Preview ? (
                  <>
                    <img src={logo2Preview} alt="Preview logo 2" />
                    <button
                      type="button"
                      className="hero-logo-remove"
                      aria-label="Hapus logo 2"
                      title="Hapus logo 2"
                      onClick={handleLogo2Remove}
                    >
                      <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                  </>
                ) : (
                  <i className="fa-regular fa-image"></i>
                )}
              </div>
              <label className="cb-btn-upload hero-logo-btn" htmlFor="logo2-input">
                <i className="fa-solid fa-upload"></i> Upload
              </label>
              <input
                key={logo2InputKey}
                id="logo2-input"
                type="file"
                accept="image/*"
                className="cb-hidden-input"
                onChange={handleLogo2Change}
              />
            </div>
          </div>
        </div>
      </div>

      <button
        className={`cb-btn cb-btn-simpan ${isDirty ? 'is-dirty' : ''}`}
        style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
        onClick={onSave}
        disabled={isSaving || !isDirty}
      >
        {isSaving ? (
          <><i className="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...</>
        ) : isDirty ? (
          <><i className="fa-solid fa-save"></i> Simpan Perubahan</>
        ) : (
          <><i className="fa-solid fa-save"></i> Simpan Landing Page</>
        )}
      </button>
    </section>
  );
};

export default HeroSetting;
