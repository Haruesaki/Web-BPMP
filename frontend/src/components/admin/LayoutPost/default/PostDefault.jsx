import React, { useState, useEffect, useMemo } from 'react';
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
// Buang tag HTML untuk pratinjau ringkas di daftar konten.
const stripHtml = (html) =>
  html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';



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
  // Normalisasi sekali: pastikan tiap konten awal punya id yang stabil, agar
  // id di daftar konten cocok dengan editingId form saat autoEditFirst.
  const normalizedInitial = useMemo(
    () => initialContents.map((c) => ({ id: c.id || makeId(), ...c })),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Daftar konten yang sudah ditambahkan.
  const [contents, setContents] = useState(normalizedInitial);

  // Saat autoEditFirst, form langsung menampilkan konten pertama (mode edit
  // item) sehingga CKEditor tampil sudah terisi judul + konten.
  const firstContent = autoEditFirst ? normalizedInitial[0] : null;

  // --- STATE FORM (untuk menambah / mengedit satu konten) ---
  const [judul, setJudul] = useState(firstContent ? firstContent.judul || '' : '');
  const [konten, setKonten] = useState(firstContent ? firstContent.konten || '' : '');
  const [editingId, setEditingId] = useState(firstContent ? firstContent.id : null);
  const [formError, setFormError] = useState('');




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
    window.scrollTo({ top: 0 });
  };

  const handleHapusItem = (id) => {
    setContents((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) resetForm();
  };

  const handleSimpan = () => {
    // Commit isi form yang belum di-"Tambah/Perbarui" agar tidak hilang saat
    // admin langsung klik Simpan (mis. saat mengedit satu konten). Bila judul
    // form kosong, tidak ada yang di-commit.
    let finalContents = contents;
    if (judul.trim()) {
      const entry = { judul: judul.trim(), konten };
      finalContents = editingId
        ? contents.map((c) => (c.id === editingId ? { ...c, ...entry } : c))
        : [...contents, { id: makeId(), ...entry }];
    }

    if (finalContents.length === 0) {
      if (setSaveStatus) {
        setSaveStatus({ error: true, message: 'Form harus diisi minimal 1 konten untuk bisa menyimpan ke database.' });
      }
      return;
    }

    const data = { contents: finalContents };
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
          <h1>{heading || (menuName ? `Edit Konten — ${menuName}` : 'Buat Post Baru')}</h1>
          <p>{subheading || 'Tambahkan satu konten untuk ditampilkan di halaman user.'}</p>
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
          <div className="pd-field" style={{ position: 'relative' }}>
            <label>Konten</label>
            <CKEditorComponent data={konten} onChange={setKonten} />
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
