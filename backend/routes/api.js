const express = require('express');
const router = express.Router();
const YoutubeController = require('../controllers/youtubeController');
const AuthController = require('../controllers/authController');
const UserController = require('../controllers/userController');
const UploadController = require('../controllers/uploadController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.get('/salam', (req, res) => {
    res.json({ pesan: "Halo dari Node.js Backend!" });
});

router.get('/youtube', YoutubeController.getVideos);
router.post('/auth/login', AuthController.login);
router.post('/auth/forgot-password', AuthController.requestOtp);
router.post('/auth/verify-otp', AuthController.verifyOtp);
router.post('/auth/reset-password', AuthController.resetPassword);

router.get('/users', authMiddleware, UserController.getUsers);
router.delete('/users/:id', authMiddleware, UserController.deleteUser);

// Upload gambar dari editor (CKEditor SimpleUploadAdapter). Diproteksi login.
// Bungkus uploadMiddleware agar error multer (mis. bukan gambar / kelewat besar)
// dibalas sebagai JSON { error: { message } } — bukan HTML error Express.
router.post(
  '/upload/gambar',
  authMiddleware,
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Ukuran gambar melebihi batas 10 MB.'
            : err.message || 'Gagal mengunggah berkas.';
        return res.status(400).json({ error: { message } });
      }
      next();
    });
  },
  UploadController.uploadImage
);

module.exports = router;
