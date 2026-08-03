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



const InstagramEmbedCard = React.memo(({ postId, forceActive, staggerIndex = 0 }) => {
    const wrapperRef = useRef(null);
    const [visible, setVisible] = useState(forceActive);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (visible) return;
        const el = wrapperRef.current;
        if (!el || typeof IntersectionObserver === 'undefined') {
            // Stagger load secara berurutan agar tidak semua request bersamaan
            const timer = setTimeout(() => setVisible(true), staggerIndex * 400);
            return () => clearTimeout(timer);
        }
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                // Tunda sedikit berdasarkan urutan card agar request tidak bertabrakan
                setTimeout(() => {
                    setVisible(true);
                    observer.disconnect();
                }, staggerIndex * 400);
            }
        }, { rootMargin: '50px 0px' }); // Dikurangi dari 300px agar tidak semua iframe load bersamaan
        observer.observe(el);
        return () => observer.disconnect();
    }, [visible]);

    const cleanPostId = postId?.replace(/\/$/, '') || '';

    return (
        <div ref={wrapperRef} className="ig-post-card ig-embed-wrapper">
            {!isLoaded && (
                <div className="ig-embed-skeleton ig-skeleton-overlay" aria-hidden="true" />
            )}

            {visible && cleanPostId && (
                <iframe
                    src={`https://www.instagram.com/p/${cleanPostId}/embed`}
                    title={`Instagram Post ${cleanPostId}`}
                    className="ig-embed-iframe"
                    onLoad={() => {
                        setIsLoaded(true);
                        setTimeout(() => {
                            window.dispatchEvent(new Event('resize'));
                        }, 200);
                    }}
                    style={{
                        width: '100%',
                        height: '100%',
                        border: '0',
                        borderRadius: '10px',
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.4s ease'
                    }}
                    scrolling="no"
                    allowTransparency="true"
                />
            )}
        </div>
    );
}, (prevProps, nextProps) => prevProps.postId === nextProps.postId && prevProps.forceActive === nextProps.forceActive && prevProps.staggerIndex === nextProps.staggerIndex);


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
                            linkId ? <InstagramEmbedCard key={index} postId={linkId} forceActive={isPreviewMode} staggerIndex={index} /> : null
                        ))
                    ) : (
                        <>
                            <InstagramEmbedCard postId="DaMGvRKAb7z" forceActive={isPreviewMode} staggerIndex={0} />
                            <InstagramEmbedCard postId="DZR9Hdfh9Zs" forceActive={isPreviewMode} staggerIndex={1} />
                            <InstagramEmbedCard postId="DaNwf5vyIYn" forceActive={isPreviewMode} staggerIndex={2} />
                            <InstagramEmbedCard postId="DaKohaEPomy" forceActive={isPreviewMode} staggerIndex={3} />
                        </>
                    )}
                </div>
            </div>
        </section>
        </section>
    );
};

export default InstagramSection;