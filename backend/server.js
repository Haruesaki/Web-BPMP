const env = require('./config/env');
const app = require('./index');

// Penjadwal di dalam proses HANYA untuk development.
//
// Di production, shared hosting Hostinger dapat mengistirahatkan proses Node
// ketika tidak ada lalu lintas. Penjadwal `node-cron` ikut mati saat itu dan
// penghitung waktunya mengulang dari nol ketika proses bangun, sehingga jadwal
// 12 jam tidak pernah tercapai secara andal. Penggantinya adalah Cron Job
// hPanel yang memanggil POST /api/cron/instagram — lihat controllers/cronController.js.
//
// Pemuatan dibuat bersyarat, bukan dihapus, agar pengujian di localhost tetap
// mudah dan agar tidak ada dua penjadwal berjalan bersamaan di production.
if (env.isDevelopment) {
  require('./cron');
} else {
  console.log('[cron] Penjadwal dalam proses dimatikan (mode production). Gunakan Cron Job hPanel ke POST /api/cron/instagram.');
}

// PORT dinamis dari environment Hostinger, cadangan 5000 untuk lokal.
// Pembacaan beserta nilai cadangannya kini terpusat di config/env.js.
const port = env.PORT;

app.listen(port, () => {
    console.log(`Backend berjalan di port ${port} (mode ${env.NODE_ENV})`);
});
