import React, { useEffect } from 'react';
import './InstagramSection.css';

import Logo from "../../../assets/source/Logo.png";
import Instagram from "../../../assets/source/instagram.png";

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


const InstagramSection = ({ igProfile, loading }) => {
    return (
        <section className="instagram-section">
            <div className="ig-banner-wrapper">
                <div className="ig-banner-oval"></div>
                <h2 className="ig-banner-text">Ikuti Media Sosial BPMP Lampung</h2>
            </div>

            <div className="ig-profile-header">
                <div className="ig-profile-left">
                    <img 
                      src={igProfile?.profile_pic_url_hd?.startsWith('/uploads') 
                             ? `http://localhost:5000${igProfile.profile_pic_url_hd}` 
                             : (igProfile?.profile_pic_url_hd || Logo)} 
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
                    <a href={`https://www.instagram.com/${igProfile?.username || 'bpmplampung'}`} target="_blank" rel="noopener noreferrer" style={{textDecoration: 'none'}}>
                        <button className="ig-follow-btn">
                            <img src={Instagram} alt="IG Icon" className="ig-btn-icon" />
                            Follow
                        </button>
                    </a>
                </div>
            </div>

            <div className="ig-feed-section">
                <div className="ig-feed-grid">
                    {/* Dynamic Instagram Embed Component */}
                    <InstagramEmbedCard postId="DaMGvRKAb7z" />
                    <InstagramEmbedCard postId="DZR9Hdfh9Zs" />
                    <InstagramEmbedCard postId="DaNwf5vyIYn" />
                    <InstagramEmbedCard postId="DaKohaEPomy" />
                </div>
            </div>
        </section>
    );
};

export default InstagramSection;