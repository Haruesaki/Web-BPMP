const axios = require('axios');
const YoutubeModel = require('../models/youtubeModel');

// Membaca isi tembolok dengan aman. Kolomnya bertipe json sehingga mysql2 bisa
// mengembalikannya sebagai objek maupun untai, bergantung penyetelan sambungan.
const bacaTembolok = (cacheData) => {
    if (!cacheData) return null;
    try {
        const data = typeof cacheData.videos_data === 'string'
            ? JSON.parse(cacheData.videos_data)
            : cacheData.videos_data;
        // Struktur lama berupa larik; abaikan karena tidak lagi dikenali frontend.
        return Array.isArray(data) ? null : data;
    } catch (e) {
        return null;
    }
};

// Bentuk kosong yang tetap dapat dirender frontend dengan wajar, dipakai saat
// tembolok belum pernah terisi sama sekali (pemasangan baru).
const DATA_KOSONG = { videos: [], channel: null };

class YoutubeController {
    static async getVideos(req, res) {
        // Tembolok dibaca lebih dulu dan dipegang sepanjang proses, supaya masih
        // tersedia sebagai cadangan bila panggilan ke YouTube gagal di tengah jalan.
        let temboloklama = null;

        try {
            const cacheData = await YoutubeModel.getLatestCache();
            temboloklama = bacaTembolok(cacheData);
            const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 Menit (dipercepat agar video baru cepat muncul)

            if (cacheData && temboloklama) {
                const now = new Date();
                const updatedAt = new Date(cacheData.updated_at);

                if (now - updatedAt < CACHE_DURATION_MS) {
                    return res.json({ success: true, data: temboloklama, cached: true });
                }
            }

            const API_KEY = process.env.YOUTUBE_API_KEY;
            const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;

            if (!API_KEY || !CHANNEL_ID) {
                // Konfigurasi yang belum lengkap tidak boleh menjatuhkan Beranda.
                // Sajikan tembolok bila ada, kalau tidak balas struktur kosong.
                console.warn('[YouTube] YOUTUBE_API_KEY atau YOUTUBE_CHANNEL_ID belum diisi. Menyajikan tembolok.');
                return res.json({ success: true, data: temboloklama || DATA_KOSONG, cached: true, catatan: 'konfigurasi belum lengkap' });
            }

            // Langkah 1: Ambil detail channel, termasuk 'contentDetails' untuk mendapatkan ID playlist upload resmi.
            const channelUrl = `https://www.googleapis.com/youtube/v3/channels?key=${API_KEY}&id=${CHANNEL_ID}&part=snippet,statistics,contentDetails`;
            const channelResponse = await axios.get(channelUrl);

            if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
                console.error(`[YouTube Controller] Channel dengan ID '${CHANNEL_ID}' tidak ditemukan di YouTube. Periksa kembali file .env Anda.`);
                throw new Error('Channel YouTube tidak ditemukan dengan ID yang diberikan.');
            }

            const channelItem = channelResponse.data.items[0];
            const uploadsPlaylistId = channelItem.contentDetails.relatedPlaylists.uploads;
            const channelData = { ...channelItem.snippet, statistics: channelItem.statistics, id: CHANNEL_ID };

            let finalVideos = []; // Default ke array kosong

            try {
                // Langkah 2: Gunakan ID playlist yang didapat untuk mengambil video.
                const url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${API_KEY}&playlistId=${uploadsPlaylistId}&part=snippet&maxResults=30`;
                const response = await axios.get(url);
                
                // Format ulang respons playlistItems agar struktur id.videoId tetap kompatibel dengan frontend lama
                let videos = response.data.items.map(item => ({
                    ...item,
                    id: { videoId: item.snippet.resourceId.videoId }
                }));
                
                const processedVideos = await Promise.all(videos.map(async (item) => {
                    let isShort = false;
                    const videoId = item.id.videoId;
                    if (videoId) {
                        try {
                            const checkRes = await axios.get(`https://www.youtube.com/shorts/${videoId}`, { 
                                maxRedirects: 0, 
                                validateStatus: (status) => status >= 200 && status < 400 
                            });
                            if (checkRes.status === 200) {
                                isShort = true;
                            }
                        } catch (e) {}
                    }
                    return {
                        ...item,
                        videoType: isShort ? 'short' : 'video'
                    };
                }));
                
                // Saring video untuk hanya menyertakan video horizontal ('video') dan ambil 3 teratas.
                const horizontalVideos = processedVideos.filter(video => video.videoType === 'video');
                finalVideos = horizontalVideos.slice(0, 3);

            } catch (playlistError) {
                if (playlistError.response && playlistError.response.status === 404) {
                    console.warn(`[YouTube Controller] Playlist dengan ID '${uploadsPlaylistId}' tidak ditemukan atau kosong. Melanjutkan tanpa video.`);
                    // Biarkan finalVideos sebagai array kosong
                } else {
                    throw playlistError; // Lemparkan error lain agar ditangkap oleh catch utama
                }
            }

            // Data final akan selalu berisi data channel, dan video (bisa jadi array kosong).
            const finalData = {
                videos: finalVideos,
                channel: channelData
            };
            
            await YoutubeModel.clearCache();
            await YoutubeModel.insertCache(finalData);
            
            res.json({ success: true, data: finalData, cached: false });
        } catch (error) {
            // Kegagalan layanan luar TIDAK BOLEH menjatuhkan Beranda. Penyebab
            // yang lazim: kuota harian YouTube Data API habis, jaringan peladen
            // terganggu, atau kunci API dibatasi. Dalam keadaan itu tembolok lama
            // — walau sudah kedaluwarsa — jauh lebih baik daripada bagian yang
            // kosong, apalagi galat 500 yang membuat pengunjung melihat halaman rusak.
            console.error('[YouTube] Gagal mengambil data:', error?.response?.data || error.message);

            if (temboloklama) {
                return res.json({ success: true, data: temboloklama, cached: true, catatan: 'tembolok kedaluwarsa dipakai karena layanan YouTube gagal dihubungi' });
            }

            return res.json({ success: true, data: DATA_KOSONG, cached: false, catatan: 'layanan YouTube gagal dihubungi dan tembolok masih kosong' });
        }
    }
}
module.exports = YoutubeController;
