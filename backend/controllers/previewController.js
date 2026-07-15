const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Mengambil metadata (judul, deskripsi, gambar) dari sebuah URL.
 */
const getLinkPreview = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ pesan: 'Parameter URL wajib diisi.' });
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