const env = require('./config/env');
const app = require('./index');
require('./cron'); // Inisialisasi cron job

// PORT dinamis dari environment Hostinger, cadangan 5000 untuk lokal.
// Pembacaan beserta nilai cadangannya kini terpusat di config/env.js.
const port = env.PORT;

app.listen(port, () => {
    console.log(`Backend berjalan di port ${port} (mode ${env.NODE_ENV})`);
});
