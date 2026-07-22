import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import './FloatingSocialBar.css';

const FloatingSocialBar = () => {
  const [socials, setSocials] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchSocials = async () => {
      try {
        const res = await axiosInstance.get('/api/beranda/media-sosial');
        if (isMounted && res.data?.success) {
          setSocials(res.data.data);
        }
      } catch (error) {
        console.error('Gagal mengambil data floating media sosial:', error);
      }
    };

    fetchSocials();

    return () => {
      isMounted = false;
    };
  }, []);

  if (socials.length === 0) return null;

  return (
    <aside className="floating-social-bar">
      <div className="glass-sidebar-bg">
        <div className="blur-shape shape-pertama"></div>
        <div className="blur-shape shape-kedua"></div>
        <div className="blur-shape shape-ketiga"></div>
      </div>

      {socials.map((social) => (
        <a 
          key={social.id} 
          href={social.url_tautan || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="social-icon" 
          aria-label={social.platform}
        >
          <span className="social-text">{social.platform}</span>
          {social.url_logo ? (
            <img src={social.url_logo} alt={social.platform} />
          ) : (
            <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}>
              <i className="fa-solid fa-link"></i>
            </div>
          )}
        </a>
      ))}
    </aside>
  );
};

export default FloatingSocialBar;
