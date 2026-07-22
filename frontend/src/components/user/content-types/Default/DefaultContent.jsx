import React, { useEffect, useState } from "react";
import "./DefaultContent.css";
import axiosInstance from "../../../../api/axiosInstance";
import parse from "html-react-parser";
import DocumentViewer from "./DocumentViewer";

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

  // Ekstensi berkas yang dianggap "dokumen" (disisipkan lewat tombol
  // "Sisipkan Dokumen" di editor). Tautan seperti ini kita ubah jadi preview.
  const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|rtf|txt|csv)(\?.*)?$/i;

  // Membungkus <img>, dan mengubah tautan-dokumen menjadi preview/kartu unduh.
  const transformNode = (node) => {
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

    const isDocAnchor = (n) =>
      n &&
      n.type === "tag" &&
      n.name === "a" &&
      n.attribs?.href &&
      DOC_EXT.test(n.attribs.href);

    const renderDoc = (anchor) => {
      const href = anchor.attribs.href;
      // Teks tautan = nama file (dari editor); fallback ke bagian akhir URL.
      const label =
        (anchor.children && anchor.children[0] && anchor.children[0].data) ||
        decodeURIComponent(href.split("/").pop());

      const match = href.match(DOC_EXT);
      const ext = match && match[1] ? match[1].toLowerCase() : "";

      // PDF & DOCX dirender sebagai pratinjau yang bisa discroll & dibaca.
      if (ext === "pdf" || ext === "doc" || ext === "docx") {
        return <DocumentViewer href={href} label={label} ext={ext} />;
      }

      // Format lain (XLS/PPT/dll) belum bisa dirender langsung → kartu unduh.
      return (
        <div className="doc-embed doc-embed-card">
          <i className="fa-solid fa-file-lines doc-embed-icon" />
          <div className="doc-embed-info">
            <span className="doc-embed-name">{label}</span>
            <a
              className="doc-embed-open"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              Buka / Unduh Dokumen
            </a>
          </div>
        </div>
      );
    };

    // CKEditor membungkus tautan dalam <p>. Karena viewer memakai <div> (blok),
    // menaruhnya di dalam <p> melanggar HTML & memicu error hydration. Maka bila
    // sebuah <p> HANYA berisi satu tautan dokumen, kita ganti seluruh <p>-nya.
    if (node.type === "tag" && node.name === "p") {
      const kids = (node.children || []).filter(
        (c) => !(c.type === "text" && !(c.data || "").trim())
      );
      if (kids.length === 1 && isDocAnchor(kids[0])) {
        return renderDoc(kids[0]);
      }
    }

    // Tautan dokumen yang berdiri sendiri (tidak dalam <p>).
    if (isDocAnchor(node)) {
      return renderDoc(node);
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
          replace: transformNode,
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
