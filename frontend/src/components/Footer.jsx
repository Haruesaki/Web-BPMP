import { useEffect, useState } from 'react'
import './Footer.css'

const links = [
  'Kemendikdasmen',
  'Dapodik',
  'Sekolah Kita',
  'Rumah Pendidikan',
  'Rapor Pendidikan',
  'Portal Data Pendidikan',
  'SPAB Kemendikdasmen'
]

export default function Footer() {
  const [visitorCount, setVisitorCount] = useState(107030)

  // Simulate live visitor count increment
  useEffect(() => {
    const interval = setInterval(() => {
      setVisitorCount(prev => prev + Math.floor(Math.random() * 3))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num)
  }

  return (
    <footer className="site-footer" id="kontak">
      <div className="visitor-count-wrapper">
        <div className="visitor-count">
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
          <span>Total Jumlah Pengunjung: </span>
          <strong className="visitor-number">{formatNumber(visitorCount)}</strong>
        </div>
      </div>

      <div className="footer-links">
        <div className="footer-col">
          <h4>Hubungi Kami</h4>
          <div className="contact-info">
            <div className="contact-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#36c2ff">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <p>Gatot Subroto 44 A Pahoman, Enggal, Kota Bandar Lampung</p>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#36c2ff">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <p>08982969696</p>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#36c2ff">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <p>bpmplampung@kemdikdasmen.go.id</p>
            </div>
          </div>
        </div>
        
        <div className="footer-col">
          <h4>Tautan</h4>
          <ul>
            {links.map((link, index) => (
              <li key={index}>
                <a href="#" className="footer-link">{link}</a>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="footer-col">
          <h4>Lokasi</h4>
          <div className="map-placeholder">
            <iframe
              title="Lokasi BPMP Lampung"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3972.123456789!2d105.26789012345678!3d-5.123456789012345!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNcKwMDcnMjQuNCJTIDEwNcKwMTYnMDQuNCJF!5e0!3m2!1sen!2sid!4v1234567890123!5m2!1sen!2sid"
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} BPMP Lampung. Hak Cipta Dilindungi Undang-Undang.</span>
      </div>
    </footer>
  )
}
