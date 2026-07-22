import React, { useState, useEffect } from "react";
import axiosInstance from "../../../api/axiosInstance";
import "./JumlahPengunjung.css";

const JumlahPengunjung = () => {
  const [visitorData, setVisitorData] = useState({
    pengunjung_hari_ini: 0,
    total_pengunjung: 0
  });

  useEffect(() => {
    const fetchVisitorData = async () => {
      try {
        const res = await axiosInstance.get('/api/beranda/pengunjung');
        if (res.data && res.data.data) {
          setVisitorData({
            pengunjung_hari_ini: res.data.data.pengunjung_hari_ini,
            total_pengunjung: res.data.data.total_pengunjung
          });
        }
      } catch (err) {
        console.error("Gagal mengambil data pengunjung:", err);
      }
    };
    fetchVisitorData();
  }, []);

  return (
    <div className="visitor-counter-wrapper">
      <div className="visitor-counter-box">
        <div className="visitor-header">
          <i className="fa-solid fa-user visitor-icon"></i>
          <h1 className="visitor-text-header">Jumlah Pengunjung</h1>
        </div>
        <div className="visitor-content">
          <div className="visitor-content left">
            <span className="visitor-text">Pengunjung Hari Ini</span>
            <span className="visitor-text">Total Pengunjung</span>
          </div>
          <div className="visitor-content right">
            <span className="visitor-text">: {visitorData.pengunjung_hari_ini.toLocaleString('id-ID')}</span>
            <span className="visitor-text">: {visitorData.total_pengunjung.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JumlahPengunjung;
