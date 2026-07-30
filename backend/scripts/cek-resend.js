const muatEnv = require('../config/muatEnv');
const axios = require('axios');

// =========================================================================
//  PEMERIKSA KUNCI RESEND
//  -----------------------------------------------------------------------
//  Dijalankan lewat `npm run cek:resend`, termasuk dari tombol "Run JS script"
//  pada panel hosting yang tidak menyediakan akses SSH.
//
//  MENGAPA BERKAS INI ADA
//  ----------------------
//  Pada 29 Juli 2026, fitur Lupa Password gagal dengan HTTP 401 "API key is
//  invalid" padahal kunci di panel sudah benar. Mencari sebabnya memakan waktu
//  lama karena EMPAT keadaan yang sama sekali berbeda menghasilkan gejala yang
//  identik dari luar:
//
//    1. Kunci di panel benar, tetapi proses belum dijalankan ulang sehingga
//       masih memegang kunci lama di memori. Menyegarkan peramban tidak
//       menjalankan ulang Node — hanya tombol Restart yang melakukannya.
//    2. Nama variabel di panel tidak persis sama, sehingga nilainya justru
//       dipasok berkas .env sisa penempatan lama.
//    3. Kunci di panel ikut tertempel bersama tanda kutip atau spasi,
//       sehingga kunci yang sah pun ditolak Resend.
//    4. Kunci itu sendiri memang sudah dicabut atau salah salin.
//
//  Keempatnya menjawab pertanyaan yang berbeda, dan tidak satu pun dapat
//  dibedakan dari pesan galat Resend. Berkas ini memisahkan keempatnya dalam
//  sekali jalan: ia melaporkan ASAL kunci yang sedang dipegang proses, lalu
//  MENGUJINYA langsung ke Resend.
//
//  Berkas ini TIDAK PERNAH mencetak kunci. Yang ditampilkan hanya asal,
//  panjang, dan sidik jari — keluaran skrip diagnosis kerap disalin ke tiket
//  bantuan atau tangkapan layar.
// =========================================================================

const NODE_ENV = (process.env.NODE_ENV || 'development').trim().toLowerCase();

const { nilai: apiKey, keluhan: keluhanKunci } = muatEnv.bersihkan('RESEND_API_KEY', process.env.RESEND_API_KEY);
const { nilai: fromEmail, keluhan: keluhanEmail } = muatEnv.bersihkan('RESEND_FROM_EMAIL', process.env.RESEND_FROM_EMAIL);

console.log('='.repeat(66));
console.log(`  PEMERIKSAAN KUNCI RESEND — mode terbaca: ${NODE_ENV}`);
console.log('='.repeat(66));

// --------------------------------------------------------- apa yang dipegang
console.log('\nNilai yang BENAR-BENAR dipegang proses ini:');
console.log(`  RESEND_API_KEY      asal=${muatEnv.asal('RESEND_API_KEY').padEnd(5)}  ` +
  (apiKey ? `panjang=${apiKey.length} sidik=${muatEnv.sidik('RESEND_API_KEY', apiKey)}` : 'KOSONG'));
console.log(`  RESEND_FROM_EMAIL   asal=${muatEnv.asal('RESEND_FROM_EMAIL').padEnd(5)}  ` +
  (fromEmail ? `${fromEmail}` : 'KOSONG'));

if (muatEnv.adaBerkasEnv) {
  console.log(`\n  Catatan: berkas .env ada di ${muatEnv.jalurEnv}`);
  if (NODE_ENV === 'production') {
    console.log('  Di peladen berkas itu seharusnya tidak ada. Hapus agar hanya panel yang berkuasa.');
  }
}

const keluhan = [...keluhanKunci, ...keluhanEmail];
if (keluhan.length) {
  console.log('\n  [!] Bentuk nilai yang mencurigakan:');
  keluhan.forEach((k) => console.log(`      - ${k}`));
}

const selesai = (kode) => {
  console.log('='.repeat(66));
  process.exit(kode);
};

if (!apiKey) {
  console.log('\n' + '='.repeat(66));
  console.log('  KESIMPULAN: RESEND_API_KEY kosong — tidak ada yang bisa diuji.');
  console.log('  Pasang variabel itu pada pengelola environment, lalu Restart aplikasi.');
  selesai(1);
}

// Kunci Resend selalu berawalan "re_". Diperiksa lebih dulu karena kekeliruan
// ini murah dideteksi dan tidak perlu memanggil jaringan sama sekali.
if (!apiKey.startsWith('re_')) {
  console.log('\n  [!] Kunci tidak berawalan "re_". Kunci Resend selalu berawalan demikian —');
  console.log('      besar kemungkinan yang tertempel adalah nilai lain (mis. Webhook Secret).');
}

// -------------------------------------------------------------- uji ke Resend
//
// Titik akhir /domains dipilih karena hanya membaca, tidak mengirim surel apa
// pun, dan sudah cukup membuktikan keabsahan kunci sekaligus memperlihatkan
// domain mana yang benar-benar terverifikasi.
console.log('\nMenguji kunci ke Resend (GET /domains) ...');

axios
  .get('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 15000,
    validateStatus: () => true,
  })
  .then((balasan) => {
    const status = balasan.status;

    if (status === 200) {
      console.log(`  HTTP 200 — kunci yang dipegang proses ini SAH.\n`);

      const domain = Array.isArray(balasan.data?.data) ? balasan.data.data : [];
      if (!domain.length) {
        console.log('  Belum ada domain terdaftar di akun Resend ini.');
      } else {
        console.log('  Domain pada akun ini:');
        domain.forEach((d) => console.log(`    - ${d.name}  status=${d.status}`));
      }

      if (!fromEmail) {
        console.log('\n  [!] RESEND_FROM_EMAIL kosong. Kunci sah, tetapi pengiriman tetap gagal.');
        selesai(1);
      }

      const domainPengirim = String(fromEmail.split('@').pop() || '').toLowerCase();
      const cocok = domain.find((d) => String(d.name).toLowerCase() === domainPengirim);

      console.log('');
      if (!cocok) {
        console.log(`  [!] Domain pengirim "${domainPengirim}" TIDAK ada pada akun ini.`);
        console.log('      Resend menolak mengirim dari domain yang tidak terdaftar. Tambahkan');
        console.log('      domainnya di dashboard Resend, atau samakan RESEND_FROM_EMAIL.');
        selesai(1);
      }

      if (String(cocok.status).toLowerCase() !== 'verified') {
        console.log(`  [!] Domain pengirim "${domainPengirim}" berstatus "${cocok.status}", belum verified.`);
        console.log('      Selesaikan pemasangan data DNS di Resend. Selama belum verified,');
        console.log('      pengiriman akan ditolak walaupun kuncinya sah.');
        selesai(1);
      }

      console.log(`  [v] Domain pengirim "${domainPengirim}" sudah verified.`);
      console.log('\n' + '='.repeat(66));
      console.log('  KESIMPULAN: kunci sah dan domain pengirim siap. Fitur Lupa Password');
      console.log('  seharusnya berjalan. Bila masih gagal, periksa Log Runtime pada baris');
      console.log('  yang berawalan [Resend].');
      selesai(0);
    }

    // Resend memakai LEBIH DARI SATU kode status untuk menolak kunci, dan ini
    // baru ketahuan saat diuji sungguhan:
    //   401 — kunci berbentuk benar tetapi tidak dikenali (dicabut, salah akun).
    //   400 — kunci cacat bentuknya, mis. terpotong atau ikut tanda kutip.
    // Karena akibatnya bagi pengguna sama persis, keduanya ditangani sama.
    // Pencocokan pesan dibatasi pada 400 saja supaya 401 tetap tertangkap
    // meskipun kelak Resend mengubah bunyi pesannya.
    const pesanBalasan = String(balasan.data?.message ?? '');
    const kunciDitolak = status === 401 || (status === 400 && /api key/i.test(pesanBalasan));

    if (kunciDitolak) {
      console.log(`  HTTP ${status} — Resend MENOLAK kunci yang dipegang proses ini.`);
      console.log(`  Balasan Resend: ${pesanBalasan || JSON.stringify(balasan.data)}\n`);
      if (status === 400) {
        console.log('  Kode 400 (bukan 401) menandakan BENTUK kuncinya yang bermasalah — biasanya');
        console.log('  tersalin sebagian, atau ikut tertempel bersama tanda kutip maupun spasi.');
        console.log('  Bandingkan panjang di atas dengan panjang kunci di dashboard Resend.\n');
      }
      console.log('  Pertanyaan berikutnya: apakah kunci ini memang kunci yang Anda pasang di panel?');
      console.log('');
      if (muatEnv.asal('RESEND_API_KEY') === 'panel') {
        console.log('  Asalnya "panel", jadi nilai dari pengelola environment MEMANG sudah sampai');
        console.log('  ke proses ini. Berarti masalahnya ada pada nilainya sendiri:');
        console.log('    - kunci sudah dicabut atau dibuat ulang di dashboard Resend;');
        console.log('    - kunci tersalin sebagian (bandingkan panjangnya dengan yang di dashboard);');
        console.log('    - kunci milik akun Resend yang berbeda.');
        console.log('');
        console.log('  Bila Anda BARU SAJA mengubahnya di panel: catat sidik jari di atas, lalu');
        console.log('  Restart aplikasi dan jalankan ulang perintah ini. Sidik yang tidak berubah');
        console.log('  berarti proses belum benar-benar dijalankan ulang.');
      } else if (muatEnv.asal('RESEND_API_KEY') === '.env' && NODE_ENV === 'production') {
        console.log('  Asalnya ".env" — INILAH SEBABNYA. Kunci ini datang dari berkas .env di');
        console.log('  peladen, BUKAN dari pengelola environment. Artinya RESEND_API_KEY belum');
        console.log('  ada di panel, atau namanya tidak persis sama sehingga tidak terbaca.');
        console.log('');
        console.log('  Perbaikan: pasang RESEND_API_KEY di panel dengan ejaan yang persis,');
        console.log(`  hapus berkas ${muatEnv.jalurEnv}, lalu Restart aplikasi.`);
      } else if (muatEnv.asal('RESEND_API_KEY') === '.env') {
        // Di komputer pengembang, .env memang satu-satunya sumber dan itu wajar —
        // tidak ada pengelola environment di localhost. Jadi penolakan di sini
        // berarti kuncinya sendiri yang bermasalah, bukan urutan kemenangan nilai.
        console.log('  Asalnya ".env", dan di localhost itu memang wajar — tidak ada pengelola');
        console.log('  environment di sini. Berarti kunci di dalam berkas .env Anda sendiri yang');
        console.log('  sudah tidak sah (kemungkinan besar kunci lama yang sudah dicabut).');
      } else if (muatEnv.asal('RESEND_API_KEY') === '.env!') {
        console.log('  Asalnya ".env!" — berkas .env sedang MENIMPA panel karena ENV_FILE_OVERRIDE');
        console.log('  menyala. Selama bendera itu aktif, apa pun yang Anda ubah di panel tidak');
        console.log('  akan berpengaruh. Matikan ENV_FILE_OVERRIDE, lalu Restart aplikasi.');
      }
      selesai(1);
    }

    if (status === 403) {
      console.log('  HTTP 403 — kunci dikenali tetapi izinnya tidak cukup.\n');
      console.log('  Kunci Resend dapat dibatasi hanya untuk mengirim (sending access), sehingga');
      console.log('  membaca daftar domain ditolak. Untuk pengiriman OTP hal ini TIDAK masalah —');
      console.log('  artinya kunci yang dipegang proses ini sah. Uji langsung lewat Lupa Password.');
      selesai(0);
    }

    if (status === 429) {
      console.log('  HTTP 429 — permintaan dibatasi Resend. Kunci tidak dapat dinilai sekarang.');
      console.log('  Tunggu sebentar lalu jalankan ulang perintah ini.');
      selesai(1);
    }

    console.log(`  HTTP ${status} — balasan di luar dugaan.`);
    console.log(`  Isi balasan: ${JSON.stringify(balasan.data)}`);
    selesai(1);
  })
  .catch((galat) => {
    // Kegagalan jaringan bukan kegagalan konfigurasi. Dibedakan tegas supaya
    // tidak salah menuduh kuncinya.
    console.log('  Permintaan ke Resend GAGAL sebelum sempat dinilai.\n');
    console.log(`  Sebab: ${galat.code || galat.message}`);
    console.log('  Ini soal jaringan peladen, bukan soal kunci. Periksa apakah peladen');
    console.log('  diizinkan menghubungi api.resend.com melalui HTTPS.');
    selesai(1);
  });
