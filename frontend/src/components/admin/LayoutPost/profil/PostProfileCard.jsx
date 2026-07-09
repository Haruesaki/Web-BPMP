import React, { useState } from 'react';
import '../default/PostDefault.css'; // pakai ulang palet + kelas dasar (.pd-*)
import './PostProfileCard.css';
import { uploadImageToServer } from '../uploadImage';

// =========================================================================
//  POST PROFILE CARD — EDITOR konten admin untuk layout "Profile Card".
//  -----------------------------------------------------------------------
//  Muncul saat Super Admin membuat menu bertipe Post dengan layout
//  "Profile Card". Mendukung CRUD BANYAK kartu profil (satu per karyawan):
//  tambah, edit, hapus. Tiap kartu berisi: Gambar, Nama, Jabatan, Quotes.
//  Dirender oleh MenuContentEditor via layoutRegistry (key: 'profile-card').
//
//  Props (opsional supaya tetap bisa dipakai standalone):
//    - menuName         : nama menu yang sedang diedit (untuk judul halaman)
//    - initialProfiles  : array kartu awal [{ id?, nama, jabatan, gambar, quotes }]
//    - onSave(data)     : dipanggil saat Simpan → { profiles: [...] }
//    - onCancel()       : dipanggil saat Batal
// =========================================================================

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const inisialDari = (n) => (n && n.trim() ? n.trim().slice(0, 2).toUpperCase() : '?');

const PostProfileCard = ({
  menuName = '',
  initialProfiles = [],
  onSave,
  onCancel,
}) => {
  // Daftar kartu profil yang sudah ditambahkan.
  const [cards, setCards] = useState(() =>
    initialProfiles.map((p) => ({ id: p.id || makeId(), ...p }))
  );

  // --- STATE FORM (untuk menambah / mengedit satu kartu) ---
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [quotes, setQuotes] = useState('');
  const [gambar, setGambar] = useState(''); // URL final dari server
  const [preview, setPreview] = useState(''); // yang ditampilkan di avatar form
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null); // null = mode tambah

  const resetForm = () => {
    setNama('');
    setJabatan('');
    setQuotes('');
    setGambar('');
    setPreview('');
    setUploadError('');
    setFormError('');
    setEditingId(null);
  };

  const handlePilihGambar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // reset agar file yang sama bisa dipilih lagi
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Berkas harus berupa gambar.');
      return;
    }

    setUploadError('');
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl); // pratinjau instan sebelum upload selesai
    setUploading(true);
    try {
      const url = await uploadImageToServer(file);
      setGambar(url);
      setPreview(url);
      URL.revokeObjectURL(localUrl);
    } catch (err) {
      setUploadError(err.message || 'Gagal mengunggah gambar.');
      setGambar(''); // URL server tak ada → jangan disimpan setengah jadi
    } finally {
      setUploading(false);
    }
  };

  const handleHapusGambar = () => {
    setGambar('');
    setPreview('');
    setUploadError('');
  };

  // Tambah kartu baru ATAU perbarui kartu yang sedang diedit.
  const handleTambahAtauPerbarui = () => {
    if (uploading) return;
    if (!nama.trim()) {
      setFormError('Nama wajib diisi.');
      return;
    }
    const entry = {
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      gambar,
      quotes: quotes.trim(),
    };
    if (editingId) {
      setCards((prev) => prev.map((c) => (c.id === editingId ? { ...c, ...entry } : c)));
    } else {
      setCards((prev) => [...prev, { id: makeId(), ...entry }]);
    }
    resetForm();
  };

  const handleEditCard = (id) => {
    const c = cards.find((x) => x.id === id);
    if (!c) return;
    setNama(c.nama || '');
    setJabatan(c.jabatan || '');
    setQuotes(c.quotes || '');
    setGambar(c.gambar || '');
    setPreview(c.gambar || '');
    setUploadError('');
    setFormError('');
    setEditingId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHapusCard = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    if (editingId === id) resetForm();
  };

  const handleSimpan = () => {
    const data = { profiles: cards };
    if (onSave) onSave(data);
    else console.log(data); // fallback standalone
  };

  const handleBatal = () => {
    if (onCancel) onCancel();
    else {
      setCards([]);
      resetForm();
    }
  };

  return (
    <div className="postdefault">
      <main className="pd-content">
        {/* ---------- HEADING ---------- */}
        <div className="pd-heading">
          <h1>{menuName ? `Edit Profil — ${menuName}` : 'Buat Profile Card'}</h1>
          <p>Tambahkan satu atau beberapa kartu profil untuk ditampilkan di halaman user.</p>
        </div>

        {/* ---------- FORM: TAMBAH / EDIT SATU PROFIL ---------- */}
        <section className="pd-card">
          <h2 className="ppc-section-title">{editingId ? 'Edit Profil' : 'Tambah Profil'}</h2>

          {/* Gambar Profil */}
          <div className="pd-field">
            <label>Gambar Profil</label>
            <div className="ppc-photo-row">
              <div className="ppc-avatar">
                {preview ? (
                  <img src={preview} alt="Pratinjau profil" />
                ) : (
                  <span className="ppc-avatar-fallback">{inisialDari(nama)}</span>
                )}
              </div>

              <div className="ppc-photo-actions">
                <div className="ppc-photo-buttons">
                  <label className={`pd-btn pd-btn-simpan ppc-upload-btn${uploading ? ' ppc-disabled' : ''}`}>
                    {uploading ? 'Mengunggah…' : preview ? 'Ganti Gambar' : 'Unggah Gambar'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePilihGambar}
                      hidden
                      disabled={uploading}
                    />
                  </label>
                  {preview && !uploading && (
                    <button type="button" className="pd-btn pd-btn-batal" onClick={handleHapusGambar}>
                      Hapus
                    </button>
                  )}
                </div>
                <p className="ppc-hint">Format gambar, maks. 10 MB. Disarankan rasio 1:1.</p>
                {uploadError && <p className="ppc-error">{uploadError}</p>}
              </div>
            </div>
          </div>

          {/* Nama */}
          <div className="pd-field">
            <label htmlFor="ppc-nama">Nama</label>
            <input
              id="ppc-nama"
              type="text"
              className="pd-input"
              placeholder="Masukkan nama…"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </div>

          {/* Jabatan */}
          <div className="pd-field">
            <label htmlFor="ppc-jabatan">Jabatan</label>
            <input
              id="ppc-jabatan"
              type="text"
              className="pd-input"
              placeholder="Masukkan jabatan…"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
            />
          </div>

          {/* Quotes */}
          <div className="pd-field">
            <label htmlFor="ppc-quotes">Quotes</label>
            <textarea
              id="ppc-quotes"
              className="pd-input ppc-textarea"
              placeholder="Masukkan kutipan…"
              rows={4}
              value={quotes}
              onChange={(e) => setQuotes(e.target.value)}
            />
          </div>

          {formError && <p className="ppc-error">{formError}</p>}

          <div className="ppc-form-actions">
            {editingId && (
              <button type="button" className="pd-btn pd-btn-batal" onClick={resetForm}>
                Batal Edit
              </button>
            )}
            <button
              type="button"
              className={`pd-btn pd-btn-simpan${uploading ? ' ppc-disabled' : ''}`}
              onClick={handleTambahAtauPerbarui}
              disabled={uploading}
            >
              {editingId ? 'Perbarui Profil' : '+ Tambah Profil'}
            </button>
          </div>
        </section>

        {/* ---------- DAFTAR PROFIL ---------- */}
        <section className="pd-card ppc-list-card">
          <h2 className="ppc-section-title">Daftar Profil ({cards.length})</h2>
          {cards.length === 0 ? (
            <p className="ppc-empty">Belum ada profil. Tambahkan lewat form di atas.</p>
          ) : (
            <div className="ppc-list">
              {cards.map((c) => (
                <div className="ppc-list-item" key={c.id}>
                  <div className="ppc-list-avatar">
                    {c.gambar ? <img src={c.gambar} alt={c.nama} /> : <span>{inisialDari(c.nama)}</span>}
                  </div>
                  <div className="ppc-list-info">
                    <div className="ppc-list-nama">{c.nama}</div>
                    {c.jabatan && <div className="ppc-list-jabatan">{c.jabatan}</div>}
                    {c.quotes && <div className="ppc-list-quotes">“{c.quotes}”</div>}
                  </div>
                  <div className="ppc-list-actions">
                    <button type="button" className="ppc-icon-btn" onClick={() => handleEditCard(c.id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ppc-icon-btn ppc-icon-btn-danger"
                      onClick={() => handleHapusCard(c.id)}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---------- AKSI SIMPAN SELURUH DAFTAR ---------- */}
        <div className="pd-actions">
          <button className="pd-btn pd-btn-batal" onClick={handleBatal}>
            Batal
          </button>
          <button
            className={`pd-btn pd-btn-simpan${uploading ? ' ppc-disabled' : ''}`}
            onClick={handleSimpan}
            disabled={uploading}
          >
            Simpan
          </button>
        </div>
      </main>
    </div>
  );
};

export default PostProfileCard;
