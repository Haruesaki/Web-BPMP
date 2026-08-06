// =========================================================================
//  PENGELOMPOKAN GAMBAR BERURUTAN PADA KONTEN CKEditor
//  -----------------------------------------------------------------------
//  Aturannya: gambar-gambar yang bersebelahan TANPA teks di antaranya
//  ditampilkan berjajar mendatar, paling banyak tiga per baris. Begitu ada
//  paragraf, daftar, atau apa pun yang bukan gambar, deretnya terputus.
//
//  MENGAPA BERKAS TERSENDIRI
//  -------------------------
//  Logika ini dipakai dua tempat — halaman menu/submenu (DefaultContent) dan
//  halaman berita (BeritaDetail). Sebelumnya ia disalin utuh ke keduanya, dan
//  akibatnya cacat yang sama harus diperbaiki dua kali. Disatukan di sini agar
//  perbaikan berikutnya cukup sekali.
//
//  BENTUK GAMBAR YANG DIKENALI — dan mengapa tiga-tiganya perlu
//  ------------------------------------------------------------
//  CKEditor 5 menyimpan gambar dalam bentuk yang BERBEDA-BEDA bergantung cara
//  penyisipannya, dan perbedaan itulah yang dahulu membuat pengelompokan gagal:
//
//    1. <figure class="image"><img></figure>   — gambar blok, bentuk paling lazim
//    2. <img>                                  — gambar telanjang di tingkat atas
//    3. <p><img></p>                           — gambar SEBARIS (inline)
//
//  Bentuk ketiga inilah yang semula tidak dikenali. Gambar yang disisipkan
//  sebagai gambar sebaris dibungkus paragraf oleh CKEditor, sehingga simpul di
//  tingkat atas berupa <p>, bukan <figure> maupun <img>. Predikat lama hanya
//  menjaring dua bentuk pertama, jadi setiap <p><img></p> dianggap "bukan
//  gambar" — deretnya langsung terputus dan gambar menumpuk ke bawah.
//
//  Sebuah <p> hanya dihitung sebagai gambar bila SELURUH isinya gambar. Begitu
//  ada teks di dalamnya — misalnya keterangan di samping gambar — paragraf itu
//  tetap diperlakukan sebagai paragraf biasa, sebab teksnya akan hilang bila
//  hanya gambarnya yang diambil.
// =========================================================================

export const MAKS_GAMBAR_PER_BARIS = 3;

// Wadah yang isinya ikut disisir. Tanpa ini, dua gambar bersebelahan di DALAM
// satu butir daftar tidak akan pernah dijajarkan — sebab penyisiran berhenti di
// tingkat atas, sedangkan CKEditor kerap menaruh gambar di dalam <li>.
//
// Daftarnya sengaja disebut satu per satu, bukan "semua kecuali X". Menyisir
// sembarang wadah berisiko mengusik struktur yang maknanya bergantung pada
// urutan anak — <figure> misalnya, yang <img>-nya berpasangan dengan
// <figcaption> dan tidak boleh dipisahkan.
const WADAH_DISISIR = new Set([
  'ol', 'ul', 'li', 'blockquote', 'div', 'section', 'article', 'td', 'th',
]);

// Simpul teks yang hanya berisi spasi atau baris baru. CKEditor menyisipkannya
// di antara blok, dan itu TIDAK boleh dianggap sebagai pemutus deret gambar.
const spasiSaja = (simpul) =>
  simpul.type === 'text' && !(simpul.data || '').trim();

const isiBermakna = (simpul) =>
  (simpul.children || []).filter((anak) => !spasiSaja(anak));

// Mengembalikan daftar simpul gambar yang dikandung sebuah blok, atau null bila
// blok itu bukan gambar. Sengaja mengembalikan daftar, bukan satu simpul, sebab
// satu paragraf dapat memuat beberapa gambar sebaris sekaligus.
const gambarDalamBlok = (simpul) => {
  if (!simpul || simpul.type !== 'tag') return null;

  if (simpul.name === 'img') return [simpul];
  if (simpul.name === 'figure' && simpul.attribs?.class?.includes('image')) {
    return [simpul];
  }

  if (simpul.name === 'p') {
    const isi = isiBermakna(simpul);
    const semuaGambar =
      isi.length > 0 &&
      isi.every((anak) => anak.type === 'tag' && anak.name === 'img');
    if (semuaGambar) return isi;
  }

  return null;
};

// Mencabut gambar yang berada di UJUNG sebuah wadah, menembus wadah dalam bila
// perlu. Wadah dalam yang menjadi kosong karenanya ikut dibuang.
//
// MENGAPA INI PERLU
// -----------------
// CKEditor kerap menaruh gambar sebagai isi terakhir sebuah butir daftar,
// sementara gambar berikutnya berada di luar daftar itu. Bagi pembaca keduanya
// bersebelahan — tidak ada teks di antaranya — tetapi bagi DOM keduanya berada
// di wadah yang berbeda, sehingga penyisiran per tingkat tidak akan pernah
// mempertemukannya.
//
// Pencabutan ini MENGUBAH struktur dokumen: gambar berpindah keluar dari butir
// daftarnya. Karena itu ia hanya dilakukan bila memang ada gambar sesudahnya
// untuk disandingkan — lihat pemakaiannya di bawah. Tanpa syarat itu, gambar
// tunggal akan ikut terlempar keluar tanpa memberi manfaat apa pun.
const cabutEkorGambar = (simpul) => {
  if (!simpul || simpul.type !== 'tag' || !WADAH_DISISIR.has(simpul.name)) {
    return [];
  }

  const anak = isiBermakna(simpul);
  const ekor = [];

  while (anak.length > 0) {
    const terakhir = anak[anak.length - 1];

    const gambar = gambarDalamBlok(terakhir);
    if (gambar) {
      ekor.unshift(...gambar);
      anak.pop();
      continue;
    }

    const dariDalam = cabutEkorGambar(terakhir);
    if (dariDalam.length === 0) break;
    ekor.unshift(...dariDalam);

    // Wadah dalam yang menjadi kosong tidak perlu dipertahankan; yang masih
    // memuat teks tetap tinggal, dan deretnya berhenti di situ.
    if (isiBermakna(terakhir).length === 0) {
      anak.pop();
      continue;
    }
    break;
  }

  if (ekor.length > 0) simpul.children = anak;
  return ekor;
};

/**
 * Menyusun ulang daftar anak dari akar konten sehingga gambar yang bersebelahan
 * terbungkus wadah grid.
 *
 * @param {Array} children daftar simpul dari html-react-parser (domhandler)
 * @returns {Array} daftar simpul baru — aman dipasang ke `node.children`
 */
export const kelompokkanGambarBerurutan = (children) => {
  const daftar = children || [];
  const hasil = [];

  // Tiap butir: { simpul, asli, sendirian }
  //   simpul     — gambarnya sendiri (<img> atau <figure>), yang masuk ke grid
  //   asli       — blok pembungkus di tingkat atas, dipakai bila TIDAK jadi grid
  //   sendirian  — true bila blok asal hanya memuat satu gambar
  let deret = [];

  const bilas = () => {
    if (deret.length === 0) return;

    // Satu gambar tidak membentuk baris. Simpul ASLI yang dikembalikan — bukan
    // gambarnya saja — supaya tampilan gambar tunggal sama persis seperti
    // sebelum perbaikan ini, termasuk jarak yang berasal dari <p> pembungkus.
    if (deret.length === 1) {
      const satu = deret[0];
      hasil.push(satu.sendirian ? satu.asli : satu.simpul);
      deret = [];
      return;
    }

    for (let i = 0; i < deret.length; i += MAKS_GAMBAR_PER_BARIS) {
      const potong = deret.slice(i, i + MAKS_GAMBAR_PER_BARIS);

      if (potong.length > 1) {
        // Simpul buatan ini bukan objek domhandler sungguhan, melainkan objek
        // biasa berbentuk sama. html-react-parser menerimanya — sudah diuji —
        // dan cara ini menghindari kebergantungan langsung pada domhandler,
        // yang hanya hadir sebagai dependensi turunan.
        hasil.push({
          type: 'tag',
          name: 'div',
          attribs: { class: `image-gallery-grid cols-${potong.length}` },
          children: potong.map((butir) => butir.simpul),
        });
      } else {
        // Sisa satu gambar pada baris terakhir, misalnya gambar keempat.
        hasil.push(potong[0].sendirian ? potong[0].asli : potong[0].simpul);
      }
    }

    deret = [];
  };

  // Adakah blok gambar pada posisi i ke depan, melewati simpul spasi? Dipakai
  // sebagai SYARAT sebelum mencabut ekor sebuah wadah: tanpa calon pasangan,
  // pencabutan hanya akan memindahkan gambar tunggal tanpa alasan.
  const adaGambarSesudah = (i) => {
    for (let j = i; j < daftar.length; j++) {
      if (spasiSaja(daftar[j])) continue;
      return Boolean(gambarDalamBlok(daftar[j]));
    }
    return false;
  };

  daftar.forEach((anak, i) => {
    if (spasiSaja(anak)) {
      // Dipertahankan hanya di luar deret; di dalam deret ia justru akan
      // menyisipkan jarak liar di antara sel grid.
      if (deret.length === 0) hasil.push(anak);
      return;
    }

    const gambar = gambarDalamBlok(anak);

    if (gambar) {
      gambar.forEach((satuGambar) =>
        deret.push({
          simpul: satuGambar,
          asli: anak,
          sendirian: gambar.length === 1,
        })
      );
      return;
    }

    let ekor = [];
    if (anak.type === 'tag' && WADAH_DISISIR.has(anak.name)) {
      // Urutannya penting: ekor dicabut LEBIH DULU. Bila penyisiran ke dalam
      // dijalankan duluan, gambar di ujung sudah berubah menjadi wadah grid dan
      // tidak lagi dikenali sebagai gambar.
      if (adaGambarSesudah(i + 1)) ekor = cabutEkorGambar(anak);

      // Aturan yang sama diberlakukan pada sisa isinya. Dikerjakan SEBELUM
      // simpulnya diteruskan, sebab html-react-parser baru menyusuri anak-anaknya
      // setelah tahap ini selesai — jadi penyusunan ulang di sini pasti terbaca.
      anak.children = kelompokkanGambarBerurutan(anak.children);
    }

    bilas();

    // Wadah yang isinya habis tercabut tidak diteruskan — daftar kosong hanya
    // akan menyisakan penomoran atau bulatan tanpa isi.
    if (anak.type !== 'tag' || isiBermakna(anak).length > 0) hasil.push(anak);

    // Ekor menjadi awal deret baru, siap disandingkan dengan gambar sesudahnya.
    ekor.forEach((satuGambar) =>
      deret.push({ simpul: satuGambar, asli: satuGambar, sendirian: false })
    );
  });

  bilas();
  return hasil;
};
