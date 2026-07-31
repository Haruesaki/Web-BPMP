import { lazy, Suspense } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Layout from '../components/common/Layout'; // 1. Impor Layout baru
import Beranda from '../pages/user/Beranda/Beranda';
// import VisiDanMisi from '../pages/user/VisiDanMisi/VisiDanMisi';
// import VisiDanMisi from '../pages/user/VisiDanMisi/VisiDanMisi'; // Komponen ini sekarang digantikan oleh GenericPage
import GenericPage from '../pages/user/GenericPage/GenericPage';
import BeritaDetail from '../pages/user/BeritaDetail/BeritaDetail';

// Halaman Admin — semuanya di-lazy agar seluruh bundel admin (termasuk recharts
// pada dashboard) TIDAK ikut termuat saat pengunjung membuka halaman publik.
// ProtectedRoute tetap eager: hanya penjaga autentikasi, ringan, dan menentukan
// apakah subtree admin dirender sama sekali.
import ProtectedRoute from './ProtectedRoute';
const Login = lazy(() => import('../pages/Admin/Login/Login'));
const LupaPassword = lazy(() => import('../pages/Admin/Login/LupaPassword'));
const DashboardAdmin = lazy(() => import('../pages/Admin/DashboardAdmin/dashboard-admin'));
const ManajemenUser = lazy(() => import('../pages/Admin/ManajemenUser/ManajemenUser'));
const PengaturanMenu = lazy(() => import('../pages/Admin/PengaturanMenu/PengaturanMenu'));
const CustomizeBeranda = lazy(() => import('../pages/Admin/CustomizeBeranda/CustomizeBeranda'));
const Link = lazy(() => import('../components/admin/LayoutLink/Link'));
const AdminLayout = lazy(() => import('../components/admin/layout/AdminLayout'));
const PreviewProfilCard = lazy(() => import('../components/admin/LayoutPost/profil/PreviewProfilCard'));
const PostProfileCard = lazy(() => import('../components/admin/LayoutPost/profil/PostProfileCard'));
const Setting = lazy(() => import('../pages/Admin/Setting/Setting'));

// Editor konten menu (CKEditor) berukuran besar → lazy-load agar tidak
// membebani bundle halaman admin lain. Host ini memilih editor sesuai layout.
const MenuContentEditor = lazy(() => import('../components/admin/LayoutPost/MenuContentEditor'));

// Satu batas Suspense untuk seluruh subtree admin. Karena komponen admin kini
// lazy, dibutuhkan Suspense di atasnya; menaruhnya via <Outlet/> membuat satu
// fallback menaungi login, layout, dan semua halaman admin sekaligus.
const AdminBoundary = () => (
    <Suspense fallback={<div style={{ padding: 32, color: '#c7c4d8', minHeight: '100vh' }}>Memuat…</div>}>
        <Outlet />
    </Suspense>
);

const AppRoutes = ({ lenisRef }) => {
    return (
        <Routes>
            <Route element={<Layout lenisRef={lenisRef} />}>
                <Route path="/" element={<Beranda lenisRef={lenisRef} />} />
                {/* Rute dinamis untuk menampilkan layout berdasarkan ID menu (CMS) */}
                <Route path="/halaman/:menuId" element={<GenericPage lenisRef={lenisRef} />} />
                {/* Rute untuk detail berita dari beranda */}
                <Route path="/berita/:id" element={<BeritaDetail lenisRef={lenisRef} />} />
                {/* Rute lama statis untuk testing */}
                <Route path="/profil/visi-misi" element={<GenericPage lenisRef={lenisRef} />} />
            </Route>

            {/* Seluruh rute admin dinaungi satu batas Suspense (AdminBoundary)
                karena komponennya kini lazy-loaded. */}
            <Route element={<AdminBoundary />}>
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
                    <Route path="/admin/link/:menuId?" element={<Link />} />
                    <Route path="/admin/kelola-profil/:menuId" element={<PreviewProfilCard />} />
                    <Route path="/admin/kelola-profil/tambah/:menuId" element={<PostProfileCard />} />
                    <Route path="/admin/kelola-profil/edit/:menuId/:profileId" element={<PostProfileCard />} />
                    <Route path="/admin/manajemen-user" element={<ManajemenUser />} />
                    <Route path="/admin/setting" element={<Setting />} />
                    {/* Editor konten menu — route DINAMIS per layout (:layout).
                        Contoh: /admin/post/default → editor layout Default.
                        Dimasukkan ke dalam AdminLayout agar Sidebar tetap terlihat! */}
                    <Route
                        path="/admin/post/:layout/*"
                        element={
                            <Suspense fallback={<div style={{ padding: 32, color: '#c7c4d8', minHeight: '100vh' }}>Memuat editor…</div>}>
                                <MenuContentEditor />
                            </Suspense>
                        }
                    />
                </Route>
            </Route>
            </Route>
        </Routes>
    );
};

export default AppRoutes;