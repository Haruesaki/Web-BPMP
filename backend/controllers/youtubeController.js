const axios = require('axios');
const YoutubeModel = require('../models/youtubeModel');

class YoutubeController {
    static async getVideos(req, res) {
        console.log("Menerima request /api/youtube");
        try {
            console.log("Menghubungi DB...");
            const cacheData = await YoutubeModel.getLatestCache();
            console.log("DB response received!");
            const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 Menit (dipercepat agar video baru cepat muncul)
            
            if (cacheData) {
                const now = new Date();
                const updatedAt = new Date(cacheData.updated_at);
                
                if (now - updatedAt < CACHE_DURATION_MS) {
                    console.log("Menggunakan data dari cache PostgreSQL (Knex)...");
                    const data = typeof cacheData.videos_data === 'string' ? JSON.parse(cacheData.videos_data) : cacheData.videos_data;
                    
                    // Cek jika struktur data masih format lama (array), abaikan cache
                    if (!Array.isArray(data)) {
                        return res.json({ success: true, data: data, cached: true });
                    }
                }
            }
            
            console.log("Mengambil data baru dari YouTube API...");
            const API_KEY = process.env.YOUTUBE_API_KEY;
            const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
            
            if (!API_KEY || !CHANNEL_ID) {
                return res.status(500).json({ error: "YouTube API Key atau Channel ID tidak dikonfigurasi." });
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
            console.error("Error fetching YouTube API:", error?.response?.data || error.message);
            res.status(500).json({ success: false, error: "Gagal mengambil data dari YouTube" });
        }
    }
}
module.exports = YoutubeController;
