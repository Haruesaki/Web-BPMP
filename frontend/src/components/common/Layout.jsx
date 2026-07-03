import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import FloatingSocialBar from './FloatingSocialBar';

const Layout = ({ lenisRef }) => {
  return (
    <>
      <Navbar lenisRef={lenisRef} />
      <FloatingSocialBar />
      {/* Outlet akan me-render komponen halaman yang cocok dengan rute */}
      <Outlet />
      <Footer />
    </>
  );
};

export default Layout;