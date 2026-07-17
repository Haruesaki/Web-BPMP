const db = require('../config/database');

class AuthModel {
    static async findUserByEmail(email) {
        return await db('pengguna')
            .join('peran', 'pengguna.peran_id', '=', 'peran.id')
            .select(
                'pengguna.id',
                'pengguna.nama_pengguna',
                'pengguna.email',
                'pengguna.kata_sandi_hash',
                'pengguna.is_aktif',
                'pengguna.akses_menu',
                'peran.nama_peran',
                'peran.is_superadmin'
            )
            .where('pengguna.email', email)
            .first();
    }
    static async getLatestOtp(email) {
        return await db('otp_reset_password')
            .where('email', email)
            .orderBy('created_at', 'desc')
            .first();
    }

    static async createOtp(email, otpCode, expiresAt, cooldownSeconds) {
        const [inserted] = await db('otp_reset_password').insert({
            email,
            otp_code: otpCode,
            expires_at: expiresAt,
            last_sent_at: db.fn.now(),
            cooldown_seconds: cooldownSeconds,
            attempts: 0,
            is_verified: false
        }).returning('*');
        return inserted;
    }

    static async updateOtp(id, data) {
        const [updated] = await db('otp_reset_password')
            .where('id', id)
            .update(data)
            .returning('*');
        return updated;
    }

    static async updateUserPassword(email, passwordHash) {
        return await db('pengguna')
            .where('email', email)
            .update({
                kata_sandi_hash: passwordHash,
                diperbarui_pada: db.fn.now()
            });
    }

    static async deleteOtpByEmail(email) {
        return await db('otp_reset_password')
            .where('email', email)
            .del();
    }
}

module.exports = AuthModel;
