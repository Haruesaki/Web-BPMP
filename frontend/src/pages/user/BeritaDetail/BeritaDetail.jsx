import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../api/axiosInstance";
import parse from "html-react-parser";
import DocumentViewer from "../../../components/user/content-types/Default/DocumentViewer";
import { kelompokkanGambarBerurutan } from "../../../utils/kelompokGambar";
import "../../../components/user/content-types/Default/DefaultContent.css"; 
import "./BeritaDetail.css";

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

const BeritaDetail = ({ lenisRef }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newsDetail, setNewsDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/beranda/berita/${id}`);
        if (res.data?.success) {
          setNewsDetail(res.data.data);
        } else {
          setNewsDetail(null);
        }
      } catch (err) {
        console.error("Gagal mengambil detail berita:", err);
        setNewsDetail(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const DOC_EXT = /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|rtf|txt|csv)(\?.*)?$/i;

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
      const label =
        (anchor.children && anchor.children[0] && anchor.children[0].data) ||
        decodeURIComponent(href.split("/").pop());

      const match = href.match(DOC_EXT);
      const ext = match && match[1] ? match[1].toLowerCase() : "";
      // ".doc" TIDAK termasuk: itu format biner Office lama, dan docx-preview
      // hanya memahami OOXML. Memasukkannya membuat viewer terbuka lalu gagal —
      // pembaca melihat pesan galat padahal berkasnya baik-baik saja. Format
      // lama diarahkan ke kartu unduh di bawah.
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
    return <div style={{ padding: '150px 40px', textAlign: 'center', color: 'var(--text-main)' }}>Memuat detail berita...</div>;
  }

  if (!newsDetail) {
    return (
      <div style={{ padding: '150px 40px', textAlign: 'center', color: 'var(--text-main)' }}>
        <h2>Berita tidak ditemukan</h2>
        <button onClick={() => navigate(-1)} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc' }}>Kembali</button>
      </div>
    );
  }

  // Lakukan parsing dan integrasi logika grouping gambar seperti di DefaultContent
  const wrappedHtml = `<div class="ck-content-root">${newsDetail.konten || ''}</div>`;
  const parsedContent = parse(wrappedHtml, {
    replace: (node) => {
      // Gambar yang bersebelahan tanpa teks di antaranya dijajarkan mendatar,
      // paling banyak tiga per baris. Aturan lengkapnya di utils/kelompokGambar.js
      // — berbagi logika dengan DefaultContent supaya keduanya tidak menyimpang.
      if (node.type === "tag" && node.attribs?.class === "ck-content-root") {
        node.children = kelompokkanGambarBerurutan(node.children);
        return; // biarkan parser melanjutkan dengan anak yang baru
      }
      
      return transformNode(node);
    },
  });

  // Format tanggal DISAMAKAN dengan DefaultContent (post-date): "Hari, DD Bulan YYYY | HH.MM WIB".
  const formattedDate = (() => {
    const d = new Date(newsDetail.tanggal);
    const hari = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(d);
    const tgl = new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' }).format(d);
    const pukul = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).format(d);
    return `${hari}, ${tgl} | ${pukul} WIB`;
  })();

  return (
    <div className="berita-detail-page generic-page-container">
      <div className="content-type-section default-content" style={{ marginTop: '40px', marginBottom: '80px', maxWidth: '1000px' }}>

        <div className="default-banner-wrapper">
          <h1 className="default-banner-title">{newsDetail.judul}</h1>
          <p className="post-date">
            <i className="fa-solid fa-calendar-days" style={{ marginRight: '8px' }}></i>
            {formattedDate}
          </p>
        </div>
        
        <div className="default-description-container">
          {newsDetail.coverUrl && (
             <div className="berita-main-cover">
               <img src={newsDetail.coverUrl} alt="Cover Berita" />
             </div>
          )}
          <div className="berita-parsed-content">
            {parsedContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeritaDetail;
