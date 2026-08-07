import React, { useState, useEffect, useRef } from 'react';
import { useTTS } from "../../../../context/TTSContext";
import IconTextToSpeech from "../../../../assets/source/Ikon-TextToSpeech.png";
import styles from './TextToSpeechButton.module.css';

const TextToSpeechButton = () => {
  const { isActive, toggle } = useTTS();
  const [isTapped, setIsTapped] = useState(false);
  const tapTimeoutRef = useRef(null);

  const handleButtonClick = () => {
    toggle();
    
    // Deteksi jika perangkat menggunakan layar sentuh
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
    // Membersihkan timer saat komponen di-unmount untuk mencegah kebocoran memori
    return () => {
      if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    };
  }, []);

  // Gabungkan kelas dasar dengan kelas active dan hoverActive secara kondisional
  const buttonClassName = `${styles.btnVoice} ${isActive ? styles.active : ''} ${isTapped ? styles.hoverActive : ''}`;

  return (
    <button className={buttonClassName} aria-label={isActive ? "Matikan Suara" : "Tulisan Ke Suara"} onClick={handleButtonClick}>
      <span className={styles.voiceText}>{isActive ? "Suara Aktif" : "Tulisan Ke Suara"}</span>
      <img src={IconTextToSpeech} alt="Ikon Text to Speech" className={styles.voiceIcon} />
    </button>
  );
};

export default TextToSpeechButton;