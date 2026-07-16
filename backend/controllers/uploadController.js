const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const sharp = require('sharp');
const MediaModel = require('../models/mediaModel');

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

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
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

      // URL absolut agar <img src> tetap valid dibuka dari browser mana pun.
      const url = `${req.protocol}://${req.get('host')}/uploads/${namaBerkas}`;

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
}

module.exports = UploadController;
