const express = require('express');
const router = express.Router();
const YoutubeController = require('../controllers/youtubeController');
const AuthController = require('../controllers/authController');
const UserController = require('../controllers/userController');
const UploadController = require('../controllers/uploadController');
const MenuController = require('../controllers/menuController');
const HalamanKontenController = require('../controllers/halamanKontenController');
const InstagramController = require('../controllers/instagramController');
const StatistikPengunjungController = require('../controllers/statistikPengunjungController');
const AktivitasAdminController = require('../controllers/aktivitasAdminController');
const ProfilPegawaiController = require('../controllers/profilPegawaiController');
const BeritaController = require('../controllers/beritaController');
const BerandaHeroController = require('../controllers/berandaHeroController');
const BerandaHeaderController = require('../controllers/berandaHeaderController');
const { getLinkPreview } = require('../controllers/previewController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');

router.get('/salam', (req, res) => {
    res.json({ pesan: "Halo dari Node.js Backend!" });
});

// ================= PENGUNJUNG & AKTIVITAS =================
router.post('/pengunjung', StatistikPengunjungController.increment);
router.get('/pengunjung/stats', authMiddleware, (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
}, StatistikPengunjungController.getStats);
router.get('/aktivitas', authMiddleware, AktivitasAdminController.getAktivitas);
router.post('/aktivitas', authMiddleware, AktivitasAdminController.recordAktivitas);

router.get('/youtube', YoutubeController.getVideos);
router.get('/instagram', InstagramController.getInstagramProfile);
router.post('/auth/login', AuthController.login);
router.post('/auth/forgot-password', AuthController.requestOtp);
router.post('/auth/verify-otp', AuthController.verifyOtp);
router.post('/auth/reset-password', AuthController.resetPassword);

// ================= BERANDA CMS ROUTES =================
router.get('/beranda/header', BerandaHeaderController.getHeader);
router.put('/beranda/header', authMiddleware, BerandaHeaderController.updateHeader);
router.get('/beranda/hero', BerandaHeroController.getHero);
router.put('/beranda/hero', authMiddleware, BerandaHeroController.updateHero);

// ================= LINK PREVIEW =================
router.get('/link-preview', authMiddleware, getLinkPreview);

router.get('/users', authMiddleware, UserController.getUsers);
router.get('/users/me', authMiddleware, UserController.getMe);
router.post('/users', authMiddleware, UserController.createUser);
router.put('/users/me/password', authMiddleware, UserController.updateMyPassword);
router.put('/users/:id', authMiddleware, UserController.updateUser);
router.delete('/users/:id', authMiddleware, UserController.deleteUser);

// ================= MENU ROUTES =================
router.get('/menus', MenuController.getMenus);
router.post('/menus', authMiddleware, MenuController.createMenu);
router.patch('/menus/reorder', authMiddleware, MenuController.reorderMenus);
router.post('/menus/convert-to-submenu', authMiddleware, MenuController.convertToSubmenu);
router.patch('/menus/:id', authMiddleware, MenuController.updateMenu);
router.delete('/menus/:id', authMiddleware, MenuController.deleteMenu);

// ================= HALAMAN KONTEN ROUTES =================
router.get('/halaman-konten/:menu_id', HalamanKontenController.getKonten);
router.post('/halaman-konten/:menu_id', authMiddleware, HalamanKontenController.upsertKonten);

// ================= PROFIL PEGAWAI ROUTES =================
router.get('/profil-pegawai/:menu_id', ProfilPegawaiController.getProfilByMenu);
router.post('/profil-pegawai/:menu_id', authMiddleware, ProfilPegawaiController.upsertProfil);

// ================= BERITA ROUTES =================
router.get('/berita/:menu_id', BeritaController.getBeritaByMenu);
router.post('/berita/:menu_id', authMiddleware, BeritaController.createBerita);
router.put('/berita/:id', authMiddleware, BeritaController.updateBerita);
router.delete('/berita/:id', authMiddleware, BeritaController.deleteBerita);

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
