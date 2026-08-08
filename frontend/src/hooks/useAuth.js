import { useState } from 'react';
import { loginAdmin } from '../api/authApi';
import { simpanSesi, hapusSesi } from '../utils/sesiAdmin';

export const useAuth = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // `ingatSaya` diteruskan apa adanya ke peladen. Peladen yang menentukan
    // masa berlaku token (8 jam atau 7 hari); peramban tidak boleh memutuskan
    // sendiri, sebab batas yang hanya ada di peramban dapat diubah siapa pun
    // lewat konsol pengembang.
    const login = async (email, password, ingatSaya = false) => {
        setLoading(true);
        setError(null);
        try {
            const result = await loginAdmin(email, password, ingatSaya);
            if (result.status === 'success' && result.data) {
                // Disimpan lewat modul sesiAdmin agar berlaku untuk seluruh tab
                // pada profil peramban yang sama, bukan hanya tab ini.
                const sessionData = {
                    id: result.data.user.id,
                    nama: result.data.user.nama,
                    role: result.data.user.role,
                    email: result.data.user.email,
                    access: result.data.user.access,
                    token: result.data.token
                };
                simpanSesi(sessionData);
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
        hapusSesi();
    };

    return { login, logout, loading, error };
};
