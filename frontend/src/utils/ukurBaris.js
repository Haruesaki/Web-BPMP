// =========================================================================
//  UKUR BARIS TABEL — satu sumber pengukuran untuk seluruh bagian seret-urut
//  -----------------------------------------------------------------------
//  Dipakai bersama oleh TIGA hal yang harus sepakat pada angka yang sama:
//  penempatan pegangan titik-enam, penentuan baris sasaran saat menyeret, dan
//  animasi pergeseran baris. Bila ketiganya mengukur sendiri-sendiri, cukup
//  satu yang berbeda sedikit untuk membuat pegangan meleset dari barisnya.
//
//  DUA JEBAKAN YANG DIHINDARI BERKAS INI
//
//  1. TRANSFORM. Animasi pergeseran memasang `transform: translateY(...)` pada
//     tiap <tr>, dan `getBoundingClientRect` IKUT MENGHITUNG transform itu.
//     Mengukur baris dengan rect di tengah animasi menghasilkan angka yang
//     sedang bergerak — sasaran seretan pun ikut melompat-lompat. Karena itu
//     tinggi baris diambil dari `offsetHeight`, yang tidak terpengaruh
//     transform, dan posisi tegaknya dijumlahkan sendiri dari tinggi baris
//     sebelumnya. Baris tabel bersambung tanpa sela (border-collapse:
//     collapse), sehingga penjumlahan itu sama dengan posisi sesungguhnya.
//
//  2. ZOOM. `.bc-content` memasang `zoom: 1.2`. `getBoundingClientRect`
//     menghasilkan piksel layar yang SUDAH ter-zoom, sedangkan nilai `top`
//     maupun `translateY` yang kita tuliskan ditafsirkan dalam ruang tata
//     letak yang BELUM ter-zoom. Mencampur keduanya membuat setiap angka
//     meleset sebesar faktor zoom — pernah terukur 19px pada tabel ini.
//     Faktornya dihitung sendiri (rect ÷ offset), bukan ditulis 1.2, sebab
//     nilai di berkas gaya dapat berubah dan pembagi usang jauh lebih sukar
//     dilacak daripada pembagi yang menghitung dirinya sendiri.
// =========================================================================

export const PEMILIH_BARIS = 'tbody tr[data-seret-id]';

/**
 * Mengukur seluruh baris yang dapat diseret di dalam `wadah`.
 *
 * Mengembalikan ukuran dalam RUANG TATA LETAK (belum ter-zoom), relatif
 * terhadap sisi atas `wadah`:
 *   { baris: [{ id, atas, tinggi, simpul }], skala, ada }
 */
export const ukurBaris = (wadah, pemilih = PEMILIH_BARIS) => {
  const kosong = { baris: [], skala: 1, ada: false };
  if (!wadah) return kosong;

  const simpul = [...wadah.querySelectorAll(pemilih)];
  if (simpul.length === 0) return kosong;

  const kotakWadah = wadah.getBoundingClientRect();
  const skala = wadah.offsetHeight > 0 ? kotakWadah.height / wadah.offsetHeight : 1;
  const pembagi = skala > 0 ? skala : 1;

  // Jangkarnya <tbody>, bukan baris pertama: rect sebuah elemen TIDAK berubah
  // oleh transform pada anak-anaknya, sehingga <tbody> tetap diam walau
  // seluruh barisnya sedang beranimasi.
  const induk = simpul[0].parentElement;
  const kotakInduk = induk.getBoundingClientRect();
  const atasInduk = (kotakInduk.top - kotakWadah.top) / pembagi;

  let terkumpul = 0;
  const baris = simpul.map((n) => {
    const tinggi = n.offsetHeight;
    const butir = {
      id: n.getAttribute('data-seret-id'),
      atas: atasInduk + terkumpul,
      tinggi,
      simpul: n,
    };
    terkumpul += tinggi;
    return butir;
  });

  return { baris, skala: pembagi, ada: true };
};

/**
 * Mengubah posisi tegak kursor (piksel layar) menjadi posisi dalam ruang tata
 * letak `wadah` — ruang yang sama dengan hasil `ukurBaris`.
 */
export const yKursorKeLokal = (wadah, clientY) => {
  if (!wadah) return 0;
  const kotak = wadah.getBoundingClientRect();
  const skala = wadah.offsetHeight > 0 ? kotak.height / wadah.offsetHeight : 1;
  return (clientY - kotak.top) / (skala > 0 ? skala : 1);
};

/**
 * Indeks sisipan menurut posisi tegak kursor saja — mendatar diabaikan
 * sepenuhnya, sehingga kursor boleh berada di mana pun secara mendatar.
 *
 * Mengembalikan indeks SISIP (0..n), yaitu jumlah baris yang titik tengahnya
 * sudah dilewati kursor.
 */
export const indeksSisipDariY = (wadah, clientY, pemilih = PEMILIH_BARIS) => {
  const { baris, ada } = ukurBaris(wadah, pemilih);
  if (!ada) return -1;
  const y = yKursorKeLokal(wadah, clientY);
  for (let i = 0; i < baris.length; i += 1) {
    if (y < baris[i].atas + baris[i].tinggi / 2) return i;
  }
  return baris.length;
};
