import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { bacaSesi, pantauSesi } from '../utils/sesiAdmin';

// =========================================================================
//  PENJAGA RUTE ADMIN
//  -----------------------------------------------------------------------
//  `bacaSesi()` membaca dari penyimpanan milik PROFIL peramban, bukan milik
//  tab, sehingga tab baru yang langsung dibuka ke /admin memakai sesi yang
//  sama dan tidak lagi diminta login. Ia juga membuang sesi yang sudah lewat
//  masa berlakunya, jadi tidak ada pemeriksaan tanggal terpisah di sini.
//
//  Penjaga ini semata-mata soal tampilan. Yang benar-benar menahan akses data
//  tetap `authMiddleware` di peladen — token palsu yang ditaruh lewat konsol
//  pengembang memang lolos dari sini, tetapi setiap permintaannya ditolak 401,
//  dan pemintas di axiosInstance segera memulangkannya ke halaman login.
// =========================================================================

const ProtectedRoute = () => {
  const [sesi, setSesi] = useState(() => bacaSesi());

  // Tab lain yang keluar (atau masuk) harus terasa di tab ini juga. Tanpa
  // pemantauan ini, tab yang sudah "keluar" masih memperlihatkan panel admin
  // sampai dimuat ulang — pengguna mengira sudah keluar, padahal belum.
  useEffect(() => pantauSesi(setSesi), []);

  if (!sesi) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
