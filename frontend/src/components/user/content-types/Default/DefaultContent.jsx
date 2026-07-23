import React, { useEffect, useState } from "react";
import "./DefaultContent.css";
import axiosInstance from "../../../../api/axiosInstance";
import parse from "html-react-parser";
import DocumentViewer from "./DocumentViewer";

// Klasifikasi rasio gambar → kelas wadah adaptif (CSS tidak bisa mendeteksi
// rasio konten gambar, jadi diukur via naturalWidth/naturalHeight):
//   landscape → penuh lebar konten induk (tinggi maks 500px, crop bila lewat)
//   square (kotak) → 500×500
//   portrait → box portrait (tinggi maks 500px, kelebihan di-crop)
const classifyRatio = (w, h) => {
  if (!w || !h) return "image-frame--landscape";
  const r = w / h;
  if (r > 1.15) return "image-frame--landscape";
  if (r < 0.85) return "image-frame--portrait";
  return "image-frame--square";
};

// Wadah gambar adaptif: memilih kelas sesuai rasio gambar saat dimuat.
// Ref callback menangani gambar dari cache (sudah `complete` saat mount).
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
      // Teks tautan = nama file (dari editor); fallback ke bagian akhir URL.
      const label =
        (anchor.children && anchor.children[0] && anchor.children[0].data) ||
        decodeURIComponent(href.split("/").pop());

      const match = href.match(DOC_EXT);
      const ext = match && match[1] ? match[1].toLowerCase() : "";

      // Format modern dirender sebagai pratinjau yang bisa discroll & dibaca:
      // PDF, DOCX, XLSX/XLS, PPTX. (.doc & .ppt biner lama → kartu unduh.)
      const PREVIEWABLE = ["pdf", "doc", "docx", "xls", "xlsx", "pptx"];
      if (PREVIEWABLE.includes(ext)) {
        return <DocumentViewer href={href} label={label} ext={ext} />;
      }

      // Format lain (.ppt lama/dll) belum bisa dirender langsung → kartu unduh.
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

    // --- MEDIA EMBED (Instagram/YouTube/Vimeo) ---
    // CKEditor menyimpan hasil "Media Embed" sebagai elemen SEMANTIK
    // <figure class="media"><oembed url="..."></oembed></figure> (bukan iframe
    // jadi). <oembed> bukan elemen HTML nyata → tak tampil di browser. Di sini
    // kita ambil url-nya lalu render embed asli.
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
      // Instagram (post/reel/tv) → iframe endpoint /embed (dirancang untuk disematkan).
      const ig = url.match(/instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/i);
      if (ig) {
        return (
          // data-lenis-prevent: lepaskan pembajakan roda mouse oleh Lenis saat
          // kursor di atas embed, agar konten IG (yang punya scroll internal)
          // bisa digulir — sama seperti wadah pratinjau dokumen.
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
      // YouTube (watch/youtu.be/embed/shorts)
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
      // Vimeo
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
      // Provider lain yang tak dikenali → tetap tampil sebagai tautan (bukan hilang).
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
