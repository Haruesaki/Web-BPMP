import React from 'react';
import './DefaultContent.css';

const DefaultContent = () => {
  return (
    <div className="content-type-section default-content">
      <div className="default-banner-wrapper">
        <h1 className="default-banner-title">Judul Halaman Default</h1>
      </div>
      <div className="default-description-container">
        <p>
          Ini adalah deskripsi halaman default. Konten ini akan datang dari CKEditor.
          Anda bisa membayangkan di sini ada banyak paragraf, gambar, atau elemen lain.
        </p>
        <p>
          Tujuannya adalah untuk memastikan layout dari judul banner dan konten teks
          sudah sesuai dengan ekspektasi. Ini adalah simulasi dari halaman seperti
          "Visi Misi" atau "Tentang Kami".
        </p>
        <ul>
          <li>Poin pertama</li>
          <li>Poin kedua</li>
          <li>Poin ketiga</li>
        </ul>
        <h3>Sub-judul Contoh</h3>
        <p>
          Paragraf lain dengan beberapa <b>teks tebal</b> dan <i>teks miring</i> untuk
          menguji rendering konten.
        </p>
      </div>
    </div>
  );
};

export default DefaultContent;
