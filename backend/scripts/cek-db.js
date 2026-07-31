require('../config/muatEnv');
const mysql = require('mysql2/promise');

// =========================================================================
//  PEMERIKSA SAMBUNGAN BASIS DATA
//  -----------------------------------------------------------------------
//  Mencoba beberapa kemungkinan sekaligus dalam satu jalan, bukan satu per
//  satu. Alasannya praktis: setiap percobaan lewat pengelola variabel hosting
//  menuntut penempatan ulang, dan satu putaran memakan waktu bermenit-menit.
//
//  Yang dibedakan skrip ini:
//
//    - `pengguna@localhost` dan `pengguna@127.0.0.1` adalah DUA IZIN BERBEDA
//      di mata MySQL. Peladen bersama lazimnya hanya memberi izin bagi salah
//      satu. Bila kredensialnya benar tetapi izinnya tidak cocok, galatnya
//      tetap berbunyi "Access denied" — sama persis dengan galat sandi salah,
//      sehingga mudah disalahartikan.
//
//    - Sambungan lewat soket Unix tidak melewati lapisan jaringan sama sekali,
//      dan pada sebagian pemasangan justru itulah satu-satunya jalan yang
//      diizinkan.
//
//  Nilai sandi TIDAK PERNAH dicetak — hanya panjangnya.
// =========================================================================

const baca = (nama, cadangan = '') => String(process.env[nama] ?? cadangan).trim();

const PENGGUNA = baca('DB_USER');
const SANDI = baca('DB_PASSWORD');
const BASIS_DATA = baca('DB_NAME');
const PORTA = Number(baca('DB_PORT', '3306')) || 3306;
const HOST_TERPASANG = baca('DB_HOST');

// Soket yang lazim dipakai pemasangan MySQL/MariaDB di Linux.
const SOKET_LAZIM = ['/var/lib/mysql/mysql.sock', '/tmp/mysql.sock', '/var/run/mysqld/mysqld.sock'];

const percobaan = [];
const tambah = (label, opsi) => percobaan.push({ label, opsi });

// Host yang tercantum di environment didahulukan supaya hasilnya sejajar
// dengan yang sebenarnya dipakai aplikasi.
if (HOST_TERPASANG) tambah(`host "${HOST_TERPASANG}" (dari DB_HOST)`, { host: HOST_TERPASANG, port: PORTA });
if (HOST_TERPASANG !== 'localhost') tambah('host "localhost"', { host: 'localhost', port: PORTA });
if (HOST_TERPASANG !== '127.0.0.1') tambah('host "127.0.0.1"', { host: '127.0.0.1', port: PORTA });

const SOKET_TERPASANG = baca('DB_SOCKET_PATH');
if (SOKET_TERPASANG && SOKET_TERPASANG.toLowerCase() !== 'none') {
  tambah(`soket ${SOKET_TERPASANG} (dari DB_SOCKET_PATH)`, { socketPath: SOKET_TERPASANG });
}
SOKET_LAZIM.filter((s) => s !== SOKET_TERPASANG).forEach((s) => tambah(`soket ${s}`, { socketPath: s }));

const ringkasGalat = (e) => {
  if (e.code === 'ER_ACCESS_DENIED_ERROR') return 'DITOLAK — pengguna, sandi, atau izin host tidak cocok';
  if (e.code === 'ER_DBACCESS_DENIED_ERROR') return 'pengguna sah, tetapi TIDAK PUNYA AKSES ke basis data ini';
  if (e.code === 'ER_BAD_DB_ERROR') return 'pengguna sah, tetapi NAMA BASIS DATA tidak ditemukan';
  if (e.code === 'ECONNREFUSED') return 'tidak ada yang mendengarkan di alamat itu';
  if (e.code === 'ENOENT') return 'berkas soket tidak ada';
  if (e.code === 'ETIMEDOUT') return 'kehabisan waktu';
  return `${e.code || ''} ${e.message}`.trim();
};

// Dibungkus fungsi supaya dapat dipanggil dari dua tempat: dijalankan langsung
// lewat `npm run cek:db`, atau dipanggil `server.js` saat DIAGNOSA_DB bernilai
// true. Yang kedua diperlukan karena sebagian paket hosting tidak menyediakan
// akses terminal sama sekali, sehingga log peladen menjadi satu-satunya saluran
// keluaran yang tersedia.
const jalankan = async ({ bolehKeluar = false } = {}) => {
  console.log('='.repeat(72));
  console.log('  PEMERIKSAAN SAMBUNGAN BASIS DATA');
  console.log('='.repeat(72));
  console.log(`  DB_USER      : ${PENGGUNA || '(KOSONG)'}`);
  console.log(`  DB_NAME      : ${BASIS_DATA || '(KOSONG)'}`);
  console.log(`  DB_PASSWORD  : ${SANDI ? `terisi (${SANDI.length} karakter)` : '(KOSONG)'}`);
  console.log(`  DB_HOST      : ${HOST_TERPASANG || '(KOSONG)'}`);
  console.log(`  DB_PORT      : ${PORTA}`);

  // Sandi bersimbol adalah penyebab yang kerap luput: bila nilainya pernah
  // melewati penafsir shell, karakter seperti backtick atau tanda dolar dapat
  // berubah arti sehingga yang sampai ke MySQL bukan sandi yang diketik.
  const bersimbol = SANDI && /[^A-Za-z0-9]/.test(SANDI);
  if (bersimbol) {
    const daftar = [...new Set(SANDI.replace(/[A-Za-z0-9]/g, '').split(''))].join(' ');
    console.log(`\n  CATATAN: sandi memuat karakter bukan huruf/angka -> ${daftar}`);
    console.log('  Bila seluruh percobaan di bawah ditolak, atur ulang sandi menjadi');
    console.log('  huruf dan angka saja. Itu menyingkirkan satu kelas masalah sekaligus.');
  }

  console.log('\n' + '-'.repeat(72));
  let berhasil = null;

  for (const { label, opsi } of percobaan) {
    const dasar = { user: PENGGUNA, password: SANDI, database: BASIS_DATA, connectTimeout: 8000 };
    let conn;
    try {
      conn = await mysql.createConnection({ ...dasar, ...opsi });
      const [baris] = await conn.query(
        "SELECT DATABASE() AS basis_data, @@character_set_connection AS charset, @@session.time_zone AS zona, DATE_FORMAT(NOW(),'%Y-%m-%d %H:%i:%s') AS waktu"
      );
      console.log(`  [BERHASIL] ${label}`);
      if (!berhasil) berhasil = { label, info: baris[0], opsi };
    } catch (e) {
      console.log(`  [gagal   ] ${label}  ->  ${ringkasGalat(e)}`);
    } finally {
      if (conn) await conn.end().catch(() => {});
    }
  }

  console.log('-'.repeat(72));

  if (!berhasil) {
    console.log('\n  KESIMPULAN: tidak ada satu pun jalan yang berhasil.');
    console.log('  Bila SELURUHNYA berbunyi "DITOLAK", masalahnya pada pengguna atau sandi,');
    console.log('  bukan pada alamat. Langkah yang paling menentukan:');
    console.log('    1. Buka Database > Management di hPanel, salin nama pengguna PERSIS');
    console.log('    2. Atur ulang sandi menjadi huruf dan angka saja');
    console.log('    3. Uji sandi itu dengan masuk ke phpMyAdmin memakai pengguna yang sama.');
    console.log('       Bila phpMyAdmin menerima tetapi skrip ini menolak, berarti masalahnya');
    console.log('       ada pada izin host, bukan pada sandi.');
    console.log('='.repeat(72));
    // Keluar dengan kode galat HANYA bila dijalankan sebagai perintah tersendiri.
    // Saat dipanggil dari server.js, menghentikan proses berarti menjatuhkan
    // seluruh situs hanya karena pemeriksaan diagnosis — jelas tidak sepadan.
    if (bolehKeluar) process.exit(1);
    return false;
  }

  console.log(`\n  KESIMPULAN: sambungan berhasil lewat ${berhasil.label}`);
  console.table([berhasil.info]);

  // Skrip ini menyambung langsung lewat mysql2, tanpa melewati kolam sambungan
  // knex. Penyetelan `SET time_zone = '+07:00'` berada pada `afterCreate` di
  // knexfile, sehingga tidak ikut berjalan di sini. Nilai "SYSTEM" pada kolom
  // zona karena itu WAJAR dan bukan pertanda zona waktu aplikasi salah.
  if (berhasil.info.zona === 'SYSTEM') {
    console.log('  Kolom zona bernilai "SYSTEM" itu wajar: skrip ini menyambung langsung,');
    console.log('  tanpa penyetelan zona waktu yang dijalankan aplikasi lewat knex.');
  }

  if (berhasil.opsi.socketPath) {
    console.log('  Jalan yang berhasil memakai SOKET, bukan TCP. Ini menegaskan bahwa akun');
    console.log("  MySQL Anda terdaftar sebagai @'localhost', sementara mysql2 pada Node");
    console.log("  selalu menyambung lewat TCP sehingga dikenali sebagai @'127.0.0.1'.");
    console.log(`  knexfile sudah mencari soket secara otomatis. Bila ternyata belum terpakai,`);
    console.log(`  pasang variabel:  DB_SOCKET_PATH=${berhasil.opsi.socketPath}`);
  } else if (berhasil.opsi.host !== HOST_TERPASANG) {
    console.log(`  Ubah DB_HOST menjadi "${berhasil.opsi.host}" pada pengelola variabel, lalu jalankan ulang.`);
  } else {
    console.log('  DB_HOST sudah benar. Sambungan basis data sehat.');
  }

  if (berhasil.info.charset !== 'utf8mb4') {
    console.log(`\n  PERHATIAN: charset "${berhasil.info.charset}", bukan utf8mb4.`);
  }
  console.log('='.repeat(72));
  return true;
};

module.exports = { jalankan };

// Dijalankan sebagai perintah tersendiri (`npm run cek:db`), bukan di-require.
if (require.main === module) {
  jalankan({ bolehKeluar: true }).catch((e) => {
    console.error('Galat tak terduga:', e.message);
    process.exit(1);
  });
}
