// =========================================================================
//  JALUR PANEL ADMIN — satu-satunya tempat alamatnya ditetapkan
//  -----------------------------------------------------------------------
//  UNTUK MENGUBAH ALAMAT PANEL, UBAH SATU BARIS DI BAWAH INI SAJA.
//  Seluruh rute, pengalihan, tautan sidebar, dan penjaga halaman mengambil
//  nilainya dari sini. Sebelumnya alamat `/admin` tertulis tangan di 40-an
//  tempat pada 13 berkas; satu saja yang terlewat saat diubah, dan akibatnya
//  bukan galat yang terlihat — melainkan tombol yang melempar ke halaman
//  kosong, atau penjaga sesi yang mengalihkan ke alamat yang sudah tidak ada.
//
//  =====================================================================
//  YANG PERLU ANDA KETAHUI TENTANG APA YANG DILINDUNGI CARA INI
//  =====================================================================
//  Mengubah alamat panel MENGURANGI kebisingan dari pemindai otomatis. Bot
//  yang menyapu internet mencoba daftar alamat lazim — /admin, /wp-admin,
//  /administrator, /cms, /panel — lalu menembakkan percobaan kata sandi ke
//  apa pun yang menjawab. Alamat yang tidak ada di daftar itu tidak akan
//  pernah mereka sentuh, dan log peladen pun jauh lebih bersih.
//
//  TETAPI ALAMAT INI BUKAN RAHASIA, dan tidak dapat dijadikan rahasia.
//  Aplikasi ini SPA: seluruh berkas JavaScript-nya diunduh oleh SETIAP
//  pengunjung, dan alamat di bawah ada di dalam berkas itu. Siapa pun yang
//  membuka peralatan pengembang lalu mencari kata "pendopo" akan
//  menemukannya dalam hitungan detik. Memindahkannya ke variabel environment
//  pun tidak menolong: nilai `VITE_*` ditanam ke dalam bundel saat dibangun,
//  dan bundelnya tetap publik.
//
//  Jadi ini LAPISAN TAMBAHAN, bukan pengganti. Yang benar-benar menahan
//  penyusup tetap tiga hal yang sudah terpasang:
//    1. `authMiddleware` — tanpa token yang sah, seluruh endpoint /api
//       menjawab 401, tidak peduli lewat alamat mana panelnya dibuka;
//    2. pembatas laju login — 10 percobaan per 15 menit per alamat IP;
//    3. kata sandi ber-hash bcrypt dan masa berlaku sesi yang terbatas.
//
//  Perlu dicatat pula: alamat API **tidak** berubah dan memang tidak perlu.
//  Yang diserang bot sebenarnya `POST /api/auth/login`, dan itu sudah dijaga
//  pembatas laju. Mengaburkannya juga hanya akan menyulitkan diri sendiri
//  tanpa menambah perlindungan.
// =========================================================================

/**
 * Akar alamat panel admin. Wajib dimulai dengan '/' dan TANPA garis miring
 * di ujungnya.
 *
 * Bila ingin menggantinya, pilih yang bukan kata lazim dalam daftar pemindai
 * (hindari admin, administrator, cms, panel, dashboard, backend, manage,
 * login, wp-admin) dan tetap mudah diketik anggota tim setiap hari. Menambah
 * beberapa aksara acak — misalnya '/pendopo-kendali-7f3a' — menaikkan sedikit
 * lagi ambangnya.
 */
export const AKAR_ADMIN = '/exotic';

/**
 * Menyusun alamat di bawah panel admin.
 *   jAdmin()                  → '/pendopo-kendali'
 *   jAdmin('setting')         → '/pendopo-kendali/setting'
 *   jAdmin(`post/${a}/${b}`)  → '/pendopo-kendali/post/a/b'
 */
export const jAdmin = (sub = '') => {
  const bersih = String(sub).replace(/^\/+/, '');
  return bersih ? `${AKAR_ADMIN}/${bersih}` : AKAR_ADMIN;
};

/** Alamat yang dipakai berulang kali, supaya tidak ditulis ulang. */
export const JALUR_MASUK = jAdmin('login');
export const JALUR_LUPA_SANDI = jAdmin('lupa-password');

/**
 * Apakah sebuah pathname berada di dalam panel admin?
 *
 * Sengaja TIDAK memakai `startsWith(AKAR_ADMIN)` apa adanya. Bentuk itu ikut
 * menganggap '/pendopo-kendali-lain' sebagai bagian panel, sebab ia memang
 * berawalan sama. Perbandingannya karena itu dipisah: sama persis dengan
 * akarnya, ATAU diikuti garis miring.
 */
export const diDalamAdmin = (pathname = '') =>
  pathname === AKAR_ADMIN || pathname.startsWith(`${AKAR_ADMIN}/`);
