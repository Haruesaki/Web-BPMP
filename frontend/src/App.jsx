import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import Beranda from "./pages/Beranda/Beranda";
import DashboardAdmin from "./pages/Admin/dashboard-admin";
import Login from "./pages/Admin/Login";
import LupaPassword from "./pages/Admin/LupaPassword";

function App() {
  const lenisRef = useRef(null);

  useEffect(() => {
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

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Beranda lenisRef={lenisRef} />} />
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin/lupa-password" element={<LupaPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;