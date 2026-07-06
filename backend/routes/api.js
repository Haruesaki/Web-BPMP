const express = require('express');
const router = express.Router();
const YoutubeController = require('../controllers/youtubeController');
const AuthController = require('../controllers/authController');

router.get('/salam', (req, res) => {
    res.json({ pesan: "Halo dari Node.js Backend!" });
});

router.get('/youtube', YoutubeController.getVideos);
router.post('/auth/login', AuthController.login);

module.exports = router;
