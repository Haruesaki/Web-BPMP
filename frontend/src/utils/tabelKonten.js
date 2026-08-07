// =========================================================================
//  TABEL DI DALAM KONTEN CKEditor
//  -----------------------------------------------------------------------
//  Gulir mendatar tabel dikerjakan sepenuhnya oleh CSS pada
//  <figure class="table"> (lihat DefaultContent.css). Berkas ini tinggal
//  membereskan satu hal yang tidak dapat dijangkau berkas gaya: perataan
//  kanan-kiri yang tertulis SEBARIS.
//
//  JANGAN MEMASANG `data-lenis-prevent` DI SINI — pernah dicoba, dan merusak.
//  ------------------------------------------------------------------------
//  Penanda itu sempat dipasang dengan maksud melepaskan gulir mendatar tabel
//  dari pemulus gulir Lenis, meniru cara pratinjau dokumen dan sematan
//  Instagram. Akibatnya HALAMAN TIDAK BISA DIGULIR SAMA SEKALI selama kursor
//  berada di atas tabel.
//
//  Sebabnya: `overflow-x: auto` memaksa `overflow-y` ikut terhitung `auto`
//  (tidak ada cara membuat wadah yang hanya menggulir mendatar), sehingga
//  <figure> menjadi wadah gulir pada KEDUA sumbu. Lenis lalu diperintahkan
//  menjauh, tetapi tegaknya tidak punya apa pun untuk digulir — dan gulirnya
//  tidak pula diteruskan ke halaman. Roda tetikus jatuh ke ruang kosong.
//
//  Diukur di halaman sungguhan dengan peristiwa roda tepercaya, empat varian:
//
//    penanda + overflow-x: auto        → gulir halaman   0px  ❌
//    penanda + overflow-y: hidden      → gulir halaman   0px  ❌
//    TANPA penanda                     → gulir halaman 912px  ✅
//    TANPA penanda + overflow-y hidden → gulir halaman 440px
//
//  Gulir mendatar tabelnya sendiri terukur 216px pada KEEMPAT varian — jadi
//  penanda itu bahkan tidak diperlukan untuk tujuan yang dulu mendasarinya.
//  Lenis berorientasi tegak dan tidak menelan roda mendatar.
//
//  Kaidah yang berlaku: `data-lenis-prevent` hanya cocok bagi elemen yang
//  benar-benar menggulir TEGAK di dalam dirinya — seperti pratinjau dokumen.
//  Bagi elemen yang hanya menggulir mendatar, ia justru menjebak pembaca.
//
//  BERKAS TERSENDIRI karena dipakai dua penyaji: halaman menu/submenu
//  (DefaultContent) dan halaman berita (BeritaDetail). Pasangan berkas inilah
//  yang sudah dua kali menimbulkan cacat gara-gara disalin alih-alih dibagi.
// =========================================================================

// Menjelajah seluruh keturunan sebuah simpul.
function* keturunan(simpul) {
  for (const anak of simpul.children || []) {
    yield anak;
    if (anak.children) yield* keturunan(anak);
  }
}

// Menghitung banyaknya kolom dari baris pertama tabel.
const jumlahKolom = (figur) => {
  for (const simpul of keturunan(figur)) {
    if (simpul.type === 'tag' && simpul.name === 'tr') {
      return (simpul.children || []).filter(
        (a) => a.type === 'tag' && (a.name === 'td' || a.name === 'th')
      ).length;
    }
  }
  return 0;
};

// Membuang HANYA deklarasi `text-align: justify` dari sebuah nilai atribut
// style, dan membiarkan deklarasi lain di dalamnya utuh.
const buangJustify = (gaya) =>
  gaya
    .split(';')
    .filter((bagian) => !/^\s*text-align\s*:\s*justify\s*$/i.test(bagian))
    .join(';')
    .replace(/^\s*;+|;+\s*$/g, '')
    .trim();

/**
 * Menyiapkan <figure class="table"> untuk sisi pengunjung.
 *
 * Yang dikerjakan: membuang perataan kanan-kiri yang tertulis SEBARIS, dan itu
 * pun hanya pada tabel berkolom banyak. Simpulnya diubah DI TEMPAT — data
 * tersimpan tidak disentuh sama sekali, ini semata penyesuaian saat penyajian.
 *
 * Mengapa ini perlu, padahal CSS sudah menyetel `text-align: left` untuk isi
 * sel: gaya sebaris selalu mengalahkan berkas gaya. Konten hasil
 * salin-tempel kerap membawa `style="text-align:justify"` pada paragraf di
 * dalam selnya, dan pada kolom yang sempit perataan kanan-kiri memaksa peramban
 * meregangkan jarak antar-kata sampai menganga — persis keluhan yang memicu
 * perbaikan ini.
 *
 * Mengapa hanya tabel berkolom banyak: tabel satu kolom kerap dipakai sekadar
 * sebagai KOTAK TEKS selebar konten, dan pada lebar itu perataan kanan-kiri
 * justru rapi serta memang dipilih penulisnya dengan sengaja. Yang merusak
 * bukanlah perataannya, melainkan perataan di ruang yang sempit. Membuangnya
 * di mana-mana berarti membatalkan pilihan penulis tanpa sebab — dan itu juga
 * akan melawan `TempelBersih`, yang justru sengaja mempertahankan perataan saat
 * menempel.
 *
 * @param {object} simpul simpul dari html-react-parser (domhandler)
 * @returns {boolean} benar bila simpulnya <figure class="table">
 */
export const siapkanTabelKonten = (simpul) => {
  if (!simpul || simpul.type !== 'tag' || simpul.name !== 'figure') return false;

  // Diperiksa per-kata: `includes` pada seluruh rangkaian kelas akan ikut
  // menjaring nama lain yang kebetulan memuat "table" sebagai penggalan.
  const kelas = simpul.attribs?.class;
  if (typeof kelas !== 'string' || !kelas.split(/\s+/).includes('table')) return false;

  if (jumlahKolom(simpul) > 1) {
    for (const anak of keturunan(simpul)) {
      const gaya = anak.attribs?.style;
      if (typeof gaya !== 'string' || !/justify/i.test(gaya)) continue;
      const sisa = buangJustify(gaya);
      if (sisa) anak.attribs.style = sisa;
      else delete anak.attribs.style;
    }
  }

  return true;
};
