import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

const LenisProvider = ({ children }) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const lenisRef = useRef(null);
  
  useEffect(() => {
    // Jika berada di admin panel, pastikan lenis bersih (tidak diinisialisasi)
    // dan pastikan tidak ada class lenis yang nyangkut di tag html/body.
    if (isAdmin) {
      document.documentElement.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped', 'lenis-scrolling');
      document.body.classList.remove('lenis', 'lenis-smooth', 'lenis-stopped', 'lenis-scrolling');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      return;
    }

    // Jika bukan admin (halaman publik), jalankan Lenis secara normal
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -12 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
      wheelMultiplier: 1,
      lerp: 0.06,
      infinite: false,
      autoResize: true,
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
      lenisRef.current = null;
    };
  }, [isAdmin]); // Efek ini akan re-run setiap kali status isAdmin berubah (masuk/keluar admin)

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