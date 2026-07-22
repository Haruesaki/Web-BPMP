const app = require('./index');
require('./cron'); // Inisialisasi cron job
const port = 5000;

app.listen(port, () => {
    console.log(`Backend berjalan di http://localhost:${port}`);
});
