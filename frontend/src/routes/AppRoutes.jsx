import { Routes, Route } from 'react-router-dom';
import Layout from '../components/common/Layout'; // 1. Impor Layout baru
import Beranda from '../pages/user/Beranda/Beranda';
// import VisiDanMisi from '../pages/user/VisiDanMisi/VisiDanMisi';
// import VisiDanMisi from '../pages/user/VisiDanMisi/VisiDanMisi'; // Komponen ini sekarang digantikan oleh GenericPage
import GenericPage from '../pages/user/GenericPage/GenericPage';

// Halaman Admin
import Login from '../pages/Admin/Login';
import LupaPassword from '../pages/Admin/LupaPassword';
import DashboardAdmin from '../pages/Admin/dashboard-admin';

const AppRoutes = ({ lenisRef }) => {
    return (
        <Routes>
            <Route element={<Layout lenisRef={lenisRef} />}>
                <Route path="/" element={<Beranda lenisRef={lenisRef} />} />
                <Route path="/profil/visi-misi" element={<GenericPage lenisRef={lenisRef} />} />
                {/* <Route path="/profil/visi-misi" element={<VisiDanMisi lenisRef={lenisRef} />} /> */}
                {/* <Route path="/profil/VisiDanMisi" element={<GenericPage lenisRef={lenisRef} />} /> */}
            </Route>

            {/* Rute Admin (tanpa Layout user: punya sidebar/header sendiri) */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/lupa-password" element={<LupaPassword />} />
            <Route path="/admin" element={<DashboardAdmin />} />
        </Routes>
    );
};

export default AppRoutes;