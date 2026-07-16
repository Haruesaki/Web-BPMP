import React, { useState, useEffect } from 'react';
import CKEditorComponent from '../../../ckEditor/CKEditorComponent';
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


const PostDefault = ({
  menuName = '',
  initialContents = [],
  autoEditFirst = false, // muat konten pertama LANGSUNG ke form (untuk edit 1 item)
  heading,      // override judul halaman (mis. PostBeritaCard: "Tambah Berita")
  subheading,   // override teks bantu di bawah judul
  onSave,
  onCancel,
  saveStatus,
  setSaveStatus,
}) => {
  // --- STATE FORM (untuk menambah / mengedit satu konten) ---
  const [judul, setJudul] = useState('');
  const [konten, setKonten] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Efek untuk memuat data awal ke dalam form saat komponen dimuat
  // (terutama untuk mode edit).
  useEffect(() => {
    const initialContent = initialContents?.[0];
    if (initialContent) {
      setJudul(initialContent.judul || '');
      setKonten(initialContent.konten || '');
      setCoverUrl(initialContent.coverUrl || '');
    }
  }, [initialContents]);

  const handleSimpan = () => {
    setFormError('');
    if (setSaveStatus) {
      setSaveStatus({ error: false, message: '' });
    }

    if (!judul.trim()) {
      setFormError('Judul wajib diisi.');
      return;
    }

    // Buat payload konten tunggal dari state form saat ini.
    const currentContent = {
      judul: judul.trim(),
      konten: konten,
      coverUrl: coverUrl || null,
      id: initialContents?.[0]?.id || null, // Sertakan ID asli jika ini mode edit
    };

    if (!currentContent.judul && !currentContent.konten) {
      if (setSaveStatus) {
        setSaveStatus({ error: true, message: 'Form harus diisi minimal 1 konten untuk bisa menyimpan ke database.' });
      }
      return;
    }

    // Kirim data sebagai array dengan satu item untuk menjaga kompatibilitas
    // dengan komponen induk (MenuContentEditor, PostBeritaCard).
    const data = { contents: [currentContent] };
    if (onSave) onSave(data);
    else console.log(data); // fallback standalone
  };

  const handleBatal = () => {
    if (onCancel) onCancel();
  };



  return (
    <div className="postdefault">
      <main className="pd-content">
        {/* ---------- HEADING ---------- */}
        <div className="pd-heading">
          <h1>{heading || (menuName ? `Edit Konten — ${menuName}` : 'Buat Post Baru')}</h1>
          <p>{subheading || 'Tambahkan satu konten untuk ditampilkan di halaman user.'}</p>
        </div>

        {/* ---------- FORM: TAMBAH / EDIT SATU KONTEN ---------- */}
        <section className="pd-card">
          <h2 className="pd-section-title">Isi Konten</h2>

          {/* Judul Konten */}
          <div className="pd-field">
            <label htmlFor="pd-judul">Judul Konten</label>
            <input
              id="pd-judul"
              name="pd-judul-konten"
              type="text"
              className="pd-input"
              placeholder="Masukkan judul post..."
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
            />
          </div>

          {/* Editor Konten */}
          <div className="pd-field" style={{ position: 'relative' }}>
            <label>Konten</label>
            <CKEditorComponent
              data={konten}
              onChange={setKonten}
              thumbnailUrl={coverUrl}
              onThumbnailChange={setCoverUrl}
            />
          </div>

          {formError && <p className="pd-error">{formError}</p>}

          {/* RENDER saveStatus DI BAWAH BUTTON */}
          {saveStatus?.message && (
            <div style={{
              marginTop: '20px',
              padding: '12px 16px',
              backgroundColor: saveStatus.error ? '#441111' : '#114411',
              color: saveStatus.error ? '#ff5555' : '#55ff55',
              border: `1px solid ${saveStatus.error ? '#ff5555' : '#55ff55'}`,
              borderRadius: '6px',
              fontWeight: '500'
            }}>
              {saveStatus.message}
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