const knex = require('../config/database');

const insertAktivitas = async (nama_admin, role_admin, aksi) => {
    return await knex('aktivitas_admin').insert({
        nama_admin,
        role_admin,
        aksi
    });
};

const getAktivitas = async () => {
    return await knex('aktivitas_admin')
        .leftJoin('pengguna', 'aktivitas_admin.nama_admin', 'pengguna.nama_pengguna')
        .leftJoin('peran', 'pengguna.peran_id', 'peran.id')
        .select(
            'aktivitas_admin.id',
            'aktivitas_admin.nama_admin',
            'aktivitas_admin.aksi',
            'aktivitas_admin.created_at',
            knex.raw('COALESCE(peran.nama_peran, aktivitas_admin.role_admin) as role_admin')
        )
        .orderBy('aktivitas_admin.created_at', 'desc')
        .limit(100);
};

module.exports = {
    insertAktivitas,
    getAktivitas
};
