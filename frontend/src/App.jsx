import { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import './App.css'

import ScrollReveal from './components/ScrollReveal'
import Header from './components/Header'
import Hero from './components/Hero'
import Berita from './components/Berita'
import Mitra from './components/Mitra'
import SocialMedia from './components/SocialMedia'
import Video from './components/Video'
import Footer from './components/Footer'

function App() {
  const appRef = useRef(null)

  // Smooth scroll with Lenis
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

  const handleNavigate = (section) => {
    const targetMap = {
      beranda: 'beranda',
      profil: 'beranda',
      'reformasi birokrasi': 'beranda',
      'dok. kinerja': 'beranda',
      pelayanan: 'beranda',
      program: 'beranda',
      ppid: 'beranda',
      sipers: 'beranda',
      spab: 'beranda',
      pengaduan: 'beranda',
      'media-sosial': 'media-sosial',
      video: 'video',
      kontak: 'kontak',
      berita: 'berita',
      mitra: 'mitra',
    }
    
    const targetId = targetMap[section] || 'beranda'
    const element = document.getElementById(targetId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="site-shell" ref={appRef}>
      <Header onNavigate={handleNavigate} />

      <Hero />

      <div className="section-separator" />

      <Berita />

      <Mitra />

      <SocialMedia />

      <div className="section-separator section-separator--dark" />

      <Video />

      <Footer />
    </div>
  )
}

export default App