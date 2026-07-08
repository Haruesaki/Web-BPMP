// =========================================================================
//  UTIL UPLOAD GAMBAR (untuk form layout non-CKEditor, mis. Profile Card)
//  -----------------------------------------------------------------------
//  Mengirim satu berkas gambar ke endpoint upload backend yang sama dengan
//  yang dipakai CKEditor SimpleUploadAdapter, lalu mengembalikan URL-nya.
//  Dengan begitu yang disimpan di data menu cukup URL gambar (bukan base64).
// =========================================================================

// URL endpoint upload (samakan dengan konfigurasi CKEditor di PostDefault).
export const UPLOAD_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload/gambar`;

// Ambil token dari sesi admin; endpoint upload diproteksi authMiddleware.
const getAuthToken = () => {
  try {
    const session = sessionStorage.getItem('adminSession');
    return session ? JSON.parse(session)?.token || '' : '';
  } catch {
    return '';
  }
};

// Unggah `file` → mengembalikan URL gambar. Melempar Error bila gagal.
// Field form bernama "upload" (sesuai multer di uploadMiddleware backend).
export async function uploadImageToServer(file) {
  const form = new FormData();
  form.append('upload', file);

  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getAuthToken()}` },
    body: form,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data?.error?.message || 'Gagal mengunggah gambar.');
  }
  return data.url;
}
