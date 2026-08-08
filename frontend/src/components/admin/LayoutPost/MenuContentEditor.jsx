import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getLayoutEditor } from './layoutRegistry';
import axiosInstance from '../../../api/axiosInstance';
import { bacaSesi } from '../../../utils/sesiAdmin';

// =========================================================================
//  MENU CONTENT EDITOR (host editor konten menu — sisi ADMIN)
//  -----------------------------------------------------------------------
//  Route dinamis: /admin/post/:layout
//  Membaca key layout dari URL, memilih komponen editor dari registry, lalu
//  merender editor tersebut. Ini yang membuat "tiap menu bisa pakai layout
//  berbeda" tanpa perlu route hardcode per menu.
//
//  Sumber data (sementara): nama menu dikirim via navigation state saat
//  Super Admin membuat menu. Nanti diganti fetch konten dari backend
//  berdasarkan id/slug menu (mis. GET /api/menus/:slug).
// =========================================================================

const MenuContentEditor = ({ layout: layoutProp }) => {
  const params = useParams();
  const layout = layoutProp || params.layout;
  const location = useLocation();
  const navigate = useNavigate();

  const Editor = getLayoutEditor(layout);
  const menuName = location.state?.menuName || '';
  
  // wildcard berisi ID menu dan (opsional) action. Contoh: "26" atau "26/tambah" atau "26/edit/123"
  const wildcard = params['*'] || '';
  const wildcardParts = wildcard.split('/');
  const routeMenuId = wildcardParts[0]; // Bagian pertama selalu menuId
  const routeAction = wildcardParts.slice(1).join('/'); // Sisanya adalah action (tambah, edit/123, dll)

  const menuId = routeMenuId || location.state?.menuId || null;

  const [loading, setLoading] = React.useState(true);
  const [initialData, setInitialData] = React.useState(null);
  const [saveStatus, setSaveStatus] = React.useState({ error: false, message: '' });

  React.useEffect(() => {
    if (!menuId || layout === 'berita-card') {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const session = bacaSesi() || {};
        const token = session?.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        if (layout === 'default') {
          const res = await axiosInstance.get(`/api/halaman-konten/${menuId}`);
          const data = res.data;
          setInitialData({
            initialContents: Array.isArray(data) ? data.map(d => ({
              id: d.id,
              judul: d.judul,
              konten: d.deskripsi_kaya,
              coverUrl: d.url_foto,
              urutan_beranda: d.urutan_beranda,
              pembuat_nama: d.pembuat_nama,
              pembuat_email: d.pembuat_email,
              status: d.status
            })) : []
          });
        } else if (layout === 'profile-card') {
          const res = await axiosInstance.get(`/api/profil-pegawai/${menuId}`);
          const data = res.data;
          setInitialData({
            initialProfiles: Array.isArray(data) ? data.map(d => ({
              id: d.id,
              nama: d.nama_lengkap,
              jabatan: d.jabatan,
              gambar: d.url_foto
            })) : []
          });
        }
      } catch (err) {
        console.error('Gagal mengambil data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [menuId, layout]);

  const handleSave = async (data) => {
    setSaveStatus({ error: false, message: '' });
    if (!menuId) {
      setSaveStatus({ error: true, message: 'ID Menu tidak ditemukan. Silakan pilih ulang menu dari sidebar.' });
      return false;
    }

    try {
      const session = bacaSesi() || {};
      const token = session?.token;
      
      if (layout === 'default') {
        await axiosInstance.post(`/api/halaman-konten/${menuId}`, {
          kunci_halaman: menuName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          contents: data.contents || []
        });
        
        setSaveStatus({ error: false, message: 'Konten berhasil disimpan!' });
        return true;
      } 
      else if (layout === 'profile-card') {
        const res = await axiosInstance.post(`/api/profil-pegawai/${menuId}`, {
          profiles: data.profiles || []
        });
        
        setSaveStatus({ error: false, message: 'Profil berhasil disimpan!' });
        return true;
      }
      else {
        console.log('Menyimpan konten layout', layout, data);
        setSaveStatus({ error: true, message: `Penyimpanan untuk layout '${layout}' belum diimplementasikan.` });
        return false;
      }

    } catch (error) {
      console.error(error);
      const resData = error.response?.data || {};
      let errorMsg = resData.pesan || resData.message || error.message || 'Terjadi kesalahan jaringan.';
      if (resData.detail) {
        errorMsg += ` Detail: ${resData.detail}`;
      }
      setSaveStatus({ error: true, message: errorMsg });
      return false;
    }
  };

  const handleCancel = () => navigate(-1); // kembali ke halaman sebelumnya

  if (loading) {
    return <div style={{ padding: 32, color: '#c7c4d8' }}>Memuat data...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Editor
        key={menuId || layout}
        menuId={menuId}
        menuName={menuName}
        routeAction={routeAction}
        onSave={handleSave}
        onCancel={handleCancel}
        saveStatus={saveStatus}
        setSaveStatus={setSaveStatus}
        {...initialData}
      />
    </div>
  );
};

export default MenuContentEditor;
