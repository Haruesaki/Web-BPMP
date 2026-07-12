import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getLayoutEditor } from './layoutRegistry';

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

const MenuContentEditor = () => {
  const { layout } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const Editor = getLayoutEditor(layout);
  const menuName = location.state?.menuName || '';
  const menuId = location.state?.menuId || null;

  const [saveStatus, setSaveStatus] = React.useState({ error: false, message: '' });

  const handleSave = async (data) => {
    setSaveStatus({ error: false, message: '' });
    if (!menuId) {
      setSaveStatus({ error: true, message: 'ID Menu tidak ditemukan. Silakan pilih ulang menu dari sidebar.' });
      return;
    }

    try {
      const session = JSON.parse(sessionStorage.getItem('adminSession') || '{}');
      const token = session?.token;
      
      // Jika layout adalah Default (halaman_konten)
      if (layout === 'default') {
        // Asumsi data dari PostDefault: { contents: [{ judul, konten, ... }] }
        const firstContent = data.contents && data.contents.length > 0 ? data.contents[0] : {};
        const res = await fetch(`/api/halaman-konten/${menuId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            kunci_halaman: menuName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            judul: firstContent.judul || 'Tanpa Judul',
            deskripsi_kaya: firstContent.konten || '' // isi dari CKEditor
          })
        });
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.pesan || 'Gagal menyimpan konten ke server.');
        }
        
        setSaveStatus({ error: false, message: 'Konten berhasil disimpan!' });
      } 
      // TODO: tambah layout lain jika diperlukan (profil_pegawai, berita)
      else {
        console.log('Menyimpan konten layout', layout, data);
        setSaveStatus({ error: true, message: `Penyimpanan untuk layout '${layout}' belum diimplementasikan.` });
      }

    } catch (error) {
      console.error(error);
      setSaveStatus({ error: true, message: error.message || 'Terjadi kesalahan jaringan.' });
    }
  };

  const handleCancel = () => navigate(-1); // kembali ke halaman sebelumnya

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Editor
        menuName={menuName}
        onSave={handleSave}
        onCancel={handleCancel}
        saveStatus={saveStatus}
        setSaveStatus={setSaveStatus}
      />
    </div>
  );
};

export default MenuContentEditor;
