import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import Beranda from "./pages/Beranda/Beranda";
import { useHoverToSpeak } from "./hooks/useHoverToSpeak";

function App() {
  useHoverToSpeak();
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

  return <Beranda lenisRef={lenisRef} />;
}

export default App;