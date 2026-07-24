const app = require('./index');
require('./cron'); // Inisialisasi cron job

// Gunakan PORT dinamis dari environment Hostinger, fallback ke 5000 untuk lokal
const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Backend berjalan di port ${port}`);
});
