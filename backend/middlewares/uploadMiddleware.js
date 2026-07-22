const multer = require('multer');

// =========================================================================
//  UPLOAD MIDDLEWARE (multer)
//  -----------------------------------------------------------------------
//  Memakai memoryStorage: file ditahan di RAM sebagai Buffer, BUKAN langsung
//  ditulis ke disk. Alasannya, gambar diproses dulu dengan `sharp`
//  (resize + kompres + konversi WebP) di controller sebelum disimpan.
//  Field yang dibaca bernama "upload" — nama default SimpleUploadAdapter CKEditor.
//
//  File ini menyatukan DUA handler:
//    • (default)  → GAMBAR  : hanya image/*, diproses sharp di controller.
//    • .dokumen   → DOKUMEN : PDF/Word/Excel/PowerPoint/OpenDocument/RTF/TXT/CSV,
//                             disimpan apa adanya (tanpa sharp).
//  Keduanya batas 10 MB.
// =========================================================================

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

// ---------- Filter GAMBAR ----------
const gambarFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    // Tandai request (jangan lempar) agar bisa ditangani rapi di controller.
    req.fileValidationError = 'Hanya berkas gambar yang diperbolehkan.';
    cb(null, false);
  }
};

// ---------- Filter DOKUMEN ----------
// Validasi utama lewat EKSTENSI (paling andal lintas OS), mimetype sbg pelengkap.
const ALLOWED_DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|rtf|txt|csv)$/i;

const dokumenFilter = (req, file, cb) => {
  const namaOk = ALLOWED_DOC_EXT.test(file.originalname || '');
  const mt = file.mimetype || '';
  const mimeOk =
    mt === 'application/pdf' ||
    mt.startsWith('application/msword') ||
    mt.startsWith('application/vnd') || // openxml (docx/xlsx/pptx) & ms-office lama
    mt.startsWith('application/vnd.oasis') || // OpenDocument
    mt === 'application/rtf' ||
    mt === 'text/plain' ||
    mt === 'text/csv';

  if (namaOk || mimeOk) {
    cb(null, true);
  } else {
    req.fileValidationError = 'Format dokumen tidak didukung.';
    cb(null, false);
  }
};

const uploadGambar = multer({
  storage: multer.memoryStorage(),
  fileFilter: gambarFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

const uploadDokumen = multer({
  storage: multer.memoryStorage(),
  fileFilter: dokumenFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

// Ekspor handler satu berkas pada field "upload".
// Default = gambar (kompatibel dengan pemakaian lama), .dokumen = dokumen.
module.exports = uploadGambar.single('upload');
module.exports.dokumen = uploadDokumen.single('upload');
