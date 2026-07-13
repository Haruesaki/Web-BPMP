import React from 'react';
import { useYoutube } from '../../../hooks/useYoutube';
import { useInstagram } from '../../../hooks/useInstagram';
import './Beranda.css';

// --- IMPORT COMPONENTS KITA ---
import NewsSection from '../../../components/user/berita/NewsSection';
import HeroSection from '../../../components/common/HeroSection';
import PartnerSection from '../../../components/user/partner/PartnerSection';
import InstagramSection from '../../../components/user/instagram/InstagramSection';
import YoutubeSection from '../../../components/user/youtube/YoutubeSection';


const Beranda = ({ lenisRef }) => {
  // --- YOUTUBE STATE ---
  const { ytVideos, ytChannel } = useYoutube();

  // --- INSTAGRAM STATE ---
  const { igProfile, loading: igLoading } = useInstagram();


  return (
    <>
      <HeroSection />

      <NewsSection />

      <PartnerSection />

      <InstagramSection igProfile={igProfile} loading={igLoading} />

      <YoutubeSection ytVideos={ytVideos} ytChannel={ytChannel} />

    </>
  );
};

export default Beranda;
