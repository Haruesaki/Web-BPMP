import { useCallback, useEffect, useRef, useState } from 'react';
import '../styles/seretUrutan.css';

// =========================================================================
//  SERET-URUTKAN — dipakai bersama tabel isi konten dan kartu profil
//  -----------------------------------------------------------------------
//  MENGAPA PERISTIWA POINTER, BUKAN DRAG-AND-DROP BAWAAN HTML5
//  Dua sebab, dan keduanya menentukan:
//
//    1. Kartu profil dipicu dengan cara DITAHAN. Atribut `draggable` harus
//       sudah menempel sebelum gerakan seret dimulai, sehingga menyalakannya
//       setelah penghitung tahan berbunyi menghasilkan perilaku yang berbeda-
//       beda antar-peramban — kadang seretannya tidak pernah dimulai.
//    2. Drag-and-drop HTML5 sama sekali tidak bekerja di layar sentuh.
//
//  Peristiwa pointer melayani tetikus, pena, dan sentuhan lewat satu jalur yang
//  sama, dan seluruh keputusan tetap berada di tangan kita.
//
//  DUA CARA MEMICU, SATU MEKANISME
//    tahanMs = 0   → seretan dimulai seketika. Dipakai pegangan titik-enam di
//                    tabel: elemennya memang tidak punya guna lain.
//    tahanMs > 0   → jari/tetikus harus DITAHAN dulu. Dipakai kartu profil,
//                    yang klik singkatnya sudah bermakna "buka editor".
//
//  Sasaran ditentukan lewat `document.elementFromPoint`, bukan dengan menghitung
//  kotak tiap elemen sendiri. Cara ini otomatis benar walaupun daftarnya
//  digulir, tingginya berbeda-beda, atau tersusun sebagai kisi berbilah banyak
//  — persis keadaan kartu profil.
// =========================================================================

// Gerakan sejauh ini (piksel) sebelum penghitung tahan berbunyi dianggap
// sebagai niat MENGGULIR, bukan menyeret. Tanpa ambang ini, menggulir daftar
// dengan jari di layar sentuh akan berubah menjadi seretan.
const TOLERANSI_GESER = 8;

// Jarak dari tepi layar tempat halaman mulai ikut bergulir sendiri saat
// seretan mendekat, beserta lajunya.
const TEPI_GULIR = 90;
const LAJU_GULIR = 12;

export const useSeretUrutan = ({ daftar, onUrutBaru, tahanMs = 0, aktif = true }) => {
  // Daftar sementara selama seretan berlangsung. `null` berarti tidak sedang
  // menyeret, dan yang ditampilkan adalah `daftar` asli dari pemanggil.
  const [urutanSementara, setUrutanSementara] = useState(null);
  const [idDiseret, setIdDiseret] = useState(null);

  const ref = useRef({
    penghitung: null,   // penghitung waktu tahan
    aktifkanPada: null, // { x, y, id } saat pointer ditekan
    menyeret: false,
    baruSelesai: false, // menahan klik yang menyusul tepat sesudah seretan
    daftarKini: daftar,
    rafGulir: null,
    posisiY: 0,
  });

  // Daftar terbaru disimpan di ref supaya penangan pointer — yang dipasang
  // sekali — selalu membaca nilai mutakhir tanpa perlu dipasang ulang.
  ref.current.daftarKini = urutanSementara || daftar;

  // Panggil-balik ikut disimpan di ref, dan SENGAJA tidak dijadikan
  // kebergantungan efek di bawah. Pemanggil lazimnya menuliskannya sebagai
  // fungsi sebaris, sehingga jati dirinya berubah pada setiap render — dan
  // dengan itu seluruh pendengar pointer akan dilepas lalu dipasang ulang di
  // tengah seretan yang sedang berjalan.
  ref.current.onUrutBaru = onUrutBaru;

  const hentikanGulirOtomatis = useCallback(() => {
    if (ref.current.rafGulir) {
      cancelAnimationFrame(ref.current.rafGulir);
      ref.current.rafGulir = null;
    }
  }, []);

  // Ditulis sebagai fungsi BERNAMA supaya ia dapat menjadwalkan dirinya sendiri
  // lewat namanya, bukan lewat pengikat `const` di luar — yang belum terisi
  // pada saat badan fungsinya dibuat.
  const langkahGulir = useCallback(function langkah() {
    if (!ref.current.menyeret) {
      ref.current.rafGulir = null;
      return;
    }
    const y = ref.current.posisiY;
    const tinggi = window.innerHeight;
    let dy = 0;
    if (y < TEPI_GULIR) dy = -LAJU_GULIR * (1 - y / TEPI_GULIR);
    else if (y > tinggi - TEPI_GULIR) dy = LAJU_GULIR * (1 - (tinggi - y) / TEPI_GULIR);
    if (dy !== 0) window.scrollBy(0, dy);
    ref.current.rafGulir = requestAnimationFrame(langkah);
  }, []);

  const bersihkan = useCallback(() => {
    if (ref.current.penghitung) {
      clearTimeout(ref.current.penghitung);
      ref.current.penghitung = null;
    }
    ref.current.aktifkanPada = null;
    ref.current.menyeret = false;
    hentikanGulirOtomatis();
    document.body.classList.remove('seret-urutan-aktif');
    setIdDiseret(null);
  }, [hentikanGulirOtomatis]);

  // Menyusun ulang daftar: memindahkan `idSumber` ke posisi `idSasaran`.
  const pindahkan = useCallback((idSumber, idSasaran) => {
    setUrutanSementara((sebelumnya) => {
      const kini = sebelumnya || ref.current.daftarKini;
      const dari = kini.findIndex((x) => String(x.id) === String(idSumber));
      const ke = kini.findIndex((x) => String(x.id) === String(idSasaran));
      if (dari === -1 || ke === -1 || dari === ke) return sebelumnya || kini;
      const salinan = [...kini];
      const [terangkat] = salinan.splice(dari, 1);
      salinan.splice(ke, 0, terangkat);
      return salinan;
    });
  }, []);

  useEffect(() => {
    if (!aktif) return undefined;

    const padaGerak = (e) => {
      const s = ref.current;
      ref.current.posisiY = e.clientY;

      // Masih menunggu penghitung tahan: gerakan berarti pengguna hendak
      // menggulir, bukan menyeret.
      if (!s.menyeret && s.aktifkanPada && tahanMs > 0) {
        const jauh =
          Math.abs(e.clientX - s.aktifkanPada.x) > TOLERANSI_GESER ||
          Math.abs(e.clientY - s.aktifkanPada.y) > TOLERANSI_GESER;
        if (jauh) bersihkan();
        return;
      }

      if (!s.menyeret) return;

      // Mencegah teks tersorot mengikuti gerakan seretan.
      e.preventDefault();

      const dibawah = document.elementFromPoint(e.clientX, e.clientY);
      const wadah = dibawah && dibawah.closest ? dibawah.closest('[data-seret-id]') : null;
      if (!wadah) return;
      const idSasaran = wadah.getAttribute('data-seret-id');
      if (idSasaran && String(idSasaran) !== String(s.idSumber)) {
        pindahkan(s.idSumber, idSasaran);
      }
    };

    const padaLepas = () => {
      const s = ref.current;
      const sempatMenyeret = s.menyeret;
      const urutanAkhir = s.daftarKini;
      bersihkan();

      if (!sempatMenyeret) return;

      // Menahan klik yang menyusul: pada kartu profil, pointerup sesudah
      // seretan tetap membangkitkan `click`, dan tanpa penahan ini setiap
      // penyusunan ulang akan berakhir dengan berpindah ke halaman editor.
      ref.current.baruSelesai = true;
      setTimeout(() => { ref.current.baruSelesai = false; }, 300);

      setUrutanSementara(null);
      if (ref.current.onUrutBaru) ref.current.onUrutBaru(urutanAkhir);
    };

    // Ditempelkan pada window: jari/tetikus kerap keluar dari elemen asalnya di
    // tengah seretan, dan penangan yang menempel pada elemen akan kehilangan
    // jejaknya begitu itu terjadi.
    window.addEventListener('pointermove', padaGerak, { passive: false });
    window.addEventListener('pointerup', padaLepas);
    window.addEventListener('pointercancel', padaLepas);
    return () => {
      window.removeEventListener('pointermove', padaGerak);
      window.removeEventListener('pointerup', padaLepas);
      window.removeEventListener('pointercancel', padaLepas);
    };
  }, [aktif, tahanMs, bersihkan, pindahkan]);

  // Dibersihkan saat komponen dilepas, supaya penghitung tahan dan kelas pada
  // <body> tidak tertinggal bila pengguna berpindah halaman di tengah seretan.
  useEffect(() => () => bersihkan(), [bersihkan]);

  const mulaiMenyeret = useCallback((id) => {
    ref.current.menyeret = true;
    ref.current.idSumber = id;
    ref.current.penghitung = null;
    document.body.classList.add('seret-urutan-aktif');
    setIdDiseret(String(id));
    if (!ref.current.rafGulir) ref.current.rafGulir = requestAnimationFrame(langkahGulir);
  }, [langkahGulir]);

  /** Dipasang pada `onPointerDown` pegangan (tahanMs 0) atau kartu (tahanMs > 0). */
  const padaTekan = useCallback((e, id) => {
    if (!aktif) return;
    // Hanya tombol kiri tetikus. Tanpa saringan ini, klik kanan pun memulai
    // seretan sekaligus membuka menu konteks.
    if (e.button !== undefined && e.button !== 0) return;

    ref.current.aktifkanPada = { x: e.clientX, y: e.clientY, id };
    ref.current.idSumber = id;
    ref.current.posisiY = e.clientY;

    if (tahanMs > 0) {
      ref.current.penghitung = setTimeout(() => mulaiMenyeret(id), tahanMs);
    } else {
      e.preventDefault();
      mulaiMenyeret(id);
    }
  }, [aktif, tahanMs, mulaiMenyeret]);

  return {
    /** Daftar yang harus dirender — mengikuti seretan yang sedang berjalan. */
    daftarTampil: urutanSementara || daftar,
    /** Id yang sedang diangkat, untuk penanda tampilan. */
    idDiseret,
    sedangMenyeret: Boolean(idDiseret),
    padaTekan,
    /** Props hit-test untuk tiap baris/kartu. */
    propsWadah: (id) => ({ 'data-seret-id': String(id) }),
    /** Klik yang menyusul tepat sesudah seretan harus diabaikan. */
    klikDitahan: () => ref.current.baruSelesai,
  };
};

export default useSeretUrutan;
