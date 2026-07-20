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
  tampilanLogo1,
  setTampilanLogo1,
  tampilanLogo2,
  setTampilanLogo2,
  logoUtamaOptions,
  onSave,
  isSaving,
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

      <button
        className="cb-btn cb-btn-simpan"
        style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <><i className="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...</>
        ) : (
          <><i className="fa-solid fa-save"></i> Simpan Landing Page</>
        )}
      </button>
    </section>
  );
};

export default HeroSetting;
