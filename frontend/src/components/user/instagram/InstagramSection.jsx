import React, { useEffect, useRef, useState } from 'react';
import './InstagramSection.css';

import MediaKosong from "../../common/MediaKosong";
import Instagram from "../../../assets/source/instagram.png";

const backendUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Script embed Instagram hanya dimuat sekali dan dipakai bersama oleh semua kartu
let instagramScriptPromise = null;
const loadInstagramScript = () => {
    if (instagramScriptPromise) return instagramScriptPromise;

    instagramScriptPromise = new Promise((resolve) => {
        if (window.instgrm) return resolve();

        const existing = document.getElementById('instagram-embed-script');
        if (existing) {
            existing.addEventListener('load', resolve);
            existing.addEventListener('error', resolve);
            return;
        }

        const script = document.createElement('script');
        script.id = 'instagram-embed-script';
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = resolve; // tetap lanjut walau gagal agar tidak menggantung
        document.body.appendChild(script);
    });

    return instagramScriptPromise;
};

// Gabungkan (coalesce) pemrosesan embed: bila beberapa kartu aktif hampir
// bersamaan, cukup SATU kali window.instgrm.Embeds.process() per frame — bukan
// N pemindaian global. process() menghidrasi semua <blockquote> yang belum
// diproses, dan hanya kartu yang terlihat yang merender blockquote.
let processScheduled = false;
const scheduleProcess = () => {
    if (processScheduled) return;
    processScheduled = true;
    requestAnimationFrame(() => {
        processScheduled = false;
        if (window.instgrm) window.instgrm.Embeds.process();
    });
};

const InstagramEmbedCard = React.memo(({ postId, forceActive }) => {
    const wrapperRef = useRef(null);
    // Lazy per-kartu: embed baru dimuat saat KARTU INI mendekati viewport
    // (bukan saat seluruh grid mendekat). forceActive = mode preview admin.
    const [visible, setVisible] = useState(forceActive);

    // Observer per-kartu.
    useEffect(() => {
        if (visible) return;
        const el = wrapperRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            setVisible(true);
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                setVisible(true);
                observer.disconnect();
            }
        }, { rootMargin: '300px 0px' }); // mulai memuat sedikit sebelum terlihat
        observer.observe(el);
        return () => observer.disconnect();
    }, [visible]);

    // Proses embed hanya setelah kartu terlihat.
    useEffect(() => {
        if (!visible) return;
        let cancelled = false;
        loadInstagramScript().then(() => {
            if (!cancelled) scheduleProcess();
        });
        return () => { cancelled = true; };
    }, [postId, visible]);

    // Placeholder ringan selama embed belum dimuat, agar tidak ada lompatan layout.
    // wrapperRef dipasang di kedua cabang agar observer punya elemen untuk diamati.
    if (!visible) {
        return <div ref={wrapperRef} className="ig-post-card ig-embed-wrapper ig-embed-skeleton" aria-hidden="true" />;
    }

    return (
        <div ref={wrapperRef} className="ig-post-card ig-embed-wrapper">
            <blockquote
                className="instagram-media"
                data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`}
                data-instgrm-version="14"
                style={{ background: '#FFF', border: 0, borderRadius: '3px', boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)', margin: '1px', maxWidth: '540px', minWidth: '326px', padding: 0, width: 'calc(100% - 2px)' }}
            >
            </blockquote>
        </div>
    );
}, (prevProps, nextProps) => prevProps.postId === nextProps.postId && prevProps.forceActive === nextProps.forceActive);


const InstagramSection = ({ igProfile, loading, isPreviewMode = false }) => {
    const followBtnWrapperRef = useRef(null);
    const scrollState = useRef({
        currentY: 0,
        targetY: 0,
        lastScrollY: 0,
        rafId: null,
    });

    useEffect(() => {
        const wrapper = followBtnWrapperRef.current;
        if (!wrapper) return;

        scrollState.current.lastScrollY = window.scrollY;

        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

        const animate = () => {
            // Lakukan interpolasi dari posisi saat ini ke posisi target untuk efek lag
            scrollState.current.currentY = lerp(scrollState.current.currentY, scrollState.current.targetY, 0.075);
            // Secara bertahap kembalikan posisi target ke 0 agar tombol kembali ke tengah
            scrollState.current.targetY = lerp(scrollState.current.targetY, 0, 0.075);

            const translateY = scrollState.current.currentY.toFixed(2);

            // Hentikan loop animasi jika sudah sangat dekat dengan posisi awal untuk efisiensi
            if (Math.abs(translateY) < 0.01 && Math.abs(scrollState.current.targetY) < 0.01) {
                wrapper.style.transform = '';
                cancelAnimationFrame(scrollState.current.rafId);
                scrollState.current.rafId = null;
            } else {
                wrapper.style.transform = `translateY(${translateY}px)`;
                scrollState.current.rafId = requestAnimationFrame(animate);
            }
        };

        const handleScroll = () => {
            const scrollY = window.scrollY;
            const delta = scrollY - scrollState.current.lastScrollY;
            scrollState.current.lastScrollY = scrollY;

            // "Dorong" posisi target berdasarkan pergerakan scroll
            scrollState.current.targetY -= delta * 0.8; // Faktor intensitas dibalik agar berlawanan arah
            // Batasi nilai target agar tidak terlalu ekstrim saat scroll cepat
            scrollState.current.targetY = Math.max(-45, Math.min(45, scrollState.current.targetY));

            if (!scrollState.current.rafId) {
                scrollState.current.rafId = requestAnimationFrame(animate);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollState.current.rafId) {
                cancelAnimationFrame(scrollState.current.rafId);
            }
        };
    }, []);

    return (
        <section className="container-instagram-section">
        <section className="instagram-section">
            <div className="ig-profile-header">
                <div className="ig-profile-left">
                    {igProfile?.profile_pic_url_hd ? (
                      <img
                        src={getFullUrl(igProfile.profile_pic_url_hd)}
                        alt="Logo BPMP"
                        className="ig-avatar"
                        width={65}
                        height={65}
                        loading="lazy"
                        decoding="async"
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <MediaKosong className="ig-avatar" label="Foto profil Instagram belum tersedia" />
                    )}
                    <span className="ig-username">@{igProfile?.username || 'bpmplampung'}</span>
                </div>

                <div className="ig-stats">
                    <div className="ig-stat-item">
                        <span className="ig-stat-label">Postingan</span>
                        <span className="ig-stat-value">
                           {loading ? '...' : (igProfile?.posts_count?.toLocaleString('id-ID') || '1.865')}
                        </span>
                    </div>
                    <div className="ig-stat-item">
                        <span className="ig-stat-label">Pengikut</span>
                        <span className="ig-stat-value">
                           {loading ? '...' : (igProfile?.followers?.toLocaleString('id-ID') || '6.138')}
                        </span>
                    </div>
                    <div className="ig-stat-item">
                        <span className="ig-stat-label">Diikuti</span>
                        <span className="ig-stat-value">
                           {loading ? '...' : (igProfile?.following?.toLocaleString('id-ID') || '1.151')}
                        </span>
                    </div>
                </div>

                <div className="ig-profile-right">
                    <div ref={followBtnWrapperRef} style={{ willChange: 'transform' }}>
                        <a href={`https://www.instagram.com/${igProfile?.username || 'bpmplampung'}`} target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none'}}>
                            <button className="ig-follow-btn">
                                <img src={Instagram} alt="IG Icon" className="ig-btn-icon" />
                                Follow
                            </button>
                        </a>
                    </div>
                </div>
            </div>

            <div className="ig-feed-section">
                <div className="ig-feed-grid">
                    {/* Dynamic Instagram Embed Component */}
                    {igProfile && igProfile.embed_links && igProfile.embed_links.length > 0 ? (
                        igProfile.embed_links.map((linkId, index) => (
                            linkId ? <InstagramEmbedCard key={index} postId={linkId} forceActive={isPreviewMode} /> : null
                        ))
                    ) : (
                        <>
                            <InstagramEmbedCard postId="DaMGvRKAb7z" forceActive={isPreviewMode} />
                            <InstagramEmbedCard postId="DZR9Hdfh9Zs" forceActive={isPreviewMode} />
                            <InstagramEmbedCard postId="DaNwf5vyIYn" forceActive={isPreviewMode} />
                            <InstagramEmbedCard postId="DaKohaEPomy" forceActive={isPreviewMode} />
                        </>
                    )}
                </div>
            </div>
        </section>
        </section>
    );
};

export default InstagramSection;