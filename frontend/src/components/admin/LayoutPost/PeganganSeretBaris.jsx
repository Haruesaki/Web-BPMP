import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

// =========================================================================
//  LAJUR PEGANGAN SERET — di LUAR tabel, bukan bagian darinya
//  -----------------------------------------------------------------------
//  MENGAPA TIDAK DITARUH DI DALAM SEL SAJA
//  Percobaan pertama memasang pegangan di dalam sel "No." dengan posisi mutlak
//  menjorok ke kiri, dan ruangnya disediakan lewat `padding-left` pada wadah
//  gulir. Cara itu SALAH pada dua hal sekaligus:
//
//    1. Padding menggeser seluruh tabel ke kanan — tabelnya tidak lagi diam di
//       tempatnya.
//    2. Padding itu ikut terhitung sebagai lebar isi wadah gulir, sehingga
//       melampaui ambang `min-width: 1104px` milik tabel dan memunculkan
//       BILAH GULIR MENDATAR yang sebelumnya tidak ada.
//
//  Dan tetap tidak mencapai tujuannya: pegangan masih berada di dalam
//  `.bc-table-scroll` (overflow-x: auto) dan `.bc-table-card` (overflow:
//  hidden), jadi ia tetap terpotong di tepi kartu — masih "bagian dari tabel".
//
//  CARA YANG DIPAKAI SEKARANG
//  Pegangan dipindahkan keluar sepenuhnya: sebuah lajur berposisi mutlak yang
//  menjadi SAUDARA kartu tabel, bukan keturunannya. Dengan begitu tidak ada
//  satu pun pemotong luapan di antaranya, dan geometri tabel sama sekali tidak
//  tersentuh — tabelnya tetap persis di tempat dan selebar semula.
//
//  Ongkosnya: posisi tegak tiap pegangan tidak lagi diwariskan barisnya,
//  sehingga harus DIUKUR — beserta satu koreksi zoom yang dijelaskan di dalam.
// =========================================================================

const PeganganSeretBaris = ({ bungkusRef, kunciUkur, aktif, idDiseret, padaTekan, judulPer = {} }) => {
  const [titik, setTitik] = useState([]);

  // Bergantung hanya pada objek ref yang jati dirinya tetap, jadi `ukur` sendiri
  // stabil lintas render dan aman dipakai langsung sebagai panggil-balik
  // pengamat — tanpa perlu disimpan di ref lagi.
  const ukur = useCallback(() => {
    const bungkus = bungkusRef.current;
    if (!bungkus) return;

    const kotak = bungkus.getBoundingClientRect();

    // `.bc-content` memasang `zoom: 1.2`, dan getBoundingClientRect
    // MEMPERHITUNGKAN zoom itu sedangkan properti `top` yang kita tulis kembali
    // ditafsirkan di dalam ruang yang SUDAH ter-zoom. Menuliskan hasil ukur apa
    // adanya membuat tiap pegangan meleset sebesar faktor zoomnya — terukur
    // sampai 19px pada tabel ini.
    //
    // Faktornya diturunkan dari perbandingan tinggi ter-zoom terhadap tinggi
    // tata letak, bukan dari angka 1.2 yang ditulis tangan: nilai di berkas gaya
    // dapat berubah, dan pembagi yang usang jauh lebih sukar dilacak daripada
    // pembagi yang menghitung dirinya sendiri.
    const skala = bungkus.offsetHeight > 0 ? kotak.height / bungkus.offsetHeight : 1;
    const pembagi = skala > 0 ? skala : 1;

    const baris = [...bungkus.querySelectorAll('tbody tr[data-seret-id]')];
    const baru = baris.map((tr) => {
      const k = tr.getBoundingClientRect();
      return {
        id: tr.getAttribute('data-seret-id'),
        y: (k.top - kotak.top + k.height / 2) / pembagi,
      };
    });

    // Hanya disetel bila benar-benar berubah. Efek di bawah berjalan sesudah
    // SETIAP render; tanpa penjaga ini setiap pengukuran memicu render baru
    // yang memicu pengukuran lagi — gelung tanpa akhir.
    setTitik((lama) => {
      if (lama.length === baru.length && lama.every((t, i) => t.id === baru[i].id && Math.abs(t.y - baru[i].y) < 0.5)) {
        return lama;
      }
      return baru;
    });
  }, [bungkusRef]);

  // Diukur SESUDAH tata letak selesai tetapi SEBELUM peramban melukis, supaya
  // pegangan tidak sempat terlihat di posisi yang salah.
  useLayoutEffect(() => { ukur(); });

  // Tinggi baris berubah oleh hal-hal di luar render React: judul yang
  // membungkus saat jendela menyempit, gambar sampul yang baru selesai dimuat,
  // atau huruf yang baru tiba. ResizeObserver menangkap semuanya.
  useEffect(() => {
    const bungkus = bungkusRef.current;
    if (!bungkus) return undefined;

    const pengamat = new ResizeObserver(ukur);
    pengamat.observe(bungkus);
    bungkus.querySelectorAll('tbody tr[data-seret-id]').forEach((tr) => pengamat.observe(tr));

    window.addEventListener('resize', ukur);
    return () => {
      pengamat.disconnect();
      window.removeEventListener('resize', ukur);
    };
  }, [bungkusRef, kunciUkur, ukur]);

  if (titik.length === 0) return null;

  return (
    <div className="bc-lajur-pegangan" aria-hidden={!aktif}>
      {titik.map(({ id, y }) => (
        <button
          key={id}
          type="button"
          className={`bc-seret-pegangan${idDiseret === String(id) ? ' bc-seret-pegangan--aktif' : ''}`}
          style={{ top: `${y}px` }}
          title={aktif ? 'Seret untuk mengubah urutan' : 'Kosongkan pencarian untuk mengubah urutan'}
          aria-label={`Ubah urutan: ${judulPer[id] || id}`}
          disabled={!aktif}
          onPointerDown={(e) => padaTekan(e, id)}
          // Seretan sudah ditangani peristiwa pointer. Melepas pointer di akhir
          // tetap membangkitkan `click`, dan tanpa penahan ini tombolnya ikut
          // terhitung "ditekan".
          onClick={(e) => e.preventDefault()}
        >
          <i className="fa-solid fa-grip-vertical" aria-hidden="true"></i>
        </button>
      ))}
    </div>
  );
};

export default PeganganSeretBaris;
