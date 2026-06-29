import { useState } from 'react'
import './Video.css'

import ig2 from '../assets/source/Foto-Instagram-2.png'
import ig3 from '../assets/source/Foto-Instagram-3.png'
import ig4 from '../assets/source/Foto-Instagram-4.png'
import ytIcon from '../assets/source/youtube.png'

const videoList = [
  {
    id: 1,
    title: 'Jejak Dedikasi, Melanjutkan Inspirasi',
    thumbnail: ig3,
    duration: '12:34',
    views: '1.2K',
    date: '2 minggu yang lalu'
  },
  {
    id: 2,
    title: 'Workshop Penjaminan Mutu Pendidikan 2026',
    thumbnail: ig4,
    duration: '8:45',
    views: '856',
    date: '1 bulan yang lalu'
  },
  {
    id: 3,
    title: 'Profil BPMP Lampung - Melayani dengan Hati',
    thumbnail: ig2,
    duration: '15:20',
    views: '2.1K',
    date: '2 bulan yang lalu'
  }
]

export default function Video() {
  const [currentVideo, setCurrentVideo] = useState(videoList[0])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handlePlayVideo = (video) => {
    setCurrentVideo(video)
    setIsPlaying(true)
  }

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed)
  }

  return (
    <section className="video-section" id="video">
      <div className="video-header-banner">
        <div className="yt-badge">
          <img src={ytIcon} alt="YouTube" />
          <span>bpmplampung</span>
          <span className="subscriber-count">{isSubscribed ? '6.13K subscribers' : 'Subscribe'}</span>
        </div>
        <button 
          className={`btn-subscribe ${isSubscribed ? 'subscribed' : ''}`}
          onClick={handleSubscribe}
        >
          {isSubscribed ? '✓ Subscribed' : 'Subscribe'}
        </button>
      </div>

      <div className="video-content">
        <div className="video-main">
          <h3>{currentVideo.title}</h3>
          <div 
            className="video-player"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <img 
              src={currentVideo.thumbnail} 
              alt={currentVideo.title} 
              className="video-poster" 
            />
            {!isPlaying && (
              <div className="play-button-overlay">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            )}
            {isPlaying && (
              <div className="pause-overlay">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              </div>
            )}
            <div className="video-duration">{currentVideo.duration}</div>
          </div>
          <div className="video-meta">
            <span className="video-views">{currentVideo.views} views</span>
            <span className="video-date">{currentVideo.date}</span>
          </div>
        </div>
        
        <div className="video-side">
          <h3>Video Terbaru</h3>
          <div className="video-side-list">
            {videoList.filter(v => v.id !== currentVideo.id).map((video) => (
              <div 
                key={video.id}
                className="video-thumb-card"
                onClick={() => handlePlayVideo(video)}
              >
                <img src={video.thumbnail} alt={video.title} />
                <div className="play-button-small">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <div className="video-thumb-duration">{video.duration}</div>
                <div className="video-thumb-info">
                  <h4>{video.title}</h4>
                  <span>{video.views} views • {video.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
