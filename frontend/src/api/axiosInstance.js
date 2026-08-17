import axios from 'axios';
import { ambilToken, hapusSesi } from '../utils/sesiAdmin';
import { JALUR_MASUK } from '../config/jalurAdmin';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000',
    timeout: 30000,
});

axiosInstance.interceptors.request.use((config) => {
    // `ambilToken` sekaligus membuang sesi yang sudah lewat masa berlakunya,
    // sehingga token mati tidak pernah ikut terkirim.
    const token = ambilToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Jangan redirect ke login jika error 401 berasal dari endpoint login itu sendiri
        const isLoginRequest = error.config && error.config.url && error.config.url.includes('/api/auth/login');
        if (error.response && error.response.status === 401 && !isLoginRequest) {
            hapusSesi();
            window.location.href = JALUR_MASUK;
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
