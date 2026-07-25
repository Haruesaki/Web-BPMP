const knex = require('../config/database');

const incrementVisitor = async (ipAddress, userAgent) => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - offset).toISOString().split('T')[0];

    // UPSERT pada kombinasi (ip_address, tanggal) — 1 baris per IP per hari.
    // MySQL memakai ON DUPLICATE KEY UPDATE, yang bersandar pada indeks unik
    // (ip_address, tanggal) bawaan migrasi tabel ini. `VALUES(kolom)` merujuk
    // nilai yang tadi gagal di-insert karena bentrok.
    return await knex.raw(`
        INSERT INTO statistik_pengunjung (ip_address, tanggal, hits, user_agent, created_at, updated_at)
        VALUES (?, ?, 1, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            hits = hits + 1,
            user_agent = VALUES(user_agent),
            updated_at = NOW()
    `, [ipAddress, localISOTime, userAgent]);
};

const getStatistik = async () => {
    // Agregasi: pengunjung unik & total hits per tanggal.
    // DATE_FORMAT memaksa tanggal keluar sebagai string 'YYYY-MM-DD' agar tidak
    // tergeser satu hari oleh konversi zona waktu saat diolah di sisi klien.
    // knex.raw pada MySQL mengembalikan [baris, metadata], jadi ambil elemen ke-0.
    const [rows] = await knex.raw(`
        SELECT
            DATE_FORMAT(tanggal, '%Y-%m-%d') as tanggal,
            COUNT(*) as pengunjung_unik,
            SUM(hits) as total_hits
        FROM statistik_pengunjung
        GROUP BY tanggal
        ORDER BY tanggal DESC
    `);
    return rows;
};

module.exports = {
    incrementVisitor,
    getStatistik
};
