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
const BerandaBeritaController = require('../controllers/berandaBeritaController');
const BerandaPengunjungController = require('../controllers/berandaPengunjungController');
const LogoMitraController = require('../controllers/logoMitraController');
const InfoKontakController = require('../controllers/infoKontakController');
const TautanFooterController = require('../controllers/tautanFooterController');
const TautanMediaSosialController = require('../controllers/tautanMediaSosialController');
const UrutanSectionBerandaController = require('../controllers/urutanSectionBerandaController');
const SearchController = require('../controllers/searchController');
const { getLinkPreview } = require('../controllers/previewController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadMiddleware = require('../middlewares/uploadMiddleware');
const CronController = require('../controllers/cronController');
const penjagaCron = require('../middlewares/penjagaCron');
const { batasLogin, batasOtp, batasVerifikasiOtp, batasPengunjung, batasCron } = require('../middlewares/pembatasLaju');

router.get('/salam', (req, res) => {
    res.json({ pesan: "Halo dari Node.js Backend!" });
});

// ================= GLOBAL SEARCH =================
router.get('/search', SearchController.globalSearch);

// ================= PENGUNJUNG & AKTIVITAS =================
router.post('/pengunjung', batasPengunjung, StatistikPengunjungController.increment);
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
router.put('/instagram/update-username', authMiddleware, InstagramController.updateInstagramUsername);
router.put('/instagram/update-embeds', authMiddleware, InstagramController.updateEmbedLinks);

// ================= CRON (dipanggil penjadwal hPanel) =================
// Dilindungi rahasia bersama lewat tajuk `X-Cron-Secret`, bukan token JWT:
// penjadwal bukan pengguna yang dapat masuk. Lihat middlewares/penjagaCron.js.
router.post('/cron/instagram', batasCron, penjagaCron, CronController.segarkanInstagram);
// Rute autentikasi dilindungi pembatas laju per alamat IP — lihat
// middlewares/pembatasLaju.js untuk alasan pemilihan angkanya.
router.post('/auth/login', batasLogin, AuthController.login);
router.post('/auth/forgot-password', batasOtp, AuthController.requestOtp);
router.post('/auth/verify-otp', batasVerifikasiOtp, AuthController.verifyOtp);
router.post('/auth/reset-password', batasVerifikasiOtp, AuthController.resetPassword);

// ================= BERANDA CMS ROUTES =================
router.get('/beranda/header', BerandaHeaderController.getHeader);
router.put('/beranda/header', authMiddleware, BerandaHeaderController.updateHeader);
router.get('/beranda/hero', BerandaHeroController.getHero);
router.put('/beranda/hero', authMiddleware, BerandaHeroController.updateHero);
router.get('/beranda/berita', BerandaBeritaController.getBeritaBeranda);
router.get('/beranda/berita/:id', BerandaBeritaController.getBeritaDetail);
router.patch('/beranda/berita/reorder', authMiddleware, BerandaBeritaController.reorderBerita);
router.patch('/beranda/berita/:sumber/:id/thumbnail', authMiddleware, BerandaBeritaController.updateThumbnail);
router.delete('/beranda/berita/:sumber/:id', authMiddleware, BerandaBeritaController.removeFromBeranda);
router.get('/beranda/pengunjung', BerandaPengunjungController.getPengaturan);
router.put('/beranda/pengunjung', authMiddleware, BerandaPengunjungController.updatePengaturan);

router.get('/beranda/mitra', LogoMitraController.getLogoMitra);
router.post(
  '/beranda/mitra',
  authMiddleware,
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) return res.status(400).json({ error: { message: err.message } });
      next();
    });
  },
  LogoMitraController.createLogoMitra
);
router.put(
  '/beranda/mitra/:id',
  authMiddleware,
  (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) return res.status(400).json({ error: { message: err.message } });
      next();
    });
  },
  LogoMitraController.updateLogoMitra
);
router.delete('/beranda/mitra/:id', authMiddleware, LogoMitraController.deleteLogoMitra);

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

// Footer (Hubungi Kami)
router.get('/beranda/footer', InfoKontakController.getFooterInfo);
router.put('/beranda/footer', authMiddleware, InfoKontakController.updateFooterInfo);
router.get('/beranda/tautan-footer', TautanFooterController.getTautanFooter);
router.put('/beranda/tautan-footer', authMiddleware, TautanFooterController.updateTautanFooter);
router.get('/beranda/media-sosial', TautanMediaSosialController.getSemua);
router.put('/beranda/media-sosial', authMiddleware, TautanMediaSosialController.updateSemua);

// --- SECTIONS BERANDA ---
router.get('/beranda/urutan-section', UrutanSectionBerandaController.getOrder);
router.put('/beranda/urutan-section', authMiddleware, UrutanSectionBerandaController.updateOrder);

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

// Upload DOKUMEN dari editor (tombol kustom "Sisipkan Dokumen"). Diproteksi login.
router.post(
  '/upload/dokumen',
  authMiddleware,
  (req, res, next) => {
    uploadMiddleware.dokumen(req, res, (err) => {
      if (err) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'Ukuran dokumen melebihi batas 10 MB.'
            : err.message || 'Gagal mengunggah dokumen.';
        return res.status(400).json({ error: { message } });
      }
      next();
    });
  },
  UploadController.uploadDokumen
);

// Penyaji berkas untuk PRATINJAU dokumen di halaman pengunjung — URL tanpa
// ekstensi + Content-Type netral supaya tidak "dicuri" download manager (IDM).
// Publik (konten tampil di halaman pengunjung).
router.get('/berkas/:base', UploadController.serveInline);

module.exports = router;
