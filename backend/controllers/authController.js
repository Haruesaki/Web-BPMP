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
                        id: user.id,
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

    static async requestOtp(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email wajib diisi.'
                });
            }

            // 1. Periksa apakah email terdaftar
            const user = await AuthModel.findUserByEmail(email);
            if (!user) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email tidak terdaftar sebagai administrator.'
                });
            }

            // 2. Periksa rate limit
            const latestOtp = await AuthModel.getLatestOtp(email);
            let cooldown = 30;

            if (latestOtp) {
                const lastSentTime = new Date(latestOtp.last_sent_at).getTime();
                const elapsedSeconds = (Date.now() - lastSentTime) / 1000;
                
                if (elapsedSeconds < latestOtp.cooldown_seconds) {
                    const remaining = Math.ceil(latestOtp.cooldown_seconds - elapsedSeconds);
                    return res.status(429).json({
                        status: 'error',
                        message: `Silakan tunggu ${remaining} detik sebelum meminta kode OTP baru.`,
                        data: { remaining }
                    });
                }
                
                // Lipat gandakan cooldown jika cooldown sebelumnya sudah terpenuhi
                cooldown = latestOtp.cooldown_seconds * 2;
            }

            // 3. Generate OTP 6 digit
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

            // 4. Kirim email via Resend API
            const apiKey = process.env.RESEND_API_KEY;
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

            const axios = require('axios');
            try {
                await axios.post('https://api.resend.com/emails', {
                    from: fromEmail,
                    to: email,
                    subject: 'Kode OTP Reset Kata Sandi - BPMP Lampung',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                            <div style="text-align: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 15px; margin-bottom: 20px;">
                                <h2 style="color: #1e3a8a; margin: 0; font-size: 22px;">Reset Kata Sandi CMS</h2>
                                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">Balai Penjaminan Mutu Pendidikan Provinsi Lampung</p>
                            </div>
                            <p style="font-size: 15px; line-height: 1.6; color: #374151;">Halo,</p>
                            <p style="font-size: 15px; line-height: 1.6; color: #374151;">Kami menerima permintaan untuk melakukan reset kata sandi akun administrator Anda. Gunakan kode OTP di bawah ini untuk melanjutkan:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <div style="font-size: 32px; font-weight: bold; background-color: #eff6ff; border: 1px dashed #3b82f6; padding: 15px 30px; display: inline-block; border-radius: 10px; letter-spacing: 4px; color: #2563eb; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);">
                                    ${otpCode}
                                </div>
                            </div>
                            <p style="font-size: 14px; line-height: 1.6; color: #ef4444; font-weight: 500;">*Kode OTP ini berlaku selama 5 menit. Demi keamanan akun Anda, mohon tidak menyebarkan kode ini kepada siapapun.</p>
                            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
                            <p style="font-size: 12px; line-height: 1.5; color: #9ca3af; text-align: center;">Jika Anda merasa tidak melakukan permintaan ini, abaikan email ini dan kata sandi Anda akan tetap aman.</p>
                        </div>
                    `
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (emailError) {
                console.error('Gagal mengirim email via Resend:', emailError.response ? emailError.response.data : emailError.message);
                return res.status(500).json({
                    status: 'error',
                    message: 'Gagal mengirim kode OTP ke email. Silakan periksa konfigurasi API Resend Anda.'
                });
            }

            // 5. Simpan ke database jika email sukses dikirim
            await AuthModel.createOtp(email, otpCode, expiresAt, cooldown);

            return res.status(200).json({
                status: 'success',
                message: 'Kode OTP telah dikirim ke email Anda.',
                data: { cooldown }
            });

        } catch (error) {
            console.error('Error saat request OTP:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan pada server.'
            });
        }
    }

    static async verifyOtp(req, res) {
        try {
            const { email, otpCode } = req.body;

            if (!email || !otpCode) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email dan kode OTP wajib diisi.'
                });
            }

            const latestOtp = await AuthModel.getLatestOtp(email);
            if (!latestOtp) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Permintaan OTP tidak ditemukan. Silakan minta kode OTP terlebih dahulu.'
                });
            }

            // Cek kedaluwarsa
            if (new Date(latestOtp.expires_at).getTime() < Date.now()) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Kode OTP telah kedaluwarsa. Silakan minta kode OTP baru.'
                });
            }

            // Cek batas percobaan
            const maxAttempts = 5;
            if (latestOtp.attempts >= maxAttempts) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Batas percobaan verifikasi telah habis. Silakan minta kode OTP baru.'
                });
            }

            const currentAttempts = latestOtp.attempts + 1;
            
            if (latestOtp.otp_code !== otpCode) {
                await AuthModel.updateOtp(latestOtp.id, { attempts: currentAttempts });
                const remaining = maxAttempts - currentAttempts;
                return res.status(400).json({
                    status: 'error',
                    message: `Kode OTP salah. Sisa percobaan: ${remaining} kali.`
                });
            }

            // Kode benar, tandai telah diverifikasi
            await AuthModel.updateOtp(latestOtp.id, { 
                attempts: currentAttempts,
                is_verified: true 
            });

            return res.status(200).json({
                status: 'success',
                message: 'Kode OTP berhasil diverifikasi.'
            });

        } catch (error) {
            console.error('Error saat verifikasi OTP:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan pada server.'
            });
        }
    }

    static async resetPassword(req, res) {
        try {
            const { email, newPassword } = req.body;

            if (!email || !newPassword) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Email dan kata sandi baru wajib diisi.'
                });
            }

            const latestOtp = await AuthModel.getLatestOtp(email);
            if (!latestOtp || !latestOtp.is_verified) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Akses ditolak. Silakan lakukan verifikasi OTP terlebih dahulu.'
                });
            }

            // Hashing password baru
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);

            // Update password
            await AuthModel.updateUserPassword(email, hash);

            // Hapus semua OTP untuk email ini agar bersih
            await AuthModel.deleteOtpByEmail(email);

            // Langsung login-kan pengguna setelah reset password berhasil
            const user = await AuthModel.findUserByEmail(email);
            const secretKey = process.env.JWT_SECRET || 'fallback_secret_key';
            const token = jwt.sign(
                { id: user.id, nama: user.nama_pengguna, email: user.email, role: user.nama_peran },
                secretKey,
                { expiresIn: '1d' }
            );

            return res.status(200).json({
                status: 'success',
                message: 'Kata sandi berhasil diperbarui.',
                data: {
                    user: {
                        id: user.id,
                        nama: user.nama_pengguna,
                        email: user.email,
                        role: user.nama_peran
                    },
                    token: token
                }
            });

        } catch (error) {
            console.error('Error saat reset kata sandi:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Terjadi kesalahan pada server.'
            });
        }
    }
}

module.exports = AuthController;
