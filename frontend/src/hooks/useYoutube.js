import { useState, useEffect } from 'react';
import { getYoutubeVideos } from '../api/youtubeApi';

export const useYoutube = () => {
    const [ytVideos, setYtVideos] = useState([]);
    const [ytChannel, setYtChannel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const result = await getYoutubeVideos();
                if (result.success) {
                    // Cek apakah data memiliki struktur baru { videos, channel } atau format lama (array)
                    if (result.data && !Array.isArray(result.data)) {
                        setYtVideos(result.data.videos || []);
                        setYtChannel(result.data.channel || null);
                    } else {
                        setYtVideos(result.data || []);
                    }
                }
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    return { ytVideos, ytChannel, loading, error };
};
