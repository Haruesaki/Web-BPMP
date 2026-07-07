const express = require('express');
const router = express.Router();
const YoutubeController = require('../controllers/youtubeController');
const AuthController = require('../controllers/authController');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

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

module.exports = router;
