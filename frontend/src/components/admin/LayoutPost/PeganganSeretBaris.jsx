import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ukurBaris } from '../../../utils/ukurBaris';

// =========================================================================
//  LAJUR PEGANGAN SERET — menempel pada pita barisnya, bukan pada tabelnya
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
//  hidden), jadi ia tetap terpotong di tepi kartu.
//
//  CARA YANG DIPAKAI SEKARANG
//  Pegangan tetap berada DI LUAR tabel — sebuah lajur berposisi mutlak yang
//  menjadi saudara kartu tabel — sehingga geometri tabel sama sekali tidak
//  tersentuh. Yang berubah hanyalah TAMPILANNYA: tiap pegangan kini setinggi
//  barisnya sendiri, berlatar dan berbingkai sama dengan tabel, serta menempel
//  rapat pada tepi kiri kartu tanpa sela. Hasilnya terbaca sebagai satu pita
//  yang bersambung dengan barisnya.
//
//  Yang TIDAK ikut melebar: kepala tabel dan kaki tabel. Keduanya memang tidak
//  punya pegangan, jadi lebarnya tetap seperti semula — persis seperti yang
//  diminta.
//
//  Ongkosnya: posisi DAN tinggi tiap pegangan tidak diwariskan barisnya,
//  sehingga harus diukur. Pengukurannya dipusatkan di utils/ukurBaris supaya
//  angkanya tidak pernah berbeda dari yang dipakai penentuan sasaran seretan
//  maupun animasi pergeseran.
// =========================================================================

const PeganganSeretBaris = ({ bungkusRef, kunciUkur, aktif, idDiseret, padaTekan, judulPer = {} }) => {
  const [pita, setPita] = useState([]);

  // Bergantung hanya pada objek ref yang jati dirinya tetap, jadi `ukur` sendiri
  // stabil lintas render dan aman dipakai langsung sebagai panggil-balik
  // pengamat — tanpa perlu disimpan di ref lagi.
  const ukur = useCallback(() => {
    const { baris, ada } = ukurBaris(bungkusRef.current);
    const baru = ada ? baris.map(({ id, atas, tinggi }) => ({ id, atas, tinggi })) : [];

    // Hanya disetel bila benar-benar berubah. Efek di bawah berjalan sesudah
    // SETIAP render; tanpa penjaga ini setiap pengukuran memicu render baru
    // yang memicu pengukuran lagi — gelung tanpa akhir.
    setPita((lama) => {
      const sama =
        lama.length === baru.length &&
        lama.every((t, i) =>
          t.id === baru[i].id &&
          Math.abs(t.atas - baru[i].atas) < 0.5 &&
          Math.abs(t.tinggi - baru[i].tinggi) < 0.5);
      return sama ? lama : baru;
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

  if (pita.length === 0) return null;

  return (
    <div className="bc-lajur-pegangan" aria-hidden={!aktif}>
      {pita.map(({ id, atas, tinggi }) => (
        <button
          key={id}
          type="button"
          className={`bc-seret-pegangan${idDiseret === String(id) ? ' bc-seret-pegangan--aktif' : ''}`}
          style={{ top: `${atas}px`, height: `${tinggi}px` }}
          title={aktif ? 'Seret ke atas atau ke bawah untuk mengubah urutan' : 'Kosongkan pencarian untuk mengubah urutan'}
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
