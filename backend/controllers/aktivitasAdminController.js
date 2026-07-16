const aktivitasModel = require('../models/aktivitasAdminModel');

const getAktivitas = async (req, res) => {
    try {
        const data = await aktivitasModel.getAktivitas();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('[Get Aktivitas Error]', error);
        res.status(500).json({ success: false, pesan: 'Server error' });
    }
};

const recordAktivitas = async (req, res) => {
    try {
        const { aksi } = req.body;
        // User admin harus disematkan di req.user oleh authMiddleware
        const namaAdmin = req.user.nama || 'System';
        const roleAdmin = req.user.role || 'Unknown';
        
        await aktivitasModel.insertAktivitas(namaAdmin, roleAdmin, aksi);
        res.status(200).json({ success: true, message: 'Aktivitas terekam' });
    } catch (error) {
        console.error('[Record Aktivitas Error]', error);
        res.status(500).json({ success: false, pesan: 'Server error' });
    }
};

// Helper function untuk dipanggil internal controller lain
const logActivityInternal = async (nama, role, aksi) => {
    try {
        await aktivitasModel.insertAktivitas(nama, role, aksi);
    } catch (error) {
        console.error('[Internal Log Activity Error]', error);
    }
};

module.exports = { getAktivitas, recordAktivitas, logActivityInternal };
