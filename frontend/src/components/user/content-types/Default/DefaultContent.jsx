import React from "react";
import "./DefaultContent.css";
import parse from 'html-react-parser'; // Import library

const DefaultContent = ({ contentHtml = `
  <p>Ini adalah konten dummy.</p>
  <p>Paragraf lain untuk mengisi ruang.</p>
  <img src="https://via.placeholder.com/800x600" alt="Placeholder Image">
  <p>Teks setelah gambar.</p>` 
}) => {
  // Fungsi untuk membungkus elemen <img>
  const replaceImagesWithFrames = (node) => {
    if (node.type === 'tag' && node.name === 'img') {
      // Dapatkan atribut src dari gambar
      const imgSrc = node.attribs.src;
      // Hapus atribut style, width, height dari gambar,
      // karena kita akan mengontrolnya dari frame pembungkus.
      const cleanedAttribs = { ...node.attribs };
      delete cleanedAttribs.width;
      delete cleanedAttribs.height;
      delete cleanedAttribs.style;

      return (
        <div className="image-frame"> {/* Ini adalah wadah kontainer khusus */}
          <img {...cleanedAttribs} src={imgSrc} alt={node.attribs.alt || ''} />
        </div>
      );
    }
    return node; // Kembalikan node apa adanya jika bukan <img>
  };

  // Gunakan parse untuk mengubah HTML string menjadi elemen React
  // dan terapkan fungsi replaceImagesWithFrames
  const parsedContent = parse(contentHtml, { replace: replaceImagesWithFrames });

  return (
    <div className="content-type-section default-content">
      <div className="default-banner-wrapper">
        <h1 className="default-banner-title">Judul Halaman Default</h1>
      </div>
      <div className="default-description-container">
        {/* Render konten HTML yang sudah di-parse dan diubah */}
        {parsedContent}
      </div>
    </div>
  );
};

export default DefaultContent;
