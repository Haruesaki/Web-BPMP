import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import './App.css'

import followBtn from './assets/source/Button-Follow-Instagram.png'
import ig1 from './assets/source/Foto-Instagram-1.png'
import ig2 from './assets/source/Foto-Instagram-2.png'
import ig3 from './assets/source/Foto-Instagram-3.png'
import ig4 from './assets/source/Foto-Instagram-4.png'
import ttsIcon from './assets/source/Icon-TeksToSpeech.png'
import searchIcon from './assets/source/Ikon-Search.png'
import mitra1 from './assets/source/Mitra (1).png'
import mitra2 from './assets/source/Mitra (2).png'
import mitra3 from './assets/source/Mitra (3).png'
import mitra4 from './assets/source/Mitra (4).png'
import mitra5 from './assets/source/Mitra (5).png'
import berita1 from './assets/source/Preveiw-berita (1).png'
import berita2 from './assets/source/Preveiw-berita (2).jpg'
import berita3 from './assets/source/Preveiw-berita (3).jpg'

import fbIcon from './assets/source/facebook.png'
import igIcon from './assets/source/instagram.png'
import waIcon from './assets/source/social.png'
import ytIcon from './assets/source/youtube.png'

const menuItems = [
  'Beranda',
  'Profil',
  'Reformasi Birokrasi',
  'Dok. Kinerja',
  'Pelayanan',
  'Program',
  'PPID',
  'Sipers',
  'SPAB',
  'Pengaduan',
]

const dropDownItems = ['Profil', 'Reformasi Birokrasi', 'Dok. Kinerja', 'Pelayanan', 'Program', 'Pengaduan']

import mainLogo from './assets/source/Logo.png'
import sectionLanding from './assets/source/section-landing.png'
import Lenis from 'lenis'

const buildingImage = sectionLanding

function App() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [indicatorStyle, setIndicatorStyle] = useState({
    opacity: 0,
    transform: 'translateX(0px)',
    width: 0,
  })
  const navListRef = useRef(null)
  const navItemRefs = useRef([])

  const moveIndicator = useCallback(() => {
    const navList = navListRef.current
    const target = navItemRefs.current[activeIndex]
    if (!navList || !target) return
    const navRect = navList.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    setIndicatorStyle({
      opacity: 1,
      transform: `translate3d(${targetRect.left - navRect.left}px, 0, 0)`,
      width: targetRect.width,
    })
  }, [activeIndex])

  useLayoutEffect(() => {
    moveIndicator()
  }, [moveIndicator])

  useEffect(() => {
    window.addEventListener('resize', moveIndicator)
    return () => window.removeEventListener('resize', moveIndicator)
  }, [moveIndicator])

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <div className="site-shell">
      {/* Header Bar */}
      <header className="top-header">
        <div className="top-header-inner">
          <a className="brand" href="#beranda" aria-label="BPMP Lampung">
            <img src={mainLogo} alt="Kemendikdasmen BPMP Lampung" className="brand-logo-img" />
          </a>

          <div className="header-actions">
            <button className="btn-search">
              <img src={searchIcon} alt="Search" />
            </button>
            <button className="btn-tts">
              <img src={ttsIcon} alt="Tulisan Ke Suara" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="main-nav" aria-label="Menu utama">
          <div className="nav-scroll">
            <div ref={navListRef} className="nav-list">
              <span className="nav-indicator" style={indicatorStyle} aria-hidden="true" />
              {menuItems.map((item, index) => (
                <div className="nav-entry" key={item}>
                  <button
                    ref={(el) => (navItemRefs.current[index] = el)}
                    type="button"
                    className={`nav-item ${activeIndex === index ? 'is-active' : ''}`}
                    onClick={() => setActiveIndex(index)}
                  >
                    {item}
                  </button>
                  {dropDownItems.includes(item) && <span className="nav-dropdown-arrow">▾</span>}
                  {index < menuItems.length - 1 && <span className="nav-divider" aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="hero-section" id="beranda">
        <section className="hero-copy">
          <p className="hero-kicker">Selamat Datang Di</p>
          <h1 id="hero-title">Balai Penjaminan<br/>Mutu Pendidikan<br/>Provinsi Lampung</h1>
          <p className="hero-description">Kementerian Pendidikan Dasar dan Menengah</p>

          <div className="campaign-stack">
            <img src={mitra5} alt="Pendidikan Bermutu" className="campaign-img-logo" />
            <div className="friendly-mark">
              <span>Kemendikdasmen</span>
              <strong>RAMAH</strong>
            </div>
          </div>
        </section>

        <section className="hero-visual">
          <img src={buildingImage} alt="Gedung BPMP Lampung" className="hero-building-img" />
        </section>

        <aside className="social-dock">
          <a href="#ig" className="social-icon-btn"><img src={igIcon} alt="IG" /></a>
          <a href="#yt" className="social-icon-btn"><img src={ytIcon} alt="YT" /></a>
          <a href="#wa" className="social-icon-btn"><img src={waIcon} alt="WA" /></a>
          <a href="#fb" className="social-icon-btn"><img src={fbIcon} alt="FB" /></a>
        </aside>
      </main>

      {/* Berita Section */}
      <section className="berita-section">
        <div className="berita-container">
          <h2 className="section-title">BERITA</h2>
          <div className="berita-content">
            <div className="berita-left">
              <div className="berita-main">
                <img src={berita1} alt="Berita Utama" className="berita-main-img" />
                <div className="berita-overlay">
                  <p>Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja dan Kualitas Layanan</p>
                </div>
              </div>
              <div className="berita-thumbs">
                <div className="thumb-wrapper"><img src={berita2} alt="Thumb 1" /></div>
                <div className="thumb-wrapper"><img src={berita3} alt="Thumb 2" /></div>
              </div>
            </div>
            
            <div className="berita-right">
              <h3 className="info-terkini-title">INFORMASI TERKINI</h3>
              <div className="news-list">
                {[1, 2, 3, 4].map((i) => (
                  <div className={`news-item ${i === 1 ? 'is-active' : ''}`} key={i}>
                    <div className="news-line"></div>
                    <div className="news-content">
                      <span className="news-badge">Berita</span>
                      <h4>Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja dan Kualitas Layanan</h4>
                      <span className="news-date">15 Juni 2026 🕒</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pagination">
                <button className="page-nav">&lt;</button>
                <button className="page-num active">1</button>
                <button className="page-num">2</button>
                <button className="page-num">3</button>
                <span className="page-dots">...</span>
                <button className="page-num">11</button>
                <button className="page-num">12</button>
                <button className="page-nav">&gt;</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mitra Banner */}
      <section className="mitra-banner">
        <div className="mitra-track">
          <div className="friendly-mark-blue">
            <span>KEMENDIKDASMEN</span>
            <strong>RAMAH</strong>
          </div>
          <img src={mitra4} alt="Bangga Melayani Bangsa" />
          <img src={mitra1} alt="Sehat Tanpa Korupsi" />
          <img src={mitra3} alt="Rumah Pendidikan" />
          <img src={mitra2} alt="BerAKHLAK" />
        </div>
      </section>

      {/* Social Media Section */}
      <section className="social-media-section">
        <div className="social-curve-wrapper">
          <div className="social-curve">
             <h2>Ikuti Media Sosial BPMP Lampung</h2>
          </div>
        </div>

        <div className="social-profile-card">
          <div className="profile-info">
            <div className="profile-avatar">
              <svg viewBox="0 0 100 100" className="brand-logo-svg small">
                <path d="M50 15 L85 35 L85 75 L50 95 L15 75 L15 35 Z" fill="#fff"/>
                <path d="M50 25 L75 40 L75 65 L50 80 L25 65 L25 40 Z" fill="#07508c"/>
                <text x="50" y="55" fill="#fff" fontSize="18" fontWeight="bold" textAnchor="middle">BP</text>
              </svg>
            </div>
            <span className="profile-name">@bpmplampung</span>
          </div>
          <div className="profile-stats">
            <div className="stat"><span>Postingan</span><strong>1865</strong></div>
            <div className="stat"><span>Pengikut</span><strong>6,138</strong></div>
            <div className="stat"><span>Diikuti</span><strong>1,151</strong></div>
          </div>
          <div className="profile-action">
            <img src={followBtn} alt="Follow Instagram" className="btn-follow" />
          </div>
        </div>

        <div className="instagram-grid">
          <div className="ig-post"><img src={ig1} alt="IG 1" /></div>
          <div className="ig-post"><img src={ig2} alt="IG 2" /></div>
          <div className="ig-post"><img src={ig3} alt="IG 3" /></div>
          <div className="ig-post"><img src={ig4} alt="IG 4" /></div>
        </div>
      </section>

      {/* YouTube / Video Section */}
      <section className="video-section">
        <div className="video-header-banner">
           <div className="yt-badge">
             <img src={ytIcon} alt="YouTube" />
             <span>bpmplampung</span>
           </div>
           <button className="btn-subscribe">Subscribe</button>
        </div>

        <div className="video-content">
          <div className="video-main">
            <h3>Jejak Dedikasi, Melanjutkan Inspirasi</h3>
            <div className="video-player">
              <img src={ig3} alt="Video Thumbnail" className="video-poster" />
              <div className="play-button-overlay">▶</div>
            </div>
          </div>
          <div className="video-side">
            <h3>Video Terbaru</h3>
            <div className="video-side-list">
              <div className="video-thumb-card">
                <img src={ig4} alt="Thumb" />
                <div className="play-button-small">▶</div>
              </div>
              <div className="video-thumb-card">
                <img src={ig2} alt="Thumb" />
                <div className="play-button-small">▶</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="visitor-count-wrapper">
          <div className="visitor-count">
            <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Total Jumlah Pengunjung : 107030
          </div>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <h4>Hubungi Kami</h4>
            <p>Gatot Subroto 44 A Pahoman, Enggal, Kota<br/>Bandar Lampung<br/>WhatsApp. 08982969696<br/>Posel: bpmplampung@kemdikdasmen.go.id</p>
          </div>
          <div className="footer-col">
            <h4>Tautan</h4>
            <ul>
              <li>Kemendikdasmen</li>
              <li>Dapodik</li>
              <li>Sekolah Kita</li>
              <li>Rumah Pendidikan</li>
              <li>Rapor Pendidikan</li>
              <li>Portal Data Pendidikan</li>
              <li>SPAB Kemendikdasmen</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Navigasi</h4>
            <div className="map-placeholder">
               <img src={mitra3} alt="Map" className="map-img" />
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          © 2026 BPMP Lampung
        </div>
      </footer>
    </div>
  )
}

export default App
