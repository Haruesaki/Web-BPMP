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
//  Mendukung CRUD BANYAK konten (mirip Profile Card): form "Tambah Konten"
//  (Judul + CKEditor) + daftar "Data Konten" dengan Edit/Hapus. Tiap konten
//  nanti dibungkus jadi card di halaman user, dengan orientasi (Vertikal/
//  Horizontal) yang diatur lewat "Tampilan Post" di modal Tambah Menu.
//  Dirender oleh MenuContentEditor via layoutRegistry (key: 'default').
//
//  Props (semua opsional supaya tetap bisa dipakai standalone):
//    - menuName        : nama menu yang sedang diedit (untuk judul halaman)
//    - initialContents : array konten awal [{ id?, judul, konten }]
//    - onSave(data)    : dipanggil saat klik Simpan → { contents: [...] }
//    - onCancel()      : dipanggil saat klik Batal
// =========================================================================

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
// Buang tag HTML untuk pratinjau ringkas di daftar konten.
const stripHtml = (html) =>
  html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

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
  initialContents = [],
  onSave,
  onCancel,
}) => {
  // Daftar konten yang sudah ditambahkan.
  const [contents, setContents] = useState(() =>
    initialContents.map((c) => ({ id: c.id || makeId(), ...c }))
  );

  // --- STATE FORM (untuk menambah / mengedit satu konten) ---
  const [judul, setJudul] = useState('');
  const [konten, setKonten] = useState('');
  const [editingId, setEditingId] = useState(null); // null = mode tambah
  const [formError, setFormError] = useState('');

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

  const resetForm = () => {
    setJudul('');
    setKonten('');
    setEditingId(null);
    setFormError('');
  };

  // Tambah konten baru ATAU perbarui konten yang sedang diedit.
  const handleTambahAtauPerbarui = () => {
    if (!judul.trim()) {
      setFormError('Judul wajib diisi.');
      return;
    }
    const entry = { judul: judul.trim(), konten };
    if (editingId) {
      setContents((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...entry } : c)));
    } else {
      setContents((prev) => [...prev, { id: makeId(), ...entry }]);
    }
    resetForm();
  };

  const handleEditItem = (id) => {
    const c = contents.find((x) => x.id === id);
    if (!c) return;
    setJudul(c.judul || '');
    setKonten(c.konten || '');
    setEditingId(id);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHapusItem = (id) => {
    setContents((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) resetForm();
  };

  const handleSimpan = () => {
    const data = { contents };
    if (onSave) onSave(data);
    else console.log(data); // fallback standalone
  };

  const handleBatal = () => {
    if (onCancel) onCancel();
    else {
      setContents([]);
      resetForm();
    }
  };

  return (
    <div className="postdefault">
      <main className="pd-content">
        {/* ---------- HEADING ---------- */}
        <div className="pd-heading">
          <h1>{menuName ? `Edit Konten — ${menuName}` : 'Buat Post Baru'}</h1>
          <p>Tambahkan satu atau beberapa konten untuk ditampilkan di halaman user.</p>
        </div>

        {/* ---------- FORM: TAMBAH / EDIT SATU KONTEN ---------- */}
        <section className="pd-card">
          <h2 className="pd-section-title">{editingId ? 'Edit Konten' : 'Tambah Konten'}</h2>

          {/* Judul Konten */}
          <div className="pd-field">
            <label htmlFor="pd-judul">Judul Konten</label>
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

          {formError && <p className="pd-error">{formError}</p>}

          <div className="pd-form-actions">
            {editingId && (
              <button type="button" className="pd-btn pd-btn-batal" onClick={resetForm}>
                Batal Edit
              </button>
            )}
            <button
              type="button"
              className="pd-btn pd-btn-simpan"
              onClick={handleTambahAtauPerbarui}
            >
              {editingId ? 'Perbarui Konten' : '+ Tambah Konten'}
            </button>
          </div>
        </section>

        {/* ---------- DATA KONTEN ---------- */}
        <section className="pd-card pd-list-card">
          <h2 className="pd-section-title">Data Konten ({contents.length})</h2>
          {contents.length === 0 ? (
            <p className="pd-empty">Belum ada konten. Tambahkan lewat form di atas.</p>
          ) : (
            <div className="pd-list">
              {contents.map((c, i) => {
                const preview = stripHtml(c.konten);
                return (
                  <div className="pd-list-item" key={c.id}>
                    <div className="pd-list-item-main">
                      <div className="pd-list-item-title">
                        {i + 1}. {c.judul}
                      </div>
                      {preview && <div className="pd-list-item-preview">{preview}</div>}
                    </div>
                    <div className="pd-list-actions">
                      <button type="button" className="pd-icon-btn" onClick={() => handleEditItem(c.id)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="pd-icon-btn pd-icon-btn-danger"
                        onClick={() => handleHapusItem(c.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ---------- AKSI SIMPAN SELURUH DAFTAR ---------- */}
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
