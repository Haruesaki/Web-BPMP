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

    // Peringatan migrasi tertunda — DI KEDUA MODE, tanpa perlu dinyalakan.
    // Justru di production-lah ia paling dibutuhkan: di sanalah struktur basis
    // data paling mudah tertinggal dari kodenya, sebab penempatan kode dan
    // pembaruan basis data terjadi pada dua langkah yang terpisah. Hanya
    // membaca, tidak mengubah apa pun, dan kegagalannya tidak menjatuhkan
    // peladen. Lihat utils/periksaMigrasi.js.
    require('./utils/periksaMigrasi')
        .periksaMigrasi()
        .catch((e) => console.warn('[migrasi] Pemeriksaan gagal dijalankan:', e.message));

    // Diagnosis sambungan basis data atas permintaan, lewat variabel
    // DIAGNOSA_DB. Dijalankan SETELAH peladen menyala supaya situs tidak
    // tertunda menunggu pemeriksaan, dan kegagalannya sengaja hanya dicatat —
    // menjatuhkan seluruh layanan gara-gara alat diagnosis jelas tidak sepadan.
    if (env.DIAGNOSA_DB) {
        require('./scripts/cek-db')
            .jalankan()
            .catch((e) => console.error('[diagnosa] Gagal menjalankan pemeriksaan basis data:', e.message));
    } else if (env.isDevelopment) {
        // Di development pemeriksaan ini SELALU berjalan, tanpa perlu dinyalakan.
        // Sebabnya konkret: bila MySQL lokal mati, terminal dibanjiri puluhan jejak
        // tumpukan `ECONNREFUSED` bernama controller — satu untuk setiap endpoint —
        // dan tidak ada satu pun di antaranya yang menyebut "MySQL tidak berjalan".
        // Satu baris di sini menggantikan seluruh kebisingan itu.
        //
        // Sengaja TIDAK dijalankan di production: di sana pemeriksaan atas permintaan
        // (DIAGNOSA_DB) sudah tersedia dan lebih lengkap, sementara boot production
        // sebaiknya tidak menambah kueri yang tidak diminta. Dipakai `else if` agar
        // ketika DIAGNOSA_DB menyala di localhost tidak ada dua pemeriksaan berjalan.
        require('./utils/periksaSambunganDb')
            .periksaSambunganDb()
            .catch((e) => console.error('[db] Pemeriksaan sambungan gagal dijalankan:', e.message));
    }
});
