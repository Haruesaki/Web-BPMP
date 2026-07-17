import React, { useMemo, useState, useEffect } from 'react';
// Reuse tema & layout dari dashboard-admin (variabel CSS --bg-app, dst.
// dideklarasikan di scope ".admin-layout" pada dashboard-admin.css).
import '../DashboardAdmin/dashboard-admin.css';
import './ManajemenUser.css';
import { useUsers } from '../../../hooks/useUsers';
import axiosInstance from '../../../api/axiosInstance';

// =========================================================================
//  DATA DUMMY
//  -----------------------------------------------------------------------
//  Nanti tinggal diganti fetch ke backend (GET /api/users).
// =========================================================================

// Warna avatar dirotasi berdasarkan indeks user.
const AVATAR_COLORS = ['#5b5fe8', '#8a6d1f', '#7a4fae', '#4cae8e', '#3f5aa8', '#b5642e'];

// Pilihan hak akses menu akan di-fetch secara dinamis.

const FIRST_NAMES = [
  'Arya', 'Budi', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi', 'Indah',
  'Joko', 'Kartika', 'Lukman', 'Maya', 'Naufal', 'Oki', 'Putri', 'Rizky',
  'Sari', 'Taufik', 'Umar', 'Vina', 'Wawan', 'Yuni', 'Zaki', 'Nadia',
];
const LAST_NAMES = [
  'Satria', 'Kusuma', 'Putri', 'Lestari', 'Nugraha', 'Pratama', 'Wijaya',
  'Anggraini', 'Saputra', 'Halim', 'Maulana', 'Ramadhan',
];

// Empat user pertama dibuat persis seperti desain, sisanya di-generate.
const buildUsers = () => {
  const seed = [
    { nama: 'Arya Satria', email: 'arya.satria@midnight.cms' },
    { nama: 'Budi Kusuma', email: 'budi.k@midnight.cms' },
    { nama: 'Dewi Putri', email: 'dewi.p@midnight.cms' },
    { nama: 'Eka Lestari', email: 'eka.lestari@midnight.cms' },
  ];

  const users = seed.map((u, i) => ({ id: i + 1, ...u }));

  for (let i = seed.length; i < 150; i++) {
    const nama = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[i % LAST_NAMES.length]}`;
    const email = `${nama.toLowerCase().replace(/\s+/g, '.')}@midnight.cms`;
    users.push({ id: i + 1, nama, email });
  }
  return users;
};

// Ambil inisial dari nama (maks 2 huruf).
const getInitials = (nama) =>
  nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

const PAGE_SIZE = 10;
const EMPTY_FORM = { nama: '', email: '', role: 'admin', password: '', verify: '', access: [] };

const getRoleLabel = (user) =>
  user?.role === 'superadmin' || user?.is_superadmin ? 'Super Admin' : 'Admin';

const ManajemenUser = () => {
  const { users, setUsers, loading, error: fetchError, fetchUsers, deleteUser, addUser, editUser } = useUsers();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [menuAccessOptions, setMenuAccessOptions] = useState([]);

  // Ambil data session admin saat ini
  const currentUser = useMemo(() => {
    const session = sessionStorage.getItem('adminSession');
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        console.error("Gagal membaca session admin", e);
      }
    }
    return null;
  }, []);

  // Modal form (dipakai untuk mode "add" dan "edit").
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [expandedAccessGroups, setExpandedAccessGroups] = useState([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // Modal detail akun (klik baris tabel untuk membuka ringkasan profil singkat).
  const [detailUser, setDetailUser] = useState(null);

  // Modal hapus.
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Ambil data user dari database saat komponen dimuat
  useEffect(() => {
    fetchUsers();
    
    // Fetch daftar menu dinamis untuk opsi checkbox hak akses
    const fetchMenusForAccess = async () => {
      try {
        const res = await axiosInstance.get('/api/menus');
        const data = res.data;
        
        // Memisahkan parent dan child menu
        const parentMenus = data.filter(m => m.induk_id === null).sort((a, b) => a.urutan_tampil - b.urutan_tampil);
        const childMenus = data.filter(m => m.induk_id !== null).sort((a, b) => a.urutan_tampil - b.urutan_tampil);
        
        const dynamicMenuTree = parentMenus.map(p => ({
          label: p.nama_menu,
          submenus: childMenus.filter(c => c.induk_id === p.id).map(c => c.nama_menu)
        }));

        // Gabungkan menu statis (kecuali Beranda & Setting) dengan menu dinamis
        const staticMenus = [
          { label: 'Customize Beranda', submenus: [] },
          { label: 'Pengaturan Menu', submenus: [] },
          { label: 'Manajemen User', submenus: [] }
        ];
        
        setMenuAccessOptions([...staticMenus, ...dynamicMenuTree]);
      } catch (err) {
        console.error('Gagal mengambil daftar menu:', err);
        // Fallback default bila gagal
        setMenuAccessOptions([
          { label: 'Customize Beranda', submenus: [] },
          { label: 'Pengaturan Menu', submenus: [] },
          { label: 'Manajemen User', submenus: [] }
        ]);
      }
    };
    fetchMenusForAccess();
  }, [fetchUsers]);

  // --- Filter + pagination ---
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIdx = (page - 1) * PAGE_SIZE;
  const visibleUsers = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  // --- Handlers form ---
  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setForm(f => {
      if (newRole === 'superadmin') {
        let allAccess = [];
        menuAccessOptions.forEach(menu => {
          allAccess.push(menu.label);
          if (menu.submenus) {
            allAccess.push(...menu.submenus);
          }
        });
        return { ...f, role: newRole, access: allAccess };
      } else {
        return { ...f, role: newRole, access: [] };
      }
    });
  };

  const toggleAccess = (menuLabel, parentLabel = null, isParent = false) => {
    setForm((f) => {
      let nextAccess = [...f.access];
      
      if (isParent) {
         const parentData = menuAccessOptions.find(m => m.label === menuLabel);
         const isCurrentlyChecked = nextAccess.includes(menuLabel);
         
         if (isCurrentlyChecked) {
             // Jika menu utama di-uncheck, hilangkan akses dari menu utama beserta seluruh submenu-nya
             nextAccess = nextAccess.filter(item => item !== menuLabel && !(parentData?.submenus.includes(item)));
         } else {
             // Jika menu utama di-check, tambahkan akses ke menu utama beserta seluruh submenu-nya
             if (!nextAccess.includes(menuLabel)) nextAccess.push(menuLabel);
             if (parentData && parentData.submenus) {
                 parentData.submenus.forEach(child => {
                     if (!nextAccess.includes(child)) nextAccess.push(child);
                 });
             }
             // Auto expand jika di check
             setExpandedAccessGroups(prev => prev.includes(menuLabel) ? prev : [...prev, menuLabel]);
         }
      } else {

         // Logika untuk submenu (atau menu utama yang tidak memiliki submenu)
         const isCurrentlyChecked = nextAccess.includes(menuLabel);
         
         if (isCurrentlyChecked) {
             // Uncheck submenu
             nextAccess = nextAccess.filter(item => item !== menuLabel);
             // Karena ada submenu yang di-uncheck, maka menu utama juga harus ikut di-uncheck
             if (parentLabel) {
                 nextAccess = nextAccess.filter(item => item !== parentLabel);
             }
         } else {
             // Check submenu
             nextAccess.push(menuLabel);
             // Periksa apakah seluruh submenu di bawah menu utama ini sekarang sudah ter-check semua
             if (parentLabel) {
                 const parentData = menuAccessOptions.find(m => m.label === parentLabel);
                 if (parentData && parentData.submenus) {
                     const allChildrenChecked = parentData.submenus.every(child => nextAccess.includes(child));
                     // Jika semua submenu ter-check, otomatis check menu utamanya
                     if (allChildrenChecked && !nextAccess.includes(parentLabel)) {
                         nextAccess.push(parentLabel);
                     }
                 }
             }
         }
      }
      return { ...f, access: nextAccess };
    });
  };

  const toggleExpandGroup = (label, e) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedAccessGroups(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const openAdd = () => {
    setFormMode('add');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setExpandedAccessGroups([]);
    setFormModalOpen(true);
  };

  const openEdit = (user) => {
    setFormMode('edit');
    setEditingId(user.id);
    setForm({
      nama: user.nama,
      email: user.email,
      role: user.role === 'superadmin' || user.is_superadmin ? 'superadmin' : 'admin',
      password: '',
      verify: '',
      access: user.access || ['Beranda', 'Berita', 'Dok. Kinerja', 'Pengaduan'],
    });
    setExpandedAccessGroups([]);
    setFormModalOpen(true);
  };

  // Klik baris tabel hanya membuka popup detail, tanpa memunculkan tombol
  // edit/hapus di dalam modal agar tampilannya lebih clean dan bersih.
  const openDetail = (user) => {
    setDetailUser(user);
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
  };

  const handleSaveUser = async () => {
    if (!form.nama || !form.email || !form.role) {
      setFormError('Nama, email, dan role wajib diisi.');
      return;
    }

    if (formMode === 'add') {
      if (!form.password || form.password !== form.verify) {
        setFormError('Password tidak cocok atau kosong.');
        return;
      }
      setSaveLoading(true);
      setFormError(null);
      const res = await addUser(form);
      setSaveLoading(false);
      if (res.success) {
        closeFormModal();
      } else {
        setFormError(res.error);
      }
    } else {
      if (form.password && form.password !== form.verify) {
        setFormError('Verifikasi password tidak cocok.');
        return;
      }
      setSaveLoading(true);
      setFormError(null);
      const res = await editUser(editingId, form);
      setSaveLoading(false);
      if (res.success) {
        closeFormModal();
      } else {
        setFormError(res.error);
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      setDeleteError(null);
      const result = await deleteUser(deleteTarget.id);
      if (result.success) {
        setDeleteTarget(null);
      } else {
        setDeleteError(result.error);
      }
    }
  };

  // Simpan dinonaktifkan bila belum ada menu tersedia (empty state).
  const noMenuAvailable = menuAccessOptions.length === 0;

  // --- Pagination buttons ---
  // Selalu tampilkan halaman 1 & terakhir, plus jendela di sekitar halaman
  // aktif, dengan "…" sebagai pemisah bila ada jarak. Mengikuti `page`
  // sehingga nomor ikut bergeser saat pindah halaman.
  const buildPageList = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = new Set([1, totalPages, page, page - 1, page + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

    // Sisipkan "…" pada tiap loncatan angka.
    const result = [];
    let prev = 0;
    for (const p of sorted) {
      if (prev && p - prev > 1) result.push('...');
      result.push(p);
      prev = p;
    }
    return result;
  };

  return (
    <>
      <main className="admin-content">
          {/* ---------- HERO CARD ---------- */}
          <section className="mu-hero">
            <div className="mu-hero-left">
              <span className="mu-hero-icon">
                <i className="fa-solid fa-user-lock"></i>
              </span>
              <div className="mu-hero-text">
                <h2>Manajemen User</h2>
                <p>Kelola hak akses pengguna untuk setiap menu di website ini</p>
              </div>
            </div>

            <div className="mu-hero-stat">
              <span className="mu-hero-stat-icon">
                <i className="fa-solid fa-users"></i>
              </span>
              <div className="mu-hero-stat-text">
                <div className="mu-hero-stat-number">{users.length}</div>
                <div className="mu-hero-stat-label">TOTAL USER</div>
              </div>
            </div>
          </section>

          {/* ---------- TOOLBAR ---------- */}
          <div className="mu-toolbar">
            <div className="mu-search">
              <i className="fa-solid fa-magnifying-glass"></i>
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <button className="btn-tambah-user" onClick={openAdd}>
              <i className="fa-solid fa-plus"></i> Tambah User
            </button>
          </div>

          {/* ---------- TABLE CARD ---------- */}
          <section className="mu-table-card">
            <table className="mu-table">
              <thead>
                <tr>
                  <th className="mu-col-no">NO</th>
                  <th>NAMA</th>
                  <th>EMAIL</th>
                  <th className="mu-col-aksi">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="mu-empty-row">
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Memuat data pengguna...
                    </td>
                  </tr>
                ) : fetchError ? (
                  <tr>
                    <td colSpan={4} className="mu-empty-row" style={{ color: '#ef4444' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i> {fetchError}
                    </td>
                  </tr>
                ) : visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="mu-empty-row">
                      Tidak ada user yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((user, i) => (
                    <tr
                      key={user.id}
                      className="mu-clickable-row"
                      onClick={() => setDetailUser(user)}
                    >
                      <td className="mu-col-no">{startIdx + i + 1}</td>
                      <td>
                        <div className="mu-user-cell">
                          <span
                            className="mu-avatar"
                            style={{ background: AVATAR_COLORS[(user.id - 1) % AVATAR_COLORS.length] }}
                          >
                            {getInitials(user.nama)}
                          </span>
                          <span className="mu-user-name">{user.nama}</span>
                        </div>
                      </td>
                      <td className="mu-user-email">{user.email}</td>
                      <td className="mu-col-aksi">
                        <div className="mu-actions">
                          <button
                            className="mu-action-btn"
                            title="Edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(user);
                            }}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          {currentUser && currentUser.role === 'superadmin' && Number(user.id) !== Number(currentUser.id) && (
                            <button
                              className="mu-action-btn"
                              title="Hapus"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteError(null);
                                setDeleteTarget(user);
                              }}
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* ---------- FOOTER / PAGINATION ---------- */}
            <div className="mu-table-footer">
              <span className="mu-footer-info">
                Menampilkan {filtered.length === 0 ? 0 : startIdx + 1}-
                {Math.min(startIdx + PAGE_SIZE, filtered.length)} dari {filtered.length} User
              </span>

              <div className="mu-pagination">
                <button
                  className="mu-page-btn"
                  disabled={page === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <i className="fa-solid fa-chevron-left"></i>
                </button>

                {buildPageList().map((p, idx) =>
                  p === '...' ? (
                    <span key={`dots-${idx}`} className="mu-page-dots">…</span>
                  ) : (
                    <button
                      key={p}
                      className={`mu-page-btn ${p === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  className="mu-page-btn"
                  disabled={page === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </section>
        </main>

      {/* ================= MODAL: TAMBAH / EDIT USER ================= */}
      {formModalOpen && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={closeFormModal}>
          <div className="modal-box modal-box-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header mu-modal-header">
              <div>
                <h3>{formMode === 'add' ? 'Tambah User Baru' : 'Edit User Admin'}</h3>
                <p className="mu-modal-sub">
                  {formMode === 'add'
                    ? 'Silakan isi data dan tentukan hak akses pengguna.'
                    : 'Silakan edit isi data dan hak akses menu pengguna.'}
                </p>
              </div>
            </div>

            <div className="modal-body">
              {formError && (
                <div style={{ padding: '12px', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', borderRadius: '8px', marginBottom: '16px', fontSize: '13.5px', fontWeight: '500', border: '1px solid rgba(255, 68, 68, 0.2)' }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: '8px' }}></i>
                  {formError}
                </div>
              )}
              <div className="mu-form-grid">
                <div className="form-group">
                  <label>NAMA</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nama Lengkap"
                    value={form.nama}
                    onChange={(e) => setField('nama', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>EMAIL</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>ROLE</label>
                  <select
                    className="form-input"
                    value={form.role}
                    onChange={handleRoleChange}
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Masukkan Password"
                      value={form.password}
                      onChange={(e) => setField('password', e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>VERIFIKASI PASSWORD</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showVerify ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Masukkan Password Sekali Lagi"
                      value={form.verify}
                      onChange={(e) => setField('verify', e.target.value)}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowVerify(!showVerify)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      <i className={`fa-solid ${showVerify ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                  </div>
                </div>
              </div>

              <div 
                className="mu-access-section"
                style={{
                  opacity: form.role === 'superadmin' ? 0.55 : 1,
                  pointerEvents: form.role === 'superadmin' ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease'
                }}
              >
                <label className="mu-access-title">HAK AKSES MENU</label>

                {noMenuAvailable ? (
                  <div className="mu-access-empty">
                    Belum ada menu tersedia. Silakan tambah menu terlebih dahulu melalui fitur Tambah Menu.
                  </div>
                ) : (
                  <div className="mu-access-grid">
                    {menuAccessOptions.map((menuObj) => {
                      const hasSubmenus = menuObj.submenus.length > 0;
                      const isExpanded = expandedAccessGroups.includes(menuObj.label);
                      const isChecked = form.access.includes(menuObj.label);
                      const selectedChildCount = menuObj.submenus.filter(c => form.access.includes(c)).length;
                      
                      // Warna aksen aktif saat dropdown dibuka
                      const activeBorderColor = 'rgba(91, 95, 232, 0.4)';
                      const currentBorder = isExpanded ? `1px solid ${activeBorderColor}` : '1px solid var(--border-soft)';
                      
                      return (
                        <div 
                          key={menuObj.label} 
                          className="mu-access-group-container"
                          style={{
                            border: currentBorder,
                            borderBottom: isExpanded ? 'none' : currentBorder, // Hilangkan border bawah agar menyatu dengan body
                            borderRadius: isExpanded ? '10px 10px 0 0' : '10px',
                            background: 'var(--bg-card)',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            zIndex: isExpanded ? 50 : 1, // Naikkan z-index agar bayangannya menutupi elemen sekitar
                          }}
                          onMouseEnter={() => {
                            if (hasSubmenus) {
                              setExpandedAccessGroups(prev => prev.includes(menuObj.label) ? prev : [...prev, menuObj.label]);
                            }
                          }}
                          onMouseLeave={() => {
                            if (hasSubmenus) {
                              setExpandedAccessGroups(prev => prev.filter(l => l !== menuObj.label));
                            }
                          }}
                        >
                          <div 
                            className="mu-access-group-header"
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                              background: isChecked ? 'rgba(91, 95, 232, 0.08)' : 'transparent',
                              borderRadius: isExpanded ? '9px 9px 0 0' : '9px',
                              cursor: hasSubmenus ? 'default' : 'default',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <label 
                              className="mu-access-item" 
                              style={{ 
                                fontWeight: hasSubmenus ? '600' : 'normal',
                                margin: 0,
                                flex: 1
                              }}
                              onClick={(e) => e.stopPropagation()} // Prevent double trigger
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleAccess(menuObj.label, null, hasSubmenus)}
                              />
                              <span>{menuObj.label}</span>
                            </label>

                            {hasSubmenus && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {selectedChildCount > 0 && !isChecked && (
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    background: 'var(--purple)',
                                    color: '#fff',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    lineHeight: 1
                                  }}>
                                    {selectedChildCount}/{menuObj.submenus.length}
                                  </span>
                                )}
                                <i 
                                  className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}
                                  style={{ 
                                    fontSize: '11px', 
                                    color: isExpanded ? 'var(--purple)' : 'var(--text-faint)',
                                    transition: 'all 0.2s ease'
                                  }}
                                ></i>
                              </div>
                            )}
                          </div>
                          
                          {/* Konten Submenu (Absolute Overlay, Menyatu dengan Header) */}
                          {hasSubmenus && (
                            <div 
                              className="mu-access-group-body"
                              style={{
                                position: 'absolute',
                                top: '100%',
                                left: '-1px', // Sejajarkan dengan border container
                                right: '-1px',
                                background: 'var(--bg-card)',
                                border: currentBorder,
                                borderTop: `1px dashed ${activeBorderColor}`, // Garis putus-putus sebagai pemisah estetik
                                borderRadius: '0 0 10px 10px',
                                boxShadow: '0 16px 32px rgba(0,0,0,0.18)',
                                maxHeight: isExpanded ? '500px' : '0',
                                opacity: isExpanded ? 1 : 0,
                                overflow: 'hidden', // Ganti overflowY auto menjadi hidden untuk hilangkan glitch scrollbar
                                transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease', // Diperhalus dan diperlambat
                                display: 'flex',
                                flexDirection: 'column',
                                zIndex: 100,
                                pointerEvents: isExpanded ? 'auto' : 'none'
                              }}
                            >
                              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {menuObj.submenus.map(childLabel => (
                                  <label key={childLabel} className="mu-access-item" style={{ margin: 0 }}>
                                    <input
                                      type="checkbox"
                                      checked={form.access.includes(childLabel)}
                                      onChange={() => toggleAccess(childLabel, menuObj.label, false)}
                                    />
                                    <span style={{ fontSize: '13.5px', color: 'var(--text-sub)' }}>{childLabel}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-batal" onClick={closeFormModal} disabled={saveLoading}>
                Batal
              </button>
              <button className="btn-simpan" onClick={handleSaveUser} disabled={saveLoading || noMenuAvailable}>
                {saveLoading ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Simpan User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DETAIL AKUN ================= */}
      {detailUser && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setDetailUser(null)}>
          <div className="modal-box mu-detail-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header mu-detail-modal-header">
              <div className="mu-detail-modal-title-wrap">
                <h3>Informasi Akun</h3>
                <p className="mu-modal-sub">Detail profil pengguna yang terdaftar pada sistem.</p>
              </div>
              <button className="modal-close mu-detail-modal-close" onClick={() => setDetailUser(null)} aria-label="Tutup detail akun">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="mu-detail-hero">
                <div
                  className="mu-detail-avatar"
                  style={{ background: AVATAR_COLORS[(detailUser.id - 1) % AVATAR_COLORS.length] }}
                >
                  {getInitials(detailUser.nama)}
                </div>

                <div className="mu-detail-identity">
                  <span className="mu-detail-kicker">Akun Terdaftar</span>
                  <h4>{detailUser.nama}</h4>
                  <p>{detailUser.email}</p>
                </div>

                <div className={`mu-status-badge ${detailUser.role === 'superadmin' || detailUser.is_superadmin ? 'mu-status-superadmin' : 'mu-status-admin'}`}>
                  {getRoleLabel(detailUser)}
                </div>
              </div>

              <div className="mu-detail-grid">
                <div className="mu-detail-info-card">
                  <span className="mu-detail-info-label">Nama Pengguna</span>
                  <strong className="mu-detail-info-value">{detailUser.nama}</strong>
                </div>
                <div className="mu-detail-info-card">
                  <span className="mu-detail-info-label">Email</span>
                  <strong className="mu-detail-info-value">{detailUser.email}</strong>
                </div>
                <div className="mu-detail-info-card mu-detail-info-card-wide">
                  <span className="mu-detail-info-label">Status</span>
                  <strong className="mu-detail-info-value">{getRoleLabel(detailUser)}</strong>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: HAPUS AKUN USER ================= */}
      {deleteTarget && (
        <div className="modal-overlay" data-lenis-prevent="true" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box mu-delete-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <h3 className="mu-delete-title">Hapus Akun User</h3>
              <p className="mu-delete-desc">
                Apakah Anda yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.
                Semua data dan hak akses terkait user ini akan dihapus permanen.
              </p>

              <div className="mu-delete-target">
                <div className="mu-delete-target-label">AKUN USER YANG AKAN DIHAPUS</div>
                <div className="mu-delete-target-user">
                  <span
                    className="mu-avatar"
                    style={{ background: AVATAR_COLORS[(deleteTarget.id - 1) % AVATAR_COLORS.length] }}
                  >
                    {getInitials(deleteTarget.nama)}
                  </span>
                  <span className="mu-user-name">{deleteTarget.nama}</span>
                </div>
              </div>

              {deleteError && (
                <div className="mu-delete-error" style={{
                  color: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginTop: '16px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <i className="fa-solid fa-circle-exclamation"></i>
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-batal" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn-hapus" onClick={confirmDelete}>Hapus Akun</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManajemenUser;
