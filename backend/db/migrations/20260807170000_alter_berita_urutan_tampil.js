// =========================================================================
//  BERITA — kolom urutan_tampil
//  -----------------------------------------------------------------------
//  Sebelum ini berita diurutkan `COALESCE(waktu_tayang, dibuat_pada) DESC`,
//  jadi urutannya sepenuhnya ditentukan waktu dan tidak dapat diatur admin.
//  Kolom ini yang membuatnya dapat diseret-urutkan, sama seperti
//  `halaman_konten` dan `profil_pegawai` yang sudah memilikinya.
//
//  PENGISIAN AWAL — bagian yang paling mudah keliru
//  ------------------------------------------------
//  Bila seluruh baris dibiarkan bernilai 0 (nilai bawaan), urutan tampilnya
//  seketika berubah menjadi tak menentu begitu pengurutan beralih ke kolom ini
//  — MySQL tidak menjamin urutan baris yang nilainya sama. Halaman berita yang
//  sudah tayang akan teracak tanpa seorang pun menyentuhnya.
//
//  Karena itu tiap baris diisi mengikuti urutan yang BERLAKU SAAT INI, dihitung
//  per menu. Sesudah migrasi ini tampilannya sama persis seperti sebelumnya;
//  yang berubah hanya urutannya kini dapat diubah.
// =========================================================================

exports.up = async function (knex) {
  const sudahAda = await knex.schema.hasColumn('berita', 'urutan_tampil');
  if (!sudahAda) {
    await knex.schema.alterTable('berita', (table) => {
      table.integer('urutan_tampil').notNullable().defaultTo(0);
    });
  }

  // Dikelompokkan per menu: nomor urut dimulai dari 0 pada setiap menu.
  const daftarMenu = await knex('berita').distinct('menu_id').pluck('menu_id');

  for (const menuId of daftarMenu) {
    const baris = await knex('berita')
      .select('id')
      .where('menu_id', menuId)
      .orderByRaw('COALESCE(waktu_tayang, dibuat_pada) DESC')
      .orderBy('id', 'desc');

    for (let i = 0; i < baris.length; i++) {
      await knex('berita').where('id', baris[i].id).update({ urutan_tampil: i });
    }
  }
};

exports.down = async function (knex) {
  const sudahAda = await knex.schema.hasColumn('berita', 'urutan_tampil');
  if (sudahAda) {
    await knex.schema.alterTable('berita', (table) => {
      table.dropColumn('urutan_tampil');
    });
  }
};
