import React, { useState, useEffect, useRef } from "react";
import "./CardContent.css";
import MediaKosong from "../../../common/MediaKosong";

const CardContent = ({
  name = "Arif Ahmad Muzakky",
  role = "UI/UX Desain",
  quote = "“Programmer Full Stuck bukan Full Stack”",
  imageSrc = null,
  index = 0,
}) => {
  const [isTapped, setIsTapped] = useState(false);
  const tapTimeoutRef = useRef(null);

  const handleTap = () => {
    const isTouchScreen = window.matchMedia("(hover: none)").matches;
    if (isTouchScreen) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      
      setIsTapped(true);
      tapTimeoutRef.current = setTimeout(() => {
        setIsTapped(false);
      }, 1000);
    }
  };

  useEffect(() => {
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  return (
    <div 
      className={`card-profile ${isTapped ? "hover-active" : ""}`}
      style={{
        opacity: 0,
        animation: `fadeSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.1}s forwards`
      }}
      onClick={handleTap}
    >
      <div className="card-light-sweep"></div>

      <div className="profile-frame">
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt={`Profil ${name}`} 
            loading="lazy" 
            decoding="async" 
            width="170"
            height="170"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <MediaKosong fill label={`Foto profil ${name} belum tersedia`} />
        )}
      </div>

      <div className="card-text">
        <div className="name">
          <span>{name}</span>
        </div>
        <p className="role">{role}</p>
        <div className="card-divider"></div>
        <p className="quote">{quote}</p>
      </div>

      <div className="wave-shadow-wrapper">
        <div className="wave-content-container static-bg"></div>
      </div>

      <div className="liquid-bubble bubble-4"></div>
      <div className="liquid-bubble bubble-1"></div>
      <div className="liquid-bubble bubble-2"></div>
      <div className="liquid-bubble bubble-3"></div>
    </div>
  );
};

export default React.memo(CardContent);
