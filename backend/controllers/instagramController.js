const axios = require('axios');
const instagramModel = require('../models/instagramModel');

/**
 * Fetch profil dari RapidAPI dan simpan ke database (digunakan oleh cron job dan update admin)
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
        const uploadDir = path.join(__dirname, '../uploads');
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
      return res.status(200).json({
        success: true,
        data: cache.profile_data,
        diperbarui_pada: cache.diperbarui_pada
      });
    }

    // Jika belum ada di DB (cron belum jalan), panggil API manual pertama kali
    console.log('[Instagram] Cache kosong, melakukan penarikan pertama kali...');
    const result = await fetchAndCacheInstagramProfile();
    
    if (result.success) {
      const newCache = await instagramModel.getCache();
      return res.status(200).json({
        success: true,
        data: newCache.profile_data,
        diperbarui_pada: newCache.diperbarui_pada
      });
    } else {
      return res.status(500).json({
        success: false,
        pesan: 'Gagal mendapatkan data instagram dari cache maupun API eksternal'
      });
    }

  } catch (error) {
    console.error('[Instagram API Error]', error);
    res.status(500).json({ success: false, pesan: 'Terjadi kesalahan pada server' });
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
