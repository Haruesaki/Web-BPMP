import React, { useState, useRef } from 'react';
import CKEditorDefault from '../../ckEditor-default/CKEditorComponent';
import CKEditorBerita from '../../ckEditor-berita/CKEditorComponent';
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
  editorType = 'default', // 'default' atau 'berita'
  autoEditFirst = false, // muat konten pertama LANGSUNG ke form (untuk edit 1 item)
  heading,      // override judul halaman (mis. PostBeritaCard: "Tambah Berita")
  subheading,   // override teks bantu di bawah judul
  onSave,
  onCancel,
  saveStatus,
  setSaveStatus,
}) => {
  // --- STATE FORM (untuk menambah / mengedit satu konten) ---
  // Inisialisasi SEKALI saat mount dari initialContents (lazy init). Sengaja
  // TIDAK memakai useEffect untuk men-seed ulang: setKonten "dari luar" akan
  // membuat prop `data` CKEditor berbeda dari isi editor, memicu wrapper
  // memanggil editor.data.set() (reset editor + kursor) di render berikutnya —
  // itulah biang bug "klik Simpan harus 2x" saat mengedit. Dengan lazy init,
  // `konten` HANYA berubah lewat onChange editor (seperti mode Tambah yang sudah
  // benar). Pergantian item edit ditangani lewat `key` di Default (remount).
  const [judul, setJudul] = useState(() => initialContents?.[0]?.judul || '');
  const [konten, setKonten] = useState(() => initialContents?.[0]?.konten || '');
  const [coverUrl, setCoverUrl] = useState(() => initialContents?.[0]?.coverUrl || '');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Guard anti klik-ganda. Pakai ref (bukan hanya state) karena ref berubah
  // SINKRON — klik kedua di tick yang sama langsung tertahan sebelum sempat
  // mengirim request kedua (biang data ganda di DB).
  const savingRef = useRef(false);

  const handleSimpan = async () => {
    if (savingRef.current) return; // sudah ada proses simpan berjalan → abaikan

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
      status: initialContents?.[0]?.status || 'draf', // Pertahankan status (tayang/draf)
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
    if (!onSave) {
      console.log(data); // fallback standalone
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    try {
      await onSave(data);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
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
            {editorType === 'berita' ? (
              <CKEditorBerita
                data={konten}
                onChange={setKonten}
                thumbnailUrl={coverUrl}
                onThumbnailChange={setCoverUrl}
              />
            ) : (
              <CKEditorDefault
                data={konten}
                onChange={setKonten}
                thumbnailUrl={coverUrl}
                onThumbnailChange={setCoverUrl}
              />
            )}
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
          <button className="pd-btn pd-btn-batal" onClick={handleBatal} disabled={isSaving}>
            Batal
          </button>
          <button className="pd-btn pd-btn-simpan" onClick={handleSimpan} disabled={isSaving}>
            {isSaving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default PostDefault;