const dotenv = require('dotenv');
const path = require('path');

// =========================================================================
//  PEMUAT .env — satu-satunya tempat dotenv dipanggil
//  -----------------------------------------------------------------------
//  Dipakai bersama oleh config/env.js dan knexfile.js. Disatukan di sini
//  karena dua alasan: supaya dotenv tidak dipanggil dua kali dalam satu
//  proses, dan supaya perlakuan terhadap berkas .env sama persis di kedua
//  jalur — termasuk saat Knex CLI dijalankan di luar konteks peladen web.
//
//  MENGAPA `override: true`
//  ------------------------
//  Bawaan dotenv TIDAK menimpa variabel yang sudah ada di proses, sehingga
//  nilai dari pengelola environment hosting selalu menang. Itu perilaku yang
//  wajar — sampai pengelola environment-nya sendiri bermasalah.
//
//  Hal itu benar-benar terjadi pada penempatan 27 Juli 2026: panel menolak
//  menyimpan perubahan pada sebagian variabel. Nilai lama tetap disuntikkan ke
//  proses, dan tanpa kemampuan menimpa, tidak ada satu pun cara membetulkannya
//  dari sisi aplikasi. Dengan `override: true`, berkas .env menjadi jalan
//  keluar yang selalu tersedia.
//
//  Konsekuensinya harus disadari: bila .env ada, ia MENANG atas panel. Karena
//  itu nama variabel yang ditimpa dicatat ke log — bukan nilainya — supaya
//  tidak ada nilai bayangan yang menyulitkan penelusuran di kemudian hari.
//
//  Perlu diingat pula, berkas .env tidak bertahan melewati penempatan ulang
//  kecuali ia disertakan di dalam paket penempatan.
// =========================================================================

// Dua variabel dikecualikan dari penimpaan, dan ini disengaja. Keduanya
// ditetapkan oleh PLATFORM, bukan oleh pengembang, sehingga berkas .env tidak
// boleh mengambil alih:
//
//   NODE_ENV — penentu mode, satu-satunya variabel yang kekeliruannya tidak
//     menimbulkan galat apa pun. Situs tetap menyala, tetapi berjalan dengan
//     CORS longgar dan tanpa menyajikan frontend. Berkas .env yang tidak
//     sengaja terbawa dari komputer pengembang — isinya selalu 'development' —
//     akan mematikan mode production secara diam-diam.
//
//   PORT — di Hostinger porta ditetapkan platform. Berkas .env dari komputer
//     pengembang memuat 5000, dan bila nilai itu menimpa porta yang ditetapkan
//     platform, peladen mendengarkan di porta yang salah sehingga situs tidak
//     dapat dijangkau sama sekali.
//
// Nilai dari proses hanya dipertahankan bila memang SUDAH ADA. Di localhost
// tidak ada yang menetapkannya, sehingga .env tetap berlaku seperti biasa.
const MILIK_PLATFORM = ['NODE_ENV', 'PORT'];
const nilaiSebelumnya = {};
MILIK_PLATFORM.forEach((n) => {
  if (process.env[n] !== undefined) nilaiSebelumnya[n] = process.env[n];
});

// Jalur berkas .env ditetapkan RELATIF TERHADAP BERKAS INI, bukan terhadap
// direktori kerja proses.
//
// Bawaan dotenv mencari '.env' pada `process.cwd()`. Itu benar selama proses
// dijalankan dari akar aplikasi — dan menjadi salah begitu tidak. Peladen
// aplikasi seperti Passenger dan LiteSpeed tidak menjamin direktori kerjanya,
// sehingga berkas .env yang sudah terpasang dengan benar pun bisa tidak
// terbaca sama sekali. Kegagalannya senyap: tidak ada galat, hanya nilai yang
// tidak pernah muncul.
//
// Berkas ini berada di <akar aplikasi>/config/, jadi induknya adalah akar
// aplikasi — tempat .env semestinya berada, baik di lokal maupun di peladen.
const JALUR_ENV = path.join(__dirname, '..', '.env');

const hasil = dotenv.config({ path: JALUR_ENV, override: true, quiet: true });

// Keberadaan berkasnya dilaporkan tegas. Tanpa ini, ".env tidak terbaca" dan
// ".env terbaca tetapi kosong" tampak sama persis dari luar.
if (hasil.error) {
  console.log(`[env] Tidak ada berkas .env pada ${JALUR_ENV}. Seluruh nilai berasal dari pengelola environment.`);
}

for (const [nama, semula] of Object.entries(nilaiSebelumnya)) {
  if (process.env[nama] !== semula) {
    console.warn(
      `[env] Berkas .env mencoba mengubah ${nama} menjadi "${process.env[nama]}". ` +
        `Diabaikan — nilai dari pengelola environment ("${semula}") dipertahankan.`
    );
    process.env[nama] = semula;
  }
}

if (hasil.parsed) {
  const nama = Object.keys(hasil.parsed).filter((n) => nilaiSebelumnya[n] === undefined);
  if (nama.length) {
    console.log(`[env] ${nama.length} variabel dimuat dari berkas .env dan MENIMPA nilai dari pengelola environment:`);
    console.log(`      ${nama.join(', ')}`);
  }
}

module.exports = hasil;
