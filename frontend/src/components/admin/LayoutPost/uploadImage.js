// =========================================================================
//  UTIL UNGGAH GAMBAR (untuk formulir layout non-CKEditor, mis. Profile Card)
//  -----------------------------------------------------------------------
//  Mengirim satu berkas gambar ke titik akhir unggah yang sama dengan yang
//  dipakai CKEditor, lalu mengembalikan URL-nya. Dengan begitu yang disimpan
//  pada data menu cukup URL gambar, bukan base64.
//
//  MENGAPA XMLHttpRequest, BUKAN fetch
//  -----------------------------------
//  `fetch` TIDAK menyediakan kemajuan unggahan. Body-nya memang dapat berupa
//  stream, tetapi peristiwa kemajuan untuk arah UNGGAH tidak tersedia di
//  peramban arus utama — yang ada hanya untuk arah unduh. Satu-satunya cara
//  memperoleh persentase yang jujur adalah `xhr.upload.onprogress`, dan itulah
//  sebabnya berkas ini beralih dari `fetch`.
//
//  Tanda tangannya sengaja tidak berubah — tetap menerima `file` dan
//  mengembalikan URL — sehingga pemanggilnya tidak perlu disesuaikan.
// =========================================================================

import { mulaiUnggah, majukanUnggah, sudahiUnggah, gagalkanUnggah } from '../../../utils/statusUnggah';
import { ambilToken } from '../../../utils/sesiAdmin';

// URL titik akhir unggah (samakan dengan konfigurasi CKEditor di PostDefault).
export const UPLOAD_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/upload/gambar`;

// Ambil token dari sesi admin; titik akhir unggah dijaga authMiddleware.
const getAuthToken = () => ambilToken() || '';

/**
 * Unggah `file` → mengembalikan URL gambar. Melempar Error bila gagal.
 * Nama ruas formulirnya "upload", sesuai multer pada uploadMiddleware backend.
 */
export function uploadImageToServer(file) {
  return new Promise((resolve, reject) => {
    const id = mulaiUnggah({
      judul: 'Mengunggah gambar',
      berkas: file?.name || '',
      tahap: 'Menyiapkan berkas…',
    });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL, true);
    xhr.setRequestHeader('Authorization', `Bearer ${getAuthToken()}`);
    xhr.responseType = 'json';

    xhr.upload.addEventListener('progress', (evt) => {
      if (!evt.lengthComputable) return;
      const bagian = evt.loaded / evt.total;
      majukanUnggah(
        id,
        bagian * 100,
        // Bita terakhir terkirim bukan berarti selesai: peladen masih mengubah
        // ukuran gambar dengan `sharp`, dan itu tidak terukur dari peramban.
        bagian >= 1 ? 'Diproses peladen…' : 'Mengunggah ke peladen…'
      );
    });

    const gagal = (pesan) => {
      gagalkanUnggah(id, pesan);
      reject(new Error(pesan));
    };

    xhr.addEventListener('error', () => gagal('Gagal menghubungi peladen.'));
    xhr.addEventListener('abort', () => {
      sudahiUnggah(id);
      reject(new Error('Unggahan dibatalkan.'));
    });

    xhr.addEventListener('load', () => {
      // `responseType = 'json'` membuat peramban mengurai sendiri. Bila peladen
      // membalas bukan-JSON (mis. halaman galat proxy), `response` bernilai null.
      const data = xhr.response;
      if (xhr.status < 200 || xhr.status >= 300 || !data || !data.url) {
        return gagal(data?.error?.message || 'Gagal mengunggah gambar.');
      }
      sudahiUnggah(id);
      resolve(data.url);
    });

    const form = new FormData();
    form.append('upload', file);
    xhr.send(form);
  });
}
