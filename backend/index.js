// Dimuat paling awal: modul ini memuat dotenv sekaligus memvalidasi
// kelengkapan konfigurasi. Di production, konfigurasi yang bolong akan
// menghentikan proses di sini — sebelum satu pun rute sempat didaftarkan.
const env = require('./config/env');
const path = require('path');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

// Di Hostinger, permintaan HTTPS diterima proxy lebih dulu lalu diteruskan ke
// proses Node melalui HTTP internal. Tanpa ini Express mengabaikan header
// X-Forwarded-Proto sehingga `req.protocol` mengembalikan 'http' walau
// pengunjung membuka situs lewat https — dan alamat IP yang terbaca adalah IP
// proxy, bukan IP pengunjung (penting bagi pembatas laju pada Tahap 5).
// Hanya di production: di localhost tidak ada proxy di depan aplikasi, jadi
// memercayai header yang tidak ada justru menyesatkan.
if (env.isProduction) {
    app.set('trust proxy', 1);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Sajikan berkas hasil upload (gambar dari editor) sebagai file statis.
// Contoh: /uploads/1720-abc.webp → backend/uploads/1720-abc.webp
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', apiRoutes);

// --- KONFIGURASI PRODUCTION UNTUK FRONTEND ---
// Di production (Hostinger), Express akan menyajikan file build React secara statis
if (env.isProduction) {
    const dirDist = path.join(__dirname, '../frontend/dist');

    app.use(express.static(dirDist));

    // Tangkap semua route yang tidak ada di /api dan serahkan ke React Router.
    //
    // Dipasang sebagai middleware TANPA pola, bukan `app.get('*')`. Sejak
    // Express 5 (path-to-regexp v8) tanda '*' tidak lagi sah sebagai wildcard
    // dan melempar PathError begitu rute didaftarkan — artinya proses mati saat
    // modul ini dimuat, bukan saat permintaan masuk. Middleware tanpa pola tidak
    // bersandar pada tata bahasa path sama sekali, sehingga aman terhadap
    // perubahan tata bahasa pada versi Express berikutnya.
    app.use((req, res, next) => {
        // Permintaan ke /api yang tidak dikenali harus dijawab 404 JSON, jangan
        // dibalas index.html. Bila tertelan, klien menyangka permintaannya
        // berhasil (status 200) padahal endpoint-nya memang tidak ada.
        // Perbandingan sengaja memakai '/api/' agar jalur lain yang kebetulan
        // berawalan sama (misal '/apixyz') tidak ikut terjaring.
        if (req.path === '/api' || req.path.startsWith('/api/')) {
            return res.status(404).json({ pesan: 'Endpoint tidak ditemukan' });
        }

        // Berkas unggahan yang tidak ada pun sebaiknya 404 apa adanya. Kalau
        // dibalas index.html, tag <img> menerima HTML berstatus 200 sehingga
        // gambar tampak rusak tanpa petunjuk penyebabnya saat ditelusuri.
        if (req.path.startsWith('/uploads/')) {
            return res.status(404).json({ pesan: 'Berkas tidak ditemukan' });
        }

        // Hanya permintaan halaman yang wajar dibalas index.html. Metode tulis
        // ke jalur acak tidak boleh menerima HTML.
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return res.status(404).json({ pesan: 'Halaman tidak ditemukan' });
        }

        return res.sendFile(path.join(dirDist, 'index.html'), (err) => {
            if (err) next(err);
        });
    });
}

// Ekspor app untuk digunakan di server.js (Pemisahan MVC)
module.exports = app;