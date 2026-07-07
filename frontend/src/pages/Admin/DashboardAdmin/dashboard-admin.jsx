import React, { useState } from 'react';
import './dashboard-admin.css';

const ACT_PAGE_SIZE = 5;

// Warna badge pelaku (dipilih konsisten berdasarkan nama pelaku).
const ACTOR_COLORS = ['#5b5fe8', '#7a4fae', '#4cae8e', '#3f5aa8', '#8a6d1f', '#b5642e'];
const getActorInitials = (nama) => nama.replace(/\s+/g, '').slice(0, 2).toUpperCase();
const getActorColor = (nama) =>
  ACTOR_COLORS[[...nama].reduce((sum, c) => sum + c.charCodeAt(0), 0) % ACTOR_COLORS.length];

const DashboardAdmin = () => {
  // --- DATA: STATISTIK PENGUNJUNG (chart) ---
  const chartData = [
    { day: 'Mon', value: 38 },
    { day: 'Tue', value: 70 },
    { day: 'Wed', value: 45 },
    { day: 'Thu', value: 88 },
    { day: 'Fri', value: 98, highlight: true },
    { day: 'Sat', value: 60 },
    { day: 'Sun', value: 22 },
  ];

  // --- DATA: AKTIVITAS TERKINI (dummy, nanti diganti fetch backend) ---
  const recentActivity = [
    { pelaku: 'Admin', title: 'Admin memperbarui berita "Update Kurikulum 2026".', time: '14 Jun 2026, 13:52 WIB' },
    { pelaku: 'Admin', title: 'Dokumen "Laporan Keuangan Juni" diunggah ke ZIWBK-WBBM.', time: '14 Jun 2026, 13:42 WIB' },
    { pelaku: 'Admin', title: 'Admin menerbitkan berita baru: "Pengumuman SPAB".', time: '14 Jun 2026, 13:35 WIB' },
    { pelaku: 'Super Admin', title: 'Menu "Pelayanan" diaktifkan pada halaman beranda.', time: '14 Jun 2026, 13:34 WIB' },
    { pelaku: 'Super Admin', title: 'User baru ditambahkan: "Budi Kusuma".', time: '14 Jun 2026, 13:33 WIB' },
    { pelaku: 'Sistem', title: 'Backup sistem selesai dilakukan.', time: '14 Jun 2026, 13:32 WIB' },
    { pelaku: 'Super Admin', title: 'Admin mengubah urutan menu navigasi utama.', time: '14 Jun 2026, 11:20 WIB' },
    { pelaku: 'Admin', title: 'Halaman "Profil" diperbarui.', time: '14 Jun 2026, 10:05 WIB' },
    { pelaku: 'Super Admin', title: 'Submenu "Standar Pelayanan" dinonaktifkan.', time: '13 Jun 2026, 16:48 WIB' },
    { pelaku: 'Admin', title: 'Berita "Reformasi Birokrasi 2026" diarsipkan.', time: '13 Jun 2026, 15:12 WIB' },
    { pelaku: 'Admin', title: 'Admin memperbarui informasi kontak situs.', time: '13 Jun 2026, 14:00 WIB' },
    { pelaku: 'User', title: 'User "Dewi Putri" mengubah kata sandi.', time: '13 Jun 2026, 09:37 WIB' },
    { pelaku: 'Admin', title: 'Dokumen kinerja triwulan II dipublikasikan.', time: '12 Jun 2026, 17:22 WIB' },
  ];

  // --- Pagination aktivitas (5 per halaman) ---
  const [actPage, setActPage] = useState(1);
  const actTotalPages = Math.max(1, Math.ceil(recentActivity.length / ACT_PAGE_SIZE));
  const actPageSafe = Math.min(actPage, actTotalPages);
  const actStart = (actPageSafe - 1) * ACT_PAGE_SIZE;
  const visibleActivity = recentActivity.slice(actStart, actStart + ACT_PAGE_SIZE);

  const buildActPageList = () => {
    if (actTotalPages <= 5) return Array.from({ length: actTotalPages }, (_, i) => i + 1);
    const pages = new Set([1, actTotalPages, actPageSafe, actPageSafe - 1, actPageSafe + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= actTotalPages).sort((a, b) => a - b);
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
    <main className="admin-content">
      <div className="content-heading">
        <h1>SELAMAT DATANG! Admin BPMP Lampung</h1>
        <p>Dashboard Overview</p>
      </div>

      <div className="content-stack">
        {/* ----- CARD: STATISTIK PENGUNJUNG ----- */}
        <section className="card card-chart">
          <div className="card-chart-header">
            <div className="card-chart-title">
              <span className="chart-title-icon"><i className="fa-solid fa-chart-simple"></i></span>
              <div>
                <h3>Statistik Pengunjung</h3>
                <p>Visitor traffic analysis</p>
              </div>
            </div>
            <div className="chart-filters">
              <button className="chart-select">June <i className="fa-solid fa-chevron-down"></i></button>
              <button className="chart-select">2026 <i className="fa-solid fa-chevron-down"></i></button>
            </div>
          </div>

          <div className="chart-area">
            <div className="chart-yaxis">
              <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
            </div>
            <div className="chart-bars">
              {chartData.map((d) => (
                <div key={d.day} className="chart-bar-col">
                  <div className="chart-bar-track">
                    <div
                      className={`chart-bar ${d.highlight ? 'highlight' : ''}`}
                      style={{ height: `${d.value}%` }}
                    ></div>
                  </div>
                  <span className="chart-bar-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ----- CARD: AKTIVITAS TERKINI (tabel, di bawah statistik) ----- */}
        <section className="card card-activity">
          <h3>Aktivitas Terkini</h3>
          <div className="activity-table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th className="activity-col-actor">PELAKU</th>
                  <th>DESKRIPSI</th>
                  <th className="activity-col-time">WAKTU (WIB)</th>
                </tr>
              </thead>
              <tbody>
                {visibleActivity.map((a, i) => (
                  <tr key={actStart + i}>
                    <td className="activity-col-actor">
                      <div className="activity-actor">
                        <span
                          className="activity-actor-badge"
                          style={{ background: getActorColor(a.pelaku) }}
                        >
                          {getActorInitials(a.pelaku)}
                        </span>
                        <span className="activity-actor-name">{a.pelaku}</span>
                      </div>
                    </td>
                    <td>{a.title}</td>
                    <td className="activity-col-time">{a.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------- FOOTER / PAGINATION ---------- */}
          <div className="activity-footer">
            <span className="activity-info">
              Menampilkan {recentActivity.length === 0 ? 0 : actStart + 1}-
              {Math.min(actStart + ACT_PAGE_SIZE, recentActivity.length)} dari{' '}
              {recentActivity.length} Aktivitas
            </span>

            <div className="activity-pagination">
              <button
                className="activity-page-btn"
                disabled={actPageSafe === 1}
                onClick={() => setActPage((p) => Math.max(1, p - 1))}
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>

              {buildActPageList().map((p, idx) =>
                p === '...' ? (
                  <span key={`dots-${idx}`} className="activity-page-dots">…</span>
                ) : (
                  <button
                    key={p}
                    className={`activity-page-btn ${p === actPageSafe ? 'active' : ''}`}
                    onClick={() => setActPage(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                className="activity-page-btn"
                disabled={actPageSafe === actTotalPages}
                onClick={() => setActPage((p) => Math.min(actTotalPages, p + 1))}
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default DashboardAdmin;
