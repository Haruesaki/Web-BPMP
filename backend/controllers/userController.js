const UserModel = require('../models/userModel');

class UserController {
    static async getUsers(req, res) {
        try {
            const users = await UserModel.getAllUsers();
            return res.status(200).json({
                status: 'success',
                data: users
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat mengambil data pengguna.'
            });
        }
    }

    static async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const targetId = parseInt(id, 10);

            // 1. Cari target user
            const targetUser = await UserModel.getUserById(targetId);
            if (!targetUser) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Pengguna tidak ditemukan.'
                });
            }

            const currentUser = req.user; // Dari authMiddleware (JWT payload)

            // 2. Terapkan Aturan Penghapusan
            // Aturan 1: Super admin tidak bisa menghapus akun milik sendiri
            if (targetUser.role === 'superadmin' && currentUser.id === targetId) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Anda tidak dapat menghapus akun super admin Anda sendiri. Akun super admin harus dihapus dari akun super admin lain.'
                });
            }

            // Aturan 2: Akun hanya bisa dihapus oleh role super admin (admin hanya bisa dihapus oleh super admin)
            if (currentUser.role !== 'superadmin') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Akses ditolak. Hanya role super admin yang diizinkan untuk menghapus pengguna.'
                });
            }

            // 3. Eksekusi penghapusan
            await UserModel.deleteUser(targetId);

            return res.status(200).json({
                status: 'success',
                message: `Pengguna '${targetUser.nama}' berhasil dihapus.`
            });

        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat menghapus pengguna.'
            });
        }
    }
}

module.exports = UserController;
