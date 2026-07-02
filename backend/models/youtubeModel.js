const db = require('../config/database');

class YoutubeModel {
    static async getLatestCache() {
        return await db('youtube_cache').orderBy('id', 'desc').first();
    }
    
    static async clearCache() {
        return await db('youtube_cache').del();
    }
    
    static async insertCache(processedVideos) {
        return await db('youtube_cache').insert({
            videos_data: JSON.stringify(processedVideos),
            updated_at: db.fn.now()
        });
    }
}
module.exports = YoutubeModel;
