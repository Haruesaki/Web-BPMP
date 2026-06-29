import { useState } from 'react'
import './Berita.css'

import berita1 from '../assets/source/Preveiw-berita (1).png'
import berita2 from '../assets/source/Preveiw-berita (2).jpg'
import berita3 from '../assets/source/Preveiw-berita (3).jpg'

const beritaUtama = {
  image: berita1,
  title: 'Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja dan Kualitas Layanan',
  date: '15 Juni 2026'
}

const beritaThumbnail = [
  { image: berita2, title: 'BPMP Lampung Gelar Workshop Penjaminan Mutu Pendidikan' },
  { image: berita3, title: 'Kolaborasi Strategis untuk Peningkatan Kualitas Pendidikan' }
]

const beritaList = [
  {
    id: 1,
    badge: 'Berita',
    title: 'Awali Pekan dengan Semangat Melayani, BPMP Lampung Perkuat Budaya Kerja',
    date: '15 Juni 2026',
    active: true
  },
  {
    id: 2,
    badge: 'Pengumuman',
    title: 'Jadwal Pelayanan Publik BPMP Lampung Bulan Juli 2026',
    date: '12 Juni 2026'
  },
  {
    id: 3,
    badge: 'Kegiatan',
    title: 'Workshop Implementasi Kurikulum Merdeka di Provinsi Lampung',
    date: '10 Juni 2026'
  },
  {
    id: 4,
    badge: 'Berita',
    title: 'BPMP Lampung Luncurkan Program Pendampingan Sekolah Penggerak',
    date: '8 Juni 2026'
  }
]

const totalPages = 12

export default function Berita() {
  const [currentPage, setCurrentPage] = useState(1)
  const [activeNews, setActiveNews] = useState(1)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getPaginationRange = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []
    
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }
    
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }
    
    rangeWithDots.push(...range)
    
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }
    
    return rangeWithDots
  }

  return (
    <section className="berita-section" id="berita">
      <div className="berita-container">
        <h2 className="section-title">BERITA</h2>
        <div className="berita-content">
          <div className="berita-left">
            <div className="berita-main">
              <img src={beritaUtama.image} alt={beritaUtama.title} className="berita-main-img" />
              <div className="berita-overlay">
                <p>{beritaUtama.title}</p>
                <span className="berita-date">{beritaUtama.date}</span>
              </div>
            </div>
            <div className="berita-thumbs">
              {beritaThumbnail.map((item, index) => (
                <div className="thumb-wrapper" key={index}>
                  <img src={item.image} alt={item.title} />
                  <div className="thumb-overlay">
                    <p>{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="berita-right">
            <h3 className="info-terkini-title">INFORMASI TERKINI</h3>
            <div className="news-list">
              {beritaList.map((item) => (
                <div 
                  key={item.id}
                  className={`news-item ${activeNews === item.id ? 'is-active' : ''}`}
                  onClick={() => setActiveNews(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveNews(item.id)}
                >
                  <div className="news-line"></div>
                  <div className="news-content">
                    <span className={`news-badge badge-${item.badge.toLowerCase()}`}>{item.badge}</span>
                    <h4>{item.title}</h4>
                    <span className="news-date">
                      {item.date} 
                      <span className="time-icon"> 🕒</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pagination">
              <button 
                className="page-nav" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Halaman sebelumnya"
              >
                ‹
              </button>
              
              {getPaginationRange().map((item, index) => (
                item === '...' ? (
                  <span key={`dots-${index}`} className="page-dots">...</span>
                ) : (
                  <button
                    key={item}
                    className={`page-num ${currentPage === item ? 'active' : ''}`}
                    onClick={() => handlePageChange(item)}
                    aria-label={`Halaman ${item}`}
                    aria-current={currentPage === item ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              ))}
              
              <button 
                className="page-nav" 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Halaman selanjutnya"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
