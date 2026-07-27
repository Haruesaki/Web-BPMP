const jwt = require('jsonwebtoken');
const env = require('../config/env');

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                status: 'error',
                message: 'Akses ditolak. Token tidak disediakan.'
            });
        }

        const token = authHeader.split(' ')[1];
        // Kunci diambil dari modul env yang sudah memvalidasi keberadaannya saat
        // boot. Nilai cadangan sengaja dihapus: kunci yang tertulis di kode
        // sumber membuat token superadmin bisa ditempa siapa pun yang membacanya.
        const decoded = jwt.verify(token, env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            status: 'error',
            message: 'Akses ditolak. Token tidak valid.'
        });
    }
};

module.exports = authMiddleware;
