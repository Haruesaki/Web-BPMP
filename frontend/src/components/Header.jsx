import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import './Header.css'

import mainLogo from '../assets/source/Logo.png'
import searchIcon from '../assets/source/Ikon-Search.png'
import ttsIcon from '../assets/source/Icon-TeksToSpeech.png'

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

export default function Header({ activeSection, onNavigate }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const navListRef = useRef(null)
  const navItemRefs = useRef([])
  const searchInputRef = useRef(null)

  const moveIndicator = useCallback((index) => {
    const navList = navListRef.current
    const target = navItemRefs.current[index]
    if (!navList || !target) return
    const navRect = navList.getBoundingClientRect()
    const targetRect = target.getBoundingClientRect()
    setIndicatorStyle({
      left: `${targetRect.left - navRect.left}px`,
      width: `${targetRect.width}px`,
    })
  }, [])

  useLayoutEffect(() => {
    moveIndicator(activeIndex)
  }, [activeIndex, moveIndicator])

  useLayoutEffect(() => {
    window.addEventListener('resize', () => moveIndicator(activeIndex))
    return () => window.removeEventListener('resize', () => moveIndicator(activeIndex))
  }, [activeIndex, moveIndicator])

  const handleNavClick = (index, item) => {
    setActiveIndex(index)
    onNavigate?.(item.toLowerCase().replace(/\s+/g, '-'))
  }

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen)
    if (!searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log('Searching:', searchQuery)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <header className="top-header">
      <div className="top-header-inner">
        <a className="brand" href="#beranda" aria-label="BPMP Lampung">
          <img src={mainLogo} alt="Kemendikdasmen BPMP Lampung" className="brand-logo-img" />
        </a>

        <div className="header-actions">
          <button 
            className="btn-search" 
            onClick={handleSearchToggle}
            aria-label="Cari"
            aria-expanded={searchOpen}
          >
            <img src={searchIcon} alt="Search" />
          </button>
          <button className="btn-tts" aria-label="Tulisan Ke Suara">
            <img src={ttsIcon} alt="Tulisan Ke Suara" />
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="search-modal">
          <form className="search-form" onSubmit={handleSearchSubmit}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari informasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-submit">Cari</button>
          </form>
        </div>
      )}

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
                  onClick={() => handleNavClick(index, item)}
                  aria-label={`Menu ${item}`}
                >
                  {item}
                </button>
                {index < menuItems.length - 1 && <span className="nav-divider" aria-hidden="true" />}
              </div>
            ))}
          </div>
        </div>
      </nav>
    </header>
  )
}