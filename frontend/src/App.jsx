import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { BrowserRouter, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { diDalamAdmin } from './config/jalurAdmin';

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

const LenisProvider = () => {
  const location = useLocation();
  // Menentukan apakah Lenis (gulir halus) dimatikan. Panel admin memakai gulir
  // bawaan peramban. `diDalamAdmin` dipakai, bukan `startsWith` apa adanya,
  // supaya alamat yang hanya BERAWALAN sama tidak ikut terhitung panel.
  const isAdmin = diDalamAdmin(location.pathname);
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
    window.lenis = lenis; // Mendaftarkan ke objek global window agar komponen anak dapat memanggil auto-scroll

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
      window.lenis = null; // Bersihkan variabel global window.lenis saat unmount
      cleanupLenis();
    };
  }, [isAdmin, location.pathname]);

  // Selalu mulai dari paling atas setiap kali pindah rute halaman baru (dan saat
  // pertama dimuat). Tanpa ini, SPA mempertahankan posisi scroll halaman sebelumnya.
  // Untuk rute dengan hash, kita tetap mereset ke atas terlebih dahulu agar tidak
  // melorot ke footer akibat konten dinamis lambat termuat; gulir ke elemen target
  // akan ditangani secara terarah oleh komponen tujuan setelah konten selesai dirender.
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

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