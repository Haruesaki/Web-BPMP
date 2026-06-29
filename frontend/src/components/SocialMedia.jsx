import { useState } from 'react'
import './SocialMedia.css'

import ig1 from '../assets/source/Foto-Instagram-1.png'
import ig2 from '../assets/source/Foto-Instagram-2.png'
import ig3 from '../assets/source/Foto-Instagram-3.png'
import ig4 from '../assets/source/Foto-Instagram-4.png'
import followBtn from '../assets/source/Button-Follow-Instagram.png'

const instagramPosts = [
  { id: 1, image: ig1, likes: 245, comments: 18 },
  { id: 2, image: ig2, likes: 312, comments: 24 },
  { id: 3, image: ig3, likes: 189, comments: 15 },
  { id: 4, image: ig4, likes: 421, comments: 32 },
]

export default function SocialMedia() {
  const [hoveredPost, setHoveredPost] = useState(null)

  return (
    <section className="social-media-section" id="media-sosial">
      <div className="social-curve-wrapper">
        <div className="social-curve">
          <h2>Ikuti Media Sosial BPMP Lampung</h2>
        </div>
      </div>

      <div className="social-profile-card">
        <div className="profile-info">
          <div className="profile-avatar">
            <svg viewBox="0 0 100 100" className="profile-avatar-svg">
              <defs>
                <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#070833" />
                  <stop offset="100%" stopColor="#1a2670" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#avatarGrad)" />
              <text x="50" y="58" fill="#fff" fontSize="28" fontWeight="bold" textAnchor="middle">BP</text>
            </svg>
          </div>
          <div className="profile-details">
            <span className="profile-name">@bpmplampung</span>
            <span className="profile-handle">Balai Penjaminan Mutu Pendidikan Lampung</span>
          </div>
        </div>
        
        <div className="profile-stats">
          <div className="stat">
            <span>Postingan</span>
            <strong>1,865</strong>
          </div>
          <div className="stat">
            <span>Pengikut</span>
            <strong>6,138</strong>
          </div>
          <div className="stat">
            <span>Diikuti</span>
            <strong>1,151</strong>
          </div>
        </div>
        
        <div className="profile-action">
          <a 
            href="https://instagram.com/bpmplampung" 
            target="_blank" 
            rel="noopener noreferrer"
            className="follow-link"
          >
            <img src={followBtn} alt="Follow Instagram" className="btn-follow" />
          </a>
        </div>
      </div>

      <div className="instagram-grid">
        {instagramPosts.map((post) => (
          <div 
            key={post.id}
            className="ig-post"
            onMouseEnter={() => setHoveredPost(post.id)}
            onMouseLeave={() => setHoveredPost(null)}
          >
            <img src={post.image} alt={`Instagram Post ${post.id}`} loading="lazy" />
            <div className={`ig-post-overlay ${hoveredPost === post.id ? 'visible' : ''}`}>
              <div className="ig-stats">
                <span className="ig-stat">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {post.likes}
                </span>
                <span className="ig-stat">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                    <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/>
                  </svg>
                  {post.comments}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
