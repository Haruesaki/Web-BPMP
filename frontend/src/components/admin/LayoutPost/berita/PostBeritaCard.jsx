import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../../api/axiosInstance';
import '../default/PostDefault.css';
import './PostBeritaCard.css';
import PostDefault from '../default/PostDefault';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const htmlToText = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
};

const formatWaktu = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

const PostBeritaCard = ({ menuName = '', menuId: propMenuId, routeAction = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const menuId = propMenuId || location.state?.menuId || null;

  const isAddMode = routeAction === 'tambah';
  const isEditMode = routeAction.startsWith('edit/');
  const editId = isEditMode ? routeAction.split('/')[1] : null;
  const isEditorActive = isAddMode || isEditMode;

  const [beritaList, setBeritaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchBerita = async () => {
    if (!menuId) { setLoading(false); return; }
    try {
      const res = await axiosInstance.get(`/api/berita/${menuId}`);
      setBeritaList((res.data || []).map(b => ({
        ...b,
        id: b.id,
        judul: b.judul,
        deskripsi: htmlToText(b.deskripsi_kaya),
        konten: b.deskripsi_kaya,
        cover: !!b.url_foto,
        coverUrl: b.url_foto,
        statusTayang: b.status === 'terbit',
        waktuTayang: b.waktu_tayang,
        pembuat: b.pembuat_nama || b.pembuat_email || 'Unknown'
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBerita();
  }, [menuId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return beritaList;
    return beritaList.filter(
      (b) =>
        b.judul.toLowerCase().includes(q) ||
        (b.deskripsi || '').toLowerCase().includes(q) ||
        (b.pembuat || '').toLowerCase().includes(q)
    );
  }, [beritaList, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * pageSize;
  const visible = filtered.slice(startIdx, startIdx + pageSize);

  const toggleTayang = async (id) => {
    const b = beritaList.find(x => x.id === id);
    if (!b) return;
    const nyala = !b.statusTayang;
    const newWaktu = nyala ? (b.waktuTayang || new Date().toISOString()) : b.waktuTayang;
    
    try {
      await axiosInstance.put(`/api/berita/${id}`, { statusTayang: nyala, waktuTayang: newWaktu });
      setBeritaList((prev) => prev.map(x => x.id === id ? { ...x, statusTayang: nyala, waktuTayang: newWaktu } : x));
    } catch (err) { console.error(err); }
  };

  const handleTambah = () => {
    const currentPath = location.pathname.replace(/\/$/, '');
    navigate(`${currentPath}/tambah`, { state: location.state });
  };
  const handleEdit = (id) => {
    const currentPath = location.pathname.replace(/\/$/, '');
    navigate(`${currentPath}/edit/${id}`, { state: location.state });
  };

  const handleEditorSave = async ({ contents = [] }) => {
    if (!contents.length) return;
    
    if (isAddMode) {
      for (const c of contents) {
        await axiosInstance.post(`/api/berita/${menuId}`, { judul: c.judul, deskripsi_kaya: c.konten, coverUrl: c.coverUrl || null, statusTayang: false });
      }
    } else if (isEditMode) {
      const mainContent = contents[0];
      await axiosInstance.put(`/api/berita/${editId}`, { judul: mainContent.judul, deskripsi_kaya: mainContent.konten, coverUrl: mainContent.coverUrl || null });
      for (let i = 1; i < contents.length; i++) {
        await axiosInstance.post(`/api/berita/${menuId}`, { judul: contents[i].judul, deskripsi_kaya: contents[i].konten, coverUrl: contents[i].coverUrl || null, statusTayang: false });
      }
    }
    
    fetchBerita();
    navigate(-1);
  };

  const handleEditorCancel = () => navigate(-1);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/api/berita/${deleteTarget.id}`);
      setBeritaList((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    } catch (err) { console.error(err); }
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

  if (loading) return <div style={{ padding: 32, color: '#c7c4d8' }}>Memuat berita...</div>;

  if (isEditorActive) {
    const editing = isEditMode ? beritaList.find((b) => String(b.id) === String(editId)) : null;
    const initialContents = editing
      ? [{ id: editing.id, judul: editing.judul, konten: editing.konten, coverUrl: editing.coverUrl }]
      : [];
    return (
      <PostDefault
        heading={editing ? 'Edit Berita' : 'Tambah Berita'}
        subheading={editing ? 'Perbarui judul & isi konten berita ini, lalu klik Simpan.' : 'Tulis judul & isi konten berita.'}
        initialContents={initialContents}
        autoEditFirst={!!editing}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
      />
    );
  }

  return (
    <div className="postdefault">
      <main className="bc-content">
        <div className="pd-heading">
          <h1>{menuName ? `Kelola Berita — ${menuName}` : 'Kelola Berita'}</h1>
          <p>Kelola daftar berita yang tampil di halaman user.</p>
        </div>

        <div className="bc-toolbar">
          <div className="bc-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input type="text" placeholder="Masukan kata kunci..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
          </div>
          <button className="bc-btn-tambah" onClick={handleTambah}>
            <i className="fa-solid fa-plus"></i> Tambah Berita
          </button>
        </div>

        <section className="bc-table-card">
          <div className="bc-table-scroll">
            <table className="bc-table">
              <thead>
                <tr>
                  <th className="bc-col-no">No.</th>
                  <th className="bc-col-foto">Thumbnail</th>
                  <th className="bc-col-judul">Judul Berita</th>
                  <th className="bc-col-desk">Deskripsi</th>
                  <th className="bc-col-pembuat">Pembuat</th>
                  <th className="bc-col-waktu">Waktu Tayang (Otomatis)</th>
                  <th className="bc-col-status">Tampilkan di Beranda</th>
                  <th className="bc-col-aksi">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr><td colSpan={8} className="bc-empty-row">Tidak ada berita yang cocok dengan pencarian.</td></tr>
                ) : (
                  visible.map((b, i) => (
                    <tr key={b.id}>
                      <td className="bc-col-no">{startIdx + i + 1}</td>
                      <td>
                        <div className="bc-thumb">
                          {b.cover ? <img src={b.coverUrl || ''} alt={b.judul} /> : <div className="bc-thumb-empty"><i className="fa-regular fa-image"></i><span>No Image</span></div>}
                        </div>
                      </td>
                      <td className="bc-col-judul"><span className="bc-judul" title={b.judul}>{b.judul}</span></td>
                      <td className="bc-col-desk"><span className="bc-desk">{b.deskripsi || '—'}</span></td>
                      <td className="bc-col-pembuat bc-pembuat">{b.pembuat}</td>
                      <td className="bc-col-waktu">
                        {b.statusTayang && b.waktuTayang ? <span className="bc-waktu">{formatWaktu(b.waktuTayang)}</span> : <span className="bc-waktu-off">Belum diaktifkan</span>}
                      </td>
                      <td className="bc-col-status">
                        <label className="bc-switch" title={b.statusTayang ? 'Tayang' : 'Tidak tayang'}>
                          <input type="checkbox" checked={b.statusTayang} onChange={() => toggleTayang(b.id)} />
                          <span className="bc-slider"></span>
                        </label>
                      </td>
                      <td className="bc-col-aksi">
                        <div className="bc-actions">
                          <button className="bc-action-btn" title="Edit" onClick={() => handleEdit(b.id)}><i className="fa-solid fa-pen"></i></button>
                          <button className="bc-action-btn bc-action-danger" title="Hapus" onClick={() => setDeleteTarget(b)}><i className="fa-solid fa-trash-can"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="bc-table-footer">
            <span className="bc-footer-info">Menampilkan {filtered.length === 0 ? 0 : startIdx + 1}-{Math.min(startIdx + pageSize, filtered.length)} dari {filtered.length} data berita</span>
            <div className="bc-footer-right">
              <label className="bc-perpage">
                <span>Data per halaman</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                  {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <div className="bc-pagination">
                <button className="bc-page-btn" disabled={page === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}><i className="fa-solid fa-chevron-left"></i></button>
                {buildPageList().map((p, idx) => p === '...' ? <span key={`dots-${idx}`} className="bc-page-dots">…</span> : <button key={p} className={`bc-page-btn ${p === page ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>)}
                <button className="bc-page-btn" disabled={page === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}><i className="fa-solid fa-chevron-right"></i></button>
              </div>
            </div>
          </div>
        </section>
      </main>
      {deleteTarget && (
        <div className="bc-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="bc-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="bc-modal-title">Hapus Berita</h3>
            <p className="bc-modal-desc">Apakah Anda yakin ingin menghapus berita <b>“{deleteTarget.judul}”</b>? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="bc-modal-actions">
              <button className="pd-btn pd-btn-batal" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="pd-btn bc-btn-hapus" onClick={confirmDelete}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PostBeritaCard;