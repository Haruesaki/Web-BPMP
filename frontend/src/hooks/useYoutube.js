import { useState, useEffect } from 'react';
import { getYoutubeVideos } from '../api/youtubeApi';

export const useYoutube = () => {
    const [ytVideos, setYtVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const result = await getYoutubeVideos();
                if (result.success) {
                    setYtVideos(result.data);
                }
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    return { ytVideos, loading, error };
};
