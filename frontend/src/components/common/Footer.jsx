import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import './Footer.css';

const Footer = () => {
  const [contactInfo, setContactInfo] = useState(null);
  const [tautanLinks, setTautanLinks] = useState([]);

  useEffect(() => {
    const fetchFooter = async () => {
      try {
        const [footerRes, tautanRes] = await Promise.all([
          axiosInstance.get('/api/beranda/footer'),
          axiosInstance.get('/api/beranda/tautan-footer')
        ]);
        
        if (footerRes.data?.success) {
          setContactInfo(footerRes.data.data);
        }
        if (tautanRes.data?.success) {
          setTautanLinks(tautanRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch footer info:', err);
      }
    };
    fetchFooter();
  }, []);
  return (
    <footer className="main-footer">
      <div className="footer-content-area">
        <div className="footer-grid">
          <div className="footer-col">
            <h4 className="footer-col-title">Hubungi Kami</h4>
            {contactInfo ? (
              <>
                {(contactInfo.alamat || 'Gatot Subroto 44 A Pahoman, Enggal, Kota\nBandar Lampung').split('\n').map((line, idx) => (
                  <p key={idx} className="footer-text">
                    {idx === 0 ? `Alamat: ${line}` : line}
                  </p>
                ))}
                <p className="footer-text">WhatsApp: {contactInfo.no_telepon || '08982969696'}</p>
                <p className="footer-text">Email: {contactInfo.posel || 'bpmplampung@kemendikdasmen.go.id'}</p>
              </>
            ) : (
              <>
                <p className="footer-text">Alamat: Gatot Subroto 44 A Pahoman, Enggal, Kota</p>
                <p className="footer-text">Bandar Lampung</p>
                <p className="footer-text">WhatsApp: 08982969696</p>
                <p className="footer-text">Email: bpmplampung@kemendikdasmen.go.id</p>
              </>
            )}
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Tautan</h4>
            {tautanLinks.length > 0 ? (
              tautanLinks.map((linkItem, idx) => (
                <a key={idx} href={linkItem.url} className="footer-link" target="_blank" rel="noopener noreferrer">
                  {linkItem.label}
                </a>
              ))
            ) : (
              <>
                <a href="#" className="footer-link">Kemendikdasmen</a>
                <a href="#" className="footer-link">Dapodik</a>
                <a href="#" className="footer-link">Sekolah Kita</a>
                <a href="#" className="footer-link">Rumah Pendidikan</a>
                <a href="#" className="footer-link">Rapor Pendidikan</a>
                <a href="#" className="footer-link">Portal Data Pendidikan</a>
                <a href="#" className="footer-link">SPAB Kemendikdasmen</a>
              </>
            )}
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Navigasi</h4>
            <div className="footer-map-wrapper">
              <iframe
                src={contactInfo?.url_google_map || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3971.9088032690074!2d105.27287497439964!3d-5.430822354200016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e40dbc8d708c65d%3A0x1830f3cb58f92593!2sBPMP%20Lampung!5e0!3m2!1sen!2sid!4v1782974751659!5m2!1sen!2sid"}
                width="100%"
                height="180"
                className="footer-map-iframe"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Peta Lokasi BPMP Lampung"
              ></iframe>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p>© 2026 BPMP Lampung</p>
      </div>
    </footer>
  );
};

export default Footer;
