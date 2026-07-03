import { Routes, Route } from 'react-router-dom';
import Layout from '../components/common/Layout'; // 1. Impor Layout baru
import Beranda from '../pages/user/Beranda/Beranda';
import VisiDanMisi from '../pages/user/VisiDanMisi/VisiDanMisi';

const AppRoutes = ({ lenisRef }) => {
    return (
        <Routes>
            {/* 2. Gunakan Layout sebagai pembungkus rute */}
            <Route element={<Layout lenisRef={lenisRef} />}>
                {/* 3. Jadikan halaman sebagai anak dari Layout */}
                <Route path="/" element={<Beranda lenisRef={lenisRef} />} />
                <Route path="/profil/visi-misi" element={<VisiDanMisi lenisRef={lenisRef} />} />
                {/* Rute-rute lain di masa depan bisa ditambahkan di sini */}
            </Route>
        </Routes>
    );
};

export default AppRoutes;