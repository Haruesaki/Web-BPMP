const axios = require('axios');
const YoutubeModel = require('../models/youtubeModel');

class YoutubeController {
    static async getVideos(req, res) {
        console.log("Menerima request /api/youtube");
        try {
            console.log("Menghubungi DB...");
            const cacheData = await YoutubeModel.getLatestCache();
            console.log("DB response received!");
            const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 Jam
            
            if (cacheData) {
                const now = new Date();
                const updatedAt = new Date(cacheData.updated_at);
                
                if (now - updatedAt < CACHE_DURATION_MS) {
                    console.log("Menggunakan data dari cache PostgreSQL (Knex)...");
                    const data = typeof cacheData.videos_data === 'string' ? JSON.parse(cacheData.videos_data) : cacheData.videos_data;
                    return res.json({ success: true, data: data, cached: true });
                }
            }
            
            console.log("Mengambil data baru dari YouTube API...");
            const API_KEY = process.env.YOUTUBE_API_KEY;
            const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
            
            if (!API_KEY || !CHANNEL_ID) {
                return res.status(500).json({ error: "YouTube API Key atau Channel ID tidak dikonfigurasi." });
            }
            
            const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=3`;
            const response = await axios.get(url);
            let videos = response.data.items;
            
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
            
            await YoutubeModel.clearCache();
            await YoutubeModel.insertCache(processedVideos);
            
            res.json({ success: true, data: processedVideos, cached: false });
        } catch (error) {
            console.error("Error fetching YouTube API:", error?.response?.data || error.message);
            res.status(500).json({ success: false, error: "Gagal mengambil data dari YouTube" });
        }
    }
}
module.exports = YoutubeController;
