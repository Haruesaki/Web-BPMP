import { useLayoutEffect, useRef } from 'react';
import { ukurBaris } from '../utils/ukurBaris';

// =========================================================================
//  ANIMASI PERGESERAN BARIS (teknik FLIP)
//  -----------------------------------------------------------------------
//  MASALAHNYA
//  Ketika urutan berubah, React menyusun ulang simpul <tr> di dalam DOM.
//  Peramban langsung melukisnya di tempat yang baru — barisnya BERPINDAH
//  SEKETIKA, tanpa peralihan apa pun. Mata sukar mengikuti apa yang barusan
//  terjadi, dan seretan terasa patah-patah.
//
//  CSS `transition` saja TIDAK dapat menolong di sini: yang berubah bukan
//  nilai propertinya, melainkan kedudukan simpulnya di dalam pohon DOM.
//  Tidak ada properti yang beralih, jadi tidak ada yang dapat dianimasikan.
//
//  CARANYA
//  FLIP — First, Last, Invert, Play:
//    First  : posisi tiap baris SEBELUM perubahan sudah dicatat (render lalu).
//    Last   : posisi barunya diukur sesudah DOM disusun ulang.
//    Invert : tiap baris digeser balik ke posisi lamanya dengan `transform`,
//             tanpa transisi — bagi mata, tak ada yang bergerak.
//    Play   : transisi dinyalakan lalu transform dilepas, sehingga barisnya
//             meluncur dari posisi lama ke posisi barunya.
//
//  Seluruhnya berjalan di `useLayoutEffect`, yaitu SESUDAH tata letak selesai
//  tetapi SEBELUM peramban melukis. Bila dijalankan di `useEffect`, peramban
//  sempat melukis posisi barunya lebih dahulu dan penonton melihat kedipan.
//
//  Ukurannya diambil dari utils/ukurBaris — ruang tata letak yang belum
//  ter-zoom, dan kebal terhadap transform yang justru dipasang berkas ini
//  sendiri. Memakai getBoundingClientRect di sini akan mengukur baris yang
//  sedang beranimasi, lalu menganimasikannya lagi dari angka yang salah.
// =========================================================================

const DURASI_MS = 190;

// Animasinya dipasang dari JavaScript, sehingga `@media (prefers-reduced-motion)`
// di berkas gaya tidak dapat menjangkaunya. Preferensinya dibaca sendiri di sini.
const gerakanDikurangi = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

export const useAnimasiUrutan = (wadahRef, aktif = true) => {
  const sebelumnya = useRef(new Map());

  useLayoutEffect(() => {
    const wadah = wadahRef.current;
    if (!wadah) return;

    const { baris, ada } = ukurBaris(wadah);
    if (!ada) {
      sebelumnya.current = new Map();
      return;
    }

    const sekarang = new Map(baris.map((b) => [b.id, b.atas]));

    if (aktif && sebelumnya.current.size > 0 && !gerakanDikurangi()) {
      baris.forEach(({ id, simpul, atas }) => {
        const lama = sebelumnya.current.get(id);
        if (lama === undefined) return;
        const selisih = lama - atas;
        // Di bawah satu piksel tidak ada yang perlu dianimasikan, dan
        // memaksakannya hanya menimbulkan getaran.
        if (Math.abs(selisih) < 1) return;

        simpul.style.transition = 'none';
        simpul.style.transform = `translateY(${selisih}px)`;
      });

      // Memaksa peramban menghitung tata letak SEKARANG, selagi transform
      // pembalik masih terpasang. Tanpa paksaan ini peramban menggabungkan
      // pemasangan dan pelepasan transform menjadi satu perubahan, dan
      // animasinya tidak pernah terlihat sama sekali.
      void wadah.offsetHeight;

      baris.forEach(({ id, simpul }) => {
        const lama = sebelumnya.current.get(id);
        if (lama === undefined) return;
        simpul.style.transition = `transform ${DURASI_MS}ms cubic-bezier(0.2, 0, 0.2, 1)`;
        simpul.style.transform = '';

        // Membersihkan transition setelah animasi selesai (190ms).
        // Jika dibiarkan, `transition: transform` akan membuat baris tetap menjadi
        // composite layer (stacking context) permanen. Di Chrome, ini memutus
        // perenderan `border-collapse: collapse` sehingga garis pembatas tabel hilang.
        setTimeout(() => {
          simpul.style.transition = '';
        }, DURASI_MS);
      });
    }

    sebelumnya.current = sekarang;
  });
};

export default useAnimasiUrutan;
