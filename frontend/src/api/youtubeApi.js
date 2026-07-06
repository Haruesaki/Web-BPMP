import axiosInstance from './axiosInstance';

export const getYoutubeVideos = async () => {
    try {
        const response = await axiosInstance.get('/api/youtube');
        return response.data;
    } catch (error) {
        console.error("Error fetching YouTube API:", error);
        throw error;
    }
};
