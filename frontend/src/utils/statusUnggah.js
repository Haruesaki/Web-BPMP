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

// -------------------------------------------------------- tenggang tampil
//
// Kartu yang sudah SELESAI tidak dibuang seketika. Sebelumnya pemberitahuan
// "berhasil" muncul sebagai panel tersendiri di tengah layar, dan panel itu
// menuntut perhatian sekaligus menutupi editor persis pada saat penyunting
// hendak melanjutkan mengetik. Pemberitahuannya kini disatukan ke kartu yang
// sama dengan kemajuannya — kartu itu tinggal berganti rupa — lalu pergi
// sendiri.
//
// PUDARNYA DIAMBIL DARI DALAM TENGGANG, bukan ditambahkan sesudahnya. Dengan
// begitu kartunya benar-benar sudah tidak ada pada detik ketujuh, bukan pada
// detik ketujuh koma sekian.
const TAHAN_SELESAI_MS = 7000;
// Kegagalan diberi waktu lebih panjang: pesannya perlu dibaca, bukan sekadar
// disadari.
const TAHAN_GAGAL_MS = 8000;
const DURASI_PUDAR_MS = 450;

/**
 * Menjadwalkan sebuah kartu untuk memudar lalu hilang.
 *
 * Ditandai `memudar` lebih dulu, tidak langsung dibuang — CSS perlu satu
 * kesempatan merender keadaan "sedang pudar" agar animasinya sempat berjalan.
 * Membuang barisnya seketika hanya menghasilkan kartu yang lenyap mendadak.
 */
const jadwalkanHilang = (id, tahan) => {
  setTimeout(() => {
    // Kartu yang sudah ditutup pengguna lebih awal tidak lagi ada di daftar,
    // sehingga penandaan ini menjadi tanpa akibat — bukan galat. Id tidak
    // pernah dipakai ulang (`urutan` hanya naik), jadi tidak ada kemungkinan
    // penjadwalan lama mengenai pekerjaan baru.
    pekerjaan = pekerjaan.map((p) => (p.id === id ? { ...p, memudar: true } : p));
    siarkan();
    setTimeout(() => sudahiUnggah(id), DURASI_PUDAR_MS);
  }, Math.max(0, tahan - DURASI_PUDAR_MS));
};

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
  pekerjaan = [
    ...pekerjaan,
    { id, judul, berkas, persen: 0, tahap, galat: '', selesai: false, memudar: false },
  ];
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

/**
 * Membuang pekerjaan SEKETIKA, tanpa pemberitahuan apa pun.
 *
 * Dipakai bagi unggahan yang hasilnya sudah kelihatan sendiri — gambar sisipan
 * CKEditor langsung muncul di dalam naskah, sehingga kartu "berhasil" untuknya
 * hanya menjadi kebisingan. Untuk unggahan yang hasilnya TIDAK kasatmata,
 * pakai `selesaikanUnggah`.
 */
export const sudahiUnggah = (id) => {
  pekerjaan = pekerjaan.filter((p) => p.id !== id);
  siarkan();
};

/**
 * Menandai pekerjaan BERHASIL, lalu membiarkan kartunya bertahan tujuh detik
 * sebelum memudar dan hilang sendiri.
 *
 * Dipakai bagi unggahan yang hasilnya tidak langsung terlihat. Dokumen adalah
 * contohnya: yang tersisip ke naskah hanya sebaris tautan bertuliskan nama
 * berkas, sehingga tanpa pemberitahuan penyunting tidak punya cara membedakan
 * "sudah selesai" dari "masih berjalan".
 */
export const selesaikanUnggah = (id, { judul, tahap } = {}) => {
  pekerjaan = pekerjaan.map((p) =>
    p.id === id
      ? {
          ...p,
          selesai: true,
          galat: '',
          persen: 100,
          judul: judul || p.judul,
          tahap: tahap || '',
        }
      : p
  );
  siarkan();
  jadwalkanHilang(id, TAHAN_SELESAI_MS);
};

/**
 * Menandai pekerjaan gagal. TIDAK langsung dibuang: pesannya perlu sempat
 * terbaca. Dibuang sendiri setelah beberapa detik, dan pengguna boleh menutupnya
 * lebih awal lewat tombol pada kartunya.
 */
export const gagalkanUnggah = (id, pesan) => {
  pekerjaan = pekerjaan.map((p) =>
    p.id === id ? { ...p, galat: pesan || 'Gagal mengunggah.', selesai: false, tahap: '' } : p
  );
  siarkan();
  // Memakai penjadwal yang sama dengan kartu "berhasil" — sebelumnya kartu
  // gagal lenyap mendadak, dan dua perilaku berbeda pada komponen yang sama
  // terbaca seperti kerusakan.
  jadwalkanHilang(id, TAHAN_GAGAL_MS);
};

export const tutupUnggah = sudahiUnggah;
