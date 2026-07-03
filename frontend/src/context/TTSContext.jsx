// src/context/TTSContext.jsx
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

const TTSContext = createContext(null);

export function TTSProvider({ children }) {
  const [isActive, setIsActive] = useState(true);
  const lastSpokenRef = useRef(null); // hindari baca ulang elemen yang sama berkali-kali

  // Trigger load voices di awal dan bersihkan antrean suara nyangkut dari sesi/refresh sebelumnya
  useEffect(() => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.getVoices();
  }, []);



  const toggle = useCallback(() => {
    setIsActive((prev) => {
      const next = !prev;
      if (!next) {
        window.speechSynthesis.cancel(); // langsung bisu saat dimatikan
        lastSpokenRef.current = null;
      }
      return next;
    });
  }, []);

  const speakText = useCallback(
    (text, element) => {
      if (!isActive || !text) return;
      if (lastSpokenRef.current === element) return; // sudah dibacakan, skip

      window.speechSynthesis.cancel();
      lastSpokenRef.current = element;

      // 1. Membersihkan karakter spesial untuk diucapkan
      let cleanText = text
        .replace(/#/g, " tagar ")
        .replace(/@/g, " di ")
        .replace(/%/g, " persen ")
        .replace(/&/g, " dan ")
        .replace(/\*/g, " bintang ")
        .replace(/\+/g, " tambah ")
        .replace(/=/g, " sama dengan ");

      // 2. Logika Deteksi Bahasa (Indonesia & Inggris bercampur)
      const tokens = cleanText.match(/([a-zA-Z0-9]+|[^a-zA-Z0-9]+)/g) || [];

      const isEnglishWord = (w) => {
        const engPatterns = [/th[a-z]/i, /sh[a-z]/i, /[a-z]ly$/i, /[a-z]ing$/i, /[a-z]ed$/i, /[a-z]tion$/i, /[a-z]ment$/i, /ee/i, /oo/i, /ph[a-z]/i];
        const engCommon = ["web", "api", "text", "speech", "button", "voice", "user", "error", "search", "hover", "page", "default", "project", "dashboard", "update", "upload", "download", "online", "system", "file", "folder", "copy", "paste", "save", "delete", "edit", "view", "link", "click", "mouse", "keyboard", "screen", "monitor", "laptop", "computer", "server", "database", "network", "internet", "wifi", "bluetooth", "app", "application", "software", "hardware", "developer", "programmer", "code", "coding", "design", "layout", "template", "theme", "plugin", "extension", "browser", "chrome", "firefox", "safari", "edge", "windows", "mac", "linux", "android", "ios", "mobile", "desktop", "tablet", "smartphone", "device", "smart", "phone", "video", "audio", "image", "picture", "photo", "camera", "microphone", "speaker", "headset", "earphone", "music", "song", "play", "pause", "stop", "record", "live", "stream", "streaming", "chat", "message", "email", "mail", "inbox", "outbox", "sent", "draft", "spam", "trash", "contact", "profile", "setting", "account", "login", "logout", "register", "signup", "signin", "password", "username", "security", "privacy", "policy", "terms", "condition", "about", "home", "contact", "help", "faq", "support", "service", "product", "price", "pricing", "plan", "subscribe", "unsubscribe", "notification", "alert", "warning", "info", "success", "fail", "failed", "cancel", "confirm", "accept", "decline", "yes", "no", "ok", "submit", "send", "receive", "read", "write", "create", "read"];
        const cleanW = w.toLowerCase();
        if (engCommon.includes(cleanW)) return true;
        return engPatterns.some(p => p.test(cleanW));
      };

      const utterances = [];
      let currentLang = "id-ID";
      let currentPhrase = "";

      tokens.forEach(token => {
        const isWord = /[a-zA-Z0-9]/.test(token);
        if (!isWord) {
           currentPhrase += token; 
        } else {
           const wordLang = isEnglishWord(token) ? "en-US" : "id-ID";
           if (wordLang === currentLang) {
             currentPhrase += token;
           } else {
             if (currentPhrase.trim()) {
               utterances.push({ text: currentPhrase, lang: currentLang });
             }
             currentPhrase = token;
             currentLang = wordLang;
           }
        }
      });
      if (currentPhrase.trim()) {
        utterances.push({ text: currentPhrase, lang: currentLang });
      }

      // 3. Eksekusi pengucapan secara berurutan dengan pilihan suara wanita
      const voices = window.speechSynthesis.getVoices();
      
      const idFemaleVoice = voices.find(v => v.lang.startsWith("id") && (
        v.name.toLowerCase().includes("female") || 
        v.name.toLowerCase().includes("gadis") || 
        v.name.toLowerCase().includes("google") || 
        v.name.toLowerCase().includes("siti")
      )) || voices.find(v => v.lang.startsWith("id"));
      
      const enFemaleVoice = voices.find(v => v.lang.startsWith("en") && (
        v.name.toLowerCase().includes("female") || 
        v.name.toLowerCase().includes("zira") || 
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("google")
      )) || voices.find(v => v.lang.startsWith("en"));

      utterances.forEach((u, index) => {
        const utterance = new SpeechSynthesisUtterance(u.text);
        utterance.lang = u.lang;
        utterance.rate = 1;
        
        if (u.lang === "id-ID" && idFemaleVoice) {
           utterance.voice = idFemaleVoice;
        } else if (u.lang === "en-US" && enFemaleVoice) {
           utterance.voice = enFemaleVoice;
        }

        // Ketika bagian ucapan terakhir selesai, reset ref agar hover berikutnya bisa memicu ulang
        if (index === utterances.length - 1) {
          utterance.onend = () => {
            lastSpokenRef.current = null;
          };
        }
        
        window.speechSynthesis.resume(); // pastikan tidak paused
        window.speechSynthesis.speak(utterance);
      });
    },
    [isActive]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    lastSpokenRef.current = null;
  }, []);

  const clearLastSpoken = useCallback(() => {
    lastSpokenRef.current = null;
  }, []);

  return (
    <TTSContext.Provider value={{ isActive, toggle, speakText, stopSpeaking, clearLastSpoken }}>
      {children}
    </TTSContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTTS() {
  const ctx = useContext(TTSContext);
  if (!ctx) throw new Error("useTTS harus dipakai di dalam TTSProvider");
  return ctx;
}
