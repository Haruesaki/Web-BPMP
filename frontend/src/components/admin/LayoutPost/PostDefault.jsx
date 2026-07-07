import React, { useState } from 'react';
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
  Base64UploadAdapter,
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
    Image, ImageToolbar, ImageCaption, ImageStyle, ImageResize, ImageInsert, AutoImage, ImageUpload, Base64UploadAdapter,
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
};

const PostDefault = ({
  menuName = '',
  initialTitle = '',
  initialContent = '',
  onSave,
  onCancel,
}) => {
  const [judul, setJudul] = useState(initialTitle);
  const [konten, setKonten] = useState(initialContent);

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
                config={editorConfig}
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
