const dns = require('dns');
const net = require('net');

// =========================================================================
//  PENJAGA SSRF — penyaring alamat bagi permintaan keluar yang URL-nya
//  ditentukan pengguna (proksi berkas, pratinjau tautan).
//  -----------------------------------------------------------------------
//  SEBAB LAHIRNYA MODUL INI
//  ------------------------
//  Penjaga sebelumnya berada langsung di dalam `serveProxyFile` dan hanya
//  memeriksa NAMA HOST pada URL yang dikirim pengguna — mencocokkannya dengan
//  daftar pola seperti /^127\./ atau /^192\.168\./. Pemeriksaan semacam itu
//  tampak masuk akal, tetapi memeriksa hal yang keliru: yang menentukan ke
//  mana sambungan benar-benar pergi bukanlah ejaan nama host, melainkan
//  ALAMAT IP hasil resolusi DNS-nya.
//
//  Empat jalan tembus yang sudah terbukti atau jelas terbuka:
//
//    1. NAMA DOMAIN PUBLIK YANG MENUNJUK KE DALAM. `localtest.me` adalah
//       domain publik sungguhan yang seluruh catatan DNS-nya bernilai
//       127.0.0.1. Namanya lolos setiap pola di atas, tetapi sambungannya
//       mendarat di peladen kita sendiri. Ini DIBUKTIKAN EMPIRIS pada
//       3 Agustus 2026: proksi berhasil menjangkau layanan lokal peladen.
//
//    2. PENGALIHAN. Penjaga lama berjalan SEKALI di awal, sedangkan axios
//       diperbolehkan mengikuti sampai tiga pengalihan. Alamat pertama yang
//       tampak wajar cukup untuk lolos, lalu peladen sumber mengirim
//       `Location: http://127.0.0.1:5000/...` dan penjaganya sudah selesai
//       bekerja.
//
//    3. BENTUK ALAMAT NON-DESIMAL. `http://2130706433/` adalah cara lain
//       menulis 127.0.0.1 (bentuk desimal 32-bit); ada pula bentuk oktal
//       (0177.0.0.1) dan heksadesimal (0x7f.0.0.1). Tidak satu pun cocok
//       dengan pola bertitik.
//
//    4. IPv6. Pola lama sama sekali tidak menyebut `fc00::/7` (alamat lokal
//       unik), `fe80::/10` (link-local), maupun bentuk IPv4-terpetakan
//       `::ffff:127.0.0.1`.
//
//  CARA MODUL INI MENJAWABNYA
//  --------------------------
//  Penyaringan dipindahkan dari NAMA ke ALAMAT, dan dipasang pada lapisan
//  yang tidak dapat dilewati: fungsi `lookup` milik agen HTTP. Setiap kali
//  Node hendak membuka soket — permintaan pertama maupun setiap pengalihan,
//  disengaja maupun tidak — ia memanggil `lookup` lebih dulu. Dengan menaruh
//  penjaga di sana, tidak ada satu pun jalan keluar yang luput diperiksa,
//  termasuk jalan yang belum terpikirkan saat modul ini ditulis.
//
//  Letak itu sekaligus menutup DNS REBINDING: memeriksa DNS lebih dulu lalu
//  menyambung belakangan menyisakan celah waktu, sebab nama yang sama dapat
//  menjawab alamat berbeda pada resolusi kedua. Di sini yang diperiksa adalah
//  alamat dari resolusi yang IPB-nya benar-benar dipakai menyambung — tidak
//  ada resolusi kedua yang dapat menyelinap di antaranya.
//
//  Bentuk non-desimal ikut selesai dengan sendirinya: `getaddrinfo` menerima
//  "2130706433" dan mengembalikan 127.0.0.1, dan yang diperiksa modul ini
//  adalah hasilnya, bukan ejaannya.
// =========================================================================

// ---------------------------------------------------------------- IPv4
// Rentang yang ditolak beserta sebabnya. Bukan hanya rentang privat RFC 1918:
// alamat loopback, link-local (termasuk 169.254.169.254 — titik metadata yang
// dipakai hampir seluruh penyedia awan), CGNAT, serta rentang khusus lain juga
// tidak pernah menjadi sumber dokumen publik yang sah.
const RENTANG_IPV4 = [
  { cidr: '0.0.0.0/8', sebab: 'alamat "this network"' },
  { cidr: '10.0.0.0/8', sebab: 'jaringan privat' },
  { cidr: '100.64.0.0/10', sebab: 'CGNAT' },
  { cidr: '127.0.0.0/8', sebab: 'loopback' },
  { cidr: '169.254.0.0/16', sebab: 'link-local / titik metadata awan' },
  { cidr: '172.16.0.0/12', sebab: 'jaringan privat' },
  { cidr: '192.0.0.0/24', sebab: 'rentang khusus IETF' },
  { cidr: '192.0.2.0/24', sebab: 'rentang dokumentasi' },
  { cidr: '192.88.99.0/24', sebab: 'relai 6to4 usang' },
  { cidr: '192.168.0.0/16', sebab: 'jaringan privat' },
  { cidr: '198.18.0.0/15', sebab: 'rentang uji tolok ukur' },
  { cidr: '198.51.100.0/24', sebab: 'rentang dokumentasi' },
  { cidr: '203.0.113.0/24', sebab: 'rentang dokumentasi' },
  { cidr: '224.0.0.0/4', sebab: 'multicast' },
  { cidr: '240.0.0.0/4', sebab: 'rentang cadangan' },
];

const bitsIpv4 = (ip) => {
  const bagian = ip.split('.');
  if (bagian.length !== 4) return null;
  let nilai = 0;
  for (const b of bagian) {
    // `Number` sengaja dipakai bersama pemeriksaan pola: parseInt('12abc')
    // menghasilkan 12 tanpa mengeluh, dan kelonggaran itulah yang justru
    // menjadi celah pada penyaring berbasis untai.
    if (!/^\d{1,3}$/.test(b)) return null;
    const n = Number(b);
    if (n > 255) return null;
    nilai = (nilai * 256) + n;
  }
  return nilai;
};

const cocokCidrIpv4 = (nilai, cidr) => {
  const [alamat, panjang] = cidr.split('/');
  const dasar = bitsIpv4(alamat);
  const bit = Number(panjang);
  if (dasar === null) return false;
  if (bit === 0) return true;
  // Pembagian dipakai sebagai ganti geseran bit: operator `>>>` bekerja pada
  // 32 bit BERTANDA, sehingga alamat di atas 128.0.0.0 berubah negatif dan
  // pembandingannya menjadi salah tanpa gejala apa pun.
  const pembagi = Math.pow(2, 32 - bit);
  return Math.floor(nilai / pembagi) === Math.floor(dasar / pembagi);
};

// ---------------------------------------------------------------- IPv6
// Dikembalikan sebagai 16 bita agar awalannya dapat dibandingkan apa adanya,
// tanpa bergantung pada bentuk penulisan (huruf besar/kecil, pemadatan '::',
// maupun ekor IPv4 pada bentuk terpetakan).
const bytesIpv6 = (ip) => {
  // Pengenal zona (fe80::1%eth0) tidak berpengaruh pada alamatnya.
  const bersih = ip.split('%')[0];

  let inti = bersih;
  let ekorIpv4 = null;

  // Bentuk campuran: ::ffff:127.0.0.1 dan 64:ff9b::203.0.113.1
  const titikTerakhir = bersih.lastIndexOf(':');
  const setelahTitikDua = bersih.slice(titikTerakhir + 1);
  if (setelahTitikDua.includes('.')) {
    const v4 = bitsIpv4(setelahTitikDua);
    if (v4 === null) return null;
    ekorIpv4 = v4;
    inti = bersih.slice(0, titikTerakhir + 1) + '0:0';
  }

  const bagian = inti.split('::');
  if (bagian.length > 2) return null;

  const keAngka = (teks) =>
    teks
      .split(':')
      .filter((t) => t !== '')
      .map((t) => (/^[0-9a-fA-F]{1,4}$/.test(t) ? parseInt(t, 16) : NaN));

  const depan = keAngka(bagian[0] ?? '');
  const belakang = bagian.length === 2 ? keAngka(bagian[1] ?? '') : [];
  if ([...depan, ...belakang].some((n) => Number.isNaN(n))) return null;

  let hextet;
  if (bagian.length === 2) {
    const isi = 8 - depan.length - belakang.length;
    if (isi < 0) return null;
    hextet = [...depan, ...new Array(isi).fill(0), ...belakang];
  } else {
    if (depan.length !== 8) return null;
    hextet = depan;
  }

  if (ekorIpv4 !== null) {
    hextet[6] = Math.floor(ekorIpv4 / 65536);
    hextet[7] = ekorIpv4 % 65536;
  }

  const bita = [];
  for (const h of hextet) {
    bita.push(Math.floor(h / 256), h % 256);
  }
  return bita;
};

const awalanSama = (bita, awalan, panjangBit) => {
  const penuh = Math.floor(panjangBit / 8);
  const sisa = panjangBit % 8;
  for (let i = 0; i < penuh; i += 1) {
    if (bita[i] !== awalan[i]) return false;
  }
  if (sisa === 0) return true;
  const topeng = 0xff << (8 - sisa) & 0xff;
  return (bita[penuh] & topeng) === (awalan[penuh] & topeng);
};

/**
 * Menilai satu alamat IP (bukan nama host). Mengembalikan alasan penolakan
 * berupa untai, atau `null` bila alamatnya boleh dijangkau.
 *
 * Bentuk yang TIDAK dikenali juga ditolak. Sikap ini disengaja: penjaga yang
 * meloloskan apa yang tidak dipahaminya adalah pola kegagalan yang sudah
 * berulang di proyek ini — pemeriksa lebih longgar daripada keadaan yang
 * diperiksanya.
 */
const alasanAlamatTerlarang = (alamat) => {
  const jenis = net.isIP(alamat);

  if (jenis === 4) {
    const nilai = bitsIpv4(alamat);
    if (nilai === null) return 'bentuk alamat IPv4 tidak dikenali';
    if (nilai === 0xffffffff) return 'alamat siaran';
    const cocok = RENTANG_IPV4.find((r) => cocokCidrIpv4(nilai, r.cidr));
    return cocok ? `${cocok.sebab} (${cocok.cidr})` : null;
  }

  if (jenis === 6) {
    const bita = bytesIpv6(alamat);
    if (!bita) return 'bentuk alamat IPv6 tidak dikenali';

    // IPv4 yang menyamar sebagai IPv6 dinilai memakai aturan IPv4-nya sendiri,
    // sebab ::ffff:127.0.0.1 dan 127.0.0.1 menuju tempat yang sama persis.
    const ipv4Terpetakan = awalanSama(bita, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff], 96);
    const nat64 = awalanSama(bita, [0x00, 0x64, 0xff, 0x9b], 32);
    if (ipv4Terpetakan || nat64) {
      const v4 = `${bita[12]}.${bita[13]}.${bita[14]}.${bita[15]}`;
      return alasanAlamatTerlarang(v4);
    }

    if (bita.every((b) => b === 0)) return 'alamat tak tentu (::)';
    if (bita.slice(0, 15).every((b) => b === 0) && bita[15] === 1) return 'loopback (::1)';
    if ((bita[0] & 0xfe) === 0xfc) return 'alamat lokal unik (fc00::/7)';
    if (bita[0] === 0xfe && (bita[1] & 0xc0) === 0x80) return 'link-local (fe80::/10)';
    if (bita[0] === 0xff) return 'multicast (ff00::/8)';
    if (awalanSama(bita, [0x20, 0x01, 0x0d, 0xb8], 32)) return 'rentang dokumentasi (2001:db8::/32)';
    return null;
  }

  return 'bukan alamat IP yang sah';
};

/**
 * Pengganti `dns.lookup` bagi agen HTTP/HTTPS. Menolak menyerahkan alamat
 * apa pun yang terlarang, sehingga soketnya tidak pernah sempat terbuka.
 *
 * Tanda tangannya sengaja mengikuti `dns.lookup` apa adanya, termasuk ragam
 * pemanggilan `(host, callback)` dan mode `all: true`. Mode terakhir itu
 * BUKAN kelengkapan yang boleh dilewatkan: sejak Node 20, `autoSelectFamily`
 * menyala secara bawaan dan memanggil `lookup` dengan `all: true` untuk
 * mencoba IPv6 dan IPv4 berbarengan. Bila ragam itu tidak dilayani dengan
 * benar, sambungan gagal pada keadaan yang sulit ditebak.
 */
const lookupAman = (nama, opsi, callback) => {
  let setelan = opsi;
  let selesai = callback;
  if (typeof setelan === 'function') {
    selesai = setelan;
    setelan = {};
  }
  if (typeof setelan === 'number') setelan = { family: setelan };
  setelan = setelan || {};

  dns.lookup(nama, { ...setelan, all: true }, (err, daftar) => {
    if (err) return selesai(err);

    const hasil = Array.isArray(daftar) ? daftar : [daftar];

    // SELURUH alamat harus lolos, bukan yang pertama saja. Sebuah nama boleh
    // menjawab beberapa alamat sekaligus; bila satu di antaranya mengarah ke
    // dalam, Node bebas memilih yang mana pun — termasuk yang itu.
    for (const a of hasil) {
      const alasan = alasanAlamatTerlarang(a.address);
      if (alasan) {
        const galat = new Error(
          `Host "${nama}" menunjuk alamat yang tidak diizinkan: ${a.address} — ${alasan}.`
        );
        galat.code = 'ESSRF';
        return selesai(galat);
      }
    }

    if (setelan.all) return selesai(null, hasil);
    return selesai(null, hasil[0].address, hasil[0].family);
  });
};

/**
 * Pemeriksaan awal atas URL, dijalankan SEBELUM permintaan dikirim.
 *
 * Ini lapis kedua, bukan lapis utama — penjaga yang sesungguhnya ada pada
 * `lookupAman`. Gunanya dua: menolak lebih awal dengan pesan yang jelas
 * (400, bukan 502 yang membingungkan), dan menangkap hal yang memang tidak
 * terlihat dari alamat IP, yakni protokol dan kredensial tersemat.
 *
 * Mengembalikan untai alasan penolakan, atau `null` bila URL-nya boleh.
 */
const alasanUrlTerlarang = (target) => {
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return 'protokol selain http/https tidak diizinkan';
  }
  // `http://pengguna:sandi@host/` — kredensialnya akan ikut terkirim oleh
  // peladen kita atas nama pengunjung, dan sebagian layanan internal memang
  // dibuka dengan cara itu. Tidak ada dokumen publik sah yang memerlukannya.
  if (target.username || target.password) {
    return 'URL tidak boleh memuat kredensial';
  }
  const host = target.hostname.replace(/^\[|\]$/g, '');
  if (!host) return 'nama host kosong';

  // Bila hostnya sudah berupa alamat IP, nilai sekarang juga. Yang berupa nama
  // diserahkan kepada `lookupAman` saat penyambungan.
  if (net.isIP(host)) {
    const alasan = alasanAlamatTerlarang(host);
    if (alasan) return `alamat tidak diizinkan — ${alasan}`;
  }

  return null;
};

module.exports = {
  alasanAlamatTerlarang,
  alasanUrlTerlarang,
  lookupAman,
};
