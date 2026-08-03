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

    if (isAdmin) {
      cleanupLenis();
      return;
    }

    const rootEl = document.getElementById('root');

    const lenis = new Lenis({
      duration: 2.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -12 * t)),
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.042,
      touchInertiaExponent: 1.35,
      touchMultiplier: 0.65,
      wheelMultiplier: 1,
      lerp: 0.045,
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