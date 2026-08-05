// =========================================================================
//  TEMPEL BERSIH — membuang format visual saat menempel ke CKEditor
//  -----------------------------------------------------------------------
//  MASALAH YANG DIPECAHKAN
//  Menempel teks dari Word, Google Docs, atau halaman web membawa serta warna
//  teks, warna latar, jenis dan ukuran font, serta kelas milik situs asalnya.
//  Akibatnya konten di dalam editor tampak belang dan tidak mengikuti tema
//  situs, dan merapikannya satu per satu memakan waktu.
//
//  MENGAPA CKEditor TIDAK MEMBUANGNYA SENDIRI
//  Biasanya CKEditor 5 otomatis membuang apa pun yang tidak dikenali skemanya.
//  Tetapi konfigurasi editor ini memasang General Html Support dengan wildcard:
//
//      htmlSupport: { allow: [ { name: /.*/, attributes: true,
//                               classes: true, styles: true } ] }
//
//  yang mengizinkan SETIAP elemen beserta seluruh atribut, kelas, dan gaya
//  inline lolos apa adanya. Itulah sebabnya format ikut terbawa.
//
//  MENGAPA PENYARINGAN DILAKUKAN DI JALUR TEMPEL, BUKAN DENGAN MENCABUT GHS
//  Mencabut wildcard GHS memang akan menutup celahnya, TETAPI ia juga berlaku
//  saat konten LAMA dimuat ke editor — sehingga format pada konten yang sudah
//  telanjur tersimpan akan ikut terbuang begitu seseorang membuka lalu
//  menyimpannya kembali. Itu kehilangan data yang senyap. Menyaring di jalur
//  tempel hanya memengaruhi apa yang BARU ditempel, dan tidak menyentuh
//  satu pun konten yang sudah ada.
//
//  APA YANG DIPERTAHANKAN
//  Struktur tetap utuh: paragraf, heading, daftar, tabel, tautan, gambar,
//  serta penanda dasar seperti tebal dan miring. Perataan (`text-align`)
//  sengaja DIPERTAHANKAN karena diminta secara khusus.
//
//  Pengguna tetap dapat memberi warna sendiri lewat toolbar sesudah menempel —
//  yang dibuang hanyalah format bawaan dari sumber tempelan.
// =========================================================================

// Satu-satunya gaya inline yang boleh bertahan.
export const GAYA_DIPERTAHANKAN = ['text-align'];

// Atribut presentasional gaya lama (HTML4) yang membawa warna/font.
// `width` dan `height` sengaja TIDAK dibuang: keduanya menentukan ukuran
// gambar dan tabel, jadi membuangnya merusak tata letak, bukan merapikannya.
export const ATRIBUT_PRESENTASI = ['color', 'bgcolor', 'face', 'background'];

// Elemen yang hanya berfungsi sebagai pembungkus format. Isinya dinaikkan ke
// induknya, elemennya sendiri dibuang.
export const ELEMEN_PEMBUNGKUS = ['span', 'font'];

// Nilai `align` lama yang setara dengan text-align.
const ALIGN_SAH = ['left', 'right', 'center', 'justify'];

/**
 * Membersihkan satu elemen view. Dipisah dari penelusuran pohon supaya
 * keputusannya dapat diuji tanpa perlu menjalankan CKEditor.
 *
 * @param {object} el Elemen view (butuh: getStyleNames, getAttributeKeys, hasAttribute, getAttribute, name).
 * @param {object} writer UpcastWriter (butuh: removeStyle, setStyle, removeAttribute, removeClass).
 * @returns {boolean} true bila elemen ini sebaiknya dibuka (di-unwrap).
 */
export const bersihkanElemen = (el, writer) => {
  // 1. Atribut `align` lama diterjemahkan lebih dulu menjadi text-align,
  //    supaya perataan dari dokumen lama tidak ikut hilang.
  if (typeof el.getAttribute === 'function' && el.hasAttribute && el.hasAttribute('align')) {
    const nilai = String(el.getAttribute('align') || '').toLowerCase();
    if (ALIGN_SAH.includes(nilai)) writer.setStyle('text-align', nilai, el);
    writer.removeAttribute('align', el);
  }

  // 2. Seluruh gaya inline dibuang KECUALI yang dipertahankan.
  const gaya = typeof el.getStyleNames === 'function' ? el.getStyleNames() : [];
  const gayaDibuang = gaya.filter((g) => !GAYA_DIPERTAHANKAN.includes(g));
  if (gayaDibuang.length) writer.removeStyle(gayaDibuang, el);

  // 3. Kelas dibuang seluruhnya — kelas dari situs asal tidak berarti apa pun
  //    di situs ini, dan justru berisiko bentrok dengan kelas milik tema.
  if (el.hasAttribute && el.hasAttribute('class')) writer.removeAttribute('class', el);

  // 4. Atribut presentasional gaya lama.
  for (const attr of ATRIBUT_PRESENTASI) {
    if (el.hasAttribute && el.hasAttribute(attr)) writer.removeAttribute(attr, el);
  }

  // 5. Pembungkus format murni dibuka. Diperiksa SESUDAH pembersihan di atas:
  //    bila sebuah <span> ternyata masih memuat text-align, ia tetap dibuka
  //    sebab text-align pada elemen inline memang tidak berpengaruh apa pun.
  return ELEMEN_PEMBUNGKUS.includes(String(el.name || '').toLowerCase());
};

/**
 * Menelusuri seluruh pohon tempelan lalu membersihkan tiap elemennya.
 *
 * Penelusuran sengaja mengumpulkan daftar elemen LEBIH DULU sebelum ada yang
 * dibuka. Membuka elemen mengubah susunan anak induknya, dan mengubah susunan
 * di tengah penelusuran akan membuat sebagian elemen terlewat.
 *
 * @param {object} akar ViewDocumentFragment atau ViewElement.
 * @param {object} writer UpcastWriter.
 * @returns {{diperiksa: number, dibuka: number}} ringkasan, berguna untuk pengujian.
 */
export const bersihkanPohon = (akar, writer) => {
  const semua = [];
  const telusuri = (simpul) => {
    if (!simpul || typeof simpul.getChildren !== 'function') return;
    for (const anak of simpul.getChildren()) {
      // Simpul teks tidak punya nama elemen dan tidak perlu disentuh.
      if (anak && anak.name) semua.push(anak);
      telusuri(anak);
    }
  };
  telusuri(akar);

  const perluDibuka = [];
  for (const el of semua) {
    if (bersihkanElemen(el, writer)) perluDibuka.push(el);
  }

  // Dibuka dari yang TERDALAM lebih dulu supaya <span><span>…</span></span>
  // ikut rata seluruhnya, bukan menyisakan pembungkus di dalamnya.
  for (const el of perluDibuka.reverse()) writer.unwrapElement(el);

  return { diperiksa: semua.length, dibuka: perluDibuka.length };
};
