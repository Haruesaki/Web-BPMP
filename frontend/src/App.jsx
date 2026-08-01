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

    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -12 * t)),
      smoothWheel: true,
      // Lenis 1.3 mengganti opsi lama `smoothTouch` menjadi `syncTouch`. Nama
      // lama diabaikan diam-diam sehingga smooth scroll TIDAK aktif di perangkat
      // sentuh (mobile/tablet). `syncTouch` mengaktifkan smoothing untuk touch.
      // `syncTouchLerp` sengaja lebih tinggi dari lerp wheel agar terasa responsif
      // (dekat gerakan jari) dan tidak "melayang" — mengurangi risiko scroll
      // terasa aneh/terkunci di HP.
      syncTouch: true,
      syncTouchLerp: 0.1,
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