import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import YoutubeSection from '../../user/youtube/YoutubeSection';
import './YouTubeSectionNotice.css';

const YouTubeSectionNotice = () => {
  const [ytData, setYtData] = useState({ videos: [], channel: null });
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchYoutubeData();
  }, []);

  const fetchYoutubeData = async () => {
    setIsFetching(true);
    try {
      const res = await axiosInstance.get('/api/youtube');
      if (res.data?.success) {
        setYtData({
          videos: res.data.data?.videos || [],
          channel: res.data.data?.channel || null
        });
      }
    } catch (error) {
      console.error('Gagal mengambil data YouTube untuk pratinjau:', error);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="cb-yt-section-notice">
      <div className="cb-yt-notice-card">
        <div className="cb-yt-notice-header">
          <i className="fa-brands fa-youtube cb-yt-notice-icon"></i>
          <h4 className="cb-yt-notice-title">Integrasi Sistem YouTube Terkunci</h4>
        </div>
        
        <div className="cb-yt-notice-body">
          <p>
            Sistem penyelarasan (sinkronisasi) YouTube di situs ini terhubung langsung secara resmi menggunakan <strong>Google Cloud Console API</strong>.
          </p>
          <p>
            Demi menjaga standar <strong>Keamanan Infrastruktur</strong> tingkat tinggi dan mencegah eksploitasi Kredensial API oleh pihak yang tidak bertanggung jawab apabila terjadi pembobolan di level antarmuka, maka akses modifikasi kunci API secara sengaja dinonaktifkan dari panel Administrator ini.
          </p>
          
          <div className="cb-yt-algorithm-box">
            <h5><i className="fa-solid fa-microchip"></i> Bagaimana Algoritma Bekerja?</h5>
            <ul>
              <li>Sistem akan melakukan <em>Data Scraping</em> secara otonom ke <em>Uploads Playlist</em> (bukan hasil pencarian) untuk memangkas jeda keterlambatan indeks YouTube.</li>
              <li>Data video terbaru beserta metadata saluran akan disimpan secara internal di dalam memori</li>
              <li>Sistem ini dieksekusi dengan teknik <em>Caching</em> periodik demi menyeimbangkan kuota API <em>real-time</em> tanpa mengorbankan kecepatan pemuatan beranda pengunjung.</li>
            </ul>
          </div>

          <p className="cb-yt-contact-programmer">
            <i className="fa-solid fa-headset"></i> Apabila Anda perlu mengganti target Channel YouTube atau memperbarui Kredensial API, silakan hubungi <strong>Programmer / Tim Pengembang</strong> Anda untuk melakukan konfigurasi ulang dari sisi peladen (Backend).
          </p>
        </div>
      </div>

      <div className="cb-mitra-preview-container">
        <div className="cb-mitra-preview-header">
          <i className="fa-solid fa-desktop"></i>
          <span>Live Preview Beranda (YouTube)</span>
        </div>
        <div className="cb-ig-preview-box cb-yt-preview-box">
          {isFetching ? (
            <div className="cb-mitra-preview-empty">
              Sedang menyinkronkan data pratinjau dari server...
            </div>
          ) : (
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-50px' }}>
              <YoutubeSection 
                ytVideos={ytData.videos} 
                ytChannel={ytData.channel} 
                loading={false} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeSectionNotice;
