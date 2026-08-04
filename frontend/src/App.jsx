import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

const LENIS_CLASSES = ['lenis', 'lenis-smooth', 'lenis-stopped', 'lenis-scrolling'];

const LenisProvider = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const lenisRef = useRef(null);
  
  useEffect(() => {


    const cleanupLenis = () => {
      document.documentElement.classList.remove(...LENIS_CLASSES);
      document.body.classList.remove(...LENIS_CLASSES);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };

    // Deteksi Layar Sentuh secara universal
    const isTouchDevice = 
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.matchMedia('(pointer: coarse)').matches;

    // Jika admin atau perangkat layar sentuh, matikan Lenis
    if (isAdmin || isTouchDevice) {
      cleanupLenis();
      return;
    }

    const lenis = new Lenis({
      duration: 1.2, // Default industri
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Default industri
      smoothWheel: true,
      syncTouch: false, // Layar sentuh menggunakan native scroll
      lerp: 0.1, // Default industri
      infinite: false,
      autoResize: true,
      prevent: (node) => node.hasAttribute('data-lenis-prevent'),
    });

    lenisRef.current = lenis;

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      cleanupLenis();
    };
  }, [isAdmin, location.pathname]);

  // Kita berikan lenisRef sebagai cloneElement prop jika dibutuhkan oleh children
  // (misalnya untuk Navbar), atau karena AppRoutes menerima lenisRef
  return <AppRoutes lenisRef={lenisRef} />;
};

function App() {
  return (
    <BrowserRouter>
      <LenisProvider />
    </BrowserRouter>
  );
}

export default App;