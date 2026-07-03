import React from 'react';
import { useYoutube } from '../../../hooks/useYoutube';
import './Beranda.css';

// --- IMPORT COMPONENTS KITA ---
// (Path disesuaikan dengan struktur folder src/components/common/ di gambar)
import Navbar from '../../../components/common/Navbar';
import Footer from '../../../components/common/Footer';
import FloatingSocialBar from '../../../components/common/FloatingSocialBar';
import NewsSection from '../../../components/user/berita/NewsSection';
import HeroSection from '../../../components/common/HeroSection';
import PartnerSection from '../../../components/user/partner/PartnerSection';
import InstagramSection from '../../../components/user/instagram/InstagramSection';
import YoutubeSection from '../../../components/user/youtube/YoutubeSection';


const Beranda = ({ lenisRef }) => {
  // --- YOUTUBE STATE ---
  const { ytVideos, ytChannel } = useYoutube();



  // 5. EFEK HERO PARALLAX

  return (
    <>
      {/* 1. MENGGUNAKAN KOMPONEN NAVBAR */}
      <Navbar lenisRef={lenisRef} />

      <FloatingSocialBar />

      <HeroSection />

      <NewsSection />

      <PartnerSection />

      <InstagramSection />

      <YoutubeSection ytVideos={ytVideos} ytChannel={ytChannel} />

      {/* 3. MENGGUNAKAN KOMPONEN FOOTER */}
      <Footer />
    </>
  );
};

export default Beranda;
