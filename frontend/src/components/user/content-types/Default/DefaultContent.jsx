import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./DefaultContent.css";
import axiosInstance from "../../../../api/axiosInstance";
import parse from "html-react-parser";
import DocumentViewer from "./DocumentViewer";
import { kelompokkanGambarBerurutan } from "../../../../utils/kelompokGambar";

// ==========================================
// IMAGE RATIO & FRAME HELPERS
// ==========================================
const classifyRatio = (w, h) => {
  if (!w || !h) return "image-frame--landscape";
  const r = w / h;
  if (r > 1.15) return "image-frame--landscape";
  if (r < 0.85) return "image-frame--portrait";
  return "image-frame--square";
};

const ContentImage = ({ imgProps }) => {
  const [variant, setVariant] = useState("image-frame--landscape");
  const apply = (img) => {
    if (img && img.naturalWidth) {
      setVariant(classifyRatio(img.naturalWidth, img.naturalHeight));
    }
  };
  return (
    <div className={`image-frame ${variant}`}>
      <img
        {...imgProps}
        onLoad={(e) => apply(e.currentTarget)}
        ref={(el) => {
          if (el && el.complete) apply(el);
        }}
      />
    </div>
  );
};

// ==========================================
// MAIN COMPONENT: DEFAULT CONTENT RENDERER
// ==========================================
const DefaultContent = ({ menuId, viewLayout, menuName }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const targetId = location.hash.substring(1);
    if (targetId && content.length > 0) {
      const element = document.getElementById(targetId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
      }
    }
  }, [location.hash, content]);

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

  const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|rtf|txt|csv)(\?.*)?$/i;

  // ==========================================
  // NODE TRANSFORMER (HTML PARSER & COMPONENT INJECTION)
  // ==========================================
  const transformNode = (node) => {
    if (node.type === "tag" && node.attribs?.style) {
      const originalStyle = node.attribs.style;
      const fontSizeRegex = /font-size\s*:\s*([^;]+)/i;
      const match = originalStyle.match(fontSizeRegex);
      if (match) {
        const fontSizeVal = match[1].trim();
        let newStyle = originalStyle.replace(/font-size\s*:\s*[^;]+;?/gi, "").trim();
        newStyle = newStyle.replace(/;+/g, ";").replace(/^;|;$/g, "");
        const numericVal = parseFloat(fontSizeVal);
        const fsValDecl = isNaN(numericVal) ? "" : `; --fs-val: ${numericVal}`;
        node.attribs.style = `${newStyle}${newStyle ? "; " : ""}--fs: ${fontSizeVal}${fsValDecl};`;
      }
    }

    if (node.type === "tag" && node.name === "img") {
      const imgSrc = node.attribs.src;
      const cleanedAttribs = { ...node.attribs };
      delete cleanedAttribs.width;
      delete cleanedAttribs.height;
      delete cleanedAttribs.style;
      return (
        <ContentImage
          imgProps={{ ...cleanedAttribs, src: imgSrc, alt: node.attribs.alt || "" }}
        />
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
      const label =
        (anchor.children && anchor.children[0] && anchor.children[0].data) ||
        decodeURIComponent(href.split("/").pop());
      const match = href.match(DOC_EXT);
      const ext = match && match[1] ? match[1].toLowerCase() : "";

      // Format modern dirender sebagai pratinjau yang bisa discroll & dibaca:
      // PDF, DOCX, XLSX/XLS, PPTX. (.doc & .ppt biner lama → kartu unduh.)
      //
      // ".doc" sempat ikut terdaftar di sini, bertentangan dengan keterangan di
      // atasnya: viewer-nya terbuka lalu gagal karena docx-preview hanya
      // memahami OOXML, sehingga pembaca melihat pesan galat padahal berkasnya
      // baik-baik saja.
      const PREVIEWABLE = ["pdf", "docx", "xls", "xlsx", "pptx"];
      if (PREVIEWABLE.includes(ext)) {
        return <DocumentViewer href={href} label={label} ext={ext} />;
      }
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

    const getEmbedUrl = (n) => {
      if (!n || n.type !== "tag") return "";
      if (n.attribs?.["data-oembed-url"]) return n.attribs["data-oembed-url"];
      if (n.name === "oembed" && n.attribs?.url) return n.attribs.url;
      if (n.name === "figure") {
        const o = (n.children || []).find(
          (c) => c.type === "tag" && c.name === "oembed" && c.attribs?.url
        );
        if (o) return o.attribs.url;
      }
      return "";
    };

    const renderMediaEmbed = (url) => {
      const ig = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i);
      if (ig) {
        return (
          <div className="media-embed media-embed-ig" data-lenis-prevent>
            <iframe
              src={`https://www.instagram.com/${ig[1]}/${ig[2]}/embed`}
              title="Instagram"
              loading="lazy"
              frameBorder="0"
            />
          </div>
        );
      }
      const yt = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i
      );
      if (yt) {
        return (
          <div className="media-embed media-embed-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${yt[1]}`}
              title="YouTube"
              loading="lazy"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
      if (vm) {
        return (
          <div className="media-embed media-embed-video">
            <iframe
              src={`https://player.vimeo.com/video/${vm[1]}`}
              title="Vimeo"
              loading="lazy"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      return (
        <div className="media-embed media-embed-fallback">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {url}
          </a>
        </div>
      );
    };

    const embedUrl = getEmbedUrl(node);
    if (embedUrl) {
      return renderMediaEmbed(embedUrl);
    }

    if (node.type === "tag" && node.name === "p") {
      const kids = (node.children || []).filter(
        (c) => !(c.type === "text" && !(c.data || "").trim())
      );
      if (kids.length === 1 && isDocAnchor(kids[0])) {
        return renderDoc(kids[0]);
      }
    }

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
    <div className="default-layout-wrapper">
      {menuName && (
        <div className="page-content-header">
          <h1>{menuName}</h1>
        </div>
      )}
      <div className={`default-content-wrapper ${isVertical ? 'layout-vertical' : 'layout-horizontal'}`}>
        {content.map(c => {
          const wrappedHtml = `<div class="ck-content-root">${c.deskripsi_kaya || ''}</div>`;
          const parsedContent = parse(wrappedHtml, {
            replace: (node) => {
              if (node.type === "tag" && node.attribs?.class === "ck-content-root") {
                node.children = kelompokkanGambarBerurutan(node.children);
                return;
              }
              return transformNode(node);
            },
          });

          return (
            <div key={c.id} id={`content-${c.id}`} className="content-type-section default-content">
              <div className="default-banner-wrapper">
                <h1 className="default-banner-title">{c.judul}</h1>
                <p className="post-date">
                  <i className="fa-solid fa-calendar-days" style={{ marginRight: '8px' }}></i>
                  {formatTanggal(c.dibuat_pada)}
                </p>
              </div>
              <div className="default-description-container">
                {parsedContent}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// DATE FORMATTER UTILS
// ==========================================
const formatTanggal = (tanggalISO) => {
  if (!tanggalISO) return null;
  const date = new Date(tanggalISO);
  const optionsHari = { weekday: 'long', timeZone: 'Asia/Jakarta' };
  const optionsTanggalBulanTahun = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' };
  const optionsPukul = { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' };
  const hari = new Intl.DateTimeFormat('id-ID', optionsHari).format(date);
  const tanggalBulanTahun = new Intl.DateTimeFormat('id-ID', optionsTanggalBulanTahun).format(date);
  const pukul = new Intl.DateTimeFormat('id-ID', optionsPukul).format(date);
  return `${hari}, ${tanggalBulanTahun} | ${pukul} WIB`;
};

export default DefaultContent;
