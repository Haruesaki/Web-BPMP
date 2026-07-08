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

  const handleSave = (data) => {
    // `data` bentuknya berbeda per layout: Default → { judul, konten },
    // Profile Card → { profiles: [...] }. Diteruskan apa adanya.
    // TODO: sambungkan ke backend (mis. PUT /api/menus/:slug/konten)
    console.log('Simpan konten menu:', { layout, menuName, ...data });
  };

  const handleCancel = () => navigate(-1); // kembali ke halaman sebelumnya

  return (
    <Editor
      menuName={menuName}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
};

export default MenuContentEditor;
