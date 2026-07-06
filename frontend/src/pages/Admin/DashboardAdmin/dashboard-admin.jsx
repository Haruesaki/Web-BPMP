import React from 'react';
import './dashboard-admin.css';

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

  // --- DATA: AKTIVITAS TERKINI ---
  const recentActivity = [
    { dot: 'grey', title: 'Berita "Update Kurikulum" published.', time: '2 hours ago' },
    { dot: 'orange', title: 'New document uploaded to ZIWBK-WBBM.', time: '5 hours ago' },
    { dot: 'grey', title: 'System backup completed successfully.', time: 'Yesterday, 11:00 PM' },
  ];

  return (
    <main className="admin-content">
      <div className="content-heading">
        <h1>SELAMAT DATANG! Admin BPMP Lampung</h1>
        <p>Dashboard Overview</p>
      </div>

      <div className="content-grid">
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

        {/* ----- CARD: AKTIVITAS TERKINI ----- */}
        <section className="card card-activity">
          <h3>Aktivitas Terkini</h3>
          <div className="activity-list">
            {recentActivity.map((a, i) => (
              <div key={i} className="activity-item">
                <span className={`activity-dot ${a.dot}`}></span>
                <div className="activity-text">
                  <div className="activity-title">{a.title}</div>
                  <div className="activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default DashboardAdmin;
