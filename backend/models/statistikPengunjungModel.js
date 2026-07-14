const knex = require('../config/database');

const incrementVisitor = async (ipAddress, userAgent) => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - offset).toISOString().split('T')[0];

    // UPSERT pada kombinasi (ip_address, tanggal) — 1 baris per IP per hari
    return await knex.raw(`
        INSERT INTO statistik_pengunjung (ip_address, tanggal, hits, user_agent, created_at, updated_at)
        VALUES (?, ?, 1, ?, NOW(), NOW())
        ON CONFLICT (ip_address, tanggal)
        DO UPDATE SET
            hits = statistik_pengunjung.hits + 1,
            user_agent = EXCLUDED.user_agent,
            updated_at = NOW()
    `, [ipAddress, localISOTime, userAgent]);
};

const getStatistik = async () => {
    // Agregasi: pengunjung unik & total hits per tanggal
    const result = await knex.raw(`
        SELECT
            TO_CHAR(tanggal, 'YYYY-MM-DD') as tanggal,
            COUNT(*) as pengunjung_unik,
            SUM(hits) as total_hits
        FROM statistik_pengunjung
        GROUP BY tanggal
        ORDER BY tanggal DESC
    `);
    return result.rows || result;
};

module.exports = {
    incrementVisitor,
    getStatistik
};
