import React from 'react';
import './ThemeSetting.css';

const ThemeSetting = ({ selectedTheme, setSelectedTheme, themes }) => {
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
    </section>
  );
};

export default ThemeSetting;
