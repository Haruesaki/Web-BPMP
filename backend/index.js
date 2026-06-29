require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./db/db');

const app = express();
const port = 5000;

// Mengizinkan React untuk mengakses backend ini
app.use(cors());

// Membuat endpoint sederhana
app.get('/api/salam', (req, res) => {
    res.json({ pesan: "Halo dari Node.js Backend!" });
});

// Endpoint untuk mengambil 3 video terbaru dari YouTube (dengan caching PostgreSQL)
app.get('/api/youtube', async (req, res) => {
    try {
        // 1. Cek cache di database terlebih dahulu menggunakan knex
        const cacheData = await db('youtube_cache').orderBy('id', 'desc').first();
        const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 Jam

        if (cacheData) {
            const now = new Date();
            const updatedAt = new Date(cacheData.updated_at);
            
            // Jika cache masih valid (di bawah 1 jam)
            if (now - updatedAt < CACHE_DURATION_MS) {
                console.log("Menggunakan data dari cache PostgreSQL (Knex)...");
                return res.json({ success: true, data: cacheData.videos_data, cached: true });
            }
        }

        // 2. Jika cache tidak valid / kosong, ambil dari YouTube API
        console.log("Mengambil data baru dari YouTube API...");
        const API_KEY = process.env.YOUTUBE_API_KEY;
        const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
        
        if (!API_KEY || !CHANNEL_ID) {
            return res.status(500).json({ error: "YouTube API Key atau Channel ID tidak dikonfigurasi." });
        }

        const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=3`;
        const response = await axios.get(url);
        
        let videos = response.data.items;
        
        // Cek tipe video (Shorts 9:16 atau Normal 16:9)
        const processedVideos = await Promise.all(videos.map(async (item) => {
            let isShort = false;
            const videoId = item.id.videoId;
            if (videoId) {
                try {
                    // Cek apakah url /shorts/ membalikkan 200 (Shorts) atau 303 redirect ke /watch (Normal)
                    const checkRes = await axios.get(`https://www.youtube.com/shorts/${videoId}`, { 
                        maxRedirects: 0, 
                        validateStatus: (status) => status >= 200 && status < 400 
                    });
                    if (checkRes.status === 200) {
                        isShort = true;
                    }
                } catch (e) {
                    // Abaikan error
                }
            }
            return {
                ...item,
                videoType: isShort ? 'short' : 'video' // 'short' = 9:16, 'video' = 16:9
            };
        }));
        
        // 3. Simpan data baru ke database menggunakan knex (hapus data lama agar rapi)
        await db('youtube_cache').del(); // Hapus cache lama
        await db('youtube_cache').insert({
            videos_data: JSON.stringify(processedVideos),
            updated_at: db.fn.now()
        });

        res.json({ success: true, data: processedVideos, cached: false });
    } catch (error) {
        console.error("Error fetching YouTube API:", error?.response?.data || error.message);
        res.status(500).json({ success: false, error: "Gagal mengambil data dari YouTube" });
    }
});

// Menjalankan server
app.listen(port, () => {
    console.log(`Backend berjalan di http://localhost:${port}`);
});