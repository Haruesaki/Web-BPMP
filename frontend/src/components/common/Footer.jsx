import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="visitor-counter-wrapper">
        <div className="visitor-counter-box">
          <i className="fa-solid fa-user visitor-icon"></i>
          <span className="visitor-text">Total Jumlah Pengunjung : 107030</span>
        </div>
      </div>

      <div className="footer-content-area">
        <div className="footer-grid">
          <div className="footer-col">
            <h4 className="footer-col-title">Hubungi Kami</h4>
            <p className="footer-text">Gatot Subroto 44 A Pahoman, Enggal, Kota</p>
            <p className="footer-text">Bandar Lampung</p>
            <p className="footer-text">WhatsApp: 08982969696</p>
            <p className="footer-text">Posel: bpmplampung@kemendikdasmen.go.id</p>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Tautan</h4>
            <a href="#" className="footer-link">Kemendikdasmen</a>
            <a href="#" className="footer-link">Dapodik</a>
            <a href="#" className="footer-link">Sekolah Kita</a>
            <a href="#" className="footer-link">Rumah Pendidikan</a>
            <a href="#" className="footer-link">Rapor Pendidikan</a>
            <a href="#" className="footer-link">Portal Data Pendidikan</a>
            <a href="#" className="footer-link">SPAB Kemendikdasmen</a>
          </div>

          <div className="footer-col">
            <h4 className="footer-col-title">Navigasi</h4>
            <div className="footer-map-wrapper">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3971.9546059286815!2d105.26875931476536!3d-5.424564996065545!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e40db0008b8b40d%3A0xc665bb2c73041077!2sBPMP%20Provinsi%20Lampung!5e0!3m2!1sen!2sid!4v1700000000000!5m2!1sen!2sid"
                width="100%"
                height="140"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
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
