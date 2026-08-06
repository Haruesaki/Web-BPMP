// =========================================================================
//  PENYIMPAN STATUS UNGGAHAN
//  -----------------------------------------------------------------------
//  Sebuah penyimpan mungil di luar React, dilanggan komponen lewat
//  `useSyncExternalStore`.
//
//  MENGAPA DI LUAR REACT
//  ---------------------
//  Unggahan dipicu dari tiga tempat yang sifatnya berbeda:
//
//    1. Adapter unggah CKEditor  — kelas biasa, bukan komponen
//    2. Plugin "Sisipkan Dokumen" — berjalan di dalam CKEditor, di luar
//       pohon React sepenuhnya
//    3. Formulir thumbnail        — komponen React biasa
//
//  Dua yang pertama tidak punya akses ke state React mana pun. Menyalurkan
//  kemajuannya lewat prop atau context berarti menembus batas CKEditor, dan
//  itu rapuh. Penyimpan sederhana ini menjadi titik temu: siapa pun boleh
//  melapor, satu komponen yang menampilkan.
//
//  BEBERAPA UNGGAHAN SEKALIGUS
//  ---------------------------
//  Sengaja berupa DAFTAR pekerjaan, bukan satu nilai tunggal. CKEditor
//  mengizinkan beberapa gambar dijatuhkan sekaligus, dan masing-masing punya
//  adapter sendiri yang berjalan bersamaan. Satu nilai tunggal akan saling
//  menimpa sehingga yang terlihat hanya kemajuan berkas terakhir.
// =========================================================================

let pekerjaan = [];
const pendengar = new Set();
let urutan = 0;

// Cuplikan yang di-cache. `useSyncExternalStore` memanggil pembacanya berkali-
// kali dan MEMBANDINGKAN hasilnya dengan Object.is; bila selalu mengembalikan
// larik baru, React menganggap datanya berubah terus dan masuk gelung render
// tanpa henti. Karena itu rujukannya hanya diganti saat isinya benar berubah.
let cuplikan = pekerjaan;

const siarkan = () => {
  cuplikan = pekerjaan;
  pendengar.forEach((fn) => fn());
};

export const langgananUnggah = (fn) => {
  pendengar.add(fn);
  return () => pendengar.delete(fn);
};

export const bacaUnggah = () => cuplikan;

/**
 * Mendaftarkan satu pekerjaan unggahan baru.
 * @returns {string} id — dipakai untuk memajukan atau menyudahi pekerjaan itu
 */
export const mulaiUnggah = ({ judul, berkas = '', tahap = 'Menyiapkan…' }) => {
  const id = `unggah-${++urutan}`;
  pekerjaan = [...pekerjaan, { id, judul, berkas, persen: 0, tahap, galat: '' }];
  siarkan();
  return id;
};

/**
 * Memperbarui kemajuan. `persen` dijepit ke 0–100 supaya bilah kemajuan tidak
 * pernah meluber — beberapa sumber (mis. peristiwa progres XHR) dapat
 * melaporkan nilai di luar jangkauan pada berkas yang sangat kecil.
 */
export const majukanUnggah = (id, persen, tahap) => {
  pekerjaan = pekerjaan.map((p) =>
    p.id === id
      ? {
          ...p,
          persen: Math.max(0, Math.min(100, Math.round(persen))),
          ...(tahap ? { tahap } : {}),
        }
      : p
  );
  siarkan();
};

export const sudahiUnggah = (id) => {
  pekerjaan = pekerjaan.filter((p) => p.id !== id);
  siarkan();
};

/**
 * Menandai pekerjaan gagal. TIDAK langsung dibuang: pesannya perlu sempat
 * terbaca. Dibuang sendiri setelah beberapa detik, dan pengguna boleh menutupnya
 * lebih awal lewat tombol pada kartunya.
 */
export const gagalkanUnggah = (id, pesan) => {
  pekerjaan = pekerjaan.map((p) =>
    p.id === id ? { ...p, galat: pesan || 'Gagal mengunggah.', tahap: '' } : p
  );
  siarkan();
  setTimeout(() => sudahiUnggah(id), 8000);
};

export const tutupUnggah = sudahiUnggah;
