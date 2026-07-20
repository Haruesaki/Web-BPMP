import { useEffect, useMemo, useState } from 'react';
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
import axiosInstance from '../../../api/axiosInstance';

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
  'Kosong',
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
  const [isSaveSuccessOpen, setIsSaveSuccessOpen] = useState(false);
  const [isLogoSaveSuccessOpen, setIsLogoSaveSuccessOpen] = useState(false);
  const [isSavingHero, setIsSavingHero] = useState(false);

  // ---------- TEMA ----------
  const [selectedTheme, setSelectedTheme] = useState('dark-navy');

  // ---------- HEADER (Logo Utama Website) ----------
  const [headerLogoPreview, setHeaderLogoPreview] = useState(null);
  const [headerLogoName, setHeaderLogoName] = useState('');
  const [headerLogoFile, setHeaderLogoFile] = useState(null);
  const [savedHeaderLogoUrl, setSavedHeaderLogoUrl] = useState(null);
  const [headerLogoInputKey, setHeaderLogoInputKey] = useState(0);
  const [savedHeaderForm, setSavedHeaderForm] = useState(null);

  const currentHeaderForm = useMemo(() => ({
    logoUrl: savedHeaderLogoUrl,
  }), [savedHeaderLogoUrl]);

  const hasHeaderChanges = Boolean(
    savedHeaderForm && (
      headerLogoFile ||
      currentHeaderForm.logoUrl !== savedHeaderForm.logoUrl
    )
  );

  const handleHeaderLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeaderLogoName(file.name);
    setHeaderLogoFile(file);
    setHeaderLogoPreview(URL.createObjectURL(file));
  };

  const handleHeaderLogoRemove = () => {
    setHeaderLogoName('');
    setHeaderLogoPreview(null);
    setHeaderLogoFile(null);
    setSavedHeaderLogoUrl(null);
    setHeaderLogoInputKey((prev) => prev + 1);
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
    setIsLogoSaveSuccessOpen(true); // Tampilkan modal sukses
  };

  // ---------- LANDING PAGE ----------
  const [judulBeranda, setJudulBeranda] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [backgroundName, setBackgroundName] = useState('');
  const [backgroundPreview, setBackgroundPreview] = useState(null);
  const [backgroundFile, setBackgroundFile] = useState(null);
  const [savedBackgroundUrl, setSavedBackgroundUrl] = useState(null);
  const [backgroundInputKey, setBackgroundInputKey] = useState(0);
  const [tampilanLogo1, setTampilanLogo1] = useState(LOGO_UTAMA_OPTIONS[0]);
  const [tampilanLogo2, setTampilanLogo2] = useState(LOGO_UTAMA_OPTIONS[0]);
  const [savedHeroForm, setSavedHeroForm] = useState(null);

  const currentHeroForm = useMemo(() => ({
    judul: judulBeranda,
    deskripsi,
    backgroundUrl: savedBackgroundUrl,
    logo1: tampilanLogo1,
    logo2: tampilanLogo2,
  }), [judulBeranda, deskripsi, savedBackgroundUrl, tampilanLogo1, tampilanLogo2]);

  const hasHeroChanges = Boolean(
    savedHeroForm && (
      backgroundFile ||
      currentHeroForm.judul !== savedHeroForm.judul ||
      currentHeroForm.deskripsi !== savedHeroForm.deskripsi ||
      currentHeroForm.backgroundUrl !== savedHeroForm.backgroundUrl ||
      currentHeroForm.logo1 !== savedHeroForm.logo1 ||
      currentHeroForm.logo2 !== savedHeroForm.logo2
    )
  );

  const hasPageChanges = hasHeaderChanges || hasHeroChanges;

  useEffect(() => {
    let isMounted = true;

    const loadBerandaSettings = async () => {
      try {
        const [headerResponse, heroResponse, mitraResponse, footerResponse, tautanResponse] = await Promise.all([
          axiosInstance.get('/api/beranda/header'),
          axiosInstance.get('/api/beranda/hero'),
          axiosInstance.get('/api/beranda/mitra'),
          axiosInstance.get('/api/beranda/footer'),
          axiosInstance.get('/api/beranda/tautan-footer'),
        ]);
        const header = headerResponse.data?.data;
        const hero = heroResponse.data?.data;
        const mitraData = mitraResponse.data?.data || [];
        const footerData = footerResponse?.data?.data || {};
        const tautanData = tautanResponse?.data?.data || [];

        if (!hero || !isMounted) return;

        const loadedHeaderForm = {
          logoUrl: header?.url_logo_header || null,
        };
        const loadedHeroForm = {
          judul: hero.judul || '',
          deskripsi: hero.subjudul || '',
          backgroundUrl: hero.url_gambar || null,
          logo1: hero.logo_1 || LOGO_UTAMA_OPTIONS[0],
          logo2: hero.logo_2 || LOGO_UTAMA_OPTIONS[0],
        };

        setFooter({
          email: footerData.posel || '',
          telepon: footerData.no_telepon || '',
          alamat: footerData.alamat || '',
        });
        setGoogleMaps(footerData.url_google_map || '');

        if (tautanData.length > 0) {
          setTautan(tautanData.map(t => ({ id: nextId(), label: t.label, link: t.url })));
        }

        setSavedHeaderLogoUrl(loadedHeaderForm.logoUrl);
        setHeaderLogoPreview(loadedHeaderForm.logoUrl);
        setHeaderLogoName(loadedHeaderForm.logoUrl ? loadedHeaderForm.logoUrl.split('/').pop() : '');
        setSavedHeaderForm(loadedHeaderForm);

        setJudulBeranda(loadedHeroForm.judul);
        setDeskripsi(loadedHeroForm.deskripsi);
        setSavedBackgroundUrl(loadedHeroForm.backgroundUrl);
        setBackgroundPreview(loadedHeroForm.backgroundUrl);
        setBackgroundName(loadedHeroForm.backgroundUrl ? loadedHeroForm.backgroundUrl.split('/').pop() : '');
        setTampilanLogo1(loadedHeroForm.logo1);
        setTampilanLogo2(loadedHeroForm.logo2);
        setSavedHeroForm(loadedHeroForm);

        if (mitraData.length > 0) {
          setMitraList(
            mitraData.map((m) => ({
              id: m.id,
              preview: m.url_logo,
              file: null,
            }))
          );
        } else {
          setMitraList([]);
        }
      } catch (error) {
        console.error('Gagal mengambil pengaturan Customize Beranda:', error);
      }
    };

    loadBerandaSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBackgroundChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackgroundName(file.name);
    setBackgroundFile(file);
    setBackgroundPreview(URL.createObjectURL(file));
  };

  const handleBackgroundRemove = () => {
    setBackgroundName('');
    setBackgroundPreview(null);
    setBackgroundFile(null);
    setSavedBackgroundUrl(null);
    setBackgroundInputKey((prev) => prev + 1);
  };

  const handleBatalPerubahan = () => {
    if ((!savedHeroForm && !savedHeaderForm) || isSavingHero) return;

    if (savedHeaderForm) {
      setSavedHeaderLogoUrl(savedHeaderForm.logoUrl);
      setHeaderLogoPreview(savedHeaderForm.logoUrl);
      setHeaderLogoName(savedHeaderForm.logoUrl ? savedHeaderForm.logoUrl.split('/').pop() : '');
      setHeaderLogoFile(null);
      setHeaderLogoInputKey((prev) => prev + 1);
    }

    if (!savedHeroForm) return;

    setJudulBeranda(savedHeroForm.judul);
    setDeskripsi(savedHeroForm.deskripsi);
    setSavedBackgroundUrl(savedHeroForm.backgroundUrl);
    setBackgroundPreview(savedHeroForm.backgroundUrl);
    setBackgroundName(savedHeroForm.backgroundUrl ? savedHeroForm.backgroundUrl.split('/').pop() : '');
    setBackgroundFile(null);
    setTampilanLogo1(savedHeroForm.logo1);
    setTampilanLogo2(savedHeroForm.logo2);
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

  // ---------- LOGO MITRA (Untuk Urutan Section) ----------
  const [mitraList, setMitraList] = useState([]);

  // ---------- SECTIONS HALAMAN BERANDA ----------
  const [sections, setSections] = useState([
    { id: nextId(), menu: 'Berita', judul: '', isVisible: true },
    { id: nextId(), menu: 'Logo Mitra', judul: '', isVisible: true },
    { id: nextId(), menu: 'Preview Media Sosial Instagram', judul: '', isVisible: true },
    { id: nextId(), menu: 'Preview Media Sosial YouTube', judul: '', isVisible: true },
  ]);

  const updateSection = (id, field, value) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const toggleSectionVisibility = (id) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s))
    );
  };

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

  const handleSaveFooter = async () => {
    try {
      const payload = {
        email: footer.email,
        telepon: footer.telepon,
        alamat: footer.alamat,
        googleMaps: googleMaps,
      };
      const res = await axiosInstance.put('/api/beranda/footer', payload);
      if (res.data?.success) {
        setIsSaveSuccessOpen(true);
      }
    } catch (error) {
      console.error('Gagal menyimpan pengaturan footer:', error);
      alert('Terjadi kesalahan saat menyimpan pengaturan footer.');
    }
  };

  const handleSaveTautan = async () => {
    try {
      const payload = { links: tautan };
      const res = await axiosInstance.put('/api/beranda/tautan-footer', payload);
      if (res.data?.success) {
        setIsSaveSuccessOpen(true);
      }
    } catch (error) {
      console.error('Gagal menyimpan tautan footer:', error);
      alert('Terjadi kesalahan saat menyimpan tautan footer.');
    }
  };

  const updateTautan = (id, field, value) =>
    setTautan((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));

  const tambahTautan = () =>
    setTautan((prev) => [...prev, { id: nextId(), label: '', link: '' }]);

  const hapusTautan = (id) => setTautan((prev) => prev.filter((t) => t.id !== id));

  const uploadHeroBackground = async () => {
    if (!backgroundFile) return savedBackgroundUrl;

    const formData = new FormData();
    formData.append('upload', backgroundFile);

    const response = await axiosInstance.post('/api/upload/gambar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data?.url || savedBackgroundUrl;
  };

  const uploadHeaderLogo = async () => {
    if (!headerLogoFile) return savedHeaderLogoUrl;

    const formData = new FormData();
    formData.append('upload', headerLogoFile);

    const response = await axiosInstance.post('/api/upload/gambar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data?.url || savedHeaderLogoUrl;
  };

  const handleSimpanPerubahan = async () => {
    if (isSavingHero) return;

    setIsSavingHero(true);
    try {
      const headerLogoUrl = await uploadHeaderLogo();
      const backgroundUrl = await uploadHeroBackground();

      const [headerResponse, heroResponse] = await Promise.all([
        axiosInstance.put('/api/beranda/header', {
          url_logo_header: headerLogoUrl,
        }),
        axiosInstance.put('/api/beranda/hero', {
          judul: judulBeranda,
          subjudul: deskripsi,
          url_gambar: backgroundUrl,
          logo_1: tampilanLogo1,
          logo_2: tampilanLogo2,
          is_aktif: true,
        }),
      ]);

      const savedHeader = headerResponse.data?.data;
      const nextHeaderLogoUrl = savedHeader?.url_logo_header ?? headerLogoUrl ?? null;
      const nextHeaderForm = {
        logoUrl: nextHeaderLogoUrl,
      };
      setSavedHeaderLogoUrl(nextHeaderLogoUrl);
      setHeaderLogoPreview(nextHeaderLogoUrl);
      setHeaderLogoName(nextHeaderLogoUrl ? nextHeaderLogoUrl.split('/').pop() : '');
      setHeaderLogoFile(null);
      setSavedHeaderForm(nextHeaderForm);

      const savedHero = heroResponse.data?.data;
      const nextBackgroundUrl = savedHero?.url_gambar || backgroundUrl || null;
      const nextHeroForm = {
        judul: savedHero?.judul ?? judulBeranda,
        deskripsi: savedHero?.subjudul ?? deskripsi,
        backgroundUrl: nextBackgroundUrl,
        logo1: savedHero?.logo_1 ?? tampilanLogo1,
        logo2: savedHero?.logo_2 ?? tampilanLogo2,
      };

      setSavedBackgroundUrl(nextBackgroundUrl);
      setBackgroundPreview(nextBackgroundUrl);
      setBackgroundName(nextBackgroundUrl ? nextBackgroundUrl.split('/').pop() : '');
      setBackgroundFile(null);
      setSavedHeroForm(nextHeroForm);
      setIsSaveSuccessOpen(true);
    } catch (error) {
      console.error('Gagal menyimpan pengaturan Hero Beranda:', error);
      alert(error.response?.data?.pesan || 'Gagal menyimpan pengaturan Hero Beranda.');
    } finally {
      setIsSavingHero(false);
    }
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
          {hasPageChanges && (
            <button
              type="button"
              className="cb-btn cb-btn-batal"
              onClick={handleBatalPerubahan}
              disabled={isSavingHero}
            >
              Batal
            </button>
          )}
          <button
            className="cb-btn cb-btn-simpan"
            onClick={handleSimpanPerubahan}
            disabled={isSavingHero || !hasPageChanges}
          >
            {isSavingHero ? 'Menyimpan...' : hasPageChanges ? 'Simpan Perubahan' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* ---------- TEMA ---------- */}
      <ThemeSetting
        selectedTheme={selectedTheme}
        setSelectedTheme={setSelectedTheme}
        themes={THEMES}
      />

              <HeaderLogoSetting
          headerLogoPreview={headerLogoPreview}
          headerLogoName={headerLogoName}
          headerLogoInputKey={headerLogoInputKey}
          handleHeaderLogoChange={handleHeaderLogoChange}
          handleHeaderLogoRemove={handleHeaderLogoRemove}
        />

      {/* ---------- HEADER & DATA LOGO ---------- */}
      {/* <div className="cb-grid-2">


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

      {/* ---------- LANDING PAGE & SECTIONS ---------- */}
      <div className="cb-grid-2">
        <HeroSetting
          judulBeranda={judulBeranda}
          setJudulBeranda={setJudulBeranda}
          deskripsi={deskripsi}
          setDeskripsi={setDeskripsi}
          backgroundName={backgroundName}
          backgroundPreview={backgroundPreview}
          backgroundInputKey={backgroundInputKey}
          handleBackgroundChange={handleBackgroundChange}
          handleBackgroundRemove={handleBackgroundRemove}
          tampilanLogo1={tampilanLogo1}
          setTampilanLogo1={setTampilanLogo1}
          tampilanLogo2={tampilanLogo2}
          setTampilanLogo2={setTampilanLogo2}
          logoUtamaOptions={LOGO_UTAMA_OPTIONS}
        />

              {/* ---------- MEDIA SOSIAL ---------- */}
      <SocialMediaSetting
        socials={socials}
        updateSocial={updateSocial}
        handleSocialAvatarChange={handleSocialAvatarChange}
        tambahPlatform={tambahPlatform}
        hapusPlatform={hapusPlatform}
      />

      </div>

        <SectionOrderSetting
          sections={sections}
          setSections={setSections}
          updateSection={updateSection}
          toggleSectionVisibility={toggleSectionVisibility}
          menuOptions={MENU_OPTIONS}
          mitraList={mitraList}
          setMitraList={setMitraList}
        />


      {/* ---------- FOOTER ---------- */}
      <FooterSetting
        footer={footer}
        setFooter={setFooter}
        googleMaps={googleMaps}
        setGoogleMaps={setGoogleMaps}
        tautan={tautan}
        updateTautan={updateTautan}
        tambahTautan={tambahTautan}
        hapusTautan={hapusTautan}
        onSave={handleSaveFooter}
        onSaveTautan={handleSaveTautan}
      />

      {isSaveSuccessOpen && (
        <div
          className="cb-success-overlay"
          data-lenis-prevent="true"
          onClick={() => setIsSaveSuccessOpen(false)}
        >
          <div
            className="cb-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cb-success-title"
            aria-describedby="cb-success-description"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="cb-success-close"
              aria-label="Tutup notifikasi"
              onClick={() => setIsSaveSuccessOpen(false)}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
            <div className="cb-success-icon" aria-hidden="true">
              <i className="fa-solid fa-check" />
            </div>
            <h2 id="cb-success-title">Perubahan berhasil disimpan!</h2>
            <p id="cb-success-description">
              Pengaturan tampilan beranda Anda telah diperbarui.
            </p>
            <button
              type="button"
              className="cb-success-button"
              onClick={() => setIsSaveSuccessOpen(false)}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Modal Sukses Simpan Logo */}
      {isLogoSaveSuccessOpen && (
        <div
          className="cb-success-overlay"
          data-lenis-prevent="true"
          onClick={() => setIsLogoSaveSuccessOpen(false)}
        >
          <div
            className="cb-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cb-logo-success-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cb-success-icon" aria-hidden="true">
              <i className="fa-solid fa-check" />
            </div>
            <h2 id="cb-logo-success-title">Logo berhasil disimpan!</h2>
            <p>
              Logo baru telah berhasil ditambahkan ke dalam daftar logo tersimpan.
            </p>
            <button
              type="button"
              className="cb-success-button"
              onClick={() => setIsLogoSaveSuccessOpen(false)}
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default CustomizeBeranda;
