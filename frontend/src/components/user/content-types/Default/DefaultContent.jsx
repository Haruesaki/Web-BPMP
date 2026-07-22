import React, { useEffect, useState } from "react";
import "./DefaultContent.css";
import axiosInstance from "../../../../api/axiosInstance";
import parse from "html-react-parser"; 

const DefaultContent = ({ menuId, viewLayout }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!menuId) return;
    const fetchContent = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/halaman-konten/${menuId}`);
        setContent(res.data || []);
      } catch (err) {
        console.error("Gagal mengambil halaman konten:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [menuId]);

  // Fungsi untuk membungkus elemen <img>
  const replaceImagesWithFrames = (node) => {
    if (node.type === "tag" && node.name === "img") {
      const imgSrc = node.attribs.src;

      const cleanedAttribs = { ...node.attribs };
      delete cleanedAttribs.width;
      delete cleanedAttribs.height;
      delete cleanedAttribs.style;

      return (
        <div className="image-frame">
          <img {...cleanedAttribs} src={imgSrc} alt={node.attribs.alt || ""} />
        </div>
      );
    }
    return node;
  };
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-main)' }}>Memuat konten...</div>;
  }

  if (content.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-main)' }}>Belum ada konten untuk menu ini.</div>;
  }

  const isVertical = viewLayout === 'Vertikal';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isVertical ? 'column' : 'row',
      flexWrap: isVertical ? 'nowrap' : 'wrap',
      gap: '40px',
      padding: '40px',
      width: '100%',
      justifyContent: 'center'
    }}>
      {content.map(c => {
        const parsedContent = parse(c.deskripsi_kaya || '', {
          replace: replaceImagesWithFrames,
        });

        return (
          <div key={c.id} className="content-type-section default-content" style={{ flex: isVertical ? 'none' : '1 1 45%', minWidth: '300px' }}>
            <div className="default-banner-wrapper">
              <h1 className="default-banner-title">{c.judul}</h1>
            </div>
            <div className="default-description-container">
              {parsedContent}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DefaultContent;
