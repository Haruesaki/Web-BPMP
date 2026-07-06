import axiosInstance from './axiosInstance';

export const loginAdmin = async (email, password) => {
    try {
        const response = await axiosInstance.post('/api/auth/login', { email, password });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw new Error('Terjadi kesalahan pada koneksi server.');
    }
};
