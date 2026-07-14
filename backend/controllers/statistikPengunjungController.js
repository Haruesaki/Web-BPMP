const statistikModel = require('../models/statistikPengunjungModel');

const extractIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim().replace(/^::ffff:/, '');
    }
    const remote = req.socket.remoteAddress || 'unknown';
    return remote.replace(/^::ffff:/, '');
};

const increment = async (req, res) => {
    try {
        const ip = extractIp(req);
        const ua = req.headers['user-agent'] || '';

        await statistikModel.incrementVisitor(ip, ua);
        res.status(200).json({ success: true, message: 'Visitor incremented' });
    } catch (error) {
        console.error('[Visitor Increment Error]', error);
        res.status(500).json({ success: false, pesan: 'Server error' });
    }
};

const getStats = async (req, res) => {
    try {
        const data = await statistikModel.getStatistik();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('[Get Stats Error]', error);
        res.status(500).json({ success: false, pesan: 'Server error' });
    }
};

module.exports = { increment, getStats };
