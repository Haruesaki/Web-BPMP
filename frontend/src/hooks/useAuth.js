import { useState } from 'react';
import { loginAdmin } from '../api/authApi';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const result = await loginAdmin(email, password);
            if (result.status === 'success' && result.data) {
                // Simpan data session lengkap ke sessionStorage
                const sessionData = {
                    id: result.data.user.id,
                    nama: result.data.user.nama,
                    role: result.data.user.role,
                    email: result.data.user.email,
                    access: result.data.user.access,
                    token: result.data.token
                };
                sessionStorage.setItem('adminSession', JSON.stringify(sessionData));
                return { success: true, user: result.data.user };
            }
            throw new Error(result.message || 'Login gagal.');
        } catch (err) {
            const errMsg = err.message || 'Terjadi kesalahan saat masuk.';
            setError(errMsg);
            return { success: false, error: errMsg };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        sessionStorage.removeItem('adminSession');
    };

    return { login, logout, loading, error };
};
