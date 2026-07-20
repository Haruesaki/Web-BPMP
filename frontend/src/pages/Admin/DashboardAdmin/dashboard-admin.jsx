import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
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

// Bulatkan nilai maksimum sumbu-Y ke angka "cantik" + sisakan ruang di atas
// bar tertinggi. Efeknya: sumbu ikut membesar mengikuti data (mis. 78 → 80,
// bahkan ratusan) sehingga bar bernilai kecil tampak rendah — tidak lagi
// mentok di angka 4 saat datanya masih sedikit.
const niceCeil = (v) => {
  if (!v || v <= 0) return 5;
  const step = v <= 10 ? 2 : v <= 20 ? 5 : v <= 50 ? 10 : v <= 100 ? 20 : v <= 500 ? 50 : 100;
  let top = Math.ceil(v / step) * step;
  if (top <= v) top += step; // pastikan bar tertinggi tak menyentuh atas
  return top;
};

// Sumbu-Y SELALU minimal mencapai nilai ini (skala 0–80 tampil penuh walau
// data masih kecil → bar terlihat rendah). Bila data melebihi 80, sumbu tetap
// membesar otomatis (via niceCeil) supaya bar tak pernah terpotong.
const Y_AXIS_MIN_TOP = 80;

// Langkah antar-tick sumbu-Y agar label rapi (~8 pembagian, mis. 80 → tiap 10).
const niceStep = (max) => {
  const rough = (max || 1) / 8;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
};

// Tooltip custom Recharts, di-styling manual lewat CSS (bukan pakai Tooltip
// bawaan Recharts yang defaultnya putih) supaya cocok dengan tema gelap.
const ChartTooltip = ({ active, payload, label, chartMode }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">
        {Number(payload[0].value).toLocaleString('id-ID')}{' '}
        {chartMode === 'unik' ? 'Pengunjung' : 'Web Dibuka'}
      </p>
    </div>
  );
};

const DashboardAdmin = () => {
  const [pengunjungData, setPengunjungData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartMode, setChartMode] = useState('unik'); // 'unik' | 'hits'
  const [chartType, setChartType] = useState('bar'); // 'bar' | 'area'

  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterWeek, setFilterWeek] = useState(getWeekOfMonth(now));

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
    
    const allTimeUnik = pengunjungData.reduce((s, d) => s + parseInt(d.pengunjung_unik || 0), 0);
    const allTimeHits = pengunjungData.reduce((s, d) => s + parseInt(d.total_hits || 0), 0);

    return { totalUnik, totalHits, allTimeUnik, allTimeHits };
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

    if (filterWeek === 0) {
      // Kelompokkan berdasarkan minggu jika "Semua Minggu" dipilih
      const lastDayOfMonth = new Date(filterYear, filterMonth, 0);
      const maxWeeks = getWeekOfMonth(lastDayOfMonth);
      
      const weeklyData = Array.from({ length: maxWeeks }, (_, i) => ({
        label: `Minggu ke-${i + 1}`,
        value: 0
      }));

      filtered.forEach(d => {
        const tStr = typeof d.tanggal === 'string' ? d.tanggal.split('T')[0] : '';
        const [y, m, day] = (tStr || '2000-01-01').split('-');
        const dateObj = new Date(y, m - 1, day);
        const wIndex = getWeekOfMonth(dateObj) - 1;
        if (weeklyData[wIndex]) {
          weeklyData[wIndex].value += parseInt(d[valueKey] || 0);
        }
      });

      const maxVal = Math.max(...weeklyData.map(d => d.value), 0);
      return weeklyData.map(d => ({
        ...d,
        highlight: d.value === maxVal && maxVal > 0
      }));
    }

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

  // Batas atas sumbu-Y: minimal 80 (skala penuh selalu tampil), membesar
  // otomatis bila nilai tertinggi periode melebihi 80.
  const yMax = useMemo(
    () => Math.max(niceCeil(Math.max(...chartData.map((d) => d.value), 0)), Y_AXIS_MIN_TOP),
    [chartData]
  );

  // Daftar tick sumbu-Y (0, step, 2·step, … , yMax) agar labelnya rapi.
  const yTicks = useMemo(() => {
    const step = niceStep(yMax);
    const arr = [];
    for (let v = 0; v <= yMax; v += step) arr.push(v);
    return arr;
  }, [yMax]);

  const { minYear, maxYear, minMonth } = useMemo(() => {
    const defaultRes = { minYear: now.getFullYear(), maxYear: now.getFullYear(), minMonth: 1 };
    if (!pengunjungData || pengunjungData.length === 0) return defaultRes;

    let earliestDate = new Date();
    pengunjungData.forEach((d) => {
      const tStr = typeof d.tanggal === 'string' ? d.tanggal.split('T')[0] : '';
      const [y, m, day] = (tStr || '2000-01-01').split('-');
      const dateObj = new Date(y, m - 1, day);
      if (dateObj < earliestDate) earliestDate = dateObj;
    });

    return {
      minYear: earliestDate.getFullYear(),
      maxYear: now.getFullYear(),
      minMonth: earliestDate.getMonth() + 1
    };
  }, [pengunjungData]);

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [minYear, maxYear]);

  const monthOptions = useMemo(() => {
    const allMonths = [
      { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' }, { value: 3, label: 'Maret' },
      { value: 4, label: 'April' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
      { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' }, { value: 9, label: 'September' },
      { value: 10, label: 'Oktober' }, { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
    ];
    
    return allMonths.filter(m => {
      if (filterYear === minYear && m.value < minMonth) return false;
      if (filterYear === now.getFullYear() && m.value > (now.getMonth() + 1)) return false;
      return true;
    });
  }, [filterYear, minYear, minMonth]);

  useEffect(() => {
    if (filterYear === minYear && filterMonth < minMonth) {
      setFilterMonth(minMonth);
    } else if (filterYear === now.getFullYear() && filterMonth > (now.getMonth() + 1)) {
      setFilterMonth(now.getMonth() + 1);
    }
  }, [filterYear, filterMonth, minYear, minMonth]);
  const weekOptions = useMemo(() => {
    const lastDayOfMonth = new Date(filterYear, filterMonth, 0);
    const maxWeeks = getWeekOfMonth(lastDayOfMonth);
    return Array.from({ length: maxWeeks }, (_, i) => i + 1);
  }, [filterYear, filterMonth]);

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
              <select className="chart-select" value={chartType} onChange={e => setChartType(e.target.value)}>
                <option value="bar">Diagram Batang</option>
                <option value="area">Chart</option>
              </select>
              <select className="chart-select" value={chartMode} onChange={e => setChartMode(e.target.value)}>
                <option value="unik">Pengunjung</option>
                <option value="hits">Web Dibuka</option>
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

          <div className="chart-area">
            {chartData.length === 0 ? (
              <div className="chart-empty">Tidak ada data pengunjung untuk filter yang dipilih.</div>
            ) : (
              <div className="chart-scroll" style={{ minWidth: `${Math.max(chartData.length * 60, 480)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area' ? (
                    <AreaChart data={chartData} margin={{ top: 20, right: 8, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_BAR_COLOR} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_BAR_COLOR} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: '#C7C4D8', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        domain={[0, yMax]}
                        ticks={yTicks}
                        tick={{ fill: '#5b6478', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                      />
                      <Tooltip
                        content={<ChartTooltip chartMode={chartMode} />}
                        cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={CHART_BAR_HIGHLIGHT_COLOR}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        activeDot={{ r: 6, fill: CHART_BAR_HIGHLIGHT_COLOR, stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  ) : (
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
                        domain={[0, yMax]}
                        ticks={yTicks}
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
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ----- SUMMARY CARD (di bawah chart, tanpa pembungkus/background) ----- */}
          <div className="chart-summary">
            <div className="chart-summary-item">
              <div className="chart-summary-value chart-summary-value-unik">
                {summary.totalUnik.toLocaleString('id-ID')}
              </div>
              <div className="chart-summary-label">Pengunjung</div>
            </div>
            <div className="chart-summary-divider"></div>
            <div className="chart-summary-item">
              <div className="chart-summary-value chart-summary-value-hits">
                {summary.totalHits.toLocaleString('id-ID')}
              </div>
              <div className="chart-summary-label">Web Dibuka</div>
            </div>
            <div className="chart-summary-divider"></div>
            <div className="chart-summary-item">
              <div className="chart-summary-value chart-summary-value-unik" style={{ opacity: 0.8 }}>
                {summary.allTimeUnik.toLocaleString('id-ID')}
              </div>
              <div className="chart-summary-label">Total Pengunjung</div>
            </div>
            <div className="chart-summary-divider"></div>
            <div className="chart-summary-item">
              <div className="chart-summary-value chart-summary-value-hits" style={{ opacity: 0.8 }}>
                {summary.allTimeHits.toLocaleString('id-ID')}
              </div>
              <div className="chart-summary-label">Total Web Dibuka</div>
            </div>
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