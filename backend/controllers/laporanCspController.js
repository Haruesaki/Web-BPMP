// =========================================================================
//  PENERIMA LAPORAN PELANGGARAN CSP
//  -----------------------------------------------------------------------
//  Dibuat bersamaan dengan penegakan CSP pada 7 Agustus 2026, dan justru
//  karena penegakan itulah ia diperlukan.
//
//  Selama kebijakan masih berstatus report-only, pelanggaran hanya perlu
//  dibaca sekali di konsol peramban pengembang. Sesudah ditegakkan,
//  keadaannya berbalik: sumber yang terblokir TIDAK menghasilkan galat apa pun
//  di sisi peladen, tidak muncul di log akses, dan tidak menjatuhkan
//  permintaan mana pun. Yang terjadi hanya satu gambar tidak tampil atau satu
//  sematan kosong pada peramban SEORANG pengunjung — kegagalan paling senyap
//  yang mungkin ada.
//
//  Titik ini menukar kesenyapan itu dengan satu baris di Log Runtime. Bila
//  kelak ada rekan tim menambahkan sematan baru tanpa mendaftarkan sumbernya
//  di `index.js`, log peladen yang akan memberitahu — bukan keluhan pengunjung.
//
//  SENGAJA TIDAK MENUNTUT TOKEN: laporan dikirim peramban pengunjung anonim,
//  jadi menuntut autentikasi berarti tidak ada laporan yang pernah masuk.
//  Sebagai gantinya badan permintaan dibatasi kecil (lihat routes/api.js) dan
//  pencatatannya diredam agar tidak dapat dipakai membanjiri log.
// =========================================================================

// Peredam pencatatan. Kuncinya gabungan direktif + sumber yang terblokir,
// sehingga satu jenis pelanggaran cukup tercatat sekali dalam satu jendela —
// tanpa ini, satu gambar terblokir pada halaman yang ramai akan menghasilkan
// ribuan baris identik dan justru menenggelamkan laporan lain yang penting.
const JENDELA_REDAM_MS = 10 * 60 * 1000;
const BATAS_KUNCI = 200; // penjaga memori: jangan tumbuh tanpa batas
const terakhirDicatat = new Map();

const bolehDicatat = (kunci) => {
  const sekarang = Date.now();
  const sebelumnya = terakhirDicatat.get(kunci);
  if (sebelumnya && sekarang - sebelumnya < JENDELA_REDAM_MS) return false;

  // Pembersihan sederhana: buang catatan yang jendelanya sudah lewat. Dijalankan
  // hanya saat peta membesar, bukan pada setiap laporan.
  if (terakhirDicatat.size >= BATAS_KUNCI) {
    for (const [k, waktu] of terakhirDicatat) {
      if (sekarang - waktu >= JENDELA_REDAM_MS) terakhirDicatat.delete(k);
    }
    // Masih penuh berarti memang sedang dibanjiri — hentikan pencatatan baru
    // sampai jendelanya lewat, alih-alih membiarkan peta tumbuh terus.
    if (terakhirDicatat.size >= BATAS_KUNCI) return false;
  }

  terakhirDicatat.set(kunci, sekarang);
  return true;
};

// Peramban mengirim dua bentuk badan yang berbeda: `report-uri` mengirim
// { "csp-report": {...} } dengan kunci bertanda hubung, sedangkan `report-to`
// mengirim larik { type, body } bergaya camelCase. Keduanya diterima supaya
// peralihan kelak ke `report-to` tidak menuntut perubahan di sini.
const ambilLaporan = (badan) => {
  if (!badan || typeof badan !== 'object') return [];
  if (Array.isArray(badan)) return badan.map((b) => b?.body).filter(Boolean);
  if (badan['csp-report']) return [badan['csp-report']];
  return [badan];
};

class LaporanCspController {
  static terima(req, res) {
    // Dibalas lebih dulu dan tanpa badan. Peramban tidak menunggu jawabannya,
    // dan menahan sambungan hanya untuk mencatat log adalah pemborosan.
    res.status(204).end();

    try {
      for (const laporan of ambilLaporan(req.body)) {
        const direktif =
          laporan['effective-directive'] || laporan.effectiveDirective ||
          laporan['violated-directive'] || laporan.violatedDirective || '(tanpa direktif)';
        const diblokir = laporan['blocked-uri'] || laporan.blockedURL || '(tanpa sumber)';
        const halaman = laporan['document-uri'] || laporan.documentURL || '(tanpa halaman)';

        // Dipotong: alamat data:/blob: dapat berukuran ratusan kilobita, dan
        // menyalinnya utuh ke log tidak menambah keterangan apa pun.
        const sumberRingkas = String(diblokir).slice(0, 200);
        const kunci = `${direktif}|${sumberRingkas}`;
        if (!bolehDicatat(kunci)) continue;

        console.warn(
          `[csp] Diblokir: ${direktif} -> ${sumberRingkas} (halaman: ${String(halaman).slice(0, 200)})`
        );
        console.warn('      Bila sumber ini memang sah, daftarkan pada tetapan SUMBER_* di index.js.');
      }
    } catch (e) {
      // Laporan cacat tidak boleh menjatuhkan apa pun — balasannya sudah dikirim.
      console.warn('[csp] Laporan pelanggaran tidak dapat dibaca:', e.message);
    }
  }
}

module.exports = LaporanCspController;
