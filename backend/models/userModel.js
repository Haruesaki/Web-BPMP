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
                'pengguna.akses_menu as access',
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
                'pengguna.akses_menu as access',
                'peran.nama_peran as role',
                'peran.is_superadmin'
            )
            .where('pengguna.id', id)
            .first();
    }

    static async createUser(userData) {
        const peran = await db('peran').where('nama_peran', userData.role).first();
        if (!peran) throw new Error(`Peran ${userData.role} tidak ditemukan.`);

        const [id] = await db('pengguna').insert({
            peran_id: peran.id,
            nama_pengguna: userData.nama,
            email: userData.email,
            kata_sandi_hash: userData.password_hash,
            akses_menu: JSON.stringify(userData.access || []),
            is_aktif: true
        }).returning('id');
        return id.id || id;
    }

    static async updateUser(id, userData) {
        const updateData = {};
        if (userData.nama) updateData.nama_pengguna = userData.nama;
        if (userData.email) updateData.email = userData.email;
        if (userData.password_hash) updateData.kata_sandi_hash = userData.password_hash;
        if (userData.access) updateData.akses_menu = JSON.stringify(userData.access);
        if (userData.role) {
            const peran = await db('peran').where('nama_peran', userData.role).first();
            if (!peran) throw new Error(`Peran ${userData.role} tidak ditemukan.`);
            updateData.peran_id = peran.id;
        }
        updateData.diperbarui_pada = db.fn.now();

        await db('pengguna').where('id', id).update(updateData);
    }

    static async deleteUser(id) {
        return await db('pengguna').where('id', id).del();
    }
}

module.exports = UserModel;
