const axios = require('axios');
const instagramModel = require('../models/instagramModel');
const env = require('../config/env');

// =========================================================================
//  MASA BERLAKU TEMBOLOK INSTAGRAM
//  -----------------------------------------------------------------------
//  Sebelumnya `getInstagramProfile` menyajikan tembolok apa adanya dan hanya
//  menarik data baru ketika temboloknya KOSONG. Akibatnya, begitu baris
//  temboloknya ada, datanya BEKU SELAMANYA — jumlah pengikut dan unggahan tidak
//  pernah berubah lagi, dan tidak ada satu pun galat yang muncul.
//
//  Penyegarannya dahulu bergantung sepenuhnya pada penjadwal luar: `cron.js` di
//  development, dan Cron Job hPanel di production. Pada paket hosting yang tidak
//  menyediakan penjadwal sama sekali, tidak ada yang pernah memicunya.
//
//  Pemeriksaan kedaluwarsa di bawah menghapus ketergantungan itu: tembolok
//  menyegarkan dirinya sendiri saat ada pengunjung datang sesudah masanya lewat.
//  Titik akhir /api/cron/instagram tetap ada sebagai pemicu manual, tetapi tidak
//  lagi menjadi syarat agar fiturnya hidup.
//
//  Polanya sengaja menyalin `youtubeController` yang sudah terbukti berjalan di
//  peladen: segar -> sajikan; basi -> tarik baru; gagal menarik -> sajikan yang
//  basi. Butir terakhir itu yang menjaga Beranda tetap tampil ketika RapidAPI
//  sedang bermasalah atau kuotanya habis.
//
//  12 jam dipilih menyamai jadwal `cron.js` yang lama ('0 */12 * * *'), sehingga
//  perilakunya tidak berubah — yang berubah hanya SIAPA yang memicunya.
// =========================================================================
const DURASI_TEMBOLOK_MS = 12 * 60 * 60 * 1000; // 12 jam

// Penjaga agar beberapa permintaan yang tiba berbarengan tepat sesudah tembolok
// basi tidak masing-masing menembak RapidAPI. Hanya berlaku dalam SATU proses —
// Passenger menjalankan beberapa worker, jadi ini memperkecil, bukan meniadakan.
// Sekadar penjaga sederhana sudah memadai: kuota RapidAPI terbatas, sedangkan
// penguncian lintas proses menuntut kerumitan yang tidak sepadan di sini.
let penyegaranBerjalan = null;

const segarkanSekali = () => {
  if (!penyegaranBerjalan) {
    penyegaranBerjalan = fetchAndCacheInstagramProfile().finally(() => {
      penyegaranBerjalan = null;
    });
  }
  return penyegaranBerjalan;
};

/**
 * Menghitung umur tembolok dalam milidetik.
 * Mengembalikan `null` bila stempel waktunya tidak ada atau tidak terbaca —
 * pemanggilnya memperlakukan itu sebagai "perlu disegarkan", tetapi tetap
 * menyediakan tembolok lama sebagai cadangan bila penyegarannya gagal.
 */
const umurTembolok = (cache) => {
  if (!cache || !cache.diperbarui_pada) return null;
  const waktu = new Date(cache.diperbarui_pada).getTime();
  if (Number.isNaN(waktu)) return null;
  const umur = Date.now() - waktu;
  // Umur negatif berarti stempel waktunya di masa depan (jam peladen bergeser,
  // atau zona waktu sesi tidak sesuai). Diperlakukan sebagai masih segar, sebab
  // menganggapnya basi akan memicu penarikan pada SETIAP permintaan dan
  // menghabiskan kuota RapidAPI tanpa ada yang menyadarinya.
  return umur < 0 ? 0 : umur;
};

/**
 * Fetch profil dari RapidAPI dan simpan ke database.
 * Dipakai oleh: penyegaran otomatis saat tembolok basi, titik akhir cron
 * (pemicu manual), dan pembaruan username dari panel admin.
 */
const fetchAndCacheInstagramProfile = async (targetUsername = null) => {
  try {
    const apiKey = process.env.RAPIDAPI_KEY; // Harus ditambahkan ke .env
    if (!apiKey) {
      console.error('RAPIDAPI_KEY tidak dikonfigurasi di .env');
      return false;
    }

    // Jika targetUsername kosong (dipanggil dari cron), ambil dari cache yang ada
    let usernameToFetch = targetUsername;
    if (!usernameToFetch) {
      const existingCache = await instagramModel.getCache();
      if (existingCache && existingCache.profile_data) {
        const parsed = typeof existingCache.profile_data === 'string' ? JSON.parse(existingCache.profile_data) : existingCache.profile_data;
        usernameToFetch = parsed.username;
      }
    }
    
    // Fallback jika database masih kosong dan tidak ada input
    if (!usernameToFetch) {
      usernameToFetch = 'bpmplampung';
    }

    const options = {
      method: 'POST',
      url: 'https://instagram120.p.rapidapi.com/api/instagram/profile',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'instagram120.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      data: {
        username: usernameToFetch
      }
    };

    const response = await axios.request(options);
    const result = response.data.result;

    if (!result) {
      throw new Error('Format response dari RapidAPI tidak dikenali');
    }

    const fs = require('fs');
    const path = require('path');

    let localPicUrl = '';
    const igPicUrl = result.profile_pic_url_hd || result.profile_pic_url;
    
    // Download dan simpan ke file lokal untuk mencegah CORS/CORB Instagram
    if (igPicUrl) {
      try {
        const picResponse = await axios({
          url: igPicUrl,
          method: 'GET',
          responseType: 'stream',
          headers: {
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        const uploadDir = env.UPLOAD_DIR;
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const fileName = 'ig_avatar.jpg';
        const writer = fs.createWriteStream(path.join(uploadDir, fileName));
        picResponse.data.pipe(writer);
        
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        localPicUrl = '/uploads/' + fileName;
      } catch (err) {
        console.error('[Instagram Cron] Gagal mengunduh gambar profil:', err.message);
        localPicUrl = igPicUrl; // fallback ke cdn asli jika download gagal
      }
    }

    // Extract data penting
    const profileData = {
      username: result.username,
      full_name: result.full_name,
      profile_pic_url_hd: localPicUrl,
      followers: result.edge_followed_by?.count || 0,
      following: result.edge_follow?.count || 0,
      posts_count: result.edge_owner_to_timeline_media?.count || 0
    };

    // Simpan ke database
    await instagramModel.updateCache(profileData);
    console.log('[Instagram Cron] Berhasil memperbarui cache profil instagram');
    return { success: true };

  } catch (error) {
    console.error('[Instagram Cron] Error fetching instagram API:', error.message);
    let errorMessage = 'Gagal mengambil data dari API eksternal.';
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = `RapidAPI: ${error.response.data.message}`;
    }
    return { success: false, message: errorMessage };
  }
};

/**
 * Mengambil data instagram dari database (digunakan oleh frontend / endpoint)
 */
const getInstagramProfile = async (req, res) => {
  try {
    const cache = await instagramModel.getCache();

    if (cache) {
      const umur = umurTembolok(cache);

      // Masih segar — sajikan tanpa menyentuh RapidAPI sama sekali.
      if (umur !== null && umur < DURASI_TEMBOLOK_MS) {
        return res.status(200).json({
          success: true,
          data: cache.profile_data,
          diperbarui_pada: cache.diperbarui_pada
        });
      }

      // Sudah basi (atau stempel waktunya tidak terbaca) — coba tarik data baru.
      console.log('[Instagram] Tembolok kedaluwarsa, menyegarkan dari RapidAPI...');
      const hasil = await segarkanSekali();

      if (hasil && hasil.success) {
        const tembolokBaru = await instagramModel.getCache();
        return res.status(200).json({
          success: true,
          data: tembolokBaru.profile_data,
          diperbarui_pada: tembolokBaru.diperbarui_pada
        });
      }

      // Penyegaran gagal — sajikan tembolok basi, JANGAN jatuhkan Beranda.
      // Data lama jauh lebih baik daripada bagian yang kosong, dan sebab
      // kegagalannya lazim di luar kendali kita: kuota RapidAPI habis, kunci
      // dibatasi, atau jaringan peladen terganggu.
      console.warn('[Instagram] Penyegaran gagal. Menyajikan tembolok kedaluwarsa.');
      return res.status(200).json({
        success: true,
        data: cache.profile_data,
        diperbarui_pada: cache.diperbarui_pada,
        catatan: 'tembolok kedaluwarsa dipakai karena layanan Instagram gagal dihubungi'
      });
    }

    // Belum ada baris tembolok sama sekali — penarikan pertama kali.
    console.log('[Instagram] Cache kosong, melakukan penarikan pertama kali...');
    // `fetchAndCacheInstagramProfile` mengembalikan `false` (bukan objek) ketika
    // RAPIDAPI_KEY belum diisi, sehingga hasilnya wajib diperiksa lebih dulu
    // sebelum properti `success` dibaca.
    const result = await segarkanSekali();

    if (result && result.success) {
      const newCache = await instagramModel.getCache();
      return res.status(200).json({
        success: true,
        data: newCache.profile_data,
        diperbarui_pada: newCache.diperbarui_pada
      });
    }

    // Tembolok kosong DAN layanan luar gagal. Sengaja tidak membalas 500:
    // kegagalan pihak ketiga tidak boleh menjatuhkan Beranda. Frontend membaca
    // datanya memakai optional chaining beserta nilai bawaan, sehingga `null`
    // dirender dengan wajar sebagai bagian yang kosong.
    console.warn('[Instagram] Tembolok kosong dan layanan luar gagal dihubungi.');
    return res.status(200).json({
      success: true,
      data: null,
      catatan: 'layanan Instagram gagal dihubungi dan tembolok masih kosong'
    });

  } catch (error) {
    console.error('[Instagram] Galat:', error?.response?.data || error.message);
    // Alasan sama seperti di atas — Beranda tetap harus tampil.
    return res.status(200).json({
      success: true,
      data: null,
      catatan: 'terjadi kesalahan saat mengambil data Instagram'
    });
  }
};

/**
 * Endpoint untuk Admin memperbarui username Instagram yang di-scrape
 */
const updateInstagramUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, pesan: 'Username wajib diisi' });
    }

    const result = await fetchAndCacheInstagramProfile(username);
    
    if (result.success) {
      const newCache = await instagramModel.getCache();
      return res.status(200).json({
        success: true,
        pesan: 'Data Instagram berhasil ditarik',
        data: newCache.profile_data
      });
    } else {
      return res.status(500).json({
        success: false,
        pesan: result.message || 'Gagal menarik data dari Instagram. Pastikan username valid atau periksa koneksi RapidAPI.'
      });
    }
  } catch (error) {
    console.error('Error updateInstagramUsername:', error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server' });
  }
};

/**
 * Endpoint untuk Admin memperbarui link embed postingan Instagram
 */
const updateEmbedLinks = async (req, res) => {
  try {
    const { links } = req.body;
    if (!Array.isArray(links)) {
      return res.status(400).json({ success: false, pesan: 'Format links tidak valid' });
    }
    
    await instagramModel.updateEmbedLinks(links);
    
    const newCache = await instagramModel.getCache();
    return res.status(200).json({
      success: true,
      pesan: 'Link embed Instagram berhasil disimpan',
      data: newCache.profile_data
    });
  } catch (error) {
    console.error('Error updateEmbedLinks:', error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server' });
  }
};

module.exports = {
  fetchAndCacheInstagramProfile,
  getInstagramProfile,
  updateInstagramUsername,
  updateEmbedLinks
};
