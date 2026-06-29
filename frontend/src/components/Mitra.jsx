import './Mitra.css'

import mitra1 from '../assets/source/Mitra (1).png'
import mitra2 from '../assets/source/Mitra (2).png'
import mitra3 from '../assets/source/Mitra (3).png'
import mitra4 from '../assets/source/Mitra (4).png'
import mitra5 from '../assets/source/Mitra (5).png'

const mitraLogos = [
  { src: mitra4, alt: 'Bangga Melayani Bangsa' },
  { src: mitra1, alt: 'Sehat Tanpa Korupsi' },
  { src: mitra3, alt: 'Rumah Pendidikan' },
  { src: mitra2, alt: 'BerAKHLAK' },
]

export default function Mitra() {
  return (
    <section className="mitra-banner" id="mitra">
      <div className="mitra-container">
        <div className="mitra-track">
          <div className="friendly-mark-blue">
            <span>KEMENDIKDASMEN</span>
            <strong>RAMAH</strong>
          </div>
          {mitraLogos.map((mitra, index) => (
            <img 
              key={index} 
              src={mitra.src} 
              alt={mitra.alt}
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
