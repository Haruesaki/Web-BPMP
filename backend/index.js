require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();

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
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    
    // Tangkap semua route yang tidak ada di /api dan serahkan ke React Router
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
    });
}

// Ekspor app untuk digunakan di server.js (Pemisahan MVC)
module.exports = app;