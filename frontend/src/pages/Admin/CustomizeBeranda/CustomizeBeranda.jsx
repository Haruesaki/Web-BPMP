import { useEffect, useState } from 'react';
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
import CustomAlert from '../../../components/admin/CustomAlert';
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

const SAVED_LOGO_OPTIONS = ['Dinas Pendidikan', 'Kemendikdasmen', 'BPMP Lampung'];

// Nilai logo_1/logo_2 hanya dianggap gambar bila berupa path/URL upload
// (mengabaikan data lama yang masih berupa nama).
const asImageUrl = (v) => (v && (v.startsWith('/') || v.startsWith('http')) ? v : null);

let uid = 100; // helper id lokal untuk baris dinamis (social, section, tautan)
const nextId = () => uid++;

const CustomizeBeranda = () => {
  const [isSaveSuccessOpen, setIsSaveSuccessOpen] = useState(false);
  const [isLogoSaveSuccessOpen, setIsLogoSaveSuccessOpen] = useState(false);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isSavingHeader, setIsSavingHeader] = useState(false);
  const [isSavingSocials, setIsSavingSocials] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false });

  const showAlert = (type, message, title) => {
    setAlertState({
      isOpen: true,
      type,
      title,
      message,
      onConfirm: () => setAlertState(prev => ({ ...prev, isOpen: false }))
    });
  };

  // ---------- TEMA ----------
  const [selectedTheme, setSelectedTheme] = useState('dark-navy');

  // ---------- HEADER (Logo Utama Website) ----------
  const [headerLogoPreview, setHeaderLogoPreview] = useState(null);
  const [headerLogoName, setHeaderLogoName] = useState('');
  const [headerLogoFile, setHeaderLogoFile] = useState(null);
  const [savedHeaderLogoUrl, setSavedHeaderLogoUrl] = useState(null);
  const [headerLogoInputKey, setHeaderLogoInputKey] = useState(0);

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
  // Logo 1 & 2 hero: upload gambar mandiri (tidak terkait logo mitra / gambar lain).
  const [logo1File, setLogo1File] = useState(null);
  const [logo1Preview, setLogo1Preview] = useState(null);
  const [savedLogo1Url, setSavedLogo1Url] = useState(null);
  const [logo1InputKey, setLogo1InputKey] = useState(0);
  const [logo2File, setLogo2File] = useState(null);
  const [logo2Preview, setLogo2Preview] = useState(null);
  const [savedLogo2Url, setSavedLogo2Url] = useState(null);
  const [logo2InputKey, setLogo2InputKey] = useState(0);

const [socials, setSocials] = useState([
    { id: nextId(), label: 'Instagram', url: 'https://instagram.com/kemdikbud', avatar: null },
    { id: nextId(), label: 'Facebook', url: 'https://facebook.com/kemdikbud', avatar: null },
  ]);
const [mitraList, setMitraList] = useState([]);
const [sections, setSections] = useState([
    { id: nextId(), menu: 'Berita', judul: '', isVisible: true },
    { id: nextId(), menu: 'Logo Mitra', judul: '', isVisible: true },
    { id: nextId(), menu: 'Preview Media Sosial Instagram', judul: '', isVisible: true },
    { id: nextId(), menu: 'Preview Media Sosial YouTube', judul: '', isVisible: true },
  ]);
const [footer, setFooter] = useState({ email: '', telepon: '', alamat: '' });
const [googleMaps, setGoogleMaps] = useState('');
const [tautan, setTautan] = useState([
    { id: nextId(), label: 'Portal Layanan', link: '' },
    { id: nextId(), label: 'Portal Layanan', link: '' },
    { id: nextId(), label: 'Portal Layanan', link: '' },
    { id: nextId(), label: 'Portal Layanan', link: '' },
    { id: nextId(), label: 'Portal Layanan', link: '' },
  ]);

  useEffect(() => {
    let isMounted = true;

    const loadBerandaSettings = async () => {
      try {
        const [headerResponse, heroResponse, mitraResponse, footerResponse, tautanResponse, medsosResponse, sectionResponse] = await Promise.all([
          axiosInstance.get('/api/beranda/header'),
          axiosInstance.get('/api/beranda/hero'),
          axiosInstance.get('/api/beranda/mitra'),
          axiosInstance.get('/api/beranda/footer'),
          axiosInstance.get('/api/beranda/tautan-footer'),
          axiosInstance.get('/api/beranda/media-sosial'),
          axiosInstance.get('/api/beranda/urutan-section'),
        ]);
        const header = headerResponse.data?.data;
        const hero = heroResponse.data?.data;
        const mitraData = mitraResponse.data?.data || [];
        const footerData = footerResponse?.data?.data || {};
        const tautanData = tautanResponse?.data?.data || [];
        const medsosData = medsosResponse?.data?.data || [];
        const sectionData = sectionResponse?.data?.data || [];

        if (!hero || !isMounted) return;

        const loadedHeaderForm = {
          logoUrl: header?.url_logo_header || null,
        };
        const loadedHeroForm = {
          judul: hero.judul || '',
          deskripsi: hero.subjudul || '',
          backgroundUrl: hero.url_gambar || null,
          logo1: asImageUrl(hero.logo_1),
          logo2: asImageUrl(hero.logo_2),
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

        if (medsosData.length > 0) {
          setSocials(medsosData.map(m => ({
            id: nextId(),
            label: m.platform,
            url: m.url_tautan,
            avatar: m.url_logo,
            file: null
          })));
        }

        if (sectionData.length > 0) {
          setSections(sectionData.map((s, index) => ({
            id: s.id || nextId(),
            menu: s.nama_section,
            judul: '', // not strictly used for now in order
            isVisible: s.is_visible,
          })));
        }

        setSavedHeaderLogoUrl(loadedHeaderForm.logoUrl);
        setHeaderLogoPreview(loadedHeaderForm.logoUrl);
        setHeaderLogoName(loadedHeaderForm.logoUrl ? loadedHeaderForm.logoUrl.split('/').pop() : '');

        setJudulBeranda(loadedHeroForm.judul);
        setDeskripsi(loadedHeroForm.deskripsi);
        setSavedBackgroundUrl(loadedHeroForm.backgroundUrl);
        setBackgroundPreview(loadedHeroForm.backgroundUrl);
        setBackgroundName(loadedHeroForm.backgroundUrl ? loadedHeroForm.backgroundUrl.split('/').pop() : '');
        setSavedLogo1Url(loadedHeroForm.logo1);
        setLogo1Preview(loadedHeroForm.logo1);
        setSavedLogo2Url(loadedHeroForm.logo2);
        setLogo2Preview(loadedHeroForm.logo2);

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

  // ---------- LOGO 1 & 2 (upload gambar) ----------
  const handleLogo1Change = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo1File(file);
    setLogo1Preview(URL.createObjectURL(file));
  };
  const handleLogo1Remove = () => {
    setLogo1Preview(null);
    setLogo1File(null);
    setSavedLogo1Url(null);
    setLogo1InputKey((prev) => prev + 1);
  };
  const handleLogo2Change = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogo2File(file);
    setLogo2Preview(URL.createObjectURL(file));
  };
  const handleLogo2Remove = () => {
    setLogo2Preview(null);
    setLogo2File(null);
    setSavedLogo2Url(null);
    setLogo2InputKey((prev) => prev + 1);
  };


  // ---------- MEDIA SOSIAL ----------
  

  const updateSocial = (id, field, value) =>
    setSocials((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const handleSocialAvatarChange = (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSocials((prev) => prev.map((s) => (s.id === id ? { ...s, avatar: URL.createObjectURL(file), file: file } : s)));
  };

  const tambahPlatform = () =>
    setSocials((prev) => [...prev, { id: nextId(), label: '', url: '', avatar: null, file: null }]);

  const hapusPlatform = (id) => setSocials((prev) => prev.filter((s) => s.id !== id));

  // ---------- LOGO MITRA (Untuk Urutan Section) ----------
  

  // ---------- SECTIONS HALAMAN BERANDA ----------
  

  const updateSection = (id, field, value) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const toggleSectionVisibility = async (id) => {
    let updatedSections = [];
    setSections((prev) => {
      updatedSections = prev.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s));
      return updatedSections;
    });
    await handleSaveOrder(updatedSections);
  };

  // ---------- FOOTER ----------
  
  
  

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
    } catch (err) {
      console.error('Gagal memperbarui footer:', err);
      showAlert('error', 'Terjadi kesalahan saat menyimpan pengaturan footer.', 'Simpan Gagal');
    }
  };

  const handleSaveTautan = async () => {
    try {
      const payload = { links: tautan };
      const res = await axiosInstance.put('/api/beranda/tautan-footer', payload);
      if (res.data?.success) {
        setIsSaveSuccessOpen(true);
      }
    } catch (err) {
      console.error('Gagal memperbarui tautan footer:', err);
      showAlert('error', 'Terjadi kesalahan saat menyimpan tautan footer.', 'Simpan Gagal');
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

  const uploadLogoImage = async (file, savedUrl) => {
    if (!file) return savedUrl;
    const formData = new FormData();
    formData.append('upload', file);
    const response = await axiosInstance.post('/api/upload/gambar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data?.url || savedUrl;
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


  // Simpan khusus card Landing Page (Hero). Dipanggil dari tombol Simpan di
  // dalam HeroSetting.
  const handleSaveHeader = async () => {
    if (isSavingHeader) return;

    setIsSavingHeader(true);
    try {
      const headerLogoUrl = await uploadHeaderLogo();

      const headerResponse = await axiosInstance.put('/api/beranda/header', {
        url_logo_header: headerLogoUrl,
      });

      const savedHeader = headerResponse.data?.data;
      const nextHeaderLogoUrl = savedHeader?.url_logo_header ?? headerLogoUrl ?? null;
      setSavedHeaderLogoUrl(nextHeaderLogoUrl);
      setHeaderLogoPreview(nextHeaderLogoUrl);
      setHeaderLogoName(nextHeaderLogoUrl ? nextHeaderLogoUrl.split('/').pop() : '');
      setHeaderLogoFile(null);
      setIsSaveSuccessOpen(true);
    } catch (error) {
      console.error('Gagal menyimpan pengaturan Header:', error);
      showAlert('error', error.response?.data?.pesan || 'Gagal menyimpan pengaturan Header.', 'Simpan Gagal');
    } finally {
      setIsSavingHeader(false);
    }
  };

  const handleSaveHero = async () => {
    if (isSavingHero) return;

    setIsSavingHero(true);
    try {
      const backgroundUrl = await uploadHeroBackground();
      const logo1Url = await uploadLogoImage(logo1File, savedLogo1Url);
      const logo2Url = await uploadLogoImage(logo2File, savedLogo2Url);

      const heroResponse = await axiosInstance.put('/api/beranda/hero', {
        judul: judulBeranda,
        subjudul: deskripsi,
        url_gambar: backgroundUrl,
        logo_1: logo1Url || '',
        logo_2: logo2Url || '',
        is_aktif: true,
      });

      const savedHero = heroResponse.data?.data;
      const nextBackgroundUrl = savedHero?.url_gambar || backgroundUrl || null;
      setSavedBackgroundUrl(nextBackgroundUrl);
      setBackgroundPreview(nextBackgroundUrl);
      setBackgroundName(nextBackgroundUrl ? nextBackgroundUrl.split('/').pop() : '');
      setBackgroundFile(null);

      const nextLogo1 = asImageUrl(savedHero?.logo_1) || logo1Url || null;
      const nextLogo2 = asImageUrl(savedHero?.logo_2) || logo2Url || null;
      setSavedLogo1Url(nextLogo1);
      setLogo1Preview(nextLogo1);
      setLogo1File(null);
      setSavedLogo2Url(nextLogo2);
      setLogo2Preview(nextLogo2);
      setLogo2File(null);
      setIsSaveSuccessOpen(true);
    } catch (error) {
      console.error('Gagal menyimpan pengaturan Hero Beranda:', error);
      alert(error.response?.data?.pesan || 'Gagal menyimpan pengaturan Hero Beranda.');
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleSaveSocials = async () => {
    if (isSavingSocials) return;
    setIsSavingSocials(true);
    try {
      // Upload any new avatar files first
      const updatedSocials = await Promise.all(socials.map(async (social) => {
        if (social.file) {
          const formData = new FormData();
          formData.append('upload', social.file);
          const uploadRes = await axiosInstance.post('/api/upload/gambar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return {
            platform: social.label,
            url_tautan: social.url,
            url_logo: uploadRes.data?.url || social.avatar
          };
        }
        return {
          platform: social.label,
          url_tautan: social.url,
          url_logo: social.avatar
        };
      }));

      await axiosInstance.put('/api/beranda/media-sosial', { socials: updatedSocials });
      setIsSaveSuccessOpen(true);
    } catch (error) {
      console.error('Gagal menyimpan media sosial:', error);
      showAlert('error', error.response?.data?.pesan || 'Gagal menyimpan pengaturan media sosial.', 'Simpan Gagal');
    } finally {
      setIsSavingSocials(false);
    }
  };

  const handleSaveOrder = async (sectionsToSave = sections) => {
    if (isSavingOrder) return;
    setIsSavingOrder(true);
    try {
      const payload = {
        sections: sectionsToSave.map((s, index) => ({
          nama_section: s.menu,
          urutan: index + 1,
          is_visible: s.isVisible
        }))
      };
      await axiosInstance.put('/api/beranda/urutan-section', payload);
      // Simpan diam-diam (silent save) agar tidak mengganggu UX saat drag & drop
    } catch (error) {
      console.error('Gagal menyimpan urutan section:', error);
      showAlert('error', error.response?.data?.pesan || 'Gagal menyimpan urutan section.', 'Simpan Gagal');
    } finally {
      setIsSavingOrder(false);
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
      </div>

              {/* <LogoDataSetting
          logoNama={logoNama}
          setLogoNama={setLogoNama}
          logoFileName={logoFileName}
          logoPreview={logoPreview}
          handleLogoFileChange={handleLogoFileChange}
          handleSimpanLogo={handleSimpanLogo}
          savedLogo={savedLogo}
          setSavedLogo={setSavedLogo}
          savedLogoOptions={SAVED_LOGO_OPTIONS}
        /> */}

    

      {/* ---------- HEADER & DATA LOGO ---------- */}
      <div className="cb-grid-2">
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
          onSave={handleSaveHeader}
          isSaving={isSavingHeader}
        />


      </div>

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
          logo1Preview={logo1Preview}
          logo1InputKey={logo1InputKey}
          handleLogo1Change={handleLogo1Change}
          handleLogo1Remove={handleLogo1Remove}
          logo2Preview={logo2Preview}
          logo2InputKey={logo2InputKey}
          handleLogo2Change={handleLogo2Change}
          handleLogo2Remove={handleLogo2Remove}
          onSave={handleSaveHero}
          isSaving={isSavingHero}
        />

              {/* ---------- MEDIA SOSIAL ---------- */}
      <SocialMediaSetting
        socials={socials}
        updateSocial={updateSocial}
        handleSocialAvatarChange={handleSocialAvatarChange}
        tambahPlatform={tambahPlatform}
        hapusPlatform={hapusPlatform}
        onSave={handleSaveSocials}
        isSaving={isSavingSocials}
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
          handleSaveOrder={handleSaveOrder}
          isSavingOrder={isSavingOrder}
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
      
      <CustomAlert 
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
      />
    </main>
  );
};

export default CustomizeBeranda;
