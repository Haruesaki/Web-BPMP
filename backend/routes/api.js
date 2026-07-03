const express = require('express');
const router = express.Router();
const YoutubeController = require('../controllers/youtubeController');

router.get('/salam', (req, res) => {
    res.json({ pesan: "Halo dari Node.js Backend!" });
});

router.get('/youtube', YoutubeController.getVideos);

module.exports = router;
