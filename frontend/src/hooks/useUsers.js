import { useState, useCallback } from 'react';
import { getAllUsers, deleteUserById } from '../api/userApi';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAllUsers();
            if (result.status === 'success') {
                setUsers(result.data || []);
            }
        } catch (err) {
            setError(err.message || 'Gagal memuat daftar pengguna.');
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteUser = async (id) => {
        try {
            const result = await deleteUserById(id);
            if (result.status === 'success') {
                // Update state lokal
                setUsers(prev => prev.filter(u => u.id !== id));
                return { success: true, message: result.message };
            }
            return { success: false, error: result.message || 'Gagal menghapus pengguna.' };
        } catch (err) {
            return { success: false, error: err.message || 'Terjadi kesalahan saat menghapus pengguna.' };
        }
    };

    return { users, setUsers, loading, error, fetchUsers, deleteUser };
};
