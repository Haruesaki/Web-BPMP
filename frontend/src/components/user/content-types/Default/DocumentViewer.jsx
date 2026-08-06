import React, { useEffect, useRef, useState } from 'react';
// URL worker PDF.js (aset terpisah — tidak membebani bundle utama).
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// =========================================================================
//  DOCUMENT VIEWER — pratinjau dokumen langsung di halaman pengunjung.
//  -----------------------------------------------------------------------
//  PDF  → dirender PDF.js ke <canvas> per halaman, tapi LAZY: canvas sebuah
//         halaman baru digambar saat halaman itu terlihat saat scroll. Ini
//         mencegah ledakan memori canvas saat ada dokumen banyak halaman
//         (mis. 44 halaman) yang bisa membuat dokumen lain di halaman yang
//         sama ikut gagal dirender.
//  DOCX → dirender docx-preview menjadi HTML.
//  XLSX/XLS → dirender SheetJS (xlsx) menjadi tabel HTML per sheet.
//  PPTX → dirender pptx-preview menjadi slide (per halaman).
//
//  Pustaka berat (pdfjs-dist, docx-preview, xlsx, pptx-preview) diimpor
//  DINAMIS saat dipakai. Tidak melibatkan viewer bawaan browser → tidak
//  ada auto-unduh, dan tampil konsisten tanpa bergantung setting browser.
//  Catatan: .doc & .ppt (biner Office lama) TIDAK didukung parser ini —
//  hanya format modern (docx/xlsx/pptx). Format lama ditangani sebagai
//  kartu unduh di DefaultContent.
//
//  BINGKAI BERASIO 9:16
//  --------------------
//  Wadahnya dipatok tegak 9:16, bukan sekadar dibatasi tinggi maksimum.
//  Sebelumnya tingginya mengikuti isi sampai batas 720px, sehingga dokumen
//  satu halaman dan dokumen empat puluh halaman menghasilkan kotak yang
//  tingginya berbeda-beda — halaman jadi tampak acak, dan tidak ada isyarat
//  bahwa kotak itu sesuatu yang dapat digulir. Rasio tetap memberi bentuk yang
//  dikenali sebagai "dokumen" sekaligus membuat seluruh pratinjau seragam.
//
//  KURUNGAN GULIRAN
//  ----------------
//  Saat kursor berada DI DALAM bingkai, roda mouse menggulir dokumennya dan
//  TIDAK merembet ke halaman — dijaga `overscroll-behavior: contain` beserta
//  `data-lenis-prevent` (situs ini memakai Lenis, yang kalau tidak dicegah akan
//  menelan peristiwa wheel dan justru menggerakkan seluruh halaman). Saat
//  kursor di luar bingkai, dokumennya tidak ikut bergerak sama sekali — itu
//  perilaku bawaan, dan sengaja tidak diakali dengan pendengar global.
// =========================================================================

// Ubah URL berkas /uploads/<base>.<ext> menjadi /api/berkas/<base> (tanpa
// ekstensi & Content-Type netral) supaya download manager (IDM) tidak mencuri
// permintaan pratinjau. Byte-nya sama, hanya "penyamaran" agar tidak terunduh.
const toInlineUrl = (fileUrl) => {
  try {
    const u = new URL(fileUrl, window.location.origin);
    // Berkas milik sendiri di /uploads/ → sajikan via /api/berkas (tanpa ekstensi).
    if (u.pathname.includes('/uploads/')) {
      const base = u.pathname.split('/').pop().replace(/\.[^.]+$/, '');
      return `${u.origin}/api/berkas/${base}`;
    }
    // URL eksternal (beda origin) → lewat proksi backend agar lolos CORS server
    // sumber. Tanpa ini, fetch lintas-origin ke server yang tak ber-CORS gagal
    // dengan "Failed to fetch" dan pratinjau tidak muncul.
    if (u.origin !== window.location.origin) {
      return `${window.location.origin}/api/proksi-berkas?url=${encodeURIComponent(u.href)}`;
    }
    return fileUrl;
  } catch (_) {
    return fileUrl;
  }
};

const LABEL_JENIS = {
  pdf: 'PDF', doc: 'Word', docx: 'Word',
  xls: 'Excel', xlsx: 'Excel', pptx: 'PowerPoint',
};

const IKON_JENIS = {
  pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word',
  xls: 'fa-file-excel', xlsx: 'fa-file-excel', pptx: 'fa-file-powerpoint',
};

/**
 * Mengambil berkas sambil melaporkan kemajuannya.
 *
 * `fetch` biasa tidak memberi kabar apa pun sampai seluruh bita tiba, dan pada
 * PDF puluhan megabita itu berarti layar diam berdetik-detik tanpa penjelasan.
 * Di sini badan balasannya dibaca sebagai stream sehingga jumlah bita yang sudah
 * masuk dapat dilaporkan. Bila peladen tidak menyertakan `Content-Length` —
 * lazim terjadi pada balasan terkompresi — persentase memang tidak dapat
 * dihitung, dan pemanggilnya menerima null agar menampilkan bilah tak terukur.
 */
const ambilDenganProgres = async (url, laporkan) => {
  const resp = await fetch(url, { mode: 'cors', cache: 'no-store' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

  const total = Number(resp.headers.get('Content-Length')) || 0;

  if (!resp.body || !total) {
    laporkan(null);
    return resp.arrayBuffer();
  }

  const pembaca = resp.body.getReader();
  const potongan = [];
  let masuk = 0;

  for (;;) {
    const { done, value } = await pembaca.read();
    if (done) break;
    potongan.push(value);
    masuk += value.length;
    laporkan(Math.min(99, Math.round((masuk / total) * 100)));
  }

  const gabung = new Uint8Array(masuk);
  let geser = 0;
  for (const p of potongan) {
    gabung.set(p, geser);
    geser += p.length;
  }
  return gabung.buffer;
};

const DocumentViewer = ({ href, label, ext }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [persen, setPersen] = useState(null); // null = tak terukur
  const [tahap, setTahap] = useState('Menyiapkan…');
  const [jumlahHalaman, setJumlahHalaman] = useState(0);

  const isPdf = ext === 'pdf';
  const isDocx = ext === 'doc' || ext === 'docx';
  const isXls = ext === 'xls' || ext === 'xlsx';
  const isPptx = ext === 'pptx';

  useEffect(() => {
    let cancelled = false;
    let pdfDoc = null;
    let observer = null;

    const ambil = (pesan) => {
      setTahap(pesan);
      return ambilDenganProgres(toInlineUrl(href), (p) => {
        if (!cancelled) setPersen(p);
      });
    };

    const renderPdf = async () => {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

      // Byte diambil sendiri (GET biasa, aman lintas-origin dgn CORS `*`; hindari
      // Range request internal PDF.js).
      const data = await ambil('Mengunduh dokumen…');
      if (cancelled) return;

      setTahap('Menyiapkan halaman…');
      setPersen(null);

      pdfDoc = await pdfjsLib.getDocument({ data }).promise;
      const container = containerRef.current;
      if (cancelled || !container) return;
      container.innerHTML = '';
      setJumlahHalaman(pdfDoc.numPages);

      // Skala mengikuti lebar wadah supaya canvas tidak lebih besar dari perlu.
      const baseWidth = container.clientWidth || 700;

      // Bangun "slot" berukuran tepat tiap halaman (agar scrollbar akurat),
      // tapi belum menggambar canvas. Canvas digambar lewat IntersectionObserver.
      const slots = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        if (cancelled) return;
        const unscaled = page.getViewport({ scale: 1 });
        const scale = Math.min(1.5, baseWidth / unscaled.width);
        const viewport = page.getViewport({ scale });

        const slot = document.createElement('div');
        slot.className = 'docv-page-slot';
        slot.style.width = `${Math.floor(viewport.width)}px`;
        slot.style.height = `${Math.floor(viewport.height)}px`;
        container.appendChild(slot);
        slots.push({ el: slot, page, viewport, done: false });
      }

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const slot = slots.find((s) => s.el === entry.target);
            if (!slot || slot.done) return;
            slot.done = true;
            observer.unobserve(slot.el);

            const canvas = document.createElement('canvas');
            canvas.className = 'docv-page';
            canvas.width = Math.floor(slot.viewport.width);
            canvas.height = Math.floor(slot.viewport.height);
            slot.el.appendChild(canvas);
            slot.page.render({
              canvasContext: canvas.getContext('2d'),
              viewport: slot.viewport,
            });
          });
        },
        { root: container, rootMargin: '400px 0px' }
      );

      slots.forEach((s) => observer.observe(s.el));
    };

    const renderDocx = async () => {
      const { renderAsync } = await import('docx-preview');
      const data = await ambil('Mengunduh dokumen…');
      if (cancelled) return;
      setTahap('Menyusun tampilan…');
      setPersen(null);

      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = '';
      await renderAsync(new Blob([data]), container, undefined, {
        className: 'docv-docx',
        inWrapper: true,
      });
    };

    // XLSX/XLS → SheetJS. Tiap sheet jadi satu tabel HTML (kartu putih).
    const renderXlsx = async () => {
      const mod = await import('xlsx');
      const XLSX = mod.read ? mod : mod.default; // aman utk interop CJS/ESM
      const data = await ambil('Mengunduh berkas…');
      if (cancelled) return;
      setTahap('Membaca lembar kerja…');
      setPersen(null);

      const wb = XLSX.read(data, { type: 'array' });
      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = '';
      setJumlahHalaman(wb.SheetNames.length);

      wb.SheetNames.forEach((name) => {
        const sheet = wb.Sheets[name];
        const card = document.createElement('div');
        card.className = 'docv-sheet';

        const title = document.createElement('div');
        title.className = 'docv-sheet-title';
        title.textContent = name;

        const tableWrap = document.createElement('div');
        tableWrap.className = 'docv-sheet-table';
        tableWrap.innerHTML = XLSX.utils.sheet_to_html(sheet);

        card.appendChild(title);
        card.appendChild(tableWrap);
        container.appendChild(card);
      });
    };

    // PPTX → pptx-preview. init(container, {width,height}) lalu preview(buffer).
    const renderPptx = async () => {
      const { init } = await import('pptx-preview');
      const data = await ambil('Mengunduh presentasi…');
      if (cancelled) return;
      setTahap('Menyusun slide…');
      setPersen(null);

      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = '';

      // Skala slide 16:9 mengikuti lebar wadah (maks 960px seperti default lib).
      const width = Math.min(960, (container.clientWidth || 720) - 24);
      const height = Math.round((width * 540) / 960);
      const previewer = init(container, { width, height });
      await Promise.resolve(previewer.preview(data));
    };

    const run = async () => {
      try {
        setStatus('loading');
        setPersen(null);
        setTahap('Menyiapkan…');
        if (isPdf) await renderPdf();
        else if (isDocx) await renderDocx();
        else if (isXls) await renderXlsx();
        else if (isPptx) await renderPptx();
        if (!cancelled) setStatus('ready');
      } catch (err) {
        console.error('Gagal menampilkan pratinjau dokumen:', err);
        if (!cancelled) setStatus('error');
      }
    };

    run();
    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (pdfDoc) {
        try {
          pdfDoc.destroy();
        } catch (_) {
          /* abaikan */
        }
      }
    };
  }, [href, isPdf, isDocx, isXls, isPptx]);

  const jenis = LABEL_JENIS[ext] || (ext || '').toUpperCase();
  const ikon = IKON_JENIS[ext] || 'fa-file-lines';
  const satuanHalaman = isXls ? 'lembar' : isPptx ? 'slide' : 'halaman';

  return (
    <div className="docv">
      {/* ------------------------------------------------------ kepala */}
      <div className="docv-kepala">
        <span className={`docv-ikon docv-ikon--${ext}`} aria-hidden="true">
          <i className={`fa-solid ${ikon}`} />
        </span>

        <div className="docv-judul-blok">
          <span className="docv-judul" title={label}>{label}</span>
          <span className="docv-meta">
            {jenis}
            {status === 'ready' && jumlahHalaman > 0 && ` · ${jumlahHalaman} ${satuanHalaman}`}
          </span>
        </div>

        <a
          className="docv-unduh"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          download
          title="Unduh dokumen"
        >
          <i className="fa-solid fa-download" />
          <span className="docv-unduh-teks">Unduh</span>
        </a>
      </div>

      {/* ------------------------------------------------------ bingkai */}
      <div className="docv-bingkai">
        {status === 'loading' && (
          <div className="docv-muat">
            <div className="docv-muat-ikon" aria-hidden="true">
              <i className={`fa-solid ${ikon}`} />
            </div>
            <span className="docv-muat-tahap">{tahap}</span>
            <div className="docv-rel" role="progressbar" aria-valuenow={persen ?? undefined}>
              <div
                className={`docv-isi${persen === null ? ' docv-isi--takterukur' : ''}`}
                style={persen === null ? undefined : { width: `${persen}%` }}
              />
            </div>
            {persen !== null && <span className="docv-muat-persen">{persen}%</span>}
          </div>
        )}

        {status === 'error' && (
          <div className="docv-muat docv-muat--galat">
            <div className="docv-muat-ikon" aria-hidden="true">
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <span className="docv-muat-tahap">Pratinjau tidak dapat ditampilkan.</span>
            <a className="docv-unduh docv-unduh--galat" href={href} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-download" /> Unduh berkasnya
            </a>
          </div>
        )}

        {/* data-lenis-prevent: melepaskan pembajakan roda mouse oleh Lenis saat
            kursor berada di atas wadah ini. Tanpa itu Lenis menelan peristiwa
            wheel dan yang bergerak justru seluruh halaman. */}
        <div
          ref={containerRef}
          className={`docv-isi-dokumen${status === 'ready' ? '' : ' docv-isi-dokumen--sembunyi'}`}
          data-lenis-prevent
        />
      </div>

      {/* ------------------------------------------------------ kaki */}
      {status === 'ready' && (
        <div className="docv-kaki">
          <i className="fa-solid fa-arrows-up-down" aria-hidden="true" />
          Gulir di dalam bingkai untuk membaca dokumen
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;
