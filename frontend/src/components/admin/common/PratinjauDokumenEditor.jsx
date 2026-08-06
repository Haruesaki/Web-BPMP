import { useEffect, useSyncExternalStore } from 'react';
import DocumentViewer from '../../user/content-types/Default/DocumentViewer';
import {
  langgananPratinjau,
  bacaPratinjau,
  tutupPratinjau,
} from '../../../utils/pratinjauDokumen';
import './PratinjauDokumenEditor.css';

// =========================================================================
//  PANEL PRATINJAU DOKUMEN DI DALAM EDITOR
//  -----------------------------------------------------------------------
//  Muncul begitu sebuah dokumen selesai diunggah lewat tombol "Sisipkan
//  Dokumen". Isinya komponen viewer yang sama persis dengan yang dipakai
//  halaman pengunjung — disengaja: yang dilihat penyunting di sini adalah
//  hasil yang akan dilihat pembaca, bukan tiruannya.
//
//  Sumber datanya `utils/pratinjauDokumen`; lihat di sana alasan penyimpannya
//  berada di luar React.
//
//  MENGAPA PANEL, BUKAN SISIPAN DI DALAM NASKAH
//  --------------------------------------------
//  Yang tersimpan ke basis data tetap berupa TAUTAN biasa
//  (`<a href="/uploads/....pdf">Nama.pdf</a>`) — bentuk itulah yang dikenali
//  halaman pengunjung dan yang sudah dipakai seluruh konten lama. Menanam
//  pratinjaunya sebagai widget di dalam naskah berarti mengubah bentuk data
//  yang tersimpan, dan konten yang sudah terbit harus ikut dimigrasikan.
//  Panel ini memberi kepastian visual yang sama tanpa menyentuh format
//  datanya sama sekali.
//
//  Panel ditutup dengan tombolnya, dengan Esc, atau dengan mengeklik latar di
//  luarnya — tiga jalan keluar yang lazim, supaya tidak ada yang merasa
//  terjebak.
// =========================================================================

// Format yang benar-benar dapat dirender viewer. `.doc` dan `.ppt` (biner
// Office lama) TIDAK termasuk — parser yang dipakai hanya memahami format
// modern berbasis OOXML.
const BISA_PRATINJAU = ['pdf', 'docx', 'xls', 'xlsx', 'pptx'];

const PratinjauDokumenEditor = () => {
  const dok = useSyncExternalStore(langgananPratinjau, bacaPratinjau, bacaPratinjau);

  // Esc menutup panel. Pendengarnya dipasang HANYA selagi panel terbuka,
  // supaya tidak ikut menelan Esc milik dialog CKEditor saat panel tertutup.
  useEffect(() => {
    if (!dok) return undefined;
    const padaTombol = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        tutupPratinjau();
      }
    };
    window.addEventListener('keydown', padaTombol, true);
    return () => window.removeEventListener('keydown', padaTombol, true);
  }, [dok]);

  if (!dok) return null;

  const dapatDilihat = BISA_PRATINJAU.includes(dok.ext);

  return (
    <div
      className="pde-latar"
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau dokumen yang baru diunggah"
      // Hanya klik pada latarnya sendiri yang menutup — klik yang berawal di
      // dalam panel (mis. saat menyeret batang gulir lalu lepas di luar) tidak
      // boleh ikut menutup.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) tutupPratinjau();
      }}
    >
      <div className="pde-panel">
        <div className="pde-kepala">
          <span className="pde-lencana" aria-hidden="true">
            <i className="fa-solid fa-circle-check" />
          </span>

          <div className="pde-teks">
            <span className="pde-judul">Dokumen berhasil diunggah</span>
            <span className="pde-berkas" title={dok.nama}>{dok.nama}</span>
          </div>

          <button
            type="button"
            className="pde-tutup"
            onClick={tutupPratinjau}
            aria-label="Tutup pratinjau"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="pde-isi">
          {dapatDilihat ? (
            // `key` memaksa render ulang dari awal bila dokumen lain menyusul
            // atau berkas yang sama diunggah dua kali.
            <DocumentViewer key={dok.id} href={dok.url} label={dok.nama} ext={dok.ext} />
          ) : (
            <div className="pde-tanpa-pratinjau">
              <i className="fa-solid fa-file-circle-question" aria-hidden="true" />
              <p>
                Format <strong>.{dok.ext || 'ini'}</strong> belum dapat dipratinjau langsung.
                Tautannya tetap tersisip ke dalam naskah dan berkasnya sudah tersimpan.
              </p>
              <a href={dok.url} target="_blank" rel="noopener noreferrer">
                Buka berkas di tab baru
              </a>
            </div>
          )}
        </div>

        <div className="pde-kaki">
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          Tautan dokumen sudah disisipkan di posisi kursor. Pratinjau ini hanya untuk
          memeriksa — menutupnya tidak membatalkan apa pun.
        </div>
      </div>
    </div>
  );
};

export default PratinjauDokumenEditor;
