const instagramController = require('./instagramController');

// =========================================================================
//  TITIK AKHIR CRON
//  -----------------------------------------------------------------------
//  Menggantikan penjadwal di dalam proses (`node-cron`) untuk mode production.
//
//  Alasannya ada pada sifat shared hosting: proses Node dapat diistirahatkan
//  ketika tidak ada lalu lintas, lalu dihidupkan lagi saat ada permintaan
//  masuk. Penjadwal yang hidup di dalam proses ikut mati saat proses tidur,
//  dan penghitung waktunya mengulang dari nol ketika proses bangun — sehingga
//  jadwal "setiap 12 jam" praktis tidak pernah benar-benar tercapai.
//
//  Penjadwal hPanel berada di luar proses aplikasi, sehingga tidak terpengaruh
//  keadaan itu. Panggilannya sekaligus membangunkan proses bila sedang tidur.
// =========================================================================

// Penjaga tumpang tindih. Penarikan data Instagram memanggil RapidAPI lalu
// mengunduh berkas gambar, sehingga dapat berlangsung cukup lama. Bila
// penjadwal terlanjur memanggil dua kali (misalnya percobaan ulang setelah
// curl kehabisan waktu), panggilan kedua akan menulis berkas `ig_avatar.jpg`
// yang sama secara bersamaan. Penanda ini menahannya.
let sedangBerjalan = false;

const segarkanInstagram = async (req, res) => {
  if (sedangBerjalan) {
    console.warn('[cron] Pembaruan tembolok Instagram sedang berjalan. Permintaan ini dilewati.');
    return res.status(409).json({
      sukses: false,
      pesan: 'Pembaruan sedang berjalan. Permintaan ini dilewati.',
    });
  }

  sedangBerjalan = true;
  const mulai = Date.now();

  try {
    console.log('[cron] Mulai memperbarui tembolok Instagram.');
    const hasil = await instagramController.fetchAndCacheInstagramProfile();
    const durasi = Date.now() - mulai;

    if (hasil && hasil.success) {
      console.log(`[cron] Tembolok Instagram berhasil diperbarui dalam ${durasi} ms.`);
      return res.status(200).json({
        sukses: true,
        pesan: 'Tembolok Instagram berhasil diperbarui.',
        durasi_ms: durasi,
      });
    }

    // Kegagalan layanan luar dibalas 502, bukan 500: sumber masalahnya ada di
    // pihak ketiga, dan pembedaan ini memudahkan pembacaan log penjadwal.
    console.error(`[cron] Pembaruan tembolok Instagram gagal setelah ${durasi} ms.`);
    return res.status(502).json({
      sukses: false,
      pesan: (hasil && hasil.message) || 'Gagal memperbarui tembolok Instagram.',
      durasi_ms: durasi,
    });
  } catch (error) {
    console.error('[cron] Galat tak terduga saat memperbarui tembolok Instagram:', error.message);
    return res.status(500).json({
      sukses: false,
      pesan: 'Terjadi kesalahan pada server.',
    });
  } finally {
    sedangBerjalan = false;
  }
};

module.exports = { segarkanInstagram };
