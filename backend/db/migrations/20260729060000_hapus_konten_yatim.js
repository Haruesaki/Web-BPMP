// =========================================================================
//  PEMBERSIHAN KONTEN YATIM
//  -----------------------------------------------------------------------
//  Menghapus baris `halaman_konten` dan `berita` yang `menu_id`-nya bernilai
//  NULL, yakni konten yang menunya sudah dihapus.
//
//  ASAL-USULNYA
//  ------------
//  `menuModel.delete` semula hanya menghapus baris pada tabel `menu` dan
//  menyerahkan nasib kontennya kepada foreign key. Kedua tabel ini memakai
//  ON DELETE SET NULL, sehingga barisnya tidak ikut terhapus melainkan
//  bertahan dengan `menu_id` menjadi NULL. Konten seperti itu tidak dapat
//  dijangkau halaman mana pun — `/halaman/<id>` menuntut menu yang ada —
//  tetapi masih terjaring pencarian global dan menghasilkan tautan
//  `/halaman/null` yang berujung pada halaman kosong.
//
//  Sebabnya sudah ditutup pada `models/menuModel.js` (konten kini dihapus
//  eksplisit sebelum menunya) dan gejalanya sudah ditutup pada
//  `controllers/searchController.js` (konten tanpa menu tidak lagi
//  ditampilkan). Migrasi ini membereskan baris yang TELANJUR tertinggal
//  sebelum kedua perbaikan itu ada.
//
//  MENGAPA AMAN DIHAPUS
//  --------------------
//  `menu_id` pada kedua tabel SELALU berasal dari parameter rute saat
//  pembuatan (`POST /api/halaman-konten/:menu_id` dan `POST /api/berita/:menu_id`),
//  sehingga tidak ada satu pun alur sah yang melahirkan baris ber-`menu_id`
//  NULL. Nilai NULL hanya mungkin lahir dari ON DELETE SET NULL di atas.
//
//  Baris turunannya (`bagian_konten` dan `linimasa_konten`) memakai
//  ON DELETE CASCADE terhadap `halaman_konten`, jadi ikut terbersihkan sendiri
//  tanpa perlu disebut di sini.
// =========================================================================

exports.up = async function (knex) {
  const jumlahKonten = await knex('halaman_konten').whereNull('menu_id').del();
  const jumlahBerita = await knex('berita').whereNull('menu_id').del();

  // Dicetak ke log supaya hasilnya terlihat saat migrasi dijalankan di
  // peladen — pada paket hosting tanpa terminal, keluaran inilah satu-satunya
  // cara memastikan berapa baris yang benar-benar terbersihkan.
  console.log(
    `[migrasi] Konten yatim dibersihkan — halaman_konten: ${jumlahKonten} baris, berita: ${jumlahBerita} baris.`
  );
};

exports.down = async function () {
  // Sengaja dibiarkan kosong, bukan terlupakan.
  //
  // Baris yang dihapus tidak menyimpan jejak menu asalnya — justru ketiadaan
  // jejak itulah yang membuatnya yatim — sehingga tidak ada apa pun yang bisa
  // dipulihkan. Melempar galat di sini hanya akan memblokir rollback migrasi
  // lain yang kebetulan berada di atasnya, tanpa memberi manfaat apa pun.
};
