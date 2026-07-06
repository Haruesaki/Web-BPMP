import React from 'react';
import './YoutubeSection.css';

import Youtube from "../../../assets/source/youtube.png";

const YoutubeSection = ({ ytVideos, ytChannel }) => {
    return (
        <section className="youtube-section">
            <div className="yt-header-bar">
                <div className="yt-profile-left">
                    <img src={ytChannel?.thumbnails?.default?.url || Youtube} alt="YouTube Icon" className="yt-icon" style={ytChannel?.thumbnails ? { borderRadius: '50%' } : {}} />
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
                            {ytChannel?.statistics?.viewCount && ytChannel?.statistics?.videoCount
                                ? Math.round(Number(ytChannel.statistics.viewCount) / Number(ytChannel.statistics.videoCount)).toLocaleString('id-ID')
                                : '-'}
                        </span>
                    </div>
                </div>

                <div className="yt-profile-right">
                    <a href={`https://www.youtube.com/channel/${ytChannel?.id || 'UC1ZsLrBw_Vq0b3Db9ruTwdA'}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer" className="yt-subscribe-btn" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Subscribe</a>
                </div>
            </div>

            {/* Konten Grid Video */}
            <div className="yt-content-area">
                {/* WADAH TUNGGAL BARU */}
                <div className="yt-unified-card">

                    <h3 className="yt-unified-title">VIDEO TERBARU</h3>

                    <div className="yt-feed-grid">
                        {/* Kolom Kiri: Video Utama */}
                        <div className="yt-main-column">
                            <div className={`yt-video-wrapper main-wrapper ${ytVideos.length > 0 && ytVideos[0].videoType === 'short' ? 'short-format' : ''}`}>
                                {ytVideos.length > 0 && (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${ytVideos[0].id.videoId}`}
                                        title={ytVideos[0].snippet.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        loading="lazy"
                                    ></iframe>
                                )}
                            </div>
                        </div>

                        {/* Kolom Kanan: Daftar Video Terbaru */}
                        <div className="yt-side-column">
                            <div className="yt-side-list">
                                {ytVideos.slice(1, 3).map((video, idx) => (
                                    <div key={idx} className={`yt-video-wrapper side-wrapper ${video.videoType === 'short' ? 'short-format' : ''}`}>
                                        <iframe
                                            width="100%"
                                            height="100%"
                                            src={`https://www.youtube.com/embed/${video.id.videoId}`}
                                            title={video.snippet.title}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            loading="lazy"
                                        ></iframe>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
};

export default YoutubeSection;