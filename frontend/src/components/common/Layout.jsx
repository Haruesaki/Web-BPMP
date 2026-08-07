import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Header/Navbar';
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
    <div 
      className="site-theme-scope" 
      style={{ 
        ...themeVars, 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh' 
      }}
    >
      <Navbar lenisRef={lenisRef} />
      <FloatingSocialBar />
      {/* Outlet dibungkus dalam tag main dengan flex: 1 0 auto untuk mendorong footer ke bawah */}
      <main style={{ flex: '1 0 auto', width: '100%' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
