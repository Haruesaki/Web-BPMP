import React from "react";
import "./JumlahPengunjung.css";

const JumlahPengunjung = () => {

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
            <span className="visitor-text">: 123</span>
            <span className="visitor-text">: 107030</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JumlahPengunjung;
