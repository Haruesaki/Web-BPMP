import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { themeVarsFromColors } from '../utils/berandaThemes';

// Kunci cache dibagi dengan skrip inline di index.html yang menerapkan tema
// sebelum paint pertama (anti-flash). Nilai yang disimpan sudah berupa objek
// CSS variable siap-pakai, jadi skrip inline tak perlu tahu logika preset.
const CACHE_KEY = 'beranda-theme-vars';

const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch (e) {
    return undefined;
  }
};

// Mengambil tema aktif untuk halaman pengunjung dan mengembalikannya sebagai
// objek CSS variable (langsung dipakai sebagai style pada wrapper Layout).
export const useTema = () => {
  // Seed dari cache agar render pertama SUDAH bertema — mencegah kedipan ke
  // warna default sambil menunggu response API.
  const [themeVars, setThemeVars] = useState(readCache);

  useEffect(() => {
    let isMounted = true;

    axiosInstance
      .get('/api/beranda/tema')
      .then((res) => {
        if (!isMounted || !res.data?.success) return;
        const nextVars = themeVarsFromColors(res.data.data);
        setThemeVars(nextVars);
        // Segarkan cache untuk refresh berikutnya (dipakai skrip inline).
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(nextVars || {}));
        } catch (e) {
          /* localStorage penuh/diblokir — abaikan, tema tetap jalan via state */
        }
      })
      .catch((err) => console.error('Gagal memuat tema beranda:', err));

    return () => {
      isMounted = false;
    };
  }, []);

  return themeVars;
};
