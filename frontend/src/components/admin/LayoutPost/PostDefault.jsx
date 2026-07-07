import React, { useState, useEffect, useMemo } from 'react';
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
  SimpleUploadAdapter,
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
import './PostDefault.css';

// =========================================================================
//  POST DEFAULT — EDITOR konten admin untuk layout "Default".
//  -----------------------------------------------------------------------
//  Komponen editor yang bisa dipakai ulang: input judul + CKEditor + aksi.
//  Dipilih lewat registry layout (lihat layoutRegistry.js) dan dirender oleh
//  MenuContentEditor sesuai layout menu yang dibuat Super Admin.
//
//  Props (semua opsional supaya tetap bisa dipakai standalone):
//    - menuName        : nama menu yang sedang diedit (untuk judul halaman)
//    - initialTitle    : judul awal (saat edit konten yang sudah ada)
//    - initialContent  : HTML konten awal
//    - onSave(data)    : dipanggil saat klik Simpan → { judul, konten }
//    - onCancel()      : dipanggil saat klik Batal
// =========================================================================

// Konfigurasi editor lengkap (menyerupai toolbar penuh CKEditor).
const editorConfig = {
  licenseKey: 'GPL', // penggunaan open-source (GPL)
  plugins: [
    Essentials, Paragraph, Autoformat, Clipboard, PasteFromOffice, SelectAll, Undo,
    SourceEditing, GeneralHtmlSupport, FindAndReplace,
    Bold, Italic, Underline, Strikethrough, Subscript, Superscript, Code, RemoveFormat,
    FontSize, FontFamily, FontColor, FontBackgroundColor,
    Heading, Style, Alignment,
    List, TodoList, ListProperties, Indent, IndentBlock,
    BlockQuote, CodeBlock, HorizontalLine, PageBreak, SpecialCharacters, SpecialCharactersEssentials,
    Link, AutoLink, LinkImage,
    Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageInsert, AutoImage, ImageUpload, SimpleUploadAdapter,
    MediaEmbed,
    Table, TableToolbar, TableProperties, TableCellProperties, TableColumnResize, TableCaption,
  ],
  toolbar: {
    items: [
      'sourceEditing', 'findAndReplace', 'selectAll',
      '|', 'undo', 'redo',
      '|', 'heading', 'style',
      '|', 'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor',
      '-', // baris baru
      'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'removeFormat',
      '|', 'bulletedList', 'numberedList', 'todoList', 'outdent', 'indent',
      '|', 'alignment', 'blockQuote', 'codeBlock',
      '|', 'link', 'insertImage', 'insertTable', 'mediaEmbed',
      '|', 'horizontalLine', 'specialCharacters', 'pageBreak',
    ],
    shouldNotGroupWhenFull: true, // izinkan pembungkusan multi-baris (pakai '-')
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
      { name: 'Judul Artikel', element: 'h2', classes: ['pd-style-title'] },
      { name: 'Kotak Info', element: 'p', classes: ['pd-style-info'] },
      { name: 'Teks Kecil', element: 'span', classes: ['pd-style-small'] },
    ],
  },
  image: {
    toolbar: [
      'imageTextAlternative', 'toggleImageCaption',
      '|', 'imageStyle:inline', 'imageStyle:block', 'imageStyle:side',
      '|', 'resizeImage',
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
  // Izinkan HTML bebas agar mode "Source" bisa menyimpan markup apa pun.
  htmlSupport: {
    allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
  },
  placeholder: 'Tulis isi konten di sini...',
  // Catatan: konfigurasi `simpleUpload` (URL + token) TIDAK ditaruh di sini
  // karena butuh token yang baru tersedia saat runtime. Lihat useMemo di
  // dalam komponen — di sana editorConfig digabung dengan simpleUpload.
};

// Ambil header Authorization dari sesi admin (disimpan saat login).
// Endpoint upload diproteksi authMiddleware, jadi token wajib disertakan.
const getAuthToken = () => {
  try {
    const session = sessionStorage.getItem('adminSession');
    return session ? JSON.parse(session)?.token || '' : '';
  } catch {
    return '';
  }
};

// URL endpoint upload gambar di backend (samakan dengan axiosInstance).
const UPLOAD_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/upload/gambar`;

const PostDefault = ({
  menuName = '',
  initialTitle = '',
  initialContent = '',
  onSave,
  onCancel,
}) => {
  const [judul, setJudul] = useState(initialTitle);
  const [konten, setKonten] = useState(initialContent);

  // Config final = editorConfig statis + simpleUpload (butuh token runtime).
  // Dengan SimpleUploadAdapter, gambar yang disisipkan admin dikirim ke
  // backend lalu yang disimpan di konten hanya <img src="URL"> (bukan base64).
  const finalEditorConfig = useMemo(
    () => ({
      ...editorConfig,
      simpleUpload: {
        uploadUrl: UPLOAD_URL,
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      },
    }),
    []
  );

  // --- Auto-scroll halaman saat menyeret (mis. gambar) ke tepi atas/bawah ---
  // CKEditor tidak menggulir window secara otomatis saat drag; ini menutup
  // celah itu agar gambar mudah dipindah ke posisi yang sedang di luar layar.
  // Zona bawah dibuat lebih lebar dari atas karena di bawah viewport ada
  // taskbar OS — scroll harus mulai lebih awal sebelum kursor keluar browser.
  useEffect(() => {
    const EDGE_TOP = 110; // px zona pemicu dari tepi atas
    const EDGE_BOTTOM = 190; // px zona pemicu dari tepi bawah (lebih lebar)
    const MIN_SPEED = 8; // langsung bergerak begitu masuk zona
    const MAX_SPEED = 28; // saat mepet tepi
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
        dy = -ramp(1 - distTop / EDGE_TOP); // makin dekat tepi → makin cepat
      } else if (distBottom < EDGE_BOTTOM) {
        dy = ramp(1 - distBottom / EDGE_BOTTOM);
      }
      if (dy !== 0) window.scrollBy(0, dy);
      raf = requestAnimationFrame(step);
    };

    const onDragOver = (e) => {
      // Batasi ke posisi valid dalam viewport; bila kursor mepet/melewati
      // tepi bawah, anggap tepat di tepi agar tetap scroll kecepatan penuh.
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

  const handleSimpan = () => {
    if (onSave) onSave({ judul, konten });
    else console.log({ judul, konten }); // fallback standalone
  };

  const handleBatal = () => {
    if (onCancel) onCancel();
    else {
      setJudul('');
      setKonten('');
    }
  };

  return (
    <div className="postdefault">
      <main className="pd-content">
        {/* ---------- HEADING ---------- */}
        <div className="pd-heading">
          <h1>{menuName ? `Edit Konten — ${menuName}` : 'Buat Post Baru'}</h1>
          <p>Isi judul lalu tulis konten menggunakan editor di bawah.</p>
        </div>

        {/* ---------- CARD FORM ---------- */}
        <section className="pd-card">
          {/* Judul Post */}
          <div className="pd-field">
            <label htmlFor="pd-judul">Judul Post</label>
            <input
              id="pd-judul"
              type="text"
              className="pd-input"
              placeholder="Masukkan judul post..."
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
            />
          </div>

          {/* Editor Konten */}
          <div className="pd-field">
            <label>Konten</label>
            <div className="pd-editor">
              <CKEditor
                editor={ClassicEditor}
                config={finalEditorConfig}
                data={konten}
                onChange={(event, editor) => setKonten(editor.getData())}
              />
            </div>
          </div>
        </section>

        {/* ---------- AKSI ---------- */}
        <div className="pd-actions">
          <button className="pd-btn pd-btn-batal" onClick={handleBatal}>
            Batal
          </button>
          <button className="pd-btn pd-btn-simpan" onClick={handleSimpan}>
            Simpan
          </button>
        </div>
      </main>
    </div>
  );
};

export default PostDefault;
