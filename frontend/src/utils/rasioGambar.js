// =========================================================================
//  RASIO GAMBAR ISI KONTEN — klasifikasi & penanda "potong otomatis"
//  -----------------------------------------------------------------------
//  Dipakai bersama oleh sisi pengunjung (GambarKonten) dan sisi admin
//  (AutoPotongGambarPlugin). Ambang batasnya WAJIB sama di kedua sisi: bila
//  editor menganggap sebuah gambar potret sedangkan halaman pengunjung tidak,
//  penyunting akan menyalakan sebuah saklar yang tidak pernah berpengaruh.
//  Karena itu angkanya ditaruh di sini, satu kali, bukan disalin.
//
//  MENGAPA "TIDAK MEMOTONG" MENJADI ATURAN POKOK
//  ---------------------------------------------
//  Sebelumnya setiap gambar dipaksa masuk ke kotak berukuran tetap, lalu
//  kelebihannya dibuang `object-fit: cover`. Ukuran kotaknya dinyatakan dalam
//  piksel mutlak (`max-height: 500px`) sementara lebarnya mengikuti lebar
//  kolom — dan lebar kolom BERUBAH mengikuti tingkat zoom peramban.
//
//  Akibatnya banyak-sedikitnya potongan bergantung pada zoom pembaca:
//
//    zoom diperkecil → kolom melebar (dalam piksel CSS) → gambar seharusnya
//                      makin tinggi → tertahan 500px → potongan makin banyak
//    zoom diperbesar → kolom menyempit → tinggi alaminya belum sampai 500px
//                      → tidak ada potongan sama sekali
//
//  Dua pembaca yang membuka halaman yang sama bisa melihat gambar yang
//  berbeda. Itulah cacat yang diperbaiki: tinggi tidak lagi dibatasi angka
//  mutlak, melainkan dibiarkan mengikuti rasio aslinya.
//
//  Bila pemotongan memang dikehendaki, ukurannya dinyatakan sebagai RASIO
//  (`aspect-ratio`), bukan tinggi mutlak. Rasio tidak berubah oleh zoom,
//  sehingga bagian gambar yang terlihat sama bagi setiap pembaca.
// =========================================================================

// Kelas penanda pada data HTML yang disimpan CKEditor. Menempel di elemen
// terpetakan gambar — <figure class="image"> untuk gambar blok, <img> untuk
// gambar sebaris — mengikuti cara ImageStyle bawaan CKEditor menempelkan kelas
// gayanya sendiri.
export const KELAS_AUTO_POTONG = 'gambar-auto-potong';

// Di atas ambang ini gambar dianggap lanskap, di bawah AMBANG_POTRET dianggap
// potret, dan di antara keduanya dianggap kotak. Rentang 0,85–1,15 sengaja
// dibiarkan lebar supaya foto yang "hampir persegi" tidak terlempar ke salah
// satu ujung hanya karena selisih beberapa piksel.
export const AMBANG_LANSKAP = 1.15;
export const AMBANG_POTRET = 0.85;

/**
 * Memilih kelas wadah menurut rasio gambar.
 *
 * @param {number} lebar naturalWidth
 * @param {number} tinggi naturalHeight
 * @returns {string} salah satu kelas varian `.image-frame--*`
 */
export const klasifikasiRasio = (lebar, tinggi) => {
  if (!lebar || !tinggi) return 'image-frame--landscape';
  const rasio = lebar / tinggi;
  if (rasio > AMBANG_LANSKAP) return 'image-frame--landscape';
  if (rasio < AMBANG_POTRET) return 'image-frame--portrait';
  return 'image-frame--square';
};

/**
 * Apakah gambar berasio potret?
 *
 * Mengembalikan `null` — bukan `false` — bila ukurannya belum diketahui
 * (gambar belum termuat, atau berkasnya rusak sehingga naturalWidth tetap 0).
 * Perbedaan itu penting bagi sisi admin: "belum diketahui" tidak boleh
 * diperlakukan sama dengan "sudah dipastikan bukan potret", sebab yang pertama
 * masih bisa berubah sedangkan yang kedua tidak.
 *
 * @param {number} lebar naturalWidth
 * @param {number} tinggi naturalHeight
 * @returns {boolean|null}
 */
export const apakahPotret = (lebar, tinggi) => {
  if (!lebar || !tinggi) return null;
  return lebar / tinggi < AMBANG_POTRET;
};

// Pemeriksaan kelas dilakukan per-kata, bukan lewat `includes` pada seluruh
// rangkaian kelas. `includes` akan salah menjawab untuk kelas lain yang
// kebetulan memuat nama ini sebagai penggalan.
const berkelas = (simpul, kelas) => {
  const daftar = simpul?.attribs?.class;
  return typeof daftar === 'string' && daftar.split(/\s+/).includes(kelas);
};

/**
 * Apakah penyunting menyalakan potong otomatis pada gambar ini?
 *
 * Tandanya dicari di tiga tempat, sebab CKEditor membungkus gambar dengan cara
 * yang berbeda-beda:
 *
 *   <img class="…">                                  gambar sebaris
 *   <figure class="image …"><img></figure>           gambar blok
 *   <figure class="image …"><a><img></a></figure>    gambar blok bertaut
 *
 * @param {object} simpulGambar simpul <img> dari html-react-parser (domhandler)
 * @returns {boolean}
 */
export const autoPotongDinyalakan = (simpulGambar) => {
  if (berkelas(simpulGambar, KELAS_AUTO_POTONG)) return true;

  const induk = simpulGambar?.parent;
  if (!induk || induk.type !== 'tag') return false;
  if (induk.name === 'figure') return berkelas(induk, KELAS_AUTO_POTONG);

  // LinkImage menyisipkan <a> di antara <figure> dan <img>.
  if (induk.name === 'a') {
    const kakek = induk.parent;
    if (kakek && kakek.type === 'tag' && kakek.name === 'figure') {
      return berkelas(kakek, KELAS_AUTO_POTONG);
    }
  }

  return false;
};
