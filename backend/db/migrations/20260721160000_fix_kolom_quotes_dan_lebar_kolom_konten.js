// Menutup dua celah skema yang membuat fitur gagal di database baru.
//
// 1) profil_pegawai.quotes
//    profilPegawaiController.upsertProfil menuliskan kolom `quotes`, tetapi
//    kolomnya tidak pernah dibuat pada migrasi pembuatan tabel
//    (20260712075047_create_profil_pegawai_table.js). Akibatnya "Simpan Profil"
//    gagal total di database yang masih baru:
//      PostgreSQL 42703 - column "quotes" of relation "profil_pegawai" does not exist
//
// 2) halaman_konten.judul & kunci_halaman
//    `judul` dibatasi varchar(255) dan `kunci_halaman` varchar(100), padahal
//    kunci diturunkan dari nama menu (lihat MenuContentEditor) yang bisa panjang.
//    Menyimpan konten berjudul panjang gagal dengan:
//      PostgreSQL 22001 - value too long for type character varying(255)
//    Sisi tampilan sudah aman menangani teks panjang (line-clamp + ellipsis),
//    jadi melebarkan kolom tidak menimbulkan masalah tata letak.
//
// CATATAN PENTING - migrasi ini sengaja dibuat IDEMPOTEN:
// sebagian anggota tim sudah memiliki kolom-kolom ini di database lokalnya,
// sehingga penambahan kolom dijaga `hasColumn`. Bagian alterTable aman diulang
// karena mengubah kolom ke tipe yang sudah sama tidak menghasilkan error.

exports.up = async function (knex) {
  const hasQuotes = await knex.schema.hasColumn('profil_pegawai', 'quotes');
  if (!hasQuotes) {
    await knex.schema.alterTable('profil_pegawai', function (table) {
      table.text('quotes');
    });
  }

  await knex.schema.alterTable('halaman_konten', function (table) {
    table.text('judul').notNullable().alter();
    table.string('kunci_halaman', 255).notNullable().alter();
  });
};

exports.down = async function (knex) {
  const hasQuotes = await knex.schema.hasColumn('profil_pegawai', 'quotes');
  if (hasQuotes) {
    await knex.schema.alterTable('profil_pegawai', function (table) {
      table.dropColumn('quotes');
    });
  }

  // Catatan: rollback dapat gagal apabila sudah ada baris yang melebihi batas
  // lama. Pangkas dulu datanya bila memang perlu turun versi.
  await knex.schema.alterTable('halaman_konten', function (table) {
    table.string('judul', 255).notNullable().alter();
    table.string('kunci_halaman', 100).notNullable().alter();
  });
};
