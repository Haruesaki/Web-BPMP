const db = require('../config/database');

class UserModel {
    static async getAllUsers() {
        return await db('pengguna')
            .join('peran', 'pengguna.peran_id', '=', 'peran.id')
            .select(
                'pengguna.id',
                'pengguna.nama_pengguna as nama',
                'pengguna.email',
                'pengguna.is_aktif',
                'pengguna.dibuat_pada',
                'peran.nama_peran as role',
                'peran.is_superadmin'
            )
            .orderBy('pengguna.id', 'asc');
    }

    static async getUserById(id) {
        return await db('pengguna')
            .join('peran', 'pengguna.peran_id', '=', 'peran.id')
            .select(
                'pengguna.id',
                'pengguna.nama_pengguna as nama',
                'pengguna.email',
                'pengguna.is_aktif',
                'peran.nama_peran as role',
                'peran.is_superadmin'
            )
            .where('pengguna.id', id)
            .first();
    }

    static async deleteUser(id) {
        return await db('pengguna').where('id', id).del();
    }
}

module.exports = UserModel;
