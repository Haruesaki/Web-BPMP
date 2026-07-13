import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

export const useInstagram = () => {
  const [igProfile, setIgProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInstagram = async () => {
      try {
        const response = await axiosInstance.get('/api/instagram');
        if (response.data.success) {
          setIgProfile(response.data.data);
        }
      } catch (err) {
        setError('Gagal memuat profil Instagram');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInstagram();
  }, []);

  return { igProfile, loading, error };
};
