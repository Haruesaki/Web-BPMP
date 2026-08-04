import React from 'react';
import { useTTS } from "../../../../context/TTSContext";
import IconTextToSpeech from "../../../../assets/source/Ikon-TextToSpeech.png";
import styles from './TextToSpeechButton.module.css';

const TextToSpeechButton = () => {
  const { isActive, toggle } = useTTS();

  // Gabungkan kelas dasar dengan kelas 'active' secara kondisional
  const buttonClassName = `${styles.btnVoice} ${isActive ? styles.active : ''}`;

  return (
    <button className={buttonClassName} aria-label={isActive ? "Matikan Suara" : "Tulisan Ke Suara"} onClick={toggle}>
      <span className={styles.voiceText}>{isActive ? "Suara Aktif" : "Tulisan Ke Suara"}</span>
      <img src={IconTextToSpeech} alt="Ikon Text to Speech" className={styles.voiceIcon} />
    </button>
  );
};

export default TextToSpeechButton;