const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AuthModel = require('../models/authModel');

class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // 1. Validasi input
            if (!email || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email dan password wajib diisi.'
                });
            }

            // 2. Cari pengguna di database
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Email tidak terdaftar.'
                });
            }

            // 3. Cek apakah pengguna aktif
            if (!user.is_aktif) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Akun Anda telah dinonaktifkan.'
                });
            }

            // 4. Bandingkan kata sandi
            const isPasswordValid = await bcrypt.compare(password, user.kata_sandi_hash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Kata sandi salah.'
                });
            }

            // 5. Generate token JWT
            const secretKey = process.env.JWT_SECRET || 'fallback_secret_key';
            const token = jwt.sign(
                { id: user.id, nama: user.nama_pengguna, email: user.email, role: user.nama_peran },
                secretKey,
                { expiresIn: '1d' }
            );

            // 6. Kirim respons sukses
            return res.status(200).json({
                status: 'success',
                message: 'Login berhasil.',
                data: {
                    user: {
                        nama: user.nama_pengguna,
                        email: user.email,
                        role: user.nama_peran
                    },
                    token: token
                }
            });

        } catch (error) {
            console.error('Error saat login:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan pada server.'
            });
        }
    }
}

module.exports = AuthController;
