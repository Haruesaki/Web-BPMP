import React from 'react';
import './FloatingSocialBar.css';

// --- IMPORT ASSETS ---
import Facebook from "../source/facebook.png";
import Instagram from "../source/instagram.png";
import Youtube from "../source/youtube.png";
import Social from "../source/social.png";

const FloatingSocialBar = () => {
  return (
    <aside className="floating-social-bar">
      <div className="glass-sidebar-bg">
        <div className="blur-shape shape-pertama"></div>
        <div className="blur-shape shape-kedua"></div>
        <div className="blur-shape shape-ketiga"></div>
      </div>

      <a href="#" className="social-icon" aria-label="Instagram">
        <span className="social-text">@bpmplampung</span>
        <img src={Instagram} alt="Instagram" />
      </a>
      <a href="#" className="social-icon" aria-label="YouTube">
        <span className="social-text">bpmplampung</span>
        <img src={Youtube} alt="YouTube" />
      </a>
      <a href="#" className="social-icon" aria-label="WhatsApp">
        <span className="social-text">62+895-462-763</span>
        <img src={Social} alt="WhatsApp" />
      </a>
      <a href="#" className="social-icon" aria-label="Facebook">
        <span className="social-text">bpmplampung</span>
        <img src={Facebook} alt="Facebook" />
      </a>
    </aside>
  );
};

export default FloatingSocialBar;