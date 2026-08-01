const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const axios = require('axios');
const https = require('https');
const MediaModel = require('../models/mediaModel');
const env = require('../config/env');

// Agent HTTPS yang TIDAK menolak sertifikat tak-terverifikasi — DIPAKAI KHUSUS
// oleh proksi dokumen (serveProxyFile), BUKAN global. Alasannya: banyak server
// pemerintah (mis. *.kemendikdasmen.go.id) mengirim rantai sertifikat TAK
// LENGKAP (tanpa sertifikat perantara). Peramban menambalnya sendiri (AIA
// fetching), tetapi Node menolaknya dengan "unable to verify the first
// certificate" sehingga proksi gagal (502). Karena endpoint ini hanya MENGAMBIL
// berkas publik dan TIDAK mengirim kredensial apa pun, melonggarkan verifikasi
// di sini berisiko sangat kecil dan sengaja dibatasi pada agen ini saja.
const agenProksiLonggar = new https.Agent({ rejectUnauthorized: false });

// =========================================================================
//  UPLOAD CONTROLLER — menerima gambar dari CKEditor (SimpleUploadAdapter).
//  -----------------------------------------------------------------------
//  Alur:
//    1. multer (uploadMiddleware) menaruh file mentah di req.file.buffer.
//    2. sharp: auto-rotate → resize bila terlalu lebar → kompres → WebP.
//    3. Simpan berkas hasil ke folder /uploads dengan nama unik.
//    4. Catat metadata ke tabel media_konten (pemilik_id null = belum tertaut).
//    5. Balas { url } — FORMAT WAJIB yang diharapkan CKEditor SimpleUpload.
//
//  Catatan penting: memindahkan gambar ke URL (bukan base64) membuat konten
//  yang tersimpan di `deskripsi_kaya` tetap ringan, dan konversi WebP + resize
//  memangkas ukuran berkas drastis sehingga halaman user cepat dimuat.
// =========================================================================

const UPLOAD_DIR = env.UPLOAD_DIR;
const MAX_WIDTH = 1600; // px — gambar lebih lebar dari ini diperkecil
const WEBP_QUALITY = 80; // 0-100, kompromi kualitas vs ukuran

class UploadController {
  static async uploadImage(req, res) {
    // CKEditor SimpleUploadAdapter mengharapkan error dalam bentuk
    // { error: { message } } agar pesannya tampil di notifikasi editor.
    if (req.fileValidationError) {
      return res.status(400).json({ error: { message: req.fileValidationError } });
    }

    // { error: { message } } agar pesannya tampil di notifikasi editor.
    if (!req.file) {
      return res
        .status(400)
        .json({ error: { message: 'Tidak ada berkas gambar yang dikirim.' } });
    }

    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });

      // Nama unik: waktu + byte acak, ekstensi .webp (hasil konversi sharp).
      const namaBerkas = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
      const lokasiSimpan = path.join(UPLOAD_DIR, namaBerkas);

      await sharp(req.file.buffer)
        .rotate() // hormati orientasi EXIF (foto dari HP sering miring)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(lokasiSimpan);

      // Path RELATIF, bukan URL absolut. URL absolut mengikat berkas pada host
      // saat unggahan terjadi, sehingga seluruh rujukan lama menunjuk alamat
      // yang tak terjangkau begitu domain berpindah (inilah sebabnya data lama
      // memuat http://localhost:5000). Path relatif kebal terhadap perpindahan
      // domain, penambahan subdomain, maupun peralihan HTTP ke HTTPS.
      const url = `/uploads/${namaBerkas}`;

      // Catat ke pustaka media. Gagal mencatat TIDAK membatalkan upload —
      // berkasnya sudah tersimpan & URL sudah bisa dipakai editor.
      try {
        await MediaModel.create({
          jenis_pemilik: 'halaman_konten',
          pemilik_id: null, // belum tertaut ke halaman mana pun
          url_berkas: url,
          jenis_media: 'gambar',
        });
      } catch (dbErr) {
        console.error('Gagal mencatat media ke DB (berkas tetap tersimpan):', dbErr);
      }

      return res.status(200).json({ url });
    } catch (error) {
      console.error('Error saat memproses upload gambar:', error);
      return res
        .status(500)
        .json({ error: { message: 'Gagal memproses gambar di server.' } });
    }
  }

  // Upload DOKUMEN (PDF/DOC/XLS/PPT/dll). Berbeda dari gambar: berkas disimpan
  // apa adanya tanpa diproses sharp. Balas { url, name } — name dipakai editor
  // sebagai teks tautan yang tampil ke admin & pengunjung.
  static async uploadDokumen(req, res) {
    if (req.fileValidationError) {
      return res.status(400).json({ error: { message: req.fileValidationError } });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ error: { message: 'Tidak ada berkas dokumen yang dikirim.' } });
    }

    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });

      // Pertahankan ekstensi asli agar URL bisa dikenali (mis. .pdf untuk preview).
      const ext = (path.extname(req.file.originalname || '') || '').toLowerCase();
      const namaBerkas = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
      const lokasiSimpan = path.join(UPLOAD_DIR, namaBerkas);

      await fs.writeFile(lokasiSimpan, req.file.buffer);

      // Path relatif — alasannya sama seperti pada uploadImage di atas.
      const url = `/uploads/${namaBerkas}`;

      try {
        await MediaModel.create({
          jenis_pemilik: 'halaman_konten',
          pemilik_id: null,
          url_berkas: url,
          jenis_media: 'dokumen',
        });
      } catch (dbErr) {
        console.error('Gagal mencatat dokumen ke DB (berkas tetap tersimpan):', dbErr);
      }

      return res.status(200).json({ url, name: req.file.originalname || namaBerkas });
    } catch (error) {
      console.error('Error saat memproses upload dokumen:', error);
      return res
        .status(500)
        .json({ error: { message: 'Gagal menyimpan dokumen di server.' } });
    }
  }

  // Sajikan berkas untuk PRATINJAU (dibaca pdf.js/docx-preview). URL sengaja
  // TANPA ekstensi (.pdf dsb.) dan Content-Type netral (octet-stream) agar
  // download manager seperti IDM tidak mengenalinya sebagai berkas unduhan.
  // Byte tetap utuh sehingga viewer di sisi klien bisa merendernya.
  static serveInline(req, res) {
    const { base } = req.params;
    // Hanya izinkan karakter nama berkas hasil generator (cegah path traversal).
    if (!/^[A-Za-z0-9_-]+$/.test(base || '')) {
      return res.status(400).json({ error: { message: 'Nama berkas tidak valid.' } });
    }

    let found = null;
    try {
      found = fsSync.readdirSync(UPLOAD_DIR).find((f) => f.startsWith(`${base}.`));
    } catch (_) {
      /* folder belum ada */
    }
    if (!found) {
      return res.status(404).json({ error: { message: 'Berkas tidak ditemukan.' } });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-store');
    fsSync.createReadStream(path.join(UPLOAD_DIR, found)).pipe(res);
  }

  // Proksi PRATINJAU dokumen dari server LUAR. Peramban memblokir `fetch`
  // lintas-origin bila server sumber tak mengirim header CORS (mis. PDF di
  // spab.kemendikdasmen.go.id), sehingga pratinjau gagal dengan "Failed to
  // fetch". Server mengambil berkas sisi-ke-sisi (tanpa batasan CORS) lalu
  // meneruskannya dengan header CORS milik kita.
  static async serveProxyFile(req, res) {
    const { url } = req.query;

    let target;
    try {
      target = new URL(url);
    } catch (_) {
      return res.status(400).json({ error: { message: 'URL tidak valid.' } });
    }

    // Hanya http/https.
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
      return res.status(400).json({ error: { message: 'Protokol tidak diizinkan.' } });
    }

    // Penjaga SSRF: tolak host lokal/jaringan privat agar endpoint ini tidak bisa
    // dipakai menjangkau layanan internal peladen.
    const host = target.hostname.toLowerCase();
    const hostPrivat =
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host);
    if (hostPrivat) {
      return res.status(400).json({ error: { message: 'Host tidak diizinkan.' } });
    }

    try {
      const upstream = await axios.get(target.href, {
        responseType: 'stream',
        timeout: 20000,
        maxContentLength: 60 * 1024 * 1024,
        maxRedirects: 3,
        // Sebagian server menolak permintaan tanpa User-Agent peramban.
        headers: { 'User-Agent': 'Mozilla/5.0' },
        // Toleran terhadap rantai sertifikat tak lengkap milik server sumber
        // (lihat penjelasan pada `agenProksiLonggar` di atas). Hanya untuk fetch ini.
        httpsAgent: agenProksiLonggar,
      });
      res.setHeader('Content-Type', upstream.headers['content-type'] || 'application/octet-stream');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store');
      upstream.data.pipe(res);
    } catch (err) {
      console.error('Gagal proksi berkas eksternal:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: { message: 'Gagal mengambil berkas eksternal.' } });
      }
    }
  }
}

module.exports = UploadController;
