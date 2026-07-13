import React, { useMemo, useState } from 'react';
import '../default/PostDefault.css'; // pakai ulang palet gelap + tombol dasar (.pd-*)
import './PostBeritaCard.css';
import PostDefault from '../default/PostDefault';

// =========================================================================
//  POST BERITA CARD — halaman KELOLA BERITA (layout "Berita Card").
//  -----------------------------------------------------------------------
//  Muncul saat Super Admin membuat menu bertipe Post dengan layout
//  "Berita Card". Menampilkan tabel daftar berita: Nomor, Foto (cover),
//  Judul, Deskripsi, Pembuat, Waktu Tayang (otomatis), switch Status Tayang,
//  dan aksi (edit/hapus). Dilengkapi search di atas tabel + tombol Tambah
//  Berita, serta footer "Menampilkan X-Y dari N data" + pagination.
//  Dirender oleh MenuContentEditor via layoutRegistry (key: 'berita-card').
//
//  Props (opsional supaya tetap bisa dipakai standalone):
//    - menuName        : nama menu yang sedang diedit (untuk judul halaman)
//    - initialBerita   : array berita awal (kalau kosong → pakai dummy)
//    - onSave / onCancel : disediakan agar kompatibel dengan host editor
//
//  CATATAN: data masih DUMMY. Nanti diganti fetch ke backend
//  (mis. GET /api/berita) dan aksi CRUD disambungkan ke API.
// =========================================================================

const PAGE_SIZE_OPTIONS = [10, 25, 50];

// Ubah HTML (dari CKEditor) → teks polos untuk pratinjau kolom Deskripsi.
// Konten HTML lengkapnya tetap disimpan di field `konten` tiap berita.
const htmlToText = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
};

// Format tanggal → "YYYY-MM-DD HH:mm:ss" (menyerupai kolom Waktu Tayang).
const formatWaktu = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};

// --- DATA DUMMY: 24 berita (menyerupai contoh) ---
const PEMBUAT = 'bpmp_lampung@smail.co.id';

// Contoh cover (data-URI SVG) supaya jalur <img> terlihat tanpa file eksternal.
// Nanti diganti URL asli dari upload (uploadImageToServer).
const SAMPLE_COVER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="108" height="80"><rect width="108" height="80" fill="#5b5fe8"/><text x="54" y="46" font-family="Arial" font-size="22" font-weight="bold" fill="#fff" text-anchor="middle">SM</text></svg>'
  );

const makeDummy = () => {
  const seed = [
    { judul: 'test 1 - sm', deskripsi: 'testing logo sm', tayang: true, waktu: '2026-05-04T09:09:29', cover: true, coverUrl: SAMPLE_COVER },
    { judul: 'test', deskripsi: 'test', tayang: false, waktu: null },
    { judul: 'Testing judul berita 1', deskripsi: '', tayang: true, waktu: '2026-03-11T13:21:24' },
    { judul: 'tes judul berita 1', deskripsi: 'Judul Berita Judul Berita', tayang: true, waktu: '2026-03-11T09:01:10' },
    { judul: 'tess', deskripsi: '', tayang: true, waktu: '2026-03-08T13:07:36' },
    { judul: 'test', deskripsi: '', tayang: true, waktu: '2026-03-06T14:57:18' },
    { judul: 'Hindari Kecurangan, BPMP Lampung Gencar Sosialisasikan SPMB Tahun 2026', deskripsi: 'Bandar Lampung, 30 Januari 2026 - BPMP Lampung menggencarkan sosialisasi SPMB.', tayang: false, waktu: null },
    { judul: 'Mendikdasmen Salurkan Bantuan ke Sekolah-sekolah terdampak Bencana di Aceh', deskripsi: 'Mendikdasmen melakukan kunjungan langsung ke sekolah terdampak bencana.', tayang: true, waktu: '2026-02-06T14:37:23' },
    { judul: 'Darma Wanita Persatuan BPMP Lampung Adakan Pelatihan Kreasi Garnish Cantik', deskripsi: 'Bandar Lampung, 23 Januari 2026. Darmawanita Persatuan menggelar pelatihan.', tayang: false, waktu: null },
  ];

  const extra = [];
  for (let i = seed.length; i < 24; i++) {
    const on = i % 3 !== 0;
    extra.push({
      judul: `Berita contoh nomor ${i + 1}`,
      deskripsi: `Ringkasan singkat untuk berita contoh nomor ${i + 1} sebagai data uji.`,
      tayang: on,
      waktu: on ? `2026-01-${String((i % 28) + 1).padStart(2, '0')}T10:15:00` : null,
    });
  }

  return [...seed, ...extra].map((b, i) => ({
    id: i + 1,
    pembuat: PEMBUAT,
    cover: b.cover || false,
    statusTayang: b.tayang,
    waktuTayang: b.waktu,
    ...b,
  }));
};

const PostBeritaCard = ({ menuName = '', initialBerita = null }) => {
  const [beritaList, setBeritaList] = useState(() => initialBerita || makeDummy());
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Editor PostDefault: null = tabel; { mode:'add' } atau { mode:'edit', id }.
  const [editor, setEditor] = useState(null);

  // Email admin yang sedang login → mengisi kolom Pembuat berita baru.
  const adminEmail = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('adminSession'))?.email || PEMBUAT;
    } catch {
      return PEMBUAT;
    }
  }, []);

  // --- Filter + pagination ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return beritaList;
    return beritaList.filter(
      (b) =>
        b.judul.toLowerCase().includes(q) ||
        (b.deskripsi || '').toLowerCase().includes(q) ||
        b.pembuat.toLowerCase().includes(q)
    );
  }, [beritaList, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * pageSize;
  const visible = filtered.slice(startIdx, startIdx + pageSize);

  // --- Aksi ---
  // Toggle status tayang. Saat DIAKTIFKAN dan belum punya waktu, waktu tayang
  // di-set otomatis ke sekarang (meniru "Waktu Tayang (Otomatis)").
  const toggleTayang = (id) =>
    setBeritaList((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const nyala = !b.statusTayang;
        return {
          ...b,
          statusTayang: nyala,
          waktuTayang: nyala ? b.waktuTayang || new Date().toISOString() : b.waktuTayang,
        };
      })
    );

  // Buka editor konten (PostDefault) untuk membuat berita baru.
  const handleTambah = () => setEditor({ mode: 'add' });

  // Buka editor dalam mode edit, ter-prefill data baris berita terpilih.
  const handleEdit = (id) => setEditor({ mode: 'edit', id });

  // Dipanggil saat admin klik "Simpan" di editor PostDefault.
  // PostDefault mengembalikan { contents: [{ id, judul, konten }, ...] }.
  // Tiap item konten = SATU baris berita: judul→Judul, konten (HTML) disimpan
  // penuh + versi teks polos untuk kolom Deskripsi.
  const buildRow = (c, base = {}) => ({
    cover: false,
    statusTayang: false,
    waktuTayang: null,
    pembuat: adminEmail,
    ...base, // saat edit: pertahankan metadata baris lama (status tayang, dsb.)
    judul: c.judul,
    deskripsi: htmlToText(c.konten),
    konten: c.konten,
  });

  const handleEditorSave = ({ contents = [] }) => {
    setBeritaList((prev) => {
      let nextId = (prev.length ? Math.max(...prev.map((b) => b.id)) : 0) + 1;

      // --- MODE TAMBAH: semua konten jadi baris baru di paling atas ---
      if (editor?.mode === 'add') {
        const rows = contents.map((c) => ({ id: nextId++, ...buildRow(c) }));
        return [...rows, ...prev];
      }

      // --- MODE EDIT: ganti baris yang diedit dengan hasil konten ---
      // Konten pertama memperbarui baris itu (metadata lama dipertahankan:
      // pembuat, status tayang, waktu tayang, cover). Konten tambahan (bila
      // admin menambah lebih dari satu) menjadi baris baru tepat setelahnya.
      // Bila semua konten dihapus, baris berita ikut terhapus.
      return prev.flatMap((b) => {
        if (b.id !== editor.id) return [b];
        return contents.map((c, i) =>
          i === 0
            ? { ...buildRow(c, b), id: b.id }
            : { ...buildRow(c), id: nextId++ }
        );
      });
    });

    if (editor?.mode === 'add') setCurrentPage(1);
    setEditor(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setBeritaList((prev) => prev.filter((b) => b.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // Nomor halaman dengan "…" saat terlalu banyak (sama seperti Manajemen User).
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

  // Mode editor: tampilkan komponen PostDefault (CKEditor). Saat Simpan →
  // konten yang dibuat ditambah/menimpa baris berita (handleEditorSave).
  if (editor) {
    const editing =
      editor.mode === 'edit' ? beritaList.find((b) => b.id === editor.id) : null;

    // Prefill: judul + konten HTML baris terpilih. Baris dummy lama yang tak
    // punya `konten` HTML → pakai teks Deskripsi-nya, dibungkus paragraf.
    const initialContents = editing
      ? [
          {
            id: editing.id,
            judul: editing.judul,
            konten:
              editing.konten || (editing.deskripsi ? `<p>${editing.deskripsi}</p>` : ''),
          },
        ]
      : [];

    return (
      <PostDefault
        heading={editing ? 'Edit Berita' : 'Tambah Berita'}
        subheading={
          editing
            ? 'Perbarui judul & isi konten berita ini, lalu klik Simpan.'
            : 'Tulis judul & isi konten berita. Tiap konten yang ditambahkan menjadi satu baris berita.'
        }
        initialContents={initialContents}
        autoEditFirst={!!editing}
        onSave={handleEditorSave}
        onCancel={() => setEditor(null)}
      />
    );
  }

  return (
    <div className="postdefault">
      <main className="bc-content">
        {/* ---------- HEADING ---------- */}
        <div className="pd-heading">
          <h1>{menuName ? `Kelola Berita — ${menuName}` : 'Kelola Berita'}</h1>
          <p>Kelola daftar berita yang tampil di halaman user.</p>
        </div>

        {/* ---------- TOOLBAR: search + tombol tambah ---------- */}
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
            <i className="fa-solid fa-plus"></i> Tambah Berita
          </button>
        </div>

        {/* ---------- TABLE ---------- */}
        <section className="bc-table-card">
          <div className="bc-table-scroll">
            <table className="bc-table">
              <thead>
                <tr>
                  <th className="bc-col-no">No.</th>
                  <th className="bc-col-foto">Foto</th>
                  <th className="bc-col-judul">Judul Berita</th>
                  <th className="bc-col-desk">Deskripsi</th>
                  <th className="bc-col-pembuat">Pembuat</th>
                  <th className="bc-col-waktu">Waktu Tayang (Otomatis)</th>
                  <th className="bc-col-status">Tampilkan Beranda</th>
                  <th className="bc-col-aksi">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="bc-empty-row">
                      Tidak ada berita yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  visible.map((b, i) => (
                    <tr key={b.id}>
                      <td className="bc-col-no">{startIdx + i + 1}</td>

                      {/* Foto / cover */}
                      <td>
                        <div className="bc-thumb">
                          {b.cover ? (
                            <img src={b.coverUrl || ''} alt={b.judul} />
                          ) : (
                            <div className="bc-thumb-empty">
                              <i className="fa-regular fa-image"></i>
                              <span>No Image</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Judul (dipotong bila kepanjangan) */}
                      <td className="bc-col-judul">
                        <span className="bc-judul" title={b.judul}>{b.judul}</span>
                      </td>

                      {/* Deskripsi (truncate) */}
                      <td className="bc-col-desk">
                        <span className="bc-desk">{b.deskripsi || '—'}</span>
                      </td>

                      {/* Pembuat */}
                      <td className="bc-col-pembuat bc-pembuat">{b.pembuat}</td>

                      {/* Waktu Tayang (otomatis) */}
                      <td className="bc-col-waktu">
                        {b.statusTayang && b.waktuTayang ? (
                          <span className="bc-waktu">{formatWaktu(b.waktuTayang)}</span>
                        ) : (
                          <span className="bc-waktu-off">Belum diaktifkan</span>
                        )}
                      </td>

                      {/* Status Tayang (switch) */}
                      <td className="bc-col-status">
                        <label className="bc-switch" title={b.statusTayang ? 'Tayang' : 'Tidak tayang'}>
                          <input
                            type="checkbox"
                            checked={b.statusTayang}
                            onChange={() => toggleTayang(b.id)}
                          />
                          <span className="bc-slider"></span>
                        </label>
                      </td>

                      {/* Aksi */}
                      <td className="bc-col-aksi">
                        <div className="bc-actions">
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

          {/* ---------- FOOTER: info + per-halaman + pagination ---------- */}
          <div className="bc-table-footer">
            <span className="bc-footer-info">
              Menampilkan {filtered.length === 0 ? 0 : startIdx + 1}-
              {Math.min(startIdx + pageSize, filtered.length)} dari {filtered.length} data berita
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

      {/* ================= MODAL: HAPUS BERITA ================= */}
      {deleteTarget && (
        <div className="bc-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="bc-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="bc-modal-title">Hapus Berita</h3>
            <p className="bc-modal-desc">
              Apakah Anda yakin ingin menghapus berita <b>“{deleteTarget.judul}”</b>? Tindakan ini
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

export default PostBeritaCard;
