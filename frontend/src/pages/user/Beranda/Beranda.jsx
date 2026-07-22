import React, { useEffect, useState } from 'react';
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

  // --- SECTION ORDER STATE ---
  const [sectionOrder, setSectionOrder] = useState([]);

  // --- VISITOR TRACKING & SECTIONS ---
  useEffect(() => {
    // Mencatat kunjungan
    axiosInstance.post('/api/pengunjung')
      .then(res => console.log('Visitor recorded:', res.data))
      .catch(err => console.error('Visitor track error', err));

    // Ambil urutan section
    axiosInstance.get('/api/beranda/urutan-section')
      .then(res => {
        if (res.data?.success && res.data?.data) {
          setSectionOrder(res.data.data);
        }
      })
      .catch(err => console.error('Failed to load section order', err));
  }, []);

  const renderSection = (sectionName) => {
    switch (sectionName) {
      case 'Berita':
        return <NewsSection key="berita" />;
      case 'Logo Mitra':
        return <PartnerSection key="mitra" />;
      case 'Preview Media Sosial Instagram':
        return <InstagramSection key="ig" igProfile={igProfile} loading={igLoading} />;
      case 'Preview Media Sosial YouTube':
        return <YoutubeSection key="yt" ytVideos={ytVideos} ytChannel={ytChannel} />;
      case 'Jumlah Pengunjung':
        return <JumlahPengunjung key="pengunjung" />;
      default:
        return null;
    }
  };

  const defaultOrder = [
    { nama_section: 'Berita', is_visible: true },
    { nama_section: 'Logo Mitra', is_visible: true },
    { nama_section: 'Preview Media Sosial Instagram', is_visible: true },
    { nama_section: 'Preview Media Sosial YouTube', is_visible: true },
    { nama_section: 'Jumlah Pengunjung', is_visible: true },
  ];

  const sectionsToRender = sectionOrder.length > 0 ? sectionOrder : defaultOrder;

  return (
    <>
      <HeroSection />

      {sectionsToRender.map(section => {
        if (!section.is_visible) return null;
        return renderSection(section.nama_section);
      })}
    </>
  );
};

export default Beranda;
