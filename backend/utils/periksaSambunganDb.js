const db = require('../config/database');

// =========================================================================
//  PEMERIKSA SAMBUNGAN BASIS DATA SAAT BOOT (mode development)
//  -----------------------------------------------------------------------
//  Lahir dari kejadian 30 Juli 2026 di localhost. MySQL Laragon tidak berjalan,
//  dan akibatnya di terminal berupa PULUHAN jejak tumpukan hampir identik —
//  satu untuk setiap controller yang menyentuh basis data:
//
//    Acquire connection error: Error: connect ECONNREFUSED 127.0.0.1:3306
//    Error get tautan media sosial: Error: connect ECONNREFUSED ...
//    Error getHero Beranda: Error: connect ECONNREFUSED ...
//    Error getBeritaBeranda: ...        (dan seterusnya, berulang tiap muat halaman)
//
//  Seluruhnya berasal dari SATU sebab tunggal, dan tidak ada satu baris pun di
//  antaranya yang menyebut "MySQL tidak berjalan". Jawabannya sesederhana itu,
//  tetapi bentuk galatnya justru menyembunyikannya: yang paling menonjol adalah
//  nama-nama controller, sehingga kecurigaan jatuh ke kode aplikasi.
//
//  Modul ini menukar puluhan jejak tumpukan itu dengan SATU pernyataan yang
//  menyebut sebab dan tindakannya, dicetak sekali saat boot — sebelum
//  permintaan pertama sempat menghasilkan kebisingan apa pun.
//
//  MENGAPA MEMAKAI `db` (knex) DAN BUKAN SAMBUNGAN SENDIRI
//  -------------------------------------------------------
//  `scripts/cek-db.js` sengaja menyambung langsung lewat mysql2 dan mencoba
//  banyak alamat sekaligus, sebab tugasnya MENCARI jalan yang benar ketika
//  konfigurasi masih belum diketahui. Modul ini bertugas lain: memastikan jalan
//  yang BENAR-BENAR DIPAKAI APLIKASI memang hidup. Karena itu ia meminjam kolam
//  sambungan knex yang sama — kalau ia berhasil, aplikasi pasti berhasil, dan
//  kalau gagal, kegagalannya persis kegagalan yang akan dialami pengguna.
//
//  Efek sampingnya justru berguna: `min: 0` pada knexfile membuat sambungan yang
//  dipakai di sini dilepas kembali sesudahnya, jadi pemeriksaan ini tidak
//  meninggalkan sambungan menganggur.
//
//  MENGAPA TIDAK MENJATUHKAN PROSES
//  --------------------------------
//  Peladen tetap menyala walau basis data mati. Ini disengaja: rute yang tidak
//  menyentuh basis data tetap dapat diuji, dan menghidupkan MySQL lalu memuat
//  ulang halaman jauh lebih cepat daripada menjalankan ulang peladen. Perlakuan
//  ini sejajar dengan DIAGNOSA_DB di server.js, yang juga hanya mencatat.
// =========================================================================

// Setiap kode galat dipetakan ke sebab DAN tindakannya. Pemetaan ini yang
// membedakan pesan berguna dari pesan yang cuma mengulang kode galat.
const DIAGNOSIS = {
  ECONNREFUSED: {
    sebab: 'tidak ada peladen MySQL yang mendengarkan di alamat itu',
    tindakan: 'Nyalakan MySQL (di Laragon: tombol Start All), lalu muat ulang halaman.',
  },
  ETIMEDOUT: {
    sebab: 'peladen tidak menjawab sampai batas waktu',
    tindakan: 'Periksa DB_HOST dan DB_PORT, serta apakah peladennya terjangkau dari sini.',
  },
  ENOTFOUND: {
    sebab: 'nama host pada DB_HOST tidak dapat diterjemahkan',
    tindakan: 'Periksa ejaan DB_HOST di berkas .env.',
  },
  ENOENT: {
    sebab: 'berkas soket yang dituju tidak ada',
    tindakan: 'Kosongkan DB_SOCKET_PATH agar dicari otomatis, atau isi "none" untuk memaksa TCP.',
  },
  ER_ACCESS_DENIED_ERROR: {
    sebab: 'peladen hidup, tetapi pengguna atau sandi ditolak',
    tindakan: 'Periksa DB_USER dan DB_PASSWORD. Jalankan `npm run cek:db` untuk memisahkan soal sandi dari soal izin host.',
  },
  ER_DBACCESS_DENIED_ERROR: {
    sebab: 'pengguna sah, tetapi tidak punya akses ke basis data ini',
    tindakan: 'Beri izin pengguna itu atas DB_NAME.',
  },
  ER_BAD_DB_ERROR: {
    sebab: 'peladen hidup dan kredensial benar, tetapi basis datanya tidak ada',
    tindakan: 'Periksa DB_NAME, lalu jalankan migrasi: `npx knex migrate:latest`.',
  },
};

/**
 * Memeriksa sambungan basis data sekali, lalu mencetak satu pernyataan.
 * Tidak pernah melempar dan tidak pernah menghentikan proses.
 * @returns {Promise<boolean>} true bila sambungan sehat.
 */
const periksaSambunganDb = async () => {
  try {
    // Kueri paling murah yang masih membuktikan sambungan sungguhan terbentuk,
    // sekaligus memastikan `afterCreate` pada knexfile berjalan — zona waktu sesi
    // yang salah pernah membuat kunjungan pukul 00:00–07:00 WIB tercatat pada
    // tanggal sebelumnya, dan kegagalan itu sepenuhnya senyap.
    const [baris] = await db.raw('SELECT DATABASE() AS basis_data, @@session.time_zone AS zona');
    const { basis_data: basisData, zona } = baris[0];

    console.log(`[db] Sambungan basis data SEHAT (basis data "${basisData}", zona sesi ${zona}).`);

    // Zona sesi wajib +07:00. Bila tidak, `afterCreate` tidak berjalan dan
    // seluruh perhitungan tanggal statistik pengunjung akan bergeser tujuh jam.
    if (zona !== '+07:00') {
      console.warn(`[db] PERHATIAN: zona waktu sesi "${zona}", seharusnya +07:00.`);
      console.warn('     Berarti afterCreate pada knexfile.js tidak berjalan. Tanggal statistik');
      console.warn('     pengunjung akan bergeser dan kegagalannya tidak menimbulkan galat apa pun.');
    }
    return true;
  } catch (e) {
    const d = DIAGNOSIS[e.code];
    const alamat = e.address ? `${e.address}:${e.port ?? ''}`.replace(/:$/, '') : null;

    console.error(
      `[db] GAGAL menyambung ke basis data${alamat ? ` (${alamat})` : ''}: ` +
        (d ? d.sebab : `${e.code || 'galat tak dikenal'} — ${e.message}`)
    );
    if (d) console.error(`     ${d.tindakan}`);

    // Inilah yang paling menghemat waktu: memberi tahu lebih dulu bahwa
    // kebisingan yang akan datang berasal dari sebab TUNGGAL di atas, bukan dari
    // masing-masing controller yang namanya nanti muncul di setiap jejak tumpukan.
    console.error('     Peladen tetap menyala, tetapi SETIAP permintaan yang menyentuh basis data');
    console.error('     akan gagal dan mencetak jejak tumpukannya sendiri. Seluruh galat tersebut');
    console.error('     berasal dari satu sebab di atas — perbaiki itu, bukan controllernya.');
    return false;
  }
};

module.exports = { periksaSambunganDb };
