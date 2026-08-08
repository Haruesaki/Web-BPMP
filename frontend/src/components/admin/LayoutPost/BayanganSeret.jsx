import { createPortal } from 'react-dom';

// =========================================================================
//  BAYANGAN SERET — pratinjau isi konten yang mengikuti kursor
//  -----------------------------------------------------------------------
//  MENGAPA LEWAT PORTAL KE <body>, BUKAN DIRENDER DI TEMPAT
//
//  Kedudukannya diambil dari `clientX`/`clientY`, yakni piksel layar. Bila
//  bayangan ini dirender di dalam `.bc-content` — yang memasang `zoom: 1.2` —
//  maka nilai `left`/`top` yang kita tuliskan ditafsirkan dalam ruang yang
//  SUDAH ter-zoom, sehingga bayangannya melayang jauh dari kursor, makin jauh
//  makin ke kanan bawah. Itu jebakan yang sama yang dahulu membuat pegangan
//  titik-enam meleset 19px.
//
//  Dipindahkan ke <body> lewat portal, persoalannya hilang sama sekali:
//  <body> tidak ter-zoom, jadi piksel layar dan piksel tata letak sama persis.
//  Tidak perlu pembagi, tidak perlu koreksi.
//
//  `pointer-events: none` wajib: tanpa itu bayangan berada tepat di bawah
//  kursor dan menjadi sasaran `elementFromPoint`, sehingga menutupi baris yang
//  hendak dituju.
// =========================================================================

// Digeser sedikit dari ujung kursor supaya kursornya sendiri tetap terlihat.
const GESER_X = 14;
const GESER_Y = 10;

const BayanganSeret = ({ posisi, judul, urlGambar, nomor }) => {
  if (!posisi || !judul) return null;

  return createPortal(
    <div
      className="bc-bayangan-seret"
      style={{ transform: `translate3d(${posisi.x + GESER_X}px, ${posisi.y + GESER_Y}px, 0)` }}
      aria-hidden="true"
    >
      {nomor != null && <span className="bc-bayangan-nomor">{nomor}</span>}
      <span className="bc-bayangan-gambar">
        {urlGambar
          ? <img src={urlGambar} alt="" />
          : <i className="fa-regular fa-image" aria-hidden="true"></i>}
      </span>
      <span className="bc-bayangan-judul">{judul}</span>
      <i className="fa-solid fa-grip-vertical bc-bayangan-grip" aria-hidden="true"></i>
    </div>,
    document.body
  );
};

export default BayanganSeret;
