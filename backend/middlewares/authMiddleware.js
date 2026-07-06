const jwt = require('jsonwebtoken');

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
        const secretKey = process.env.JWT_SECRET || 'fallback_secret_key';
        const decoded = jwt.verify(token, secretKey);

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
