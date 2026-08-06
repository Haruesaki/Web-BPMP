const axios = require('axios');
const cheerio = require('cheerio');
const http = require('http');
const https = require('https');
const penjagaSsrf = require('../utils/penjagaSsrf');

// Penjaga SSRF yang sama seperti pada proksi dokumen — lihat
// utils/penjagaSsrf.js. Titik ini memang menuntut token admin, sehingga
// risikonya lebih kecil daripada proksi yang publik, tetapi jenis celahnya
// persis sama: URL ditentukan pengguna, peladen yang menjemputnya, dan ISI
// halamannya dikembalikan kepada pemanggil (judul, deskripsi, gambar) —
// sehingga layanan internal yang tak terjangkau dari luar dapat terbaca.
//
// Agennya sengaja TIDAK melonggarkan verifikasi sertifikat, berbeda dari
// proksi dokumen: pratinjau tautan tidak punya riwayat kegagalan rantai
// sertifikat, jadi tidak ada sebab untuk melonggarkannya.
//
// Pengalihan tetap diserahkan kepada axios seperti semula (pratinjau tautan
// lazim melewati http→https dan penambahan www). Itu aman di sini karena
// penjaganya menempel pada AGEN, dan follow-redirects memakai agen yang sama
// pada setiap lompatan — jadi tiap alamat baru tetap diperiksa.
const agenPratinjauHttp = new http.Agent({ lookup: penjagaSsrf.lookupAman });
const agenPratinjauHttps = new https.Agent({ lookup: penjagaSsrf.lookupAman });

// Halaman HTML yang wajar tidak pernah sebesar ini. Batas ini menahan satu
// URL menyeret berkas raksasa ke dalam memori peladen — cheerio memuat
// seluruhnya sekaligus, dan pada shared hosting itu cukup untuk menjatuhkan
// proses.
const BATAS_HTML = 5 * 1024 * 1024;

/**
 * Mengambil metadata (judul, deskripsi, gambar) dari sebuah URL.
 */
const getLinkPreview = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ pesan: 'Parameter URL wajib diisi.' });
  }

  let target;
  try {
    target = new URL(url);
  } catch (_) {
    return res.status(400).json({ pesan: 'URL tidak valid.' });
  }

  const alasan = penjagaSsrf.alasanUrlTerlarang(target);
  if (alasan) {
    console.warn(`[Link Preview] Ditolak penjaga SSRF: ${alasan}`);
    return res.status(400).json({ pesan: 'Alamat tersebut tidak diizinkan.' });
  }

  try {
    // Lakukan request ke URL target dengan User-Agent browser standar
    // untuk menghindari blokir dari beberapa situs.
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      timeout: 5000, // Set timeout agar tidak menunggu terlalu lama
      maxContentLength: BATAS_HTML,
      maxBodyLength: BATAS_HTML,
      httpAgent: agenPratinjauHttp,
      httpsAgent: agenPratinjauHttps,
    });

    const $ = cheerio.load(html);

    // Fungsi helper untuk mencari meta tag. Prioritas: Open Graph (og), Twitter, lalu tag standar.
    const getMetaTag = (name) => {
      return (
        $(`meta[property='og:${name}']`).attr('content') ||
        $(`meta[name='twitter:${name}']`).attr('content') ||
        $(`meta[name='${name}']`).attr('content') ||
        null
      );
    };

    const preview = {
      url,
      title: getMetaTag('title') || $('title').first().text() || 'Judul tidak tersedia',
      description: getMetaTag('description') || 'Deskripsi tidak tersedia',
      image: getMetaTag('image'),
    };

    // Pastikan URL gambar adalah URL absolut
    if (preview.image && !preview.image.startsWith('http')) {
      try {
        const pageUrl = new URL(url);
        preview.image = new URL(preview.image, pageUrl.origin).href;
      } catch (e) {
        // Abaikan jika URL tidak valid, biarkan apa adanya
        console.warn(`Could not construct absolute image URL for ${preview.image} from base ${url}`);
      }
    }

    res.status(200).json(preview);

  } catch (error) {
    // Ditolak penjaga alamat — termasuk bila penolakannya baru terjadi pada
    // pengalihan ke sekian, sebab penjaganya menempel pada agen. Dibedakan
    // supaya tidak tersamar sebagai "gagal memuat" yang menyesatkan.
    if (error.code === 'ESSRF' || /ESSRF/.test(error.message || '')) {
      console.error(`[Link Preview] Alamat diblokir penjaga SSRF: ${error.message}`);
      return res.status(400).json({ pesan: 'Alamat tersebut tidak diizinkan.' });
    }

    // LOGGING YANG LEBIH DETAIL UNTUK DIAGNOSTIK
    console.error(`[Link Preview Error] Gagal mengambil pratinjau untuk URL: ${url}`);
    if (error.response) {
      // Permintaan berhasil dibuat dan server tujuan merespons dengan status error (di luar 2xx)
      console.error('Status Error dari URL Target:', error.response.status);

      // Deteksi spesifik untuk blokir Cloudflare
      if (error.response.status === 403 && error.response.headers.server === 'cloudflare') {
        return res.status(403).json({ 
          pesan: 'Pratinjau tidak tersedia karena situs ini dilindungi oleh sistem keamanan (Cloudflare).',
          code: 'CLOUDFLARE_BLOCKED' // Kirim kode spesifik ke frontend
        });
      }
    } else if (error.request) {
      // Permintaan berhasil dibuat tapi tidak ada respons yang diterima (mis. timeout)
      console.error('Tidak ada respons dari URL target. Kemungkinan timeout atau masalah jaringan.');
    } else {
      // Terjadi kesalahan saat menyiapkan permintaan
      console.error('Error saat setup request Axios:', error.message);
    }
    res.status(500).json({ pesan: 'Gagal memuat pratinjau link. Pastikan URL valid dan dapat diakses publik.' });
  }
};

module.exports = { getLinkPreview };