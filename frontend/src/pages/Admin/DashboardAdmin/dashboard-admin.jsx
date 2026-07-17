import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import axiosInstance from '../../../api/axiosInstance';
import { getAuthHeaders } from '../../../api/userApi';
import './dashboard-admin.css';

const ACT_PAGE_SIZE = 5;

const ACTOR_COLORS = ['#5b5fe8', '#7a4fae', '#4cae8e', '#3f5aa8', '#8a6d1f', '#b5642e'];
const getActorInitials = (nama) => (nama || 'A').replace(/\s+/g, '').slice(0, 2).toUpperCase();
const getActorColor = (nama) =>
  ACTOR_COLORS[[...(nama || 'A')].reduce((sum, c) => sum + c.charCodeAt(0), 0) % ACTOR_COLORS.length];

const getWeekOfMonth = (date) => {
  const startMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const diff = date.getDate() - 1 + startMonth.getDay();
  return Math.floor(diff / 7) + 1;
};

// Warna bar chart statistik pengunjung — disamakan dengan --green & --purple-soft
// di dashboard-admin.css. Ditulis literal (bukan var(--...)) karena dukungan
// CSS custom property pada atribut SVG `fill` tidak konsisten di semua browser.
const CHART_BAR_COLOR = '#4cae8e';
const CHART_BAR_HIGHLIGHT_COLOR = '#c3c4f7';

// Tooltip custom Recharts, di-styling manual lewat CSS (bukan pakai Tooltip
// bawaan Recharts yang defaultnya putih) supaya cocok dengan tema gelap.
const ChartTooltip = ({ active, payload, label, chartMode }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">
        {Number(payload[0].value).toLocaleString('id-ID')}{' '}
        {chartMode === 'unik' ? 'Pengunjung Unik' : 'Tayangan'}
      </p>
    </div>
  );
};

const DashboardAdmin = () => {
  const [pengunjungData, setPengunjungData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartMode, setChartMode] = useState('unik'); // 'unik' | 'hits'

  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterWeek, setFilterWeek] = useState(0);

  const fetchStats = async () => {
    try {
      const res = await axiosInstance.get(`/api/pengunjung/stats?t=${Date.now()}`, { headers: getAuthHeaders() });
      if (res.data.success) {
        setPengunjungData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetch statistik:', error);
    }
  };

  const fetchAktivitas = async () => {
    try {
      const res = await axiosInstance.get('/api/aktivitas', { headers: getAuthHeaders() });
      if (res.data.success) {
        setRecentActivity(res.data.data);
      }
    } catch (error) {
      console.error('Error fetch aktivitas:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAktivitas();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
        fetchAktivitas();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Ringkasan untuk periode terfilter
  const summary = useMemo(() => {
    const filtered = pengunjungData.filter((item) => {
      const tStr = typeof item.tanggal === 'string' ? item.tanggal.split('T')[0] : '';
      const [y, m, d] = (tStr || '2000-01-01').split('-');
      const date = new Date(y, m - 1, d);
      const isYearMatch = date.getFullYear() === parseInt(filterYear);
      const isMonthMatch = (date.getMonth() + 1) === parseInt(filterMonth);
      const isWeekMatch = filterWeek === 0 ? true : getWeekOfMonth(date) === parseInt(filterWeek);
      return isYearMatch && isMonthMatch && isWeekMatch;
    });
    const totalUnik = filtered.reduce((s, d) => s + parseInt(d.pengunjung_unik || 0), 0);
    const totalHits = filtered.reduce((s, d) => s + parseInt(d.total_hits || 0), 0);
    return { totalUnik, totalHits };
  }, [pengunjungData, filterYear, filterMonth, filterWeek]);

  // Proses Filter Chart
  const chartData = useMemo(() => {
    let filtered = pengunjungData.filter((item) => {
      const tStr = typeof item.tanggal === 'string' ? item.tanggal.split('T')[0] : '';
      const [y, m, d] = (tStr || '2000-01-01').split('-');
      const date = new Date(y, m - 1, d);

      const isYearMatch = date.getFullYear() === parseInt(filterYear);
      const isMonthMatch = (date.getMonth() + 1) === parseInt(filterMonth);
      const isWeekMatch = filterWeek === 0 ? true : getWeekOfMonth(date) === parseInt(filterWeek);
      return isYearMatch && isMonthMatch && isWeekMatch;
    });

    filtered = filtered.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

    const valueKey = chartMode === 'unik' ? 'pengunjung_unik' : 'total_hits';
    const maxVal = Math.max(...filtered.map(d => parseInt(d[valueKey] || 0)), 0);
    return filtered.map(d => {
      const tStr = typeof d.tanggal === 'string' ? d.tanggal.split('T')[0] : '';
      const [y, m, day] = (tStr || '2000-01-01').split('-');
      const dateObj = new Date(y, m - 1, day);

      const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
      const dateNum = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const value = parseInt(d[valueKey] || 0);
      return {
        label: `${dayName}, ${dateNum}`,
        value,
        highlight: value === maxVal && maxVal > 0
      };
    });
  }, [pengunjungData, filterYear, filterMonth, filterWeek, chartMode]);

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const monthOptions = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
    { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
  ];
  const weekOptions = [1, 2, 3, 4, 5, 6];

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

  const formatWaktu = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
           d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
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
            <div className="chart-filters" style={{display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center'}}>
              <select className="chart-select" value={chartMode} onChange={e => setChartMode(e.target.value)}>
                <option value="unik">Pengunjung Unik</option>
                <option value="hits">Total Tayangan</option>
              </select>
              <select className="chart-select" value={filterWeek} onChange={e => setFilterWeek(Number(e.target.value))}>
                <option value={0}>Semua Minggu</option>
                {weekOptions.map(w => <option key={w} value={w}>Minggu ke-{w}</option>)}
              </select>
              <select className="chart-select" value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>
                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select className="chart-select" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {/* ----- SUMMARY CARD ----- */}
          <div style={{display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap'}}>
            <div style={{flex: '1 1 180px', padding: '16px', borderRadius: '8px', background: '#f0f4ff', textAlign: 'center'}}>
              <div style={{fontSize: '28px', fontWeight: 'bold', color: '#3f5aa8'}}>
                {summary.totalUnik.toLocaleString('id-ID')}
              </div>
              <div style={{fontSize: '13px', color: '#666', marginTop: '4px'}}>Pengunjung Unik</div>
            </div>
            <div style={{flex: '1 1 180px', padding: '16px', borderRadius: '8px', background: '#f0fff4', textAlign: 'center'}}>
              <div style={{fontSize: '28px', fontWeight: 'bold', color: '#4cae8e'}}>
                {summary.totalHits.toLocaleString('id-ID')}
              </div>
              <div style={{fontSize: '13px', color: '#666', marginTop: '4px'}}>Total Tayangan (Hits)</div>
            </div>
          </div>

          <div className="chart-area">
            {chartData.length === 0 ? (
              <div className="chart-empty">Tidak ada data pengunjung untuk filter yang dipilih.</div>
            ) : (
              <div className="chart-scroll" style={{ minWidth: `${Math.max(chartData.length * 60, 480)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#C7C4D8', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#5b6478', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      content={<ChartTooltip chartMode={chartMode} />}
                      cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={46}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.highlight ? CHART_BAR_HIGHLIGHT_COLOR : CHART_BAR_COLOR}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* ----- CARD: AKTIVITAS TERKINI ----- */}
        <section className="card card-activity">
          <h3>Aktivitas Terkini</h3>
          <div className="activity-table-wrap">
            <table className="activity-table">
              <thead>
                <tr>
                  <th className="activity-col-actor">PELAKU</th>
                  <th className="activity-col-role">ROLE</th>
                  <th>DESKRIPSI</th>
                  <th className="activity-col-time">WAKTU (WIB)</th>
                </tr>
              </thead>
              <tbody>
                {visibleActivity.length === 0 ? (
                  <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>Belum ada aktivitas.</td></tr>
                ) : visibleActivity.map((a, i) => (
                  <tr key={a.id || i}>
                    <td className="activity-col-actor">
                      <div className="activity-actor">
                        <span
                          className="activity-actor-badge"
                          style={{ background: getActorColor(a.nama_admin) }}
                        >
                          {getActorInitials(a.nama_admin)}
                        </span>
                        <span className="activity-actor-name">{a.nama_admin}</span>
                      </div>
                    </td>
                    <td className="activity-col-role">
                        <span style={{
                          fontSize: '12px', 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          background: (a.role_admin || '').toLowerCase() === 'superadmin' ? '#ffe1e1' : '#e1f0ff', 
                          color: (a.role_admin || '').toLowerCase() === 'superadmin' ? '#d32f2f' : '#0277bd',
                          fontWeight: '600',
                          border: `1px solid ${(a.role_admin || '').toLowerCase() === 'superadmin' ? '#ffcdd2' : '#bbdefb'}`,
                          textTransform: 'capitalize'
                        }}>
                          {a.role_admin}
                        </span>
                    </td>
                    <td>{a.aksi}</td>
                    <td className="activity-col-time">{formatWaktu(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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