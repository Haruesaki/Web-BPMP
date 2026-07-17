import axiosInstance from './axiosInstance';

export const getAuthHeaders = () => {
    const session = sessionStorage.getItem('adminSession');
    if (session) {
        try {
            const parsed = JSON.parse(session);
            if (parsed.token) {
                return { Authorization: `Bearer ${parsed.token}` };
            }
        } catch (e) {
            console.error("Gagal parsing token session", e);
        }
    }
    return {};
};

export const getAllUsers = async () => {
    try {
        const response = await axiosInstance.get('/api/users', {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw new Error('Terjadi kesalahan saat mengambil data pengguna.');
    }
};

export const deleteUserById = async (id) => {
    try {
        const response = await axiosInstance.delete(`/api/users/${id}`, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw new Error('Terjadi kesalahan saat menghapus pengguna.');
    }
};

export const createUser = async (userData) => {
    try {
        const response = await axiosInstance.post('/api/users', userData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw new Error('Terjadi kesalahan saat menambahkan pengguna.');
    }
};

export const updateUserById = async (id, userData) => {
    try {
        const response = await axiosInstance.put(`/api/users/${id}`, userData, {
            headers: getAuthHeaders()
        });
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw error.response.data;
        }
        throw new Error('Terjadi kesalahan saat memperbarui pengguna.');
    }
};
