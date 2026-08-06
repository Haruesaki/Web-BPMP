// =========================================================================
//  PENYIMPAN PRATINJAU DOKUMEN (sisi editor)
//  -----------------------------------------------------------------------
//  Sebuah penyimpan mungil di luar React, dilanggan komponen lewat
//  `useSyncExternalStore` — pola yang sama dengan `statusUnggah`, dan karena
//  alasan yang sama: tombol "Sisipkan Dokumen" adalah plugin CKEditor yang
//  berjalan sepenuhnya di luar pohon React, sehingga tidak dapat menyentuh
//  state komponen mana pun secara langsung.
//
//  MENGAPA PRATINJAUNYA DI EDITOR
//  ------------------------------
//  Setelah dokumen terunggah, yang tersisip ke dalam editor hanyalah TAUTAN
//  bertuliskan nama berkas. Penyunting tidak punya cara memastikan berkas yang
//  barusan diunggah memang berkas yang dimaksud — apalagi bila namanya mirip,
//  atau bila dokumennya hasil ekspor yang belum sempat dibuka. Satu-satunya
//  cara memeriksa adalah menyimpan tulisannya lebih dulu, membuka halaman
//  pengunjung, dan menggulir mencarinya.
//
//  Panel ini memindahkan pemeriksaan itu ke tempat kejadiannya: begitu
//  unggahan selesai, dokumennya langsung ditampilkan. Yang dibaca panel
//  adalah berkas yang benar-benar tersimpan di peladen — bukan berkas di
//  cakram penyunting — sehingga sekaligus membuktikan unggahannya utuh.
//
//  SATU DOKUMEN SAJA
//  -----------------
//  Berbeda dari `statusUnggah` yang berupa daftar, di sini cukup satu nilai:
//  pratinjau adalah panel yang menuntut perhatian penuh, dan menumpuk beberapa
//  sekaligus justru menghalangi editor. Unggahan berikutnya menggantikan yang
//  sedang tampil.
// =========================================================================

let dokumen = null;
const pendengar = new Set();
let urutan = 0;

const siarkan = () => pendengar.forEach((fn) => fn());

export const langgananPratinjau = (fn) => {
  pendengar.add(fn);
  return () => pendengar.delete(fn);
};

// Rujukannya hanya berganti saat isinya benar-benar berubah. `useSyncExternalStore`
// membandingkan hasil pembacaan dengan Object.is; mengembalikan objek baru pada
// tiap panggilan akan membuat React menganggap datanya berubah terus-menerus dan
// masuk gelung render tanpa henti.
export const bacaPratinjau = () => dokumen;

/** Menurunkan ekstensi dari URL berkas (tanpa titik, huruf kecil). */
const ekstensiDari = (url) => {
  const cocok = /\.([a-z0-9]+)(?:\?.*)?$/i.exec(url || '');
  return cocok ? cocok[1].toLowerCase() : '';
};

/**
 * Menampilkan pratinjau sebuah dokumen di dalam editor.
 * @param {{url: string, nama?: string}} berkas
 */
export const bukaPratinjau = ({ url, nama = '' }) => {
  if (!url) return;
  dokumen = {
    // `id` naik tiap kali dibuka. Dipakai sebagai `key` komponen viewer supaya
    // dokumen yang sama diunggah dua kali tetap dirender ulang dari awal —
    // tanpa itu React menganggapnya elemen yang sama dan mempertahankan hasil
    // render lama.
    id: ++urutan,
    url,
    nama: nama || decodeURIComponent(String(url).split('/').pop()),
    ext: ekstensiDari(url),
  };
  siarkan();
};

export const tutupPratinjau = () => {
  if (!dokumen) return;
  dokumen = null;
  siarkan();
};
