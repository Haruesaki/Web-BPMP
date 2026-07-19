import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    timeout: 30000,
});

axiosInstance.interceptors.request.use((config) => {
    const session = sessionStorage.getItem('adminSession');
    if (session) {
        try {
            const parsed = JSON.parse(session);
            if (parsed.token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${parsed.token}`;
            }
        } catch (e) {
            console.error("Gagal parsing token session", e);
        }
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
            sessionStorage.removeItem('adminSession');
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
