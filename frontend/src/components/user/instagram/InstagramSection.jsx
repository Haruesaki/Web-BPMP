import React, { useEffect, useRef } from 'react';
import './InstagramSection.css';

import Logo from "../../../assets/source/Logo.png";
import Instagram from "../../../assets/source/instagram.png";

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const InstagramEmbedCard = React.memo(({ postId }) => {
    useEffect(() => {
        // Fungsi untuk memicu proses embed dari script Instagram
        const processInstagram = () => {
            if (window.instgrm) {
                window.instgrm.Embeds.process();
            }
        };

        // Cek apakah script sudah ada, jika belum muat scriptnya
        if (!document.getElementById('instagram-embed-script')) {
            const script = document.createElement('script');
            script.id = 'instagram-embed-script';
            script.src = 'https://www.instagram.com/embed.js';
            script.async = true;
            script.onload = processInstagram;
            document.body.appendChild(script);
        } else {
            // Jika sudah ada, beri sedikit jeda agar DOM terupdate lalu jalankan ulang process()
            setTimeout(processInstagram, 100);
        }
    }, [postId]);

    return (
        <div className="ig-post-card ig-embed-wrapper">
            <blockquote
                className="instagram-media"
                data-instgrm-permalink={`https://www.instagram.com/p/${postId}/`}
                data-instgrm-version="14"
                style={{ background: '#FFF', border: 0, borderRadius: '3px', boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)', margin: '1px', maxWidth: '540px', minWidth: '326px', padding: 0, width: 'calc(100% - 2px)' }}
            >
            </blockquote>
        </div>
    );
}, (prevProps, nextProps) => prevProps.postId === nextProps.postId);


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
                    <img 
                      src={igProfile?.profile_pic_url_hd ? getFullUrl(igProfile.profile_pic_url_hd) : Logo} 
                      alt="Logo BPMP" 
                      className="ig-avatar" 
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                      referrerPolicy="no-referrer"
                    />
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
                            linkId ? <InstagramEmbedCard key={index} postId={linkId} /> : null
                        ))
                    ) : (
                        <>
                            <InstagramEmbedCard postId="DaMGvRKAb7z" />
                            <InstagramEmbedCard postId="DZR9Hdfh9Zs" />
                            <InstagramEmbedCard postId="DaNwf5vyIYn" />
                            <InstagramEmbedCard postId="DaKohaEPomy" />
                        </>
                    )}
                </div>
            </div>
        </section>
        </section>
    );
};

export default InstagramSection;