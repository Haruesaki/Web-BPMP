import React, { useState } from 'react';
// Halaman ini di-render sebagai konten di dalam <AdminLayout> (yang sudah
// menyediakan sidebar, header, dan wrapper .admin-layout). Jadi cukup return
// <main className="admin-content"> saja — tanpa AdminSidebar/AdminHeader.
// Reuse tema & layout dari dashboard-admin (variabel CSS --bg-app, dst.
// dideklarasikan di scope ".admin-layout" pada dashboard-admin.css).
import '../DashboardAdmin/dashboard-admin.css';
import './CustomizeBeranda.css';

// =========================================================================
//  DATA AWAL
//  -----------------------------------------------------------------------
//  Nanti tinggal diganti fetch ke backend (GET /api/beranda-settings).
// =========================================================================
const THEMES = [
  { id: 'dark-navy', label: 'Dark Navy', hex: '#0B132B' },
  { id: 'saffron-gold', label: 'Saffron Gold', hex: '#FAB12F' },
  { id: 'forest-green', label: 'Forest Green', hex: '#2B5748' },
];

// Opsi menu untuk dropdown "Tampilkan Logo" & "Menu" pada Sections.
const MENU_OPTIONS = [
  'Berita',
  'Logo Mitra',
  'Preview Media Sosial Instagram',
  'Preview Media Sosial YouTube',
  'Program',
  'Profil',
  'Reformasi Birokrasi',
];

const LOGO_UTAMA_OPTIONS = ['Pilih Logo Utama', 'Kemendikdasmen', 'BPMP Lampung', 'Dinas Pendidikan'];
const SAVED_LOGO_OPTIONS = ['Dinas Pendidikan', 'Kemendikdasmen', 'BPMP Lampung'];

let uid = 100; // helper id lokal untuk baris dinamis (social, section, tautan)
const nextId = () => uid++;

const CustomizeBeranda = () => {
  // ---------- TEMA ----------
  const [selectedTheme, setSelectedTheme] = useState('dark-navy');

  // ---------- HEADER (Logo Utama Website) ----------
  const [headerLogoPreview, setHeaderLogoPreview] = useState(null);
  const [headerLogoName, setHeaderLogoName] = useState('');

  const handleHeaderLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeaderLogoName(file.name);
    setHeaderLogoPreview(URL.createObjectURL(file));
  };

  // ---------- DATA LOGO ----------
  const [logoNama, setLogoNama] = useState('');
  const [logoFileName, setLogoFileName] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [savedLogo, setSavedLogo] = useState(SAVED_LOGO_OPTIONS[0]);

  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFileName(file.name);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSimpanLogo = () => {
    if (!logoNama.trim()) return;
    // TODO: kirim ke backend (POST /api/logos)
    setLogoNama('');
    setLogoFileName('');
    setLogoPreview(null);
  };

  // ---------- LANDING PAGE ----------
  const [judulBeranda, setJudulBeranda] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [backgroundName, setBackgroundName] = useState('');
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [tampilanLogo1, setTampilanLogo1] = useState(LOGO_UTAMA_OPTIONS[0]);
  const [tampilanLogo2, setTampilanLogo2] = useState(LOGO_UTAMA_OPTIONS[0]);

  const handleBackgroundChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackgroundName(file.name);
    setBackgroundPreview(URL.createObjectURL(file));
  };

  // ---------- MEDIA SOSIAL ----------
  const [socials, setSocials] = useState([
    { id: nextId(), label: 'Instagram', url: 'https://instagram.com/kemdikbud', avatar: null },
    { id: nextId(), label: 'Facebook', url: 'https://facebook.com/kemdikbud', avatar: null },
  ]);

  const updateSocial = (id, field, value) =>
    setSocials((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const handleSocialAvatarChange = (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateSocial(id, 'avatar', URL.createObjectURL(file));
  };

  const tambahPlatform = () =>
    setSocials((prev) => [...prev, { id: nextId(), label: '', url: '', avatar: null }]);

  const hapusPlatform = (id) => setSocials((prev) => prev.filter((s) => s.id !== id));

  // ---------- SECTIONS HALAMAN BERANDA ----------
  const [sections, setSections] = useState([
    { id: nextId(), menu: 'Berita', judul: 'Berita Terkini' },
    { id: nextId(), menu: 'Logo Mitra', judul: 'Mitra Kami' },
    { id: nextId(), menu: 'Preview Media Sosial Instagram', judul: 'Instagram' },
    { id: nextId(), menu: 'Preview Media Sosial YouTube', judul: 'YouTube' },
  ]);

  const updateSection = (id, field, value) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const tambahSection = () =>
    setSections((prev) => [...prev, { id: nextId(), menu: MENU_OPTIONS[0], judul: '' }]);

  const hapusSection = (id) => setSections((prev) => prev.filter((s) => s.id !== id));

  // ---------- FOOTER ----------
  const [footer, setFooter] = useState({ email: '', telepon: '', alamat: '' });
  const [googleMaps, setGoogleMaps] = useState('');
  const [tautan, setTautan] = useState([
    { id: nextId(), label: 'Portal Layanan', link: '' },
    { id: nextId(), label: 'Portal Layanan', link: '' },
    { id: nextId(), label: 'Portal Layanan', link: '' },
    { id: nextId(), label: 'Portal Layanan', link: '' },
    { id: nextId(), label: 'Portal Layanan', link: '' },
  ]);

  const updateTautan = (id, field, value) =>
    setTautan((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));

  const tambahTautan = () =>
    setTautan((prev) => [...prev, { id: nextId(), label: '', link: '' }]);

  const hapusTautan = (id) => setTautan((prev) => prev.filter((t) => t.id !== id));

  const handleSimpanPerubahan = () => {
    // TODO: kumpulkan seluruh state di atas dan kirim ke backend
    // (PUT /api/beranda-settings)
    console.log('Simpan perubahan Customize Beranda');
  };

  return (
    <main className="admin-content">
      {/* ---------- HEADING + AKSI ---------- */}
      <div className="cb-header">
        <div className="cb-heading">
          <h1>Customize Beranda</h1>
          <p>Kelola tampilan menu di halaman beranda.</p>
        </div>
        <div className="cb-header-actions">
          <button className="cb-btn cb-btn-batal">Batal</button>
          <button className="cb-btn cb-btn-simpan" onClick={handleSimpanPerubahan}>
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* ---------- TEMA ---------- */}
      <section className="cb-card">
        <div className="cb-card-title">
          <i className="fa-solid fa-palette"></i>
          <span>Tema</span>
        </div>
        <p className="cb-card-sub">Atur Warna Tema Halaman Beranda</p>

        <div className="cb-theme-grid">
          {THEMES.map((theme) => (
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

      {/* ---------- HEADER & DATA LOGO ---------- */}
      <div className="cb-grid-2">
        {/* ===== HEADER ===== */}
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

        {/* ===== DATA LOGO ===== */}
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
              {SAVED_LOGO_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <i className="fa-solid fa-chevron-down cb-select-caret"></i>
          </div>
        </section>
      </div>

      {/* ---------- LANDING PAGE ---------- */}
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
                  {LOGO_UTAMA_OPTIONS.map((opt) => (
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
                  {LOGO_UTAMA_OPTIONS.map((opt) => (
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

      {/* ---------- MEDIA SOSIAL ---------- */}
      <section className="cb-card">
        <div className="cb-card-title">
          <i className="fa-solid fa-share-nodes"></i>
          <span>Media Sosial</span>
        </div>

        <div className="cb-social-list">
          {socials.map((social) => (
            <div className="cb-social-row" key={social.id}>
              <label className="cb-social-avatar" htmlFor={`social-avatar-${social.id}`}>
                {social.avatar ? (
                  <img src={social.avatar} alt={social.label || 'Avatar platform'} />
                ) : (
                  <i className="fa-regular fa-image"></i>
                )}
              </label>
              <input
                id={`social-avatar-${social.id}`}
                type="file"
                accept="image/*"
                className="cb-hidden-input"
                onChange={(e) => handleSocialAvatarChange(social.id, e)}
              />

              <div className="cb-social-field">
                <label className="cb-field-label cb-field-label-caps">Label</label>
                <input
                  type="text"
                  className="cb-input"
                  value={social.label}
                  onChange={(e) => updateSocial(social.id, 'label', e.target.value)}
                  placeholder="Instagram"
                />
              </div>

              <div className="cb-social-field">
                <label className="cb-field-label cb-field-label-caps">URL Link</label>
                <input
                  type="text"
                  className="cb-input"
                  value={social.url}
                  onChange={(e) => updateSocial(social.id, 'url', e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <button
                className="cb-icon-btn cb-icon-btn-danger"
                title="Hapus"
                onClick={() => hapusPlatform(social.id)}
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          ))}
        </div>

        <button className="cb-btn-dashed" onClick={tambahPlatform}>
          <i className="fa-solid fa-plus"></i> Tambah Platform
        </button>
      </section>

      {/* ---------- SECTIONS HALAMAN BERANDA ---------- */}
      <section className="cb-card">
        <div className="cb-card-title">
          <i className="fa-solid fa-table-cells"></i>
          <span>Sections Halaman Beranda</span>
        </div>

        <div className="cb-section-grid">
          {sections.map((section) => (
            <div className="cb-section-box" key={section.id}>
              <button
                className="cb-icon-btn cb-icon-btn-danger cb-section-delete"
                title="Hapus section"
                onClick={() => hapusSection(section.id)}
              >
                <i className="fa-solid fa-trash"></i>
              </button>

              <label className="cb-field-label">Menu</label>
              <div className="cb-select-wrap">
                <select
                  className="cb-select"
                  value={section.menu}
                  onChange={(e) => updateSection(section.id, 'menu', e.target.value)}
                >
                  {MENU_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down cb-select-caret"></i>
              </div>

              <label className="cb-field-label">Judul Section</label>
              <input
                type="text"
                className="cb-input"
                value={section.judul}
                onChange={(e) => updateSection(section.id, 'judul', e.target.value)}
              />
            </div>
          ))}
        </div>

        <button className="cb-btn-dashed" onClick={tambahSection}>
          <i className="fa-solid fa-plus"></i> Tambah Section
        </button>
      </section>

      {/* ---------- FOOTER ---------- */}
      <section className="cb-card">
        <div className="cb-card-title">
          <i className="fa-regular fa-comment-dots"></i>
          <span>Footer</span>
        </div>

        <div className="cb-grid-2">
          {/* Hubungi Kami + Lokasi */}
          <div className="cb-footer-col">
            <div className="cb-footer-box">
              <h3 className="cb-footer-title">Hubungi Kami</h3>

              <label className="cb-field-label">Email</label>
              <input
                type="email"
                className="cb-input"
                placeholder="admin@instansi.go.id"
                value={footer.email}
                onChange={(e) => setFooter((prev) => ({ ...prev, email: e.target.value }))}
              />

              <label className="cb-field-label">No. Telepon</label>
              <input
                type="text"
                className="cb-input"
                placeholder="(021) 1234567"
                value={footer.telepon}
                onChange={(e) => setFooter((prev) => ({ ...prev, telepon: e.target.value }))}
              />

              <label className="cb-field-label">Alamat</label>
              <textarea
                className="cb-textarea"
                rows={2}
                placeholder="Jl. Jenderal Sudirman No. 1..."
                value={footer.alamat}
                onChange={(e) => setFooter((prev) => ({ ...prev, alamat: e.target.value }))}
              />
            </div>

            <div className="cb-footer-box">
              <h3 className="cb-footer-title">Lokasi</h3>

              <label className="cb-field-label">Link Google Maps</label>
              <input
                type="text"
                className="cb-input"
                placeholder="https://goo.gl/maps/..."
                value={googleMaps}
                onChange={(e) => setGoogleMaps(e.target.value)}
              />
            </div>
          </div>

          {/* Tautan */}
          <div className="cb-footer-box">
            <h3 className="cb-footer-title">Tautan</h3>

            {tautan.map((item) => (
              <div className="cb-tautan-row" key={item.id}>
                <div className="cb-tautan-field">
                  <label className="cb-field-label">Label</label>
                  <input
                    type="text"
                    className="cb-input"
                    value={item.label}
                    onChange={(e) => updateTautan(item.id, 'label', e.target.value)}
                  />
                </div>
                <div className="cb-tautan-field">
                  <label className="cb-field-label">Link</label>
                  <input
                    type="text"
                    className="cb-input"
                    placeholder="https://tautan..."
                    value={item.link}
                    onChange={(e) => updateTautan(item.id, 'link', e.target.value)}
                  />
                </div>
                <button
                  className="cb-icon-btn cb-icon-btn-danger cb-tautan-delete"
                  title="Hapus tautan"
                  onClick={() => hapusTautan(item.id)}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}

            <button className="cb-btn-dashed" onClick={tambahTautan}>
              <i className="fa-solid fa-plus"></i> Tambah Link
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default CustomizeBeranda;