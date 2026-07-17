import './HeaderLogoSetting.css';

const HeaderLogoSetting = ({
  headerLogoPreview,
  headerLogoName,
  headerLogoInputKey,
  handleHeaderLogoChange,
  handleHeaderLogoRemove,
}) => {
  return (
    <section className="cb-card">
      <div className="cb-card-title">
        <i className="fa-solid fa-heading"></i>
        <span>Header</span>
      </div>

      <label className="cb-field-label">Logo Utama Website (rasio 1:1)</label>
      <label className="cb-logo-drop" htmlFor="header-logo-input">
        {headerLogoPreview ? (
          <>
            <button
              type="button"
              className="cb-logo-remove"
              aria-label="Hapus logo header"
              title="Hapus logo header"
              onClick={(event) => {
                event.preventDefault();
                handleHeaderLogoRemove();
              }}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
            <img src={headerLogoPreview} alt="Preview logo header" className="cb-logo-drop-img" />
          </>
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
        key={`drop-${headerLogoInputKey}`}
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
          key={`row-${headerLogoInputKey}`}
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
