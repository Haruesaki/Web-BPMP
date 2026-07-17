import React, { useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import { useYoutube } from '../../../hooks/useYoutube';
import { useInstagram } from '../../../hooks/useInstagram';
import './Beranda.css';

// --- IMPORT COMPONENTS KITA ---
import NewsSection from '../../../components/user/berita/NewsSection';
import HeroSection from '../../../components/common/HeroSection';
import PartnerSection from '../../../components/user/partner/PartnerSection';
import InstagramSection from '../../../components/user/instagram/InstagramSection';
import YoutubeSection from '../../../components/user/youtube/YoutubeSection';
import JumlahPengunjung from '../../../components/user/jumlah-pengunjung/JumlahPengunjung';

const Beranda = ({ lenisRef }) => {
  // --- YOUTUBE STATE ---
  const { ytVideos, ytChannel } = useYoutube();

  // --- INSTAGRAM STATE ---
  const { igProfile, loading: igLoading } = useInstagram();

  // --- VISITOR TRACKING ---
  useEffect(() => {
    // Mencatat kunjungan
    axiosInstance.post('/api/pengunjung')
      .then(res => console.log('Visitor recorded:', res.data))
      .catch(err => console.error('Visitor track error', err));
  }, []);


  return (
    <>
      <HeroSection />

      <NewsSection />

      <PartnerSection />

      <InstagramSection igProfile={igProfile} loading={igLoading} />

      <YoutubeSection ytVideos={ytVideos} ytChannel={ytChannel} />

      <JumlahPengunjung/>

    </>
  );
};

export default Beranda;
