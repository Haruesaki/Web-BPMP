import { useState } from 'react';
import { klasifikasiRasio } from '../../../../utils/rasioGambar';

// =========================================================================
//  GAMBAR ISI KONTEN (sisi pengunjung)
//  -----------------------------------------------------------------------
//  Dipakai halaman menu/submenu (DefaultContent) dan halaman berita
//  (BeritaDetail). Sebelumnya komponen ini disalin utuh ke keduanya beserta
//  fungsi klasifikasi rasionya — dan salinan itu sudah pernah menyimpang satu
//  sama lain. Disatukan di sini agar perbaikan berikutnya cukup sekali.
//
//  MENGAPA RASIO DIUKUR DI JAVASCRIPT
//  ----------------------------------
//  CSS tidak dapat memilih aturan berdasarkan rasio ISI sebuah gambar; ia hanya
//  mengenal rasio KOTAKNYA. Padahal yang menentukan nyaman-tidaknya tampilan
//  justru rasio berkasnya. Maka ukurannya dibaca dari naturalWidth/
//  naturalHeight, lalu dituangkan menjadi kelas varian yang bisa dipegang CSS.
//
//  Ref callback diperlukan di samping onLoad: gambar yang sudah ada di singgahan
//  peramban acap kali sudah `complete` sebelum React sempat memasang onLoad,
//  sehingga peristiwa itu tidak pernah menyala.
// =========================================================================

/**
 * @param {object}  imgProps   atribut <img> hasil parsing (tanpa `class`)
 * @param {boolean} autoPotong penyunting menyalakan potong otomatis?
 * @param {string}  className  kelas asli dari HTML konten, bila ada
 */
const GambarKonten = ({ imgProps, autoPotong = false, className = '' }) => {
  // Lanskap dipakai sebagai tebakan awal — varian inilah yang paling longgar
  // (tidak memotong, tidak membatasi tinggi), jadi salah tebak sekejap sebelum
  // gambar termuat tidak menimbulkan lompatan tata letak yang mencolok.
  const [varian, setVarian] = useState('image-frame--landscape');

  const terapkan = (gambar) => {
    if (gambar && gambar.naturalWidth) {
      setVarian(klasifikasiRasio(gambar.naturalWidth, gambar.naturalHeight));
    }
  };

  const kelasWadah = ['image-frame', varian];
  // Penanda hanya bermakna pada gambar potret — lihat DefaultContent.css.
  // Kelasnya tetap dipasang apa adanya; CSS yang memutuskan kapan ia berlaku,
  // sebab varian rasionya baru pasti setelah gambar termuat.
  if (autoPotong) kelasWadah.push('image-frame--potong');

  return (
    <div className={kelasWadah.join(' ')}>
      <img
        {...imgProps}
        className={className || undefined}
        onLoad={(e) => terapkan(e.currentTarget)}
        ref={(el) => {
          if (el && el.complete) terapkan(el);
        }}
      />
    </div>
  );
};

export default GambarKonten;
