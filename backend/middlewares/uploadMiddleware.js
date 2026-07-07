const multer = require('multer');

// =========================================================================
//  UPLOAD MIDDLEWARE (multer)
//  -----------------------------------------------------------------------
//  Memakai memoryStorage: file ditahan di RAM sebagai Buffer, BUKAN langsung
//  ditulis ke disk. Alasannya, kita mau memproses dulu dengan `sharp`
//  (resize + kompres + konversi WebP) di controller sebelum menyimpannya.
//
//  - Hanya menerima berkas gambar (image/*).
//  - Membatasi ukuran unggahan mentah agar server tidak dibanjiri file besar.
//  Field yang dibaca bernama "upload" — ini nama default yang dikirim oleh
//  SimpleUploadAdapter milik CKEditor.
// =========================================================================

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB (sebelum dikompres sharp)

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya berkas gambar yang diperbolehkan.'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

// Ekspor handler untuk satu berkas pada field "upload".
module.exports = upload.single('upload');
