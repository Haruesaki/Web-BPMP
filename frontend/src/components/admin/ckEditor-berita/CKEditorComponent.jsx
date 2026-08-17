import React, { useEffect, useRef, useMemo, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  // Inti
  Essentials,
  Paragraph,
  Autoformat,
  Clipboard,
  PasteFromOffice,
  SelectAll,
  Undo,
  // Sumber / HTML
  SourceEditing,
  GeneralHtmlSupport,
  FindAndReplace,
  // Format teks
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Code,
  RemoveFormat,
  // Font
  FontSize,
  FontFamily,
  FontColor,
  FontBackgroundColor,
  // Paragraf / heading / gaya
  Heading,
  Style,
  Alignment,
  // List & indent
  List,
  TodoList,
  ListProperties,
  Indent,
  IndentBlock,
  // Blok
  BlockQuote,
  CodeBlock,
  HorizontalLine,
  PageBreak,
  SpecialCharacters,
  SpecialCharactersEssentials,
  // Tautan & media
  Link,
  AutoLink,
  LinkImage,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  ImageInsert,
  AutoImage,
  ImageUpload,
  MediaEmbed,
  // Tabel
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  TableCaption,
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import { CustomUploadAdapterPlugin } from '../../../utils/CustomUploadAdapter';
import { InsertDocumentPlugin } from '../../../utils/InsertDocumentPlugin';
// Membuang format visual bawaan sumber saat menempel (warna, latar, font,
// kelas), tetapi mempertahankan perataan beserta struktur. Lihat sebab
// lengkapnya di utils/tempelBersih.js.
import { TempelBersih } from '../../../utils/TempelBersihPlugin';
// Saklar "Potong otomatis" pada bilah alat gambar. Sisi pengunjung kini tidak
// pernah memotong gambar; plugin ini yang memberi penyunting jalan keluar untuk
// gambar potret yang terlalu menjulang. Lihat utils/AutoPotongGambarPlugin.js.
import { AutoPotongGambarPlugin } from '../../../utils/AutoPotongGambarPlugin';
import axiosInstance from '../../../api/axiosInstance';
import { ambilToken } from '../../../utils/sesiAdmin';
import OverlayUnggah from '../common/OverlayUnggah';
import './CKEditorComponent.css';

const editorConfig = {
  licenseKey: 'GPL',
  plugins: [
    Essentials, Paragraph, Autoformat, Clipboard, PasteFromOffice, SelectAll, Undo,
    SourceEditing, GeneralHtmlSupport, FindAndReplace,
    Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Code, RemoveFormat,
    FontSize, FontFamily, FontColor, FontBackgroundColor,
    Heading, Style, Alignment,
    List, TodoList, ListProperties, Indent, IndentBlock,
    BlockQuote, CodeBlock, HorizontalLine, PageBreak, SpecialCharacters, SpecialCharactersEssentials,
    Link, AutoLink, LinkImage,
    Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageInsert, AutoImage, ImageUpload,
    AutoPotongGambarPlugin,
    MediaEmbed,
    Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize, TableCaption,
  ],
  toolbar: {
    items: [
      'sourceEditing', 'findAndReplace', 'selectAll',
      '|', 'undo', 'redo',
      '|', 'heading', 'style',
      '|', 'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor',
      '-',
      'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'removeFormat',
      '|', 'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent',
      '|', 'alignment', 'blockQuote', 'codeBlock',
      '|', 'link', 'insertImage', 'insertDocument', 'insertTable', 'mediaEmbed',
      '|', 'horizontalLine', 'specialCharacters', 'pageBreak',
    ],
    shouldNotGroupWhenFull: true,
  },
  heading: {
    options: [
      { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
    ],
  },
  fontSize: {
    options: [10, 12, 14, 'default', 18, 20, 24, 28, 32],
    supportAllValues: true,
  },
  fontFamily: { supportAllValues: true },
  style: {
    definitions: [
      { name: 'Italic Title', element: 'p', classes: ['article-italic-title'] },
      { name: 'Subtitle', element: 'p', classes: ['article-subtitle'] },
      { name: 'Special Container', element: 'p', classes: ['article-special-container'] },
      { name: 'Marker', element: 'span', classes: ['article-marker'] },
      { name: 'Big', element: 'span', classes: ['article-big'] },
      { name: 'Small', element: 'span', classes: ['article-small'] },
      { name: 'Computer Code', element: 'span', classes: ['article-code'] },
      { name: 'Keyboard Phrase', element: 'span', classes: ['article-kbd'] },
      { name: 'Cited Work', element: 'span', classes: ['article-cite'] },
      { name: 'Inline Quotation', element: 'span', classes: ['article-quote'] },
    ],
  },
  image: {
    // `insertImage` sengaja diletakkan PALING DEPAN. Pada bilah alat gambar,
    // tombol ini berganti sendiri menjadi "Ganti gambar" begitu ada gambar
    // terpilih — CKEditor menandainya lewat `isImageSelected` pada
    // ImageInsertUI. Sebelumnya bilah alat ini hanya memuat teks alternatif,
    // keterangan, gaya, dan ukuran, sehingga gambar yang berkasnya rusak atau
    // hilang tidak dapat ditukar sama sekali: satu-satunya jalan adalah
    // menghapusnya lalu menyisipkan ulang, dan bersamanya hilang pula
    // keterangan, perataan, serta ukuran yang sudah disetel.
    //
    // Menggantinya mempertahankan seluruh atribut itu — yang berubah hanya
    // sumber gambarnya. Unggahannya menempuh CustomUploadAdapter yang sama
    // dengan penyisipan biasa, jadi kompresi, konversi WebP, dan bilah
    // kemajuannya ikut berlaku tanpa penyesuaian apa pun.
    //
    // `autoPotongGambar` diletakkan PALING BELAKANG dan dipisahkan garis. Ia
    // satu-satunya butir bertuliskan teks di antara deretan ikon, jadi menaruhnya
    // di ujung menjaga barisan ikon tetap rapat. Saklarnya hanya menyala untuk
    // gambar berasio potret — pada gambar lain ia tampil redup beserta
    // keterangan sebabnya.
    toolbar: [
      'insertImage',
      '|', 'imageTextAlternative', 'toggleImageCaption',
      '|', 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side',
      '|', 'resizeImage',
      '|', 'autoPotongGambar',
    ],
  },
  table: {
    contentToolbar: [
      'tableColumn', 'tableRow', 'mergeTableCells',
      'tableProperties', 'tableCellProperties',
    ],
  },
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: 'https://',
  },
  htmlSupport: {
    allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
  },
  placeholder: 'Tulis isi konten di sini...',
};

const getAuthToken = () => ambilToken() || '';

const UPLOAD_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/upload/gambar`;

// =========================================================================
//  THUMBNAIL DI DALAM ISI BERITA
//  -----------------------------------------------------------------------
//  Sebelumnya halaman detail berita SELALU menempelkan thumbnail di atas isi
//  kontennya, tanpa satu pun cara mematikannya — padahal thumbnail itu
//  sebetulnya sampul untuk kartu daftar berita, bukan bagian naskahnya.
//
//  Sekarang penyertaannya menjadi keputusan penyunting, dan caranya sengaja
//  BUKAN penanda tersendiri di basis data melainkan GAMBAR SUNGGUHAN yang
//  disisipkan ke dalam isi konten. Sebabnya ada tiga:
//    1. Permintaannya menuntut gambar itu dapat dipindah ke baris mana saja.
//       Sebagai gambar biasa di dalam editor, ia langsung memperoleh seluruh
//       kemampuan bawaan CKEditor — diseret, dipotong-tempel, diberi
//       keterangan, diatur perataan — tanpa satu baris kode pun untuk itu.
//       Penanda di basis data hanya mampu menyimpan "ya/tidak"; posisinya
//       akan menuntut kolom kedua, dan pemindahannya menuntut antarmuka
//       seret tersendiri yang menirukan milik editor.
//    2. Halaman pengunjung tidak perlu diubah sedikit pun untuk memuatnya:
//       gambarnya menempuh jalur yang sama dengan gambar isi konten lain,
//       termasuk pengelompokan mendatar dan saklar potong otomatis.
//    3. Keadaan saklarnya DITURUNKAN dari isi konten, bukan disimpan
//       terpisah. Dengan begitu keduanya mustahil berselisih: menghapus
//       gambarnya di editor mematikan saklarnya sendiri, dan Ctrl+Z
//       memulangkan keduanya sekaligus.
//
//  Tidak ada perubahan skema basis data — jadi tidak ada pula yang perlu
//  dijalankan di phpMyAdmin production sebelum penempatan ulang.
// =========================================================================

const lolosRegex = (teks) => String(teks).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Dibaca dari untai HTML (bukan dari model editor) supaya keadaan saklarnya
// ikut menyesuaikan diri pada setiap penyuntingan — termasuk saat gambarnya
// dihapus lewat tombol Delete atau dipulangkan lewat Ctrl+Z.
const thumbnailAdaDiKonten = (html, url) => {
  if (!html || !url) return false;
  return new RegExp(`src=["']${lolosRegex(url)}["']`).test(html);
};

const kumpulkanGambarBersumber = (editor, url) => {
  if (!editor || !url) return [];
  const akar = editor.model.document.getRoot();
  if (!akar) return [];
  const hasil = [];
  for (const { item } of editor.model.createRangeIn(akar)) {
    const gambar = item.is('element', 'imageBlock') || item.is('element', 'imageInline');
    if (gambar && item.getAttribute('src') === url) hasil.push(item);
  }
  return hasil;
};

const CKEditorComponent = ({ data, onChange, thumbnailUrl, onThumbnailChange }) => {
  const editorRef = useRef(null);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [thumbError, setThumbError] = useState('');
  // Kemajuan unggahan thumbnail ditampilkan DI TEMPAT, bukan lewat overlay
  // sudut layar. Kotaknya tepat berada di depan mata saat pengguna memilih
  // berkas, sehingga isyarat di situ jauh lebih mudah dihubungkan dengan
  // tindakannya sendiri.
  const [thumbPersen, setThumbPersen] = useState(0);
  const [thumbTahap, setThumbTahap] = useState('');
  const thumbInputRef = useRef(null);

  // Saklar "Tampilkan juga ke detail berita" hanya dapat bekerja lewat model
  // editor, jadi ia ditahan sampai instance CKEditor benar-benar siap. Tanpa
  // ini kliknya diam-diam tidak berbuat apa pun pada detik-detik pertama
  // sesudah halaman terbuka.
  const [editorSiap, setEditorSiap] = useState(false);

  // Nilai thumbnail sebelumnya. Dipakai untuk mencari gambar sisipan yang
  // masih memakai URL lama ketika penyunting menekan "Ganti Gambar" atau
  // "Hapus" — tanpa ini gambar lama tertinggal di dalam naskah sebagai
  // rujukan ke berkas yang sudah tidak dipakai lagi.
  const urlThumbSebelumnya = useRef(thumbnailUrl || '');

  const thumbnailIkutKeDetail = thumbnailAdaDiKonten(data, thumbnailUrl);

  const alihkanThumbnailKeDetail = () => {
    const editor = editorRef.current;
    if (!editor || !thumbnailUrl) return;

    const sudahAda = kumpulkanGambarBersumber(editor, thumbnailUrl);

    if (sudahAda.length) {
      editor.model.change((writer) => {
        sudahAda.forEach((gambar) => writer.remove(gambar));
      });
      return;
    }

    // `insertObject` dipakai alih-alih perintah `insertImage`: perintah itu
    // menyisipkan pada posisi terpilih dan memilih sendiri antara gambar blok
    // atau sebaris, sedangkan di sini posisinya harus pasti — baris pertama
    // dokumen — dan bentuknya harus blok agar melintang penuh seperti sampul.
    editor.model.change((writer) => {
      const akar = editor.model.document.getRoot();
      const gambar = writer.createElement('imageBlock', { src: thumbnailUrl });
      editor.model.insertObject(gambar, writer.createPositionAt(akar, 0), null, {
        setSelection: 'on',
      });
    });
  };

  // Menjaga gambar sisipan tetap sejalan dengan thumbnail yang berlaku.
  // Dipisahkan dari penangan tombol karena URL-nya dapat berubah dari mana
  // saja — unggahan baru, penghapusan, atau pemuatan ulang data konten.
  useEffect(() => {
    const lama = urlThumbSebelumnya.current;
    const baru = thumbnailUrl || '';
    if (lama === baru) return;
    urlThumbSebelumnya.current = baru;

    const editor = editorRef.current;
    if (!editor || !lama) return;

    const sisipan = kumpulkanGambarBersumber(editor, lama);
    if (!sisipan.length) return;

    editor.model.change((writer) => {
      // Thumbnail dihapus → sisipannya ikut hilang. Bila hanya diganti,
      // sumbernya yang ditukar sehingga POSISI, keterangan, perataan, dan
      // ukuran yang sudah disetel penyunting tetap utuh.
      if (!baru) sisipan.forEach((gambar) => writer.remove(gambar));
      else sisipan.forEach((gambar) => writer.setAttribute('src', baru, gambar));
    });
  }, [thumbnailUrl]);

  const handleThumbnailPick = () => {
    if (thumbInputRef.current) thumbInputRef.current.click();
  };

  const handleThumbnailFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset supaya bisa pilih file yang sama lagi
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setThumbError('Berkas yang dipilih bukan gambar.');
      return;
    }

    setThumbError('');
    setThumbUploading(true);
    setThumbPersen(0);
    setThumbTahap('Menyiapkan berkas…');

    try {
      const formData = new FormData();
      formData.append('upload', file);

      const res = await axiosInstance.post('/api/upload/gambar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          // `evt.total` dapat kosong bila peramban tidak mengetahui panjang
          // muatan; persentase tidak dapat dihitung, jadi bilahnya dibiarkan
          // pada mode tak terukur alih-alih menampilkan angka karangan.
          if (!evt.total) {
            setThumbPersen(100);
            setThumbTahap('Mengunggah…');
            return;
          }
          const bagian = evt.loaded / evt.total;
          setThumbPersen(Math.round(bagian * 100));
          // Bita terakhir terkirim bukan berarti selesai — peladen masih
          // mengubah ukuran gambar dengan `sharp`.
          setThumbTahap(bagian >= 1 ? 'Diproses peladen…' : 'Mengunggah ke peladen…');
        },
      });

      const url = res?.data?.url;
      if (url && onThumbnailChange) {
        onThumbnailChange(url);
      } else {
        setThumbError('Peladen tidak mengembalikan URL gambar.');
      }
    } catch (err) {
      console.error('Gagal upload thumbnail:', err);
      const message = err?.response?.data?.error?.message || 'Gagal mengunggah gambar thumbnail.';
      setThumbError(message);
    } finally {
      setThumbUploading(false);
      setThumbPersen(0);
      setThumbTahap('');
    }
  };

  const handleThumbnailRemove = () => {
    setThumbError('');
    if (onThumbnailChange) onThumbnailChange('');
  };

  const finalEditorConfig = useMemo(
    () => ({
      ...editorConfig,
      extraPlugins: [
        CustomUploadAdapterPlugin(UPLOAD_URL, `Bearer ${getAuthToken()}`),
        InsertDocumentPlugin('/api/upload/dokumen'),
        TempelBersih,
      ]
    }),
    []
  );

  useEffect(() => {
    const EDGE_TOP = 110;
    const EDGE_BOTTOM = 190;
    const MIN_SPEED = 8;
    const MAX_SPEED = 28;
    let pointerY = 0;
    let active = false;
    let raf = null;

    const ramp = (t) => MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.max(0, Math.min(1, t));

    const step = () => {
      if (!active) {
        raf = null;
        return;
      }
      const h = window.innerHeight;
      let dy = 0;
      const distTop = pointerY;
      const distBottom = h - pointerY;
      if (distTop < EDGE_TOP) {
        dy = -ramp(1 - distTop / EDGE_TOP);
      } else if (distBottom < EDGE_BOTTOM) {
        dy = ramp(1 - distBottom / EDGE_BOTTOM);
      }
      if (dy !== 0) window.scrollBy(0, dy);
      raf = requestAnimationFrame(step);
    };

    const onDragOver = (e) => {
      pointerY = Math.max(0, Math.min(e.clientY, window.innerHeight));
      if (!active) {
        active = true;
        if (!raf) raf = requestAnimationFrame(step);
      }
    };
    const stop = () => {
      active = false;
      if (raf) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    };

    window.addEventListener('dragover', onDragOver, true);
    window.addEventListener('drop', stop, true);
    window.addEventListener('dragend', stop, true);
    return () => {
      window.removeEventListener('dragover', onDragOver, true);
      window.removeEventListener('drop', stop, true);
      window.removeEventListener('dragend', stop, true);
      stop();
    };
  }, []);

  // Cleanup on unmount: destroy the CKEditor JS instance and remove orphaned
  // DOM elements (.ck-body-wrapper) that CKEditor appends to <body> outside
  // React's tree. Using useEffect (not useLayoutEffect) so the <CKEditor>
  // React component can destroy its own internal state first.
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        try { editorRef.current.destroy(); } catch (_) {}
        editorRef.current = null;
      }
      document.querySelectorAll('.ck-body-wrapper').forEach((el) => {
        el.removeAttribute('data-lenis-prevent');
        el.remove();
      });
    };
  }, []);

  const handleEditorReady = (editor) => {
    editorRef.current = editor;
    setEditorSiap(true);

    const markLenisPrevent = () =>
      document
        .querySelectorAll('.ck-body-wrapper')
        .forEach((el) => el.setAttribute('data-lenis-prevent', 'true'));
    markLenisPrevent();

    if (editor.plugins.has('Dialog')) {
      const dialog = editor.plugins.get('Dialog');

      dialog.on('change:id', (evt, name, id) => {
        if (id) markLenisPrevent();
      });

      editor.ui.view.toolbar.items.forEach((item) => {
        if (item && item.panelView && typeof item.on === 'function') {
          item.on('change:isOpen', (evt, name, isOpen) => {
            if (isOpen && dialog.id) dialog.hide();
          });
        }
      });
    }
  };

  return (
    <div className="ckeditor-container" style={{ position: 'relative' }}>
      {/* Kemajuan unggahan dari dalam editor — gambar sisipan dan dokumen —
          ditampilkan di sini. Keduanya dipicu dari luar pohon React (adapter
          CKEditor dan plugin toolbar), sehingga menempuh penyimpan bersama
          `utils/statusUnggah`. */}
      <OverlayUnggah />

      <div className="pd-thumbnail-uploader">
        <label className="pd-thumbnail-label">Thumbnail Berita</label>
        <input
          ref={thumbInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleThumbnailFileChange}
        />

        {thumbnailUrl ? (
          <div className="pd-thumbnail-preview">
            <img src={thumbnailUrl} alt="Pratinjau thumbnail berita" />
            <div className="pd-thumbnail-preview-actions">
              <button type="button" className="pd-thumbnail-btn" onClick={handleThumbnailPick} disabled={thumbUploading}>
                {thumbUploading ? 'Mengunggah…' : 'Ganti Gambar'}
              </button>
              <button type="button" className="pd-thumbnail-btn pd-thumbnail-btn-danger" onClick={handleThumbnailRemove} disabled={thumbUploading}>
                Hapus
              </button>

              {/* Bawaannya MATI: kolom `url_foto` yang sudah terisi pada
                  seluruh berita lama tidak lagi membawa gambarnya masuk ke
                  halaman detail dengan sendirinya. Yang menyalakannya hanya
                  tindakan penyunting di sini. */}
              <button
                type="button"
                className={`pd-thumb-sisip${thumbnailIkutKeDetail ? ' pd-thumb-sisip--nyala' : ''}`}
                onClick={alihkanThumbnailKeDetail}
                disabled={thumbUploading || !editorSiap}
                aria-pressed={thumbnailIkutKeDetail}
                title={
                  thumbnailIkutKeDetail
                    ? 'Klik untuk mengeluarkan gambar ini dari isi berita'
                    : 'Klik untuk menyisipkan gambar ini ke baris pertama isi berita'
                }
              >
                <i
                  className={`fa-solid ${thumbnailIkutKeDetail ? 'fa-toggle-on' : 'fa-toggle-off'}`}
                  aria-hidden="true"
                ></i>
                <span>Tampilkan juga ke detail berita</span>
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="pd-thumbnail-dropzone" onClick={handleThumbnailPick} disabled={thumbUploading}>
            <i className="fa-regular fa-image" style={{ fontSize: 22 }}></i>
            <span>{thumbUploading ? 'Mengunggah gambar…' : 'Klik untuk unggah gambar thumbnail'}</span>
          </button>
        )}

        {thumbUploading && (
          <div className="pd-thumb-progres" role="status" aria-live="polite">
            <div className="pd-thumb-progres-baris">
              <span className="pd-thumb-progres-tahap">{thumbTahap}</span>
              {/* Angka disembunyikan saat tahap tak terukur; menampilkan 100%
                  sementara peladen masih bekerja justru menyesatkan. */}
              {thumbPersen < 100 && <span className="pd-thumb-progres-persen">{thumbPersen}%</span>}
            </div>
            <div className="pd-thumb-progres-rel">
              <div
                className={`pd-thumb-progres-isi${thumbPersen >= 100 ? ' pd-thumb-progres-isi--takterukur' : ''}`}
                style={thumbPersen >= 100 ? undefined : { width: `${thumbPersen}%` }}
              />
            </div>
          </div>
        )}

        {thumbnailUrl && thumbnailIkutKeDetail && (
          <p className="pd-thumb-sisip-catatan">
            <i className="fa-solid fa-arrows-up-down-left-right" aria-hidden="true"></i>
            Gambar thumbnail kini menjadi baris pertama isi berita di bawah. Seret gambarnya
            di dalam editor untuk memindahkannya ke baris mana pun.
          </p>
        )}

        {thumbError && <p className="pd-thumbnail-error">{thumbError}</p>}
      </div>

      <div className="pd-editor">
        <CKEditor
          editor={ClassicEditor}
          config={finalEditorConfig}
          data={data}
          onReady={handleEditorReady}
          onChange={(event, editor) => onChange(editor.getData())}
        />
      </div>
    </div>
  );
};

export default CKEditorComponent;