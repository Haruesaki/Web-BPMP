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

export const requestOtpApi = async (email) => {
    try {
        const response = await axiosInstance.post('/api/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw new Error('Terjadi kesalahan pada koneksi server.');
    }
};

export const verifyOtpApi = async (email, otpCode) => {
    try {
        const response = await axiosInstance.post('/api/auth/verify-otp', { email, otpCode });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw new Error('Terjadi kesalahan pada koneksi server.');
    }
};

export const resetPasswordApi = async (email, newPassword) => {
    try {
        const response = await axiosInstance.post('/api/auth/reset-password', { email, newPassword });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw new Error('Terjadi kesalahan pada koneksi server.');
    }
};
