const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

// Mengizinkan React untuk mengakses backend ini
app.use(cors());

// Membuat endpoint sederhana
app.get('/api/salam', (req, res) => {
    res.json({ pesan: "Halo dari Node.js Backend!" });
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Backend berjalan di http://localhost:${port}`);
});