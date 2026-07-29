import React, { useEffect, useRef } from 'react';
import './YoutubeSection.css';

import MediaKosong from "../../common/MediaKosong";

// Komponen Iframe Player dengan pola "facade":
// Awalnya HANYA menampilkan thumbnail + tombol play (ringan). Iframe YouTube
// yang berat (menyeret analitik YouTube + iklan DoubleClick, ~1 MB/video) baru
// dimuat SAAT DIKLIK. Ini menghapus rantai jaringan kritis ~7 detik di mobile
// tanpa mengubah tampilan: sebelum diklik pun iframe YouTube hanya menampilkan
// thumbnail + tombol play yang serupa.
const IframePlayer = ({ videoId, isMain }) => {
    const [aktif, setAktif] = React.useState(false);

    return (
        <div className={`yt-video-wrapper ${isMain ? 'main-wrapper' : 'side-wrapper'}`}>
            {aktif ? (
                <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            ) : (
                <button
                    type="button"
                    className="yt-facade"
                    onClick={() => setAktif(true)}
                    aria-label="Putar video YouTube"
                    style={{ backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)` }}
                >
                    <span className="yt-facade-play" aria-hidden="true"></span>
                </button>
            )}
        </div>
    );
};

// Komponen Placeholder untuk saat tidak ada video
const VideoPlaceholder = () => (
    <div className="yt-video-placeholder">
        <i className="fa-solid fa-video-slash"></i>
        <span>Tidak ada video untuk ditampilkan.</span>
    </div>
);

const YoutubeSection = ({ ytVideos, ytChannel, loading, error }) => {
    const subscribeBtnWrapperRef = useRef(null);
    const scrollState = useRef({
        currentY: 0,
        targetY: 0,
        lastScrollY: 0,
        rafId: null,
    });

    useEffect(() => {
        const wrapper = subscribeBtnWrapperRef.current;
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
        <section className="container-youtube-section">
        <section className="youtube-section">
            <div className="yt-header-bar">
                <div className="yt-profile-left">
                    {ytChannel?.thumbnails?.default?.url ? (
                        <img src={ytChannel.thumbnails.default.url} alt="YouTube Icon" className="yt-icon" style={{ borderRadius: '50%' }} loading="lazy" decoding="async" />
                    ) : (
                        <MediaKosong className="yt-icon" label="Ikon kanal YouTube belum tersedia" />
                    )}
                    <span className="yt-channel-name">
                        {ytChannel?.title || "Memuat..."}
                    </span>
                </div>

                <div className="yt-stats">
                    <div className="yt-stat-item">
                        <span className="yt-stat-label">Subscribe</span>
                        <span className="yt-stat-value">{ytChannel?.statistics?.subscriberCount ? Number(ytChannel.statistics.subscriberCount).toLocaleString('id-ID') : '-'}</span>
                    </div>
                    <div className="yt-stat-item">
                        <span className="yt-stat-label">Video</span>
                        <span className="yt-stat-value">{ytChannel?.statistics?.videoCount ? Number(ytChannel.statistics.videoCount).toLocaleString('id-ID') : '-'}</span>
                    </div>
                    <div className="yt-stat-item">
                        <span className="yt-stat-label">Rata-rata Views</span>
                        <span className="yt-stat-value">
                            {ytChannel?.statistics?.viewCount && ytChannel?.statistics?.videoCount && Number(ytChannel.statistics.videoCount) > 0
                                ? Math.round(Number(ytChannel.statistics.viewCount) / Number(ytChannel.statistics.videoCount)).toLocaleString('id-ID')
                                : (ytChannel?.statistics?.videoCount === '0' ? '0' : '-')}
                        </span>
                    </div>
                </div>

                <div className="yt-profile-right">
                    <div ref={subscribeBtnWrapperRef} style={{ willChange: 'transform' }}>
                        <a href={`https://www.youtube.com/channel/${ytChannel?.id || 'UC1ZsLrBw_Vq0b3Db9ruTwdA'}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer" className="yt-subscribe-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Subscribe</a>
                    </div>
                </div>
            </div>

            {/* Konten Grid Video */}
            <div className="yt-content-area">
                {/* WADAH TUNGGAL BARU */}
                <div className="yt-unified-card">

                    <h3 className="yt-unified-title">VIDEO TERBARU</h3>

                    {(() => {
                        if (loading) {
                            return (
                                <div className="yt-state-feedback">
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                    <span>Memuat video terbaru...</span>
                                </div>
                            );
                        }

                        if (error) {
                            return (
                                <div className="yt-state-feedback error">
                                    <i className="fa-solid fa-triangle-exclamation"></i>
                                    <span>{error}</span>
                                </div>
                            );
                        }

                        return (
                            <div className="yt-feed-grid">
                                {/* Kolom Kiri: Video Utama */}
                                <div className="yt-main-column">
                                    {ytVideos && ytVideos[0] ? (
                                        <IframePlayer videoId={ytVideos[0].id.videoId} isMain={true} />
                                    ) : (
                                        <div className="yt-video-wrapper main-wrapper">
                                            <VideoPlaceholder />
                                        </div>
                                    )}
                                </div>
                                {/* Kolom Kanan: Daftar Video Terbaru */}
                                <div className="yt-side-column">
                                    <div className="yt-side-list">
                                        {[...Array(2)].map((_, index) => {
                                            const video = ytVideos && ytVideos[index + 1];
                                            if (video) {
                                                return <IframePlayer key={video.id.videoId} videoId={video.id.videoId} isMain={false} />;
                                            } else {
                                                return (
                                                    <div key={`placeholder-${index}`} className="yt-video-wrapper side-wrapper">
                                                        <VideoPlaceholder />
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </section>
        </section>
    );
};

export default YoutubeSection;