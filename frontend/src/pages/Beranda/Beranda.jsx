import React, { useEffect, useState, useRef } from 'react';
import './Beranda.css';

// --- IMPORT COMPONENTS KITA ---
// (Path disesuaikan dengan struktur folder src/assets/component/ di gambar)
import Navbar from '../../assets/component/Navbar';
import Footer from '../../assets/component/Footer';
import FloatingSocialBar from '../../assets/component/FloatingSocialBar';
import NewsSection from '../../assets/component/NewsSection';
import HeroSection from '../../assets/component/HeroSection';


import Logo from "../../assets/source/Logo.png";
// --- IMPORT ASSETS (Hero, Sosial, Mitra & Postingan) ---
import Instagram from "../../assets/source/instagram.png";
import Youtube from "../../assets/source/youtube.png";

import Mitra1Jpg from "../../assets/source/Mitra (1).jpg";
import Mitra1Png from "../../assets/source/Mitra (1).png";
import Mitra2 from "../../assets/source/Mitra (2).png";
import Mitra3 from "../../assets/source/Mitra (3).png";
import Mitra4 from "../../assets/source/Mitra (4).png";
import Mitra5 from "../../assets/source/Mitra (5).png";

import PreviewBerita1Jpg from "../../assets/source/Preveiw-berita (1).jpg";
import PreviewBerita2 from "../../assets/source/Preveiw-berita (2).jpg";
import PreviewBerita3 from "../../assets/source/Preveiw-berita (3).jpg";

const InstagramEmbedCard = React.memo(({ postId }) => {
  useEffect(() => {
    // Fungsi untuk memicu proses embed dari script Instagram
    const processInstagram = () => {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
    };

    // Cek apakah script sudah ada, jika belum muat scriptnya
    if (!document.getElementById('instagram-embed-script')) {
      const script = document.createElement('script');
      script.id = 'instagram-embed-script';
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.onload = processInstagram;
      document.body.appendChild(script);
    } else {
      // Jika sudah ada, beri sedikit jeda agar DOM terupdate lalu jalankan ulang process()
      setTimeout(processInstagram, 100);
    }
  }, [postId]);

  return (
    <div className="ig-post-card ig-embed-wrapper">
      <blockquote 
        className="instagram-media" 
        data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`} 
        data-instgrm-version="14" 
        style={{ background: '#FFF', border: 0, borderRadius: '3px', boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)', margin: '1px', maxWidth: '540px', minWidth: '326px', padding: 0, width: 'calc(100% - 2px)' }}
      >
      </blockquote>
    </div>
  );
}, (prevProps, nextProps) => prevProps.postId === nextProps.postId);

const Beranda = ({ lenisRef }) => {
  // --- STATE & REF UNTUK BERANDA (Hero, Typewriter, Mitra) ---
  const trackRef = useRef(null);
  const partnersSectionRef = useRef(null);

  const mitraList = [Mitra1Jpg, Mitra5, Mitra2, Mitra3, Mitra1Png, Mitra4];

  // --- YOUTUBE STATE ---
  const [ytVideos, setYtVideos] = useState([]);



  // 2. LENS EFEK 3D LOGO MITRA
  useEffect(() => {
    const track = trackRef.current;
    const partnersSection = partnersSectionRef.current;
    let observerMitra;
    let animationFrameId;

    if (track && partnersSection) {
      const allLogos = track.querySelectorAll('.partner-logo');
      let isSectionVisible = false;

      function apply3DLensEffect() {
        if (!isSectionVisible) return;

        const screenCenter = window.innerWidth / 2;
        const maxDistance = window.innerWidth / 2;

        for (let i = 0; i < allLogos.length; i++) {
          const rect = allLogos[i].getBoundingClientRect();

          if (rect.width === 0) continue;

          const logoCenter = rect.left + rect.width / 2;
          const distanceFromCenter = Math.abs(screenCenter - logoCenter);

          let normalized = distanceFromCenter / maxDistance;
          if (normalized > 1) normalized = 1;

          const scale = 0.65 + 0.95 * Math.pow(normalized, 2);

          allLogos[i].style.transform = `scale(${scale}) translateZ(0)`;
          allLogos[i].style.opacity = '1';
          allLogos[i].style.filter = 'none';
        }

        animationFrameId = requestAnimationFrame(apply3DLensEffect);
      }

      observerMitra = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isSectionVisible = entry.isIntersecting;
            if (isSectionVisible) {
              apply3DLensEffect();
            } else {
              if (animationFrameId) cancelAnimationFrame(animationFrameId);
            }
          });
        },
        { threshold: 0.01 }
      );

      const startObserver = () => {
        if (partnersSectionRef.current) {
          observerMitra.observe(partnersSectionRef.current);
        }
      };

      if (document.readyState === 'complete') {
        startObserver();
      } else {
        window.addEventListener('load', startObserver);
      }
    }

    return () => {
      if (observerMitra) observerMitra.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('load', () => { });
    };
  }, []);

  // 4. EFEK MARQUEE SCROLL VELOCITY 
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let percentX = 0;
    let lastScrollY = window.scrollY;
    let currentVelocity = 0;
    let animationFrameId;

    const animateMarquee = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      currentVelocity += (scrollDelta - currentVelocity) * 0.08;

      const baseSpeed = 0.04; 
      const scrollSensitivity = 0.015; 
      const totalSpeed = baseSpeed + (currentVelocity * scrollSensitivity);

      percentX -= totalSpeed;

      if (percentX <= -50) {
        percentX += 50;
      } else if (percentX > 0) {
        percentX -= 50;
      }

      track.style.transform = `translate3d(${percentX}%, 0, 0)`;
      animationFrameId = requestAnimationFrame(animateMarquee);
    };

    animationFrameId = requestAnimationFrame(animateMarquee);
    return () => cancelAnimationFrame(animationFrameId);
  }, []); 

  // 5. EFEK HERO PARALLAX
  // --- FETCH YOUTUBE VIDEOS ---
  useEffect(() => {
    const fetchYouTube = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/youtube');
        const json = await res.json();
        if (json.success && json.data) {
          setYtVideos(json.data);
        }
      } catch (e) {
        console.error("Error fetching YT:", e);
      }
    };
    fetchYouTube();
  }, []);




  return (
    <>
      {/* 1. MENGGUNAKAN KOMPONEN NAVBAR */}
      <Navbar lenisRef={lenisRef} />

      <FloatingSocialBar />

      <HeroSection />

      <NewsSection />

      <section className="partners-section" ref={partnersSectionRef}>
        <div className="partners-container">
          <div className="partners-track" ref={trackRef} style={{ gap: '0px' }}>
            {[...mitraList, ...mitraList].map((mitra, index) => (
              <img
                key={index}
                src={mitra}
                alt={`Mitra Kerja BPMP ${index + 1}`}
                className="partner-logo"
                style={{ paddingRight: '7vw' }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="instagram-section">
        <div className="ig-banner-wrapper">
          <div className="ig-banner-oval"></div>
          <h2 className="ig-banner-text">Ikuti Media Sosial BPMP Lampung</h2>
        </div>

        <div className="ig-profile-header">
          <div className="ig-profile-left">
            <img src={Logo} alt="Logo BPMP" className="ig-avatar" />
            <span className="ig-username">@bpmplampung</span>
          </div>

          <div className="ig-stats">
            <div className="ig-stat-item">
              <span className="ig-stat-label">Postingan</span>
              <span className="ig-stat-value">1865</span>
            </div>
            <div className="ig-stat-item">
              <span className="ig-stat-label">Pengikut</span>
              <span className="ig-stat-value">6,138</span>
            </div>
            <div className="ig-stat-item">
              <span className="ig-stat-label">Diikuti</span>
              <span className="ig-stat-value">1,151</span>
            </div>
          </div>

          <div className="ig-profile-right">
            <button className="ig-follow-btn">
              <img src={Instagram} alt="IG Icon" className="ig-btn-icon" />
              Follow
            </button>
          </div>
        </div>

        <div className="ig-feed-section">
          <div className="ig-feed-grid">
            {/* Dynamic Instagram Embed Component */}
            <InstagramEmbedCard postId="DaMGvRKAb7z" />
            <InstagramEmbedCard postId="DZR9Hdfh9Zs" />
            <InstagramEmbedCard postId="DaNwf5vyIYn" />
            <InstagramEmbedCard postId="DaKohaEPomy" />
          </div>
        </div>
      </section>

      <section className="youtube-section">
        <div className="yt-header-bar">
          <div className="yt-profile-left">
            <img src={Youtube} alt="YouTube Icon" className="yt-icon" />
            <span className="yt-channel-name">bpmplampung</span>
          </div>
          <button className="yt-subscribe-btn">Subscribe</button>
        </div>

{/* Konten Grid Video */}
        <div className="yt-content-area">
          <div className="yt-feed-grid">

            <div className="yt-main-card">
              <div className="yt-card-title">{ytVideos.length > 0 ? ytVideos[0].snippet.title : 'Memuat Video...'}</div>
              <div className={`yt-video-wrapper main-wrapper ${ytVideos.length > 0 && ytVideos[0].videoType === 'short' ? 'short-format' : ''}`}>
                {ytVideos.length > 0 && (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${ytVideos[0].id.videoId}`} 
                    title={ytVideos[0].snippet.title} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                )}
              </div>
            </div>

            <div className="yt-side-card">
              <div className="yt-card-title text-center">Video Terbaru</div>
              <div className="yt-side-list">
                
                {ytVideos.slice(1, 3).map((video, idx) => (
                  <div key={idx} className={`yt-video-wrapper side-wrapper ${video.videoType === 'short' ? 'short-format' : ''}`}>
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${video.id.videoId}`} 
                      title={video.snippet.title} 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      allowFullScreen
                      loading="lazy"
                    ></iframe>
                  </div>
                ))}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. MENGGUNAKAN KOMPONEN FOOTER */}
      <Footer />
    </>
  );
};

export default Beranda;