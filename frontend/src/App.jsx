import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

const LENIS_CLASSES = ['lenis', 'lenis-smooth', 'lenis-stopped', 'lenis-scrolling'];

// Matikan restorasi scroll otomatis peramban (default 'auto'). Tanpa ini, saat
// REFRESH peramban mengembalikan posisi scroll terakhir sebelum refresh — dan
// karena konten dimuat asinkron serta scroll dikelola Lenis, posisinya sering
// meleset "agak ke bawah". Dengan 'manual', refresh selalu mulai dari atas dan
// posisi diatur sepenuhnya oleh aplikasi. Dijalankan di ruang modul agar aktif
// sedini mungkin, sebelum React sempat merender.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

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
    const isMobile = window.innerWidth <= 1024;

    const lenis = new Lenis({
      ...(isMobile && rootEl ? { wrapper: rootEl, content: rootEl.firstElementChild || rootEl } : {}),
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
      lenisRef.current = null;
      cleanupLenis();
    };
  }, [isAdmin, location.pathname]);

  // Selalu mulai dari paling atas setiap kali pindah halaman (dan saat pertama
  // dimuat). Tanpa ini, SPA mempertahankan posisi scroll halaman sebelumnya.
  // Rute dengan hash (#section) sengaja dilewati agar lompatan ke anchor tetap
  // berfungsi. Efek ini diletakkan SETELAH efek Lenis agar `lenisRef.current`
  // sudah menunjuk instance Lenis yang baru saat dipanggil.
  useEffect(() => {
    if (location.hash) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

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