import { useCallback, useEffect, useRef, useState } from 'react';
// URL worker PDF.js (aset terpisah — tidak membebani bundle utama).
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import './DocumentViewer.css';

// =========================================================================
//  DOCUMENT VIEWER — pratinjau dokumen langsung di dalam halaman.
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
//  MENGISI PENUH PEMBUNGKUSNYA
//  ---------------------------
//  Bingkainya melebar penuh mengikuti wadah tempat ia disisipkan, dan halaman
//  dokumen digambar tepat selebar itu. Yang dibatasi tingginya, bukan lebarnya.
//
//  BILAH KENDALI MENGAMBANG
//  ------------------------
//  Satu-satunya perabot yang tersisa, dan ia MENGAMBANG di atas dokumen —
//  bukan baris tetap yang memakan tinggi. Isinya hanya hal yang tidak dapat
//  dikerjakan sendiri oleh gulir biasa:
//
//    • Nomor halaman berjalan + kotak lompat. Pada dokumen empat puluh
//      halaman, gulir saja tidak memberi tahu sedang di mana, dan mencari
//      halaman tertentu berarti menggulir menebak-nebak.
//    • Perbesaran. Halaman yang pas selebar bingkai belum tentu terbaca —
//      terutama pada tabel rapat atau pemindaian beresolusi rendah.
//    • Layar penuh. Untuk dokumen yang memang perlu dibaca, bukan dilirik.
//
//  Nama berkas dan tombol unduh SENGAJA tidak dikembalikan: dokumen di sini
//  bagian dari isi tulisan, bukan lampiran yang perlu diperkenalkan. Yang
//  ditambahkan hanyalah alat baca.
//
//  PERBESARAN PDF DIGAMBAR ULANG, BUKAN DIREGANGKAN
//  ------------------------------------------------
//  Membesarkan canvas lewat CSS hanya memperbesar piksel yang sudah ada, dan
//  hasilnya kabur persis pada saat pengguna memperbesar justru karena ingin
//  membaca yang kecil. Karena itu setiap perubahan perbesaran menggambar ulang
//  halaman yang terlihat pada kerapatan yang sesuai. Format lain memakai `zoom`
//  CSS — isinya teks dan tabel sungguhan, jadi tetap tajam berapa pun skalanya.
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
  } catch {
    return fileUrl;
  }
};

// Dipakai hanya sebagai lambang pada keadaan memuat/gagal — bukan kepala.
const IKON_JENIS = {
  pdf: 'fa-file-pdf', doc: 'fa-file-word', docx: 'fa-file-word',
  xls: 'fa-file-excel', xlsx: 'fa-file-excel', pptx: 'fa-file-powerpoint',
};

// Batas kerapatan render canvas PDF. Ukuran TAMPIL halaman ditentukan lebar
// wadah dikali perbesaran; angka ini hanya membatasi berapa piksel sebenarnya
// yang digambar. Tanpa batas, dokumen yang diperbesar di layar lebar
// menghasilkan canvas raksasa yang menghabiskan memori.
const MAKS_KERAPATAN = 3;

// Tingkat perbesaran. 1 = pas selebar bingkai. Berupa daftar, bukan penambahan
// bebas, supaya tiap ketukan tombol menghasilkan langkah yang dapat ditebak dan
// selalu bisa kembali tepat ke 100%.
const TINGKAT_ZOOM = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3];

const SATUAN_BAGIAN = {
  pdf: 'Halaman', doc: 'Halaman', docx: 'Halaman',
  xls: 'Lembar', xlsx: 'Lembar', pptx: 'Slide',
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

/**
 * Menggambar satu halaman PDF ke canvas baru di dalam slotnya.
 *
 * Lebar TAMPIL diambil dari gaya slot — di situlah perbesaran sudah tertulis —
 * sehingga fungsi ini tidak perlu tahu-menahu soal keadaan komponen dan dapat
 * dipanggil ulang apa adanya setiap kali perbesaran berubah.
 */
const gambarHalaman = (slot) => {
  const lebar = parseFloat(slot.el.style.width) || slot.asli.width;
  const viewport = slot.page.getViewport({
    scale: Math.min(MAKS_KERAPATAN, lebar / slot.asli.width),
  });

  const canvas = document.createElement('canvas');
  canvas.className = 'docv-page';
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  slot.el.replaceChildren(canvas);

  const tugas = slot.page.render({ canvasContext: canvas.getContext('2d'), viewport });
  slot.tugas = tugas;
  // Penolakan WAJIB ditangkap: menggambar ulang atau melepas komponen
  // membatalkan tugas ini, dan pembatalan menolak janjinya. Tanpa penangkap,
  // setiap perubahan perbesaran meninggalkan unhandled rejection di konsol.
  tugas.promise.catch(() => {});
};

const batalkanTugas = (slot) => {
  if (!slot.tugas) return;
  try {
    slot.tugas.cancel();
  } catch {
    /* tugas sudah selesai — tidak ada yang perlu dibatalkan */
  }
  slot.tugas = null;
};

const DocumentViewer = ({ href, label, ext }) => {
  const bingkaiRef = useRef(null);
  const gulirRef = useRef(null);
  const panggungRef = useRef(null);
  const alatRef = useRef(null);

  const slotsRef = useRef([]);   // khusus PDF: {el, page, asli, tugas, done}
  const bagianRef = useRef([]);  // elemen per halaman/lembar/slide, semua format
  const observerRef = useRef(null);
  const lebarDasarRef = useRef(0); // lebar "pas bingkai" sebelum perbesaran
  const zoomRef = useRef(1);
  const halamanRef = useRef(1);
  const siapRef = useRef(false);
  const inputFokusRef = useRef(false);

  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [persen, setPersen] = useState(null); // null = tak terukur
  const [tahap, setTahap] = useState('Menyiapkan…');

  const [zoom, setZoom] = useState(1);
  const [halaman, setHalaman] = useState(1);
  const [totalBagian, setTotalBagian] = useState(0);
  const [inputHalaman, setInputHalaman] = useState('1');
  const [layarPenuh, setLayarPenuh] = useState(false);

  // Berganti dokumen berarti keadaan alat baca tidak berlaku lagi: jumlah
  // halamannya lain, dan perbesaran dokumen sebelumnya tidak relevan.
  //
  // Penyetelan ulangnya dikerjakan SAAT RENDER, bukan di dalam efek. Efek baru
  // berjalan setelah peramban sempat melukis, sehingga akan ada satu bingkai
  // yang menampilkan "Halaman 7 / 40" milik dokumen lama di atas dokumen baru.
  // Menyetel state saat render membuat React langsung mengulang render itu
  // sebelum apa pun terlihat — pola yang memang dianjurkan untuk menyesuaikan
  // state terhadap prop yang berubah.
  const [hrefDipakai, setHrefDipakai] = useState(href);
  if (href !== hrefDipakai) {
    setHrefDipakai(href);
    setZoom(1);
    setHalaman(1);
    setInputHalaman('1');
    setTotalBagian(0);
  }

  const isPdf = ext === 'pdf';
  const isDocx = ext === 'doc' || ext === 'docx';
  const isXls = ext === 'xls' || ext === 'xlsx';
  const isPptx = ext === 'pptx';

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    halamanRef.current = halaman;
  }, [halaman]);

  // --------------------------------------------------------------- perbesaran
  const terapkanZoom = useCallback(
    (z) => {
      const panggung = panggungRef.current;
      if (!panggung) return;

      if (isPdf && slotsRef.current.length) {
        const dasar = lebarDasarRef.current || gulirRef.current?.clientWidth || 700;
        slotsRef.current.forEach((slot) => {
          batalkanTugas(slot);
          slot.el.style.width = `${Math.round(dasar * z)}px`;
          // Canvas lama dibuang supaya memorinya bebas; yang terlihat akan
          // digambar ulang oleh pengamat di bawah pada kerapatan yang baru.
          slot.el.replaceChildren();
          slot.done = false;
          if (observerRef.current) observerRef.current.observe(slot.el);
        });
        return;
      }

      // Format non-PDF: isinya teks/tabel sungguhan, jadi `zoom` CSS sudah
      // menghasilkan hasil tajam sekaligus memperbarui daerah gulir dengan
      // benar — tidak seperti `transform: scale` yang tidak mengubah tata letak.
      panggung.style.zoom = z === 1 ? '' : String(z);
      // Lebar dikompensasi terbalik supaya isinya tetap di tengah: tanpa ini,
      // lebar 100% ikut terkalikan `zoom` dan panggungnya melenceng.
      panggung.style.width = z === 1 ? '' : `${100 / z}%`;
    },
    [isPdf]
  );

  // Penerapannya sendiri berada di bawah, setelah `lompatKe` — perbesaran
  // mengubah tinggi seluruh halaman, dan tanpa dikembalikan ke tempatnya
  // pembaca terlempar entah ke mana persis saat sedang membaca.

  // ------------------------------------------------------------------ render
  useEffect(() => {
    let cancelled = false;
    let pdfDoc = null;

    // Rujukan ke isi dokumen lama dilepas. Padanan state-nya sudah disetel ulang
    // saat render (lihat `hrefDipakai` di atas).
    siapRef.current = false;
    slotsRef.current = [];
    bagianRef.current = [];

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
      const panggung = panggungRef.current;
      const gulir = gulirRef.current;
      if (cancelled || !panggung || !gulir) return;
      panggung.replaceChildren();

      // Lebar "pas bingkai" diukur dari wadah GULIR, bukan panggung: panggung
      // melebar mengikuti isinya saat diperbesar, sehingga tidak bisa dipakai
      // sebagai acuan. `clientWidth` sudah bebas dari batang gulir karena
      // ruangnya dipesan `scrollbar-gutter: stable`.
      const dasar = gulir.clientWidth || 700;
      lebarDasarRef.current = dasar;

      // Bangun "slot" berukuran tepat tiap halaman (agar scrollbar akurat),
      // tapi belum menggambar canvas. Canvas digambar lewat IntersectionObserver.
      const slots = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        if (cancelled) return;

        const asli = page.getViewport({ scale: 1 });

        const el = document.createElement('div');
        el.className = 'docv-page-slot';
        el.style.width = `${dasar}px`;
        // Tinggi diturunkan dari rasio, bukan dipatok piksel: saat lebarnya
        // berubah karena perbesaran atau layar mengecil, tingginya ikut sendiri
        // dan halaman tidak pernah menjadi gepeng.
        el.style.aspectRatio = `${asli.width} / ${asli.height}`;
        panggung.appendChild(el);
        slots.push({ el, page, asli, tugas: null, done: false });
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const slot = slots.find((s) => s.el === entry.target);
            if (!slot || slot.done) return;
            slot.done = true;
            observerRef.current.unobserve(slot.el);
            gambarHalaman(slot);
          });
        },
        { root: gulir, rootMargin: '400px 0px' }
      );

      slots.forEach((s) => observerRef.current.observe(s.el));
      slotsRef.current = slots;
      bagianRef.current = slots.map((s) => s.el);
      setTotalBagian(slots.length);
    };

    const renderDocx = async () => {
      const { renderAsync } = await import('docx-preview');
      const data = await ambil('Mengunduh dokumen…');
      if (cancelled) return;
      setTahap('Menyusun tampilan…');
      setPersen(null);

      const panggung = panggungRef.current;
      if (!panggung) return;
      panggung.replaceChildren();
      await renderAsync(new Blob([data]), panggung, undefined, {
        className: 'docv-docx',
        inWrapper: true,
      });
      if (cancelled) return;

      // docx-preview memecah dokumen menjadi <section> per halaman. Bila
      // pemecahannya tidak tersedia, kendali halaman disembunyikan sendirinya
      // karena jumlahnya nol — bukan ditampilkan dengan angka yang mengarang.
      const bagian = Array.from(panggung.querySelectorAll('.docx-wrapper > section'));
      bagianRef.current = bagian;
      setTotalBagian(bagian.length);
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
      const panggung = panggungRef.current;
      if (!panggung) return;
      panggung.replaceChildren();

      const bagian = [];
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
        panggung.appendChild(card);
        bagian.push(card);
      });

      bagianRef.current = bagian;
      setTotalBagian(bagian.length);
    };

    // PPTX → pptx-preview. init(container, {width,height}) lalu preview(buffer).
    const renderPptx = async () => {
      const { init } = await import('pptx-preview');
      const data = await ambil('Mengunduh presentasi…');
      if (cancelled) return;
      setTahap('Menyusun slide…');
      setPersen(null);

      const panggung = panggungRef.current;
      const gulir = gulirRef.current;
      if (!panggung || !gulir) return;
      panggung.replaceChildren();

      // Skala slide 16:9 mengikuti lebar wadah (maks 960px seperti default lib).
      const width = Math.min(960, (gulir.clientWidth || 720) - 24);
      const height = Math.round((width * 540) / 960);
      const previewer = init(panggung, { width, height });
      await Promise.resolve(previewer.preview(data));
      if (cancelled) return;

      const bagian = Array.from(panggung.querySelectorAll('.pptx-preview-slide-wrapper'));
      bagianRef.current = bagian;
      setTotalBagian(bagian.length);
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
        if (!cancelled) {
          siapRef.current = true;
          setStatus('ready');
        }
      } catch (err) {
        console.error('Gagal menampilkan pratinjau dokumen:', err);
        if (!cancelled) setStatus('error');
      }
    };

    run();
    return () => {
      cancelled = true;
      siapRef.current = false;
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      slotsRef.current.forEach(batalkanTugas);
      slotsRef.current = [];
      bagianRef.current = [];
      if (pdfDoc) {
        try {
          pdfDoc.destroy();
        } catch {
          /* abaikan */
        }
      }
    };
  }, [href, isPdf, isDocx, isXls, isPptx]);

  // ------------------------------------------------- halaman yang sedang dibaca
  useEffect(() => {
    const gulir = gulirRef.current;
    if (!gulir || status !== 'ready' || totalBagian === 0) return undefined;

    let rafId = null;

    const hitung = () => {
      rafId = null;
      const bagian = bagianRef.current;
      if (!bagian.length) return;

      const kotak = gulir.getBoundingClientRect();
      // Acuan diletakkan di sepertiga atas, bukan di tepi atas: halaman yang
      // baru menyembul sedikit belum layak disebut "sedang dibaca".
      const acuan = kotak.top + kotak.height * 0.35;

      let aktif = 1;
      for (let i = 0; i < bagian.length; i++) {
        if (bagian[i].getBoundingClientRect().top <= acuan) aktif = i + 1;
        else break;
      }
      setHalaman(aktif);
    };

    // Peristiwa gulir datang jauh lebih rapat daripada frame; menghitung ulang
    // pada tiap peristiwa berarti membaca tata letak berkali-kali per frame dan
    // memaksa reflow. Dijepit ke satu perhitungan per frame.
    const padaGulir = () => {
      if (rafId === null) rafId = requestAnimationFrame(hitung);
    };

    hitung();
    gulir.addEventListener('scroll', padaGulir, { passive: true });
    return () => {
      gulir.removeEventListener('scroll', padaGulir);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [status, totalBagian]);

  // Kotak nomor halaman mengikuti gulir — kecuali sedang diketik, supaya angka
  // yang belum sempat dikirim tidak tertimpa.
  useEffect(() => {
    if (!inputFokusRef.current) setInputHalaman(String(halaman));
  }, [halaman]);

  // -------------------------------------------------------------- layar penuh
  useEffect(() => {
    const padaUbah = () =>
      setLayarPenuh(document.fullscreenElement === bingkaiRef.current);
    document.addEventListener('fullscreenchange', padaUbah);
    return () => document.removeEventListener('fullscreenchange', padaUbah);
  }, []);

  // Roda mouse yang jatuh DI ATAS bilah alat tetap harus menggulir dokumennya.
  // Bilah itu berada di luar wadah gulir, jadi tanpa penerusan ini peristiwanya
  // merembet ke halaman — persis yang dijanjikan tidak akan terjadi. Pendengar
  // dipasang secara langsung, bukan lewat prop onWheel, karena React memasang
  // pendengar wheel sebagai pasif sehingga preventDefault-nya diabaikan.
  useEffect(() => {
    const alat = alatRef.current;
    const gulir = gulirRef.current;
    if (!alat || !gulir) return undefined;

    const padaRoda = (e) => {
      e.preventDefault();
      gulir.scrollTop += e.deltaY;
    };
    alat.addEventListener('wheel', padaRoda, { passive: false });
    return () => alat.removeEventListener('wheel', padaRoda);
  }, [status, totalBagian]);

  // ------------------------------------------------------------------ tindakan
  const lompatKe = useCallback((nomor, halus = true) => {
    const gulir = gulirRef.current;
    const bagian = bagianRef.current;
    if (!gulir || !bagian.length) return;

    const aman = Math.max(1, Math.min(bagian.length, Math.round(nomor) || 1));
    const el = bagian[aman - 1];
    if (!el) return;

    // Selisih posisi dipakai, bukan `scrollIntoView`: yang terakhir juga
    // menggeser halaman di belakangnya, sehingga bingkai berpindah tempat
    // padahal yang diminta hanya isinya yang bergerak.
    const geser = el.getBoundingClientRect().top - gulir.getBoundingClientRect().top;
    gulir.scrollTo({
      top: gulir.scrollTop + geser - 8,
      behavior: halus ? 'smooth' : 'auto',
    });
    setHalaman(aman);
    setInputHalaman(String(aman));
  }, []);

  // Penerapan perbesaran. Mengubahnya mengubah tinggi setiap halaman, sehingga
  // posisi gulir yang lama menunjuk ke tempat yang sama sekali berbeda —
  // pembaca yang menekan "+" di halaman 12 akan mendapati dirinya di halaman 6.
  // Karena itu halaman yang sedang dibaca dikembalikan setelah tata letaknya
  // selesai berubah, dan tanpa animasi: ini pembetulan, bukan perpindahan.
  useEffect(() => {
    if (status !== 'ready') return;
    const sebelum = halamanRef.current;
    terapkanZoom(zoom);
    const id = requestAnimationFrame(() => lompatKe(sebelum, false));
    return () => cancelAnimationFrame(id);
  }, [zoom, status, terapkanZoom, lompatKe]);

  // ------------------------------------------------------- ukuran wadah berubah
  // Layar diputar, jendela diubah ukurannya, atau masuk/keluar layar penuh:
  // lebar "pas bingkai" ikut berubah, dan halaman PDF harus digambar ulang
  // supaya tetap pas. Format lain menyesuaikan sendiri lewat tata letak CSS.
  useEffect(() => {
    const gulir = gulirRef.current;
    if (!gulir || !isPdf) return undefined;

    let tunda = null;
    const ro = new ResizeObserver(() => {
      if (!siapRef.current) return;
      const lebar = gulir.clientWidth;
      if (!lebar || Math.abs(lebar - lebarDasarRef.current) < 2) return;
      // Ditunda sejenak: menyeret tepi jendela memicu puluhan peristiwa, dan
      // menggambar ulang seluruh halaman pada tiap piksel akan membekukan tab.
      clearTimeout(tunda);
      tunda = setTimeout(() => {
        const sebelum = halamanRef.current;
        lebarDasarRef.current = gulir.clientWidth;
        terapkanZoom(zoomRef.current);
        // Alasannya sama seperti pada perbesaran: tinggi halaman berubah,
        // sehingga posisi gulir yang lama tidak lagi menunjuk ke tempat yang sama.
        requestAnimationFrame(() => lompatKe(sebelum, false));
      }, 160);
    });

    ro.observe(gulir);
    return () => {
      clearTimeout(tunda);
      ro.disconnect();
    };
  }, [isPdf, terapkanZoom, lompatKe]);

  // Mengirim isi kotak nomor halaman. Kotak yang DIKOSONGKAN bukan permintaan
  // pindah ke halaman nol — pengguna sekadar sedang menghapus untuk mengetik
  // ulang lalu berpindah fokus. Dalam keadaan itu nomornya dikembalikan, bukan
  // dijepit menjadi 1 sehingga dokumen melompat ke awal tanpa diminta.
  const komitHalaman = useCallback(() => {
    if (!inputHalaman) {
      setInputHalaman(String(halaman));
      return;
    }
    lompatKe(Number(inputHalaman));
  }, [inputHalaman, halaman, lompatKe]);

  const ubahZoom = useCallback((arah) => {
    setZoom((kini) => {
      const i = TINGKAT_ZOOM.indexOf(kini);
      const dasar = i === -1 ? TINGKAT_ZOOM.indexOf(1) : i;
      const berikut = Math.max(0, Math.min(TINGKAT_ZOOM.length - 1, dasar + arah));
      return TINGKAT_ZOOM[berikut];
    });
  }, []);

  const alihLayarPenuh = useCallback(() => {
    const bingkai = bingkaiRef.current;
    if (!bingkai) return;
    if (document.fullscreenElement === bingkai) {
      document.exitFullscreen?.().catch(() => {});
    } else {
      // Peramban menolak permintaan ini bila tidak berasal dari tindakan
      // pengguna, dan penolakannya berupa janji yang ditolak.
      bingkai.requestFullscreen?.().catch(() => {});
    }
  }, []);

  const ikon = IKON_JENIS[ext] || 'fa-file-lines';
  const satuan = SATUAN_BAGIAN[ext] || 'Halaman';
  const adaKendaliHalaman = totalBagian > 1;
  const bisaLayarPenuh =
    typeof document !== 'undefined' && document.fullscreenEnabled !== false;

  return (
    <div className="docv">
      <div
        className="docv-bingkai"
        ref={bingkaiRef}
        role="group"
        aria-label={label ? `Pratinjau dokumen: ${label}` : 'Pratinjau dokumen'}
      >
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
            {/* Satu-satunya tautan unduh yang tersisa: bukan hiasan, melainkan
                jalan keluar ketika dokumennya tidak dapat dirender. */}
            <a className="docv-unduh-galat" href={href} target="_blank" rel="noopener noreferrer">
              <i className="fa-solid fa-download" /> Unduh berkasnya
            </a>
          </div>
        )}

        {/* data-lenis-prevent: melepaskan pembajakan roda mouse oleh Lenis saat
            kursor berada di atas wadah ini. Tanpa itu Lenis menelan peristiwa
            wheel dan yang bergerak justru seluruh halaman.
            tabIndex: membuat wadahnya dapat difokuskan, sehingga tombol panah,
            Page Up/Down, Home & End menggulir dokumennya — gratis dari peramban,
            dan satu-satunya cara membaca dokumen ini tanpa tetikus. */}
        <div
          ref={gulirRef}
          className={`docv-isi-dokumen${status === 'ready' ? '' : ' docv-isi-dokumen--sembunyi'}`}
          data-lenis-prevent
          tabIndex={0}
        >
          <div
            ref={panggungRef}
            className={`docv-panggung${isPdf ? ' docv-panggung--bebas' : ''}`}
          />
        </div>

        {status === 'ready' && (
          <div className="docv-alat" ref={alatRef} data-lenis-prevent>
            {adaKendaliHalaman && (
              <>
                <div className="docv-alat-grup">
                  <button
                    type="button"
                    className="docv-alat-tombol"
                    onClick={() => lompatKe(halaman - 1)}
                    disabled={halaman <= 1}
                    aria-label={`${satuan} sebelumnya`}
                    title={`${satuan} sebelumnya`}
                  >
                    <i className="fa-solid fa-chevron-up" />
                  </button>
                  <button
                    type="button"
                    className="docv-alat-tombol"
                    onClick={() => lompatKe(halaman + 1)}
                    disabled={halaman >= totalBagian}
                    aria-label={`${satuan} berikutnya`}
                    title={`${satuan} berikutnya`}
                  >
                    <i className="fa-solid fa-chevron-down" />
                  </button>
                </div>

                <span className="docv-pisah" aria-hidden="true" />

                <label className="docv-alat-halaman">
                  <span className="docv-alat-label">{satuan}</span>
                  <input
                    className="docv-alat-input"
                    type="text"
                    inputMode="numeric"
                    value={inputHalaman}
                    aria-label={`Nomor ${satuan.toLowerCase()}, dari ${totalBagian}`}
                    onFocus={(e) => {
                      inputFokusRef.current = true;
                      e.currentTarget.select();
                    }}
                    onChange={(e) => setInputHalaman(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        komitHalaman();
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={() => {
                      inputFokusRef.current = false;
                      komitHalaman();
                    }}
                  />
                  <span className="docv-alat-total">/ {totalBagian}</span>
                </label>

                <span className="docv-pisah" aria-hidden="true" />
              </>
            )}

            <div className="docv-alat-grup">
              <button
                type="button"
                className="docv-alat-tombol"
                onClick={() => ubahZoom(-1)}
                disabled={zoom <= TINGKAT_ZOOM[0]}
                aria-label="Perkecil"
                title="Perkecil"
              >
                <i className="fa-solid fa-minus" />
              </button>
              <button
                type="button"
                className="docv-alat-tombol docv-alat-tombol--lebar"
                onClick={() => setZoom(1)}
                disabled={zoom === 1}
                aria-label="Kembalikan ke ukuran pas bingkai"
                title="Kembalikan ke ukuran pas bingkai"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                className="docv-alat-tombol"
                onClick={() => ubahZoom(1)}
                disabled={zoom >= TINGKAT_ZOOM[TINGKAT_ZOOM.length - 1]}
                aria-label="Perbesar"
                title="Perbesar"
              >
                <i className="fa-solid fa-plus" />
              </button>
            </div>

            {bisaLayarPenuh && (
              <>
                <span className="docv-pisah" aria-hidden="true" />
                <button
                  type="button"
                  className="docv-alat-tombol"
                  onClick={alihLayarPenuh}
                  aria-label={layarPenuh ? 'Keluar dari layar penuh' : 'Layar penuh'}
                  title={layarPenuh ? 'Keluar dari layar penuh' : 'Layar penuh'}
                >
                  <i
                    className={`fa-solid ${
                      layarPenuh ? 'fa-down-left-and-up-right-to-center' : 'fa-expand'
                    }`}
                  />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
