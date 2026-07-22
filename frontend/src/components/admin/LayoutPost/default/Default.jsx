import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../default/PostDefault.css'; 
import '../berita/PostBeritaCard.css';
import PostDefault from '../default/PostDefault';

// =========================================================================
//  DEFAULT CARD — halaman KELOLA KONTEN (layout "Default").
//  -----------------------------------------------------------------------
//  Muncul saat Super Admin membuat menu bertipe Post dengan layout Default.
//  Menampilkan tabel daftar konten: Nomor, Judul, Deskripsi, dan Aksi.
//  Setiap penambahan, pengeditan, atau penghapusan akan langsung memicu
//  penyimpanan ke server melalui onSave prop.
// =========================================================================

const PAGE_SIZE_OPTIONS = [10, 25, 50];

// Ubah HTML (dari CKEditor) -> teks polos untuk pratinjau kolom Deskripsi.
const htmlToText = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
};

const EMPTY_ARRAY = [];

const Default = ({ menuName = '', routeAction = '', initialContents = EMPTY_ARRAY, onSave, onCancel, saveStatus, setSaveStatus }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [kontenList, setKontenList] = useState(initialContents || []);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [highlightedRow, setHighlightedRow] = useState(null);

  const highlightId = location.state?.highlightId;
  const highlightSumber = location.state?.highlightSumber;
  
  // Deteksi mode editor dari routeAction
  const isAddMode = routeAction === 'tambah';
  const isEditMode = routeAction.startsWith('edit/');
  const editId = isEditMode ? routeAction.split('/')[1] : null;
  const isEditorActive = isAddMode || isEditMode;

  // Sync state if initialContents changes from parent fetch
  useEffect(() => {
    setKontenList(initialContents || []);
  }, [initialContents]);

  // --- Filter + pagination ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return kontenList;
    return kontenList.filter(
      (b) =>
        b.judul.toLowerCase().includes(q) ||
        htmlToText(b.konten).toLowerCase().includes(q)
    );
  }, [kontenList, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * pageSize;
  const visible = filtered.slice(startIdx, startIdx + pageSize);

  useEffect(() => {
    if (highlightId && highlightSumber === 'halaman_konten' && filtered.length > 0 && !highlightedRow) {
      const idx = filtered.findIndex((b) => String(b.id) === String(highlightId));
      if (idx !== -1) {
        const targetPage = Math.floor(idx / pageSize) + 1;
        setCurrentPage(targetPage);
        setHighlightedRow(String(highlightId));
        setTimeout(() => {
          const el = document.getElementById(`row-${highlightId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    }
  }, [highlightId, highlightSumber, filtered, pageSize, highlightedRow]);

  // --- Aksi ---
  const handleTambah = () => {
    // Arahkan ke rute tambah konten dengan mempertahankan state menu
    const currentPath = location.pathname.replace(/\/$/, '');
    navigate(`${currentPath}/tambah`, { state: location.state });
  };
  
  const handleEdit = (id) => {
    // Arahkan ke rute edit dengan mempertahankan state menu
    const currentPath = location.pathname.replace(/\/$/, '');
    navigate(`${currentPath}/edit/${id}`, { state: location.state });
  };

  const handleToggleTampil = async (id, currentVal) => {
    const nextList = kontenList.map((b) =>
      b.id === id ? { ...b, status: !currentVal ? 'terbit' : 'draf' } : b
    );
    setKontenList(nextList);
    if (onSave) {
      await onSave({ contents: nextList }); // Simpan ke backend
    }
  };

  const handleEditorCancel = () => {
    if (onCancel) onCancel();
    else navigate(-1);
  };

  const handleEditorSave = async ({ contents = [] }) => {
    let nextList;
    if (isAddMode) {
      // Append new contents, defaulting to 'draf' so light switch is off
      const newContents = contents.map(c => ({ ...c, status: c.status || 'draf' }));
      nextList = [...newContents, ...kontenList];
    } else {
      nextList = kontenList.flatMap((b) => {
        if (String(b.id) !== String(editId)) return [b];
        // The first content replaces the edited one, any additional contents are appended
        return contents;
      });
    }

    if (onSave) {
      const success = await onSave({ contents: nextList }); // Simpan ke backend
      if (success) {
        setKontenList(nextList);
        if (isAddMode) setCurrentPage(1);
        navigate(-1); // Kembali ke tabel setelah sukses
      }
    } else {
      setKontenList(nextList);
      if (isAddMode) setCurrentPage(1);
      navigate(-1); // Kembali ke tabel
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const nextList = kontenList.filter((b) => b.id !== deleteTarget.id);
    setKontenList(nextList);
    if (onSave) onSave({ contents: nextList }); // Simpan ke backend
    setDeleteTarget(null);
  };

  const buildPageList = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, page, page - 1, page + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const result = [];
    let prev = 0;
    for (const p of sorted) {
      if (prev && p - prev > 1) result.push('...');
      result.push(p);
      prev = p;
    }
    return result;
  };

  // Konten yang sedang diedit + data awal editor (identitas stabil via useMemo).
  const editing = isEditMode ? kontenList.find((b) => String(b.id) === String(editId)) : null;
  const initialForEditor = useMemo(() => (editing ? [editing] : []), [editing]);

  if (isEditorActive) {
    return (
      // key: remount PostDefault saat ganti item edit / pindah tambah↔edit,
      // supaya form di-inisialisasi ulang dari data item yang benar (PostDefault
      // meng-init state SEKALI saat mount, tanpa efek seeding).
      <PostDefault
        key={isEditMode ? `edit-${editId}` : 'tambah'}
        heading={editing ? 'Edit Konten' : 'Tambah Konten'}
        subheading={
          editing
            ? 'Perbarui judul & isi konten ini, lalu klik Simpan.'
            : 'Tulis judul & isi konten.'
        }
        initialContents={initialForEditor}
        autoEditFirst={!!editing}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
        saveStatus={saveStatus}
        setSaveStatus={setSaveStatus}
      />
    );
  }

  return (
    <div className="postdefault">
      <main className="bc-content">
        <div className="pd-heading">
          <h1>{menuName ? `Kelola Konten — ${menuName}` : 'Kelola Konten'}</h1>
          <p>Kelola daftar konten yang tampil di halaman user.</p>
        </div>

        <div className="bc-toolbar">
          <div className="bc-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Masukan kata kunci..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button className="bc-btn-tambah" onClick={handleTambah}>
            <i className="fa-solid fa-plus"></i> Tambah Konten
          </button>
        </div>

        <section className="bc-table-card">
          <div className="bc-table-scroll">
            <table className="bc-table">
              <thead>
                <tr>
                  <th className="bc-col-no" style={{width: '60px'}}>No.</th>
                  <th className="bc-col-judul">Judul Konten</th>
                  <th className="bc-col-desk">Deskripsi</th>
                  <th className="bc-col-pembuat">Pembuat</th>
                  <th className="bc-col-tampil" style={{width: '180px', textAlign: 'center'}}>Tampilkan di Beranda</th>
                  <th className="bc-col-aksi" style={{width: '120px', textAlign: 'center'}}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="bc-empty-row">
                      Tidak ada konten yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  visible.map((b, i) => (
                    <tr 
                      key={b.id} 
                      id={`row-${b.id}`} 
                      className={highlightedRow === String(b.id) ? 'row-blink' : ''}
                    >
                      <td className="bc-col-no">{startIdx + i + 1}</td>
                      <td className="bc-col-judul">
                        <span className="bc-judul" title={b.judul}>{b.judul}</span>
                      </td>
                      <td className="bc-col-desk">
                        <span className="bc-desk">{htmlToText(b.konten) || '—'}</span>
                      </td>
                      <td className="bc-col-pembuat">
                        <span className="bc-pembuat">{b.pembuat_nama || b.pembuat_email || 'Sistem'}</span>
                      </td>
                      <td className="bc-col-tampil" style={{textAlign: 'center'}}>
                        <label className="bc-switch">
                          <input 
                            type="checkbox" 
                            checked={b.status === 'terbit'} 
                            onChange={() => handleToggleTampil(b.id, b.status === 'terbit')} 
                          />
                          <span className="bc-slider"></span>
                        </label>
                      </td>
                      <td className="bc-col-aksi">
                        <div className="bc-actions" style={{justifyContent: 'center'}}>
                          <button className="bc-action-btn" title="Edit" onClick={() => handleEdit(b.id)}>
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            className="bc-action-btn bc-action-danger"
                            title="Hapus"
                            onClick={() => setDeleteTarget(b)}
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bc-table-footer">
            <span className="bc-footer-info">
              Menampilkan {filtered.length === 0 ? 0 : startIdx + 1}-
              {Math.min(startIdx + pageSize, filtered.length)} dari {filtered.length} data konten
            </span>

            <div className="bc-footer-right">
              <label className="bc-perpage">
                <span>Data per halaman</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <div className="bc-pagination">
                <button
                  className="bc-page-btn"
                  disabled={page === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>

                {buildPageList().map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="bc-page-dots">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`bc-page-btn ${p === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  className="bc-page-btn"
                  disabled={page === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {deleteTarget && (
        <div className="bc-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="bc-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="bc-modal-title">Hapus Konten</h3>
            <p className="bc-modal-desc">
              Apakah Anda yakin ingin menghapus konten <b>“{deleteTarget.judul}”</b>? Tindakan ini
              tidak dapat dibatalkan.
            </p>
            <div className="bc-modal-actions">
              <button className="pd-btn pd-btn-batal" onClick={() => setDeleteTarget(null)}>
                Batal
              </button>
              <button className="pd-btn bc-btn-hapus" onClick={confirmDelete}>
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Default;
