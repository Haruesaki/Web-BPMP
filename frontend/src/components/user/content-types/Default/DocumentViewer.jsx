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
//
//  Pustaka berat (pdfjs-dist, docx-preview) diimpor DINAMIS saat dipakai.
//  Tidak melibatkan PDF viewer bawaan browser → tidak ada auto-unduh.
// =========================================================================

// Ubah URL berkas /uploads/<base>.<ext> menjadi /api/berkas/<base> (tanpa
// ekstensi & Content-Type netral) supaya download manager (IDM) tidak mencuri
// permintaan pratinjau. Byte-nya sama, hanya "penyamaran" agar tidak terunduh.
const toInlineUrl = (fileUrl) => {
  try {
    const u = new URL(fileUrl, window.location.origin);
    if (!u.pathname.includes('/uploads/')) return fileUrl;
    const base = u.pathname.split('/').pop().replace(/\.[^.]+$/, '');
    return `${u.origin}/api/berkas/${base}`;
  } catch (_) {
    return fileUrl;
  }
};

const DocumentViewer = ({ href, label, ext }) => {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const isPdf = ext === 'pdf';
  const isDocx = ext === 'doc' || ext === 'docx';

  useEffect(() => {
    let cancelled = false;
    let pdfDoc = null;
    let observer = null;

    const renderPdf = async () => {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

      // Ambil byte sendiri (GET biasa, aman lintas-origin dgn CORS `*`; hindari
      // Range request internal PDF.js). no-store agar tak memakai cache non-CORS.
      const resp = await fetch(toInlineUrl(href), { mode: 'cors', cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.arrayBuffer();

      pdfDoc = await pdfjsLib.getDocument({ data }).promise;
      const container = containerRef.current;
      if (cancelled || !container) return;
      container.innerHTML = '';

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
      const resp = await fetch(toInlineUrl(href), { mode: 'cors', cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const container = containerRef.current;
      if (cancelled || !container) return;
      container.innerHTML = '';
      await renderAsync(blob, container, undefined, {
        className: 'docv-docx',
        inWrapper: true,
      });
    };

    const run = async () => {
      try {
        setStatus('loading');
        if (isPdf) await renderPdf();
        else if (isDocx) await renderDocx();
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
  }, [href, isPdf, isDocx]);

  return (
    <div className="doc-embed">
      {status === 'loading' && (
        <div className="docv-status">
          <i className="fa-solid fa-spinner fa-spin" /> Memuat pratinjau {label}…
        </div>
      )}
      {status === 'error' && (
        <div className="docv-status docv-error">
          Pratinjau dokumen tidak dapat ditampilkan.
        </div>
      )}
      {/* data-lenis-prevent: matikan pembajakan roda mouse oleh Lenis (smooth
          scroll global) saat kursor di atas wadah ini, agar dokumen bisa
          digulir native dengan mouse. Tanpa ini, Lenis menelan event wheel
          dan yang bergerak malah seluruh halaman. */}
      <div ref={containerRef} className="docv-canvas-wrap" data-lenis-prevent />
    </div>
  );
};

export default DocumentViewer;
