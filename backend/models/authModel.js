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
                'peran.nama_peran',
                'peran.is_superadmin'
            )
            .where('pengguna.email', email)
            .first();
    }
}

module.exports = AuthModel;
