import React, { useState } from 'react';
// Halaman ini di-render sebagai konten di dalam <AdminLayout> (yang sudah
// menyediakan sidebar, header, dan wrapper .admin-layout). Jadi cukup return
// <main className="admin-content"> saja — tanpa AdminSidebar/AdminHeader.
// Reuse tema & layout dari dashboard-admin (variabel CSS --bg-app, dst.
// dideklarasikan di scope ".admin-layout" pada dashboard-admin.css).
import '../DashboardAdmin/dashboard-admin.css';
import './CustomizeBeranda.css';

// Import subcomponents
import ThemeSetting from '../../../components/admin/CustomizeBeranda/ThemeSetting';
import HeaderLogoSetting from '../../../components/admin/CustomizeBeranda/HeaderLogoSetting';
import LogoDataSetting from '../../../components/admin/CustomizeBeranda/LogoDataSetting';
import HeroSetting from '../../../components/admin/CustomizeBeranda/HeroSetting';
import SocialMediaSetting from '../../../components/admin/CustomizeBeranda/SocialMediaSetting';
import SectionOrderSetting from '../../../components/admin/CustomizeBeranda/SectionOrderSetting';
import FooterSetting from '../../../components/admin/CustomizeBeranda/FooterSetting';

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

// Opsi menu untuk dropdown "Menu" pada Sections Halaman Beranda.
const MENU_OPTIONS = [
  'Berita',
  'Logo Mitra',
  'Preview Media Sosial Instagram',
  'Preview Media Sosial YouTube',
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
      {/* <ThemeSetting
        selectedTheme={selectedTheme}
        setSelectedTheme={setSelectedTheme}
        themes={THEMES}
      /> */}

      {/* ---------- HEADER & DATA LOGO ---------- */}
      {/* <div className="cb-grid-2">
        <HeaderLogoSetting
          headerLogoPreview={headerLogoPreview}
          headerLogoName={headerLogoName}
          handleHeaderLogoChange={handleHeaderLogoChange}
        />

        <LogoDataSetting
          logoNama={logoNama}
          setLogoNama={setLogoNama}
          logoFileName={logoFileName}
          logoPreview={logoPreview}
          handleLogoFileChange={handleLogoFileChange}
          handleSimpanLogo={handleSimpanLogo}
          savedLogo={savedLogo}
          setSavedLogo={setSavedLogo}
          savedLogoOptions={SAVED_LOGO_OPTIONS}
        />
      </div> */}

      {/* ---------- LANDING PAGE ---------- */}
      {/* <HeroSetting
        judulBeranda={judulBeranda}
        setJudulBeranda={setJudulBeranda}
        deskripsi={deskripsi}
        setDeskripsi={setDeskripsi}
        backgroundName={backgroundName}
        backgroundPreview={backgroundPreview}
        handleBackgroundChange={handleBackgroundChange}
        tampilanLogo1={tampilanLogo1}
        setTampilanLogo1={setTampilanLogo1}
        tampilanLogo2={tampilanLogo2}
        setTampilanLogo2={setTampilanLogo2}
        logoUtamaOptions={LOGO_UTAMA_OPTIONS}
      /> */}

      {/* ---------- MEDIA SOSIAL ---------- */}
      {/* <SocialMediaSetting
        socials={socials}
        updateSocial={updateSocial}
        handleSocialAvatarChange={handleSocialAvatarChange}
        tambahPlatform={tambahPlatform}
        hapusPlatform={hapusPlatform}
      /> */}

      {/* ---------- SECTIONS HALAMAN BERANDA ---------- */}
      <SectionOrderSetting
        sections={sections}
        setSections={setSections}
        updateSection={updateSection}
        tambahSection={tambahSection}
        hapusSection={hapusSection}
        menuOptions={MENU_OPTIONS}
      />

      {/* ---------- FOOTER ---------- */}
      {/* <FooterSetting
        footer={footer}
        setFooter={setFooter}
        googleMaps={googleMaps}
        setGoogleMaps={setGoogleMaps}
        tautan={tautan}
        updateTautan={updateTautan}
        tambahTautan={tambahTautan}
        hapusTautan={hapusTautan}
      /> */}
    </main>
  );
};

export default CustomizeBeranda;