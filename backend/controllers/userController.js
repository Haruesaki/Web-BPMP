const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

class UserController {
    static async getMe(req, res) {
        try {
            const userId = req.user.id;
            const targetUser = await UserModel.getUserById(userId);
            if (!targetUser) {
                return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan.' });
            }
            const formattedUser = {
                ...targetUser,
                access: typeof targetUser.access === 'string' ? JSON.parse(targetUser.access) : (targetUser.access || [])
            };
            return res.status(200).json({ status: 'success', data: formattedUser });
        } catch (error) {
            console.error('Error fetching current user:', error);
            return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan saat mengambil data pengguna.' });
        }
    }
    static async getUsers(req, res) {
        try {
            const users = await UserModel.getAllUsers();
            
            // Format access back to an array in case it was stored as a string
            const formattedUsers = users.map(user => ({
                ...user,
                access: typeof user.access === 'string' ? JSON.parse(user.access) : (user.access || [])
            }));

            return res.status(200).json({
                status: 'success',
                data: formattedUsers
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat mengambil data pengguna.'
            });
        }
    }

    static async createUser(req, res) {
        try {
            const { nama, email, role, password, access } = req.body;
            
            if (!nama || !email || !role || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Nama, email, role, dan password wajib diisi.'
                });
            }

            const password_hash = await bcrypt.hash(password, 10);

            const userId = await UserModel.createUser({
                nama,
                email,
                role,
                password_hash,
                access
            });

            return res.status(201).json({
                status: 'success',
                message: `Pengguna '${nama}' berhasil ditambahkan.`,
                data: { id: userId }
            });
        } catch (error) {
            console.error('Error creating user:', error);
            if (error.code === '23505') { // Postgres unique constraint error
                return res.status(400).json({
                    status: 'error',
                    message: 'Email atau Nama Pengguna sudah terdaftar.'
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat menambahkan pengguna.'
            });
        }
    }

    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { nama, email, role, password, access } = req.body;
            
            const targetId = id === 'me' ? req.user.id : parseInt(id, 10);
            if (isNaN(targetId)) {
                return res.status(400).json({ status: 'error', message: 'ID pengguna tidak valid.' });
            }
            
            const targetUser = await UserModel.getUserById(targetId);
            
            if (!targetUser) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Pengguna tidak ditemukan.'
                });
            }

            const updateData = {};
            if (nama) updateData.nama = nama;
            if (email) updateData.email = email;
            if (role) updateData.role = role;
            if (access) updateData.access = access;
            if (password) {
                updateData.password_hash = await bcrypt.hash(password, 10);
            }

            await UserModel.updateUser(targetId, updateData);

            return res.status(200).json({
                status: 'success',
                message: `Data pengguna '${nama || targetUser.nama}' berhasil diperbarui.`
            });
        } catch (error) {
            console.error('Error updating user:', error);
            if (error.code === '23505') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email atau Nama Pengguna sudah digunakan oleh pengguna lain.'
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan saat memperbarui pengguna.'
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

    static async updateMyPassword(req, res) {
        try {
            const userId = req.user.id;
            const { oldPassword, newPassword } = req.body;

            const targetUser = await UserModel.getUserById(userId);
            if (!targetUser) {
                return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan.' });
            }

            const AuthModel = require('../models/authModel');
            const authUser = await AuthModel.findUserByEmail(targetUser.email);
            
            if (!authUser) {
                return res.status(404).json({ status: 'error', message: 'Data autentikasi pengguna tidak ditemukan.' });
            }

            const isMatch = await bcrypt.compare(oldPassword, authUser.kata_sandi_hash);
            if (!isMatch) {
                return res.status(400).json({ status: 'error', message: 'Password lama tidak cocok.' });
            }

            const password_hash = await bcrypt.hash(newPassword, 10);
            await UserModel.updateUser(userId, { password_hash });

            return res.status(200).json({ status: 'success', message: 'Password berhasil diperbarui.' });
        } catch (error) {
            console.error('Error updating password:', error);
            return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan internal saat memperbarui password.' });
        }
    }
}

module.exports = UserController;
