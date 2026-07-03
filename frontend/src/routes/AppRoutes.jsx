import { Routes, Route } from 'react-router-dom';
import Layout from '../components/common/Layout'; // 1. Impor Layout baru
import Beranda from '../pages/user/Beranda/Beranda';
import VisiDanMisi from '../pages/user/VisiDanMisi/VisiDanMisi';

// Halaman Admin
import Login from '../pages/Admin/Login/Login';
import LupaPassword from '../pages/Admin/Login/LupaPassword';
import DashboardAdmin from '../pages/Admin/DashboardAdmin/dashboard-admin';
import ManajemenUser from '../pages/Admin/ManajemenUser/ManajemenUser';

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

            {/* Rute Admin (tanpa Layout user: punya sidebar/header sendiri) */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/lupa-password" element={<LupaPassword />} />
            <Route path="/admin" element={<DashboardAdmin />} />
            <Route path="/admin/manajemen-user" element={<ManajemenUser />} />
        </Routes>
    );
};

export default AppRoutes;