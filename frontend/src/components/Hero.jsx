import { useEffect, useRef, useState } from 'react'
import './Hero.css'

import sectionLanding from '../assets/source/section-landing.png'
import mitra5 from '../assets/source/Mitra (5).png'
import igIcon from '../assets/source/instagram.png'
import ytIcon from '../assets/source/youtube.png'
import waIcon from '../assets/source/social.png'
import fbIcon from '../assets/source/facebook.png'

const buildingImage = sectionLanding

const socialLinks = [
  { icon: igIcon, alt: 'Instagram', href: 'https://instagram.com/bpmplampung', label: 'Instagram' },
  { icon: ytIcon, alt: 'YouTube', href: 'https://youtube.com/@bpmplampung', label: 'YouTube' },
  { icon: waIcon, alt: 'WhatsApp', href: 'https://wa.me/628982969696', label: 'WhatsApp' },
  { icon: fbIcon, alt: 'Facebook', href: 'https://facebook.com/bpmplampung', label: 'Facebook' },
]

export default function Hero() {
  const heroRef = useRef(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="hero-section" id="beranda" ref={heroRef}>
      <section className="hero-copy">
        <p className="hero-kicker">Selamat Datang Di</p>
        <h1 id="hero-title">
          <span className="hero-title-line">Balai Penjaminan</span>
          <span className="hero-title-line">Mutu Pendidikan</span>
          <span className="hero-title-line hero-title-accent">Provinsi Lampung</span>
        </h1>
        <p className="hero-description">Kementerian Pendidikan Dasar dan Menengah</p>

        <div className="campaign-stack">
          <img src={mitra5} alt="Pendidikan Bermutu" className="campaign-img-logo" />
          <div className="friendly-mark">
            <span>Kemendikdasmen</span>
            <strong>RAMAH</strong>
          </div>
        </div>
      </section>

      <section 
        className="hero-visual"
        style={{
          transform: `translateY(${scrollY * 0.15}px)`
        }}
      >
        <img src={buildingImage} alt="Gedung BPMP Lampung" className="hero-building-img" />
      </section>

      <aside className="social-dock">
        {socialLinks.map((social) => (
          <a 
            key={social.label}
            href={social.href} 
            className="social-icon-btn"
            aria-label={social.label}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={social.icon} alt={social.alt} />
          </a>
        ))}
      </aside>
      
      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <div className="scroll-mouse">
          <div className="scroll-wheel"></div>
        </div>
        <span>Scroll untuk jelajahi</span>
      </div>
    </main>
  )
}