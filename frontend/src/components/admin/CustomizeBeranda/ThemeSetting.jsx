import React from 'react';
import './ThemeSetting.css';

const ThemeSetting = ({ selectedTheme, setSelectedTheme, themes, onSave, isSaving, isDirty }) => {
  const activeTheme = themes.find((t) => t.id === selectedTheme) || themes[0];

  return (
    <section className="cb-card">
      <div className="cb-card-title">
        <i className="fa-solid fa-palette"></i>
        <span>Tema</span>
      </div>
      <p className="cb-card-sub">Atur Warna Tema Halaman Beranda</p>

      <div className="cb-theme-grid">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`cb-theme-option ${selectedTheme === theme.id ? 'is-selected' : ''}`}
            onClick={() => setSelectedTheme(theme.id)}
          >
            <span className="cb-theme-swatch" style={{ backgroundColor: theme.hex }}></span>
            <span className="cb-theme-info">
              <span className="cb-theme-name">{theme.label}</span>
              <span className="cb-theme-hex">{theme.hex}</span>
            </span>
            <span className={`cb-theme-check ${selectedTheme === theme.id ? 'is-active' : ''}`}>
              <i className="fa-solid fa-check"></i>
            </span>
          </button>
        ))}
      </div>

      {/* Pratinjau palet lengkap dari preset terpilih — meniru tampilan yang
          akan tampak di halaman pengunjung (latar, teks, aksen). */}
      {activeTheme && (
        <div
          className="cb-theme-preview"
          style={{ backgroundColor: activeTheme.warna_latar, color: activeTheme.warna_teks }}
        >
          <span className="cb-theme-preview-label">Pratinjau</span>
          <span className="cb-theme-preview-title">Beranda BPMP</span>
          <span className="cb-theme-preview-dots">
            <i style={{ backgroundColor: activeTheme.warna_latar }} title="Latar"></i>
            <i style={{ backgroundColor: activeTheme.warna_sekunder }} title="Sekunder"></i>
            <i style={{ backgroundColor: activeTheme.warna_utama }} title="Utama"></i>
            <i style={{ backgroundColor: activeTheme.warna_teks }} title="Teks"></i>
          </span>
          <span
            className="cb-theme-preview-chip"
            style={{ backgroundColor: activeTheme.warna_utama, color: activeTheme.warna_latar }}
          >
            Aksen
          </span>
        </div>
      )}

      <div className="cb-card-actions" style={{ marginTop: '24px', width: '100%' }}>
        <button
          type="button"
          className={`cb-btn cb-btn-simpan ${isDirty ? 'is-dirty' : ''}`}
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onSave}
          disabled={isSaving || !isDirty}
        >
          {isSaving ? (
            <><i className="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...</>
          ) : isDirty ? (
            <><i className="fa-solid fa-save"></i> Simpan Perubahan</>
          ) : (
            <><i className="fa-solid fa-save"></i> Simpan Tema</>
          )}
        </button>
      </div>
    </section>
  );
};

export default ThemeSetting;
