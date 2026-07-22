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

// Ekspor app untuk digunakan di server.js (Pemisahan MVC)
module.exports = app;