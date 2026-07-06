// src/hooks/useHoverToSpeak.js
import { useEffect, useRef } from "react";
import { useTTS } from "../context/TTSContext";

const HOVER_DELAY_MS = 400; // delay supaya tidak langsung baca tiap gerakan mouse
const READABLE_TAGS = ["P", "H1", "H2", "H3", "H4", "H5", "H6", "A", "BUTTON", "LI", "SPAN", "LABEL"];

/**
 * Pasang sekali di root App (misal di App.jsx), aktif untuk SELURUH halaman.
 * Tidak perlu membungkus tiap elemen satu-satu.
 */
export function useHoverToSpeak() {
  const { isActive, speakText, stopSpeaking, clearLastSpoken } = useTTS();
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    function getReadableElement(el) {
      // Cari elemen ber-teks terdekat, hindari membaca seluruh parent besar (misal <div> pembungkus)
      while (el && el !== document.body) {
        if (READABLE_TAGS.includes(el.tagName)) {
          const text = el.getAttribute("aria-label") || el.innerText;
          if (text && text.trim().length > 0) return { text, element: el };
        }
        el = el.parentElement;
      }
      return null;
    }

    function handleMouseOver(e) {
      clearTimeout(timeoutRef.current);
      const target = e.target;

      timeoutRef.current = setTimeout(() => {
        const result = getReadableElement(target);
        if (result) {
          speakText(result.text, result.element);
        } else {
          clearLastSpoken();
        }
      }, HOVER_DELAY_MS);
    }

    function handleMouseOut() {
      clearTimeout(timeoutRef.current);
    }

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
      clearTimeout(timeoutRef.current);
    };
  }, [isActive, speakText, clearLastSpoken]);

  // Saat TTS dimatikan, pastikan suara yang sedang jalan langsung berhenti
  useEffect(() => {
    if (!isActive) stopSpeaking();
  }, [isActive, stopSpeaking]);
}
