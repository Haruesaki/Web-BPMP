import React, { useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Autoformat,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Link,
  List,
  BlockQuote,
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';
import './PostDefault.css';

// =========================================================================
//  POST DEFAULT — halaman editor konten (layout "Default").
//  -----------------------------------------------------------------------
//  Berisi input judul post + rich text editor (CKEditor 5) + tombol aksi.
//  Belum terhubung ke menu/route manapun. Nanti tinggal disambungkan ke
//  backend (POST /api/posts) pada handleSimpan.
// =========================================================================

// Konfigurasi editor: hanya plugin & toolbar yang relevan untuk konten post.
const editorConfig = {
  licenseKey: 'GPL', // penggunaan open-source (GPL)
  plugins: [Essentials, Autoformat, Paragraph, Heading, Bold, Italic, Underline, Link, List, BlockQuote],
  toolbar: [
    'undo', 'redo',
    '|', 'heading',
    '|', 'bold', 'italic', 'underline',
    '|', 'link', 'bulletedList', 'numberedList',
    '|', 'blockQuote',
  ],
  placeholder: 'Tulis isi konten di sini...',
};

const PostDefault = () => {
  const [judul, setJudul] = useState('');
  const [konten, setKonten] = useState('');

  const handleSimpan = () => {
    // TODO: sambungkan ke backend (POST /api/posts)
    console.log({ judul, konten });
  };

  const handleBatal = () => {
    setJudul('');
    setKonten('');
  };

  return (
    <div className="postdefault">
      <main className="pd-content">
        {/* ---------- HEADING ---------- */}
        <div className="pd-heading">
          <h1>Buat Post Baru</h1>
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
