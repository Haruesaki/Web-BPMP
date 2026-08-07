import React, { useState, useEffect, useRef } from "react";
import "./CardContent.css";
import MediaKosong from "../../../common/MediaKosong";

const CardContent = ({
  name = "Arif Ahmad Muzakky",
  role = "UI/UX Desain",
  quote = "“Programmer Full Stuck bukan Full Stack”",
  imageSrc = null,
}) => {
  const [isTapped, setIsTapped] = useState(false);
  const tapTimeoutRef = useRef(null);

  const handleTap = () => {
    // Deteksi jika perangkat menggunakan layar sentuh
    const isTouchScreen = window.matchMedia("(hover: none)").matches;
    if (isTouchScreen) {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
      
      setIsTapped(true);
      // Matikan status tap setelah 1000ms agar posisi hover kembali normal
      tapTimeoutRef.current = setTimeout(() => {
        setIsTapped(false);
      }, 1000);
    }
  };

  useEffect(() => {
    // Membersihkan timer saat komponen di-unmount untuk mencegah kebocoran memori
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  return (
    <div 
      className={`card-profile ${isTapped ? "hover-active" : ""}`}
      onClick={handleTap}
    >
      {/* Elemen baru untuk efek kilau saat hover */}
      <div className="card-light-sweep"></div>

      <div className="profile-frame">
        {imageSrc ? (
          <img src={imageSrc} alt={`Profil ${name}`} loading="lazy" decoding="async" />
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
        {/* Latar belakang solid dengan efek gelombang dari mask-image */}
        <div className="wave-content-container">
          <div className="liquid-bubble bubble-1"></div>
          <div className="liquid-bubble bubble-2"></div>
          <div className="liquid-bubble bubble-3"></div>
          <div className="stars-layer-1"></div>
          <div className="stars-layer-2"></div>
        </div>
      </div>
    </div>
  );
};

export default CardContent;
