import { Routes, Route } from 'react-router-dom';
import Beranda from '../pages/user/Beranda/Beranda';
// Nanti tambahkan rute lain di sini (misal: halaman admin)

const AppRoutes = ({ lenisRef }) => {
    return (
        <Routes>
            <Route path="/" element={<Beranda lenisRef={lenisRef} />} />
        </Routes>
    );
};

export default AppRoutes;
