import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/common/Layout'; // 1. Impor Layout baru
import Beranda from '../pages/user/Beranda/Beranda';
// import VisiDanMisi from '../pages/user/VisiDanMisi/VisiDanMisi';
// import VisiDanMisi from '../pages/user/VisiDanMisi/VisiDanMisi'; // Komponen ini sekarang digantikan oleh GenericPage
import GenericPage from '../pages/user/GenericPage/GenericPage';

// Halaman Admin
import Login from '../pages/Admin/Login/Login';
import LupaPassword from '../pages/Admin/Login/LupaPassword';
import DashboardAdmin from '../pages/Admin/DashboardAdmin/dashboard-admin';
import ManajemenUser from '../pages/Admin/ManajemenUser/ManajemenUser';
import PengaturanMenu from '../pages/Admin/PengaturanMenu/PengaturanMenu';
import CustomizeBeranda from '../pages/Admin/CustomizeBeranda/CustomizeBeranda';
import Link from '../components/admin/LayoutLink/Link';
import AdminLayout from '../components/admin/layout/AdminLayout';
import ProtectedRoute from './ProtectedRoute';

// Editor konten menu (CKEditor) berukuran besar → lazy-load agar tidak
// membebani bundle halaman admin lain. Host ini memilih editor sesuai layout.
const MenuContentEditor = lazy(() => import('../components/admin/LayoutPost/MenuContentEditor'));

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

            {/* Proteksi Rute Admin (dari branch test): ProtectedRoute menjaga
                autentikasi, AdminLayout menyediakan sidebar + header + Outlet.
                Semua halaman admin di sini bersifat content-only (return <main>). */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<DashboardAdmin />} />
                    <Route path="/admin/customize-beranda" element={<CustomizeBeranda />} />
                    <Route path="/admin/pengaturan-menu" element={<PengaturanMenu />} />
                    <Route path="/admin/link" element={<Link />} />
                    <Route path="/admin/manajemen-user" element={<ManajemenUser />} />
                    {/* Editor konten menu — route DINAMIS per layout (:layout).
                        Contoh: /admin/post/default → editor layout Default.
                        Dimasukkan ke dalam AdminLayout agar Sidebar tetap terlihat! */}
                    <Route
                        path="/admin/post/:layout"
                        element={
                            <Suspense fallback={<div style={{ padding: 32, color: '#c7c4d8', minHeight: '100vh' }}>Memuat editor…</div>}>
                                <MenuContentEditor />
                            </Suspense>
                        }
                    />
                </Route>
            </Route>
        </Routes>
    );
};

export default AppRoutes;