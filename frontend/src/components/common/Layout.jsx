import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingSocialBar from './FloatingSocialBar';
import { useHoverToSpeak } from '../../hooks/useHoverToSpeak';
import { useTema } from '../../hooks/useTema';

const Layout = ({ lenisRef }) => {
  // TTS hover-to-speak hanya aktif di halaman user (di dalam Layout), tidak di admin
  useHoverToSpeak();
  // useTema mengembalikan objek CSS variable (sudah di-seed dari cache agar tak
  // ada flash). Diterapkan pada wrapper ini saja; halaman admin (AdminLayout)
  // tidak terpengaruh. Semua section membaca `var(--theme-*, <warna lama>)`.
  const themeVars = useTema();

  return (
    <div className="site-theme-scope" style={themeVars}>
      <Navbar lenisRef={lenisRef} />
      <FloatingSocialBar />
      {/* Outlet akan me-render komponen halaman yang cocok dengan rute */}
      <Outlet />
      <Footer />
    </div>
  );
};

export default Layout;
