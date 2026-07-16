import React, { useState, useEffect, useRef, useMemo } from 'react';
import './HeroSection.css';

// Import assets
import Mitra4 from '../../assets/source/Mitra (4).png';
import Mitra5 from '../../assets/source/Mitra (5).png';
import Background from '../../assets/source/section-landing.png';

const HeroSection = () => {
    const [typedText, setTypedText] = useState('');
    const [showSubtitle, setShowSubtitle] = useState(false);
    const fullText = "Balai Penjaminan Mutu Pendidikan Provinsi Lampung";
    const heroImageRef = useRef(null);
    const heroLeftContentRef = useRef(null); // 1. Tambahkan ref baru untuk konten kiri

    // EFEK PARTIKEL
    const particles = useMemo(() => {
        const particleCount = 50;
        return Array.from({ length: particleCount }).map((_, i) => {
            const size = Math.random() * 1 + 4; // Ukuran antara 1px dan 4px
            const duration = Math.random() * 8 + 3; // Durasi antara 10s dan 20s
            const delay = Math.random() * 3; // Delay hingga 20s
            const left = Math.random() * 120; // Posisi horizontal acak

            return (
                <div
                    key={i}
                    className="particle"
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        left: `${left}%`,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                    }}
                />
            );
        });
    }, []);

    // EFEK TYPEWRITER
    useEffect(() => {
        let i = 0;
        let typingInterval;

        const startDelay = setTimeout(() => {
            typingInterval = setInterval(() => {
                if (i < fullText.length) {
                    setTypedText(fullText.substring(0, i + 1));
                    i++;
                } else {
                    clearInterval(typingInterval);
                    setShowSubtitle(true);
                }
            }, 40);
        }, 500);

        return () => {
            clearTimeout(startDelay);
            if (typingInterval) clearInterval(typingInterval);
        };
    }, [fullText]);

    // EFEK HERO PARALLAX
    useEffect(() => {
        let animationFrame;

        const rightImage = heroImageRef.current;
        const leftContent = heroLeftContentRef.current;

        if (rightImage) {
            rightImage.style.transformOrigin = 'right bottom';
        }

        const animateHero = () => {
            // Pastikan kedua elemen ada sebelum melanjutkan
            if (!rightImage || !leftContent) return;

            const scrollY = window.scrollY;

            // --- Kalkulasi untuk Gambar Kanan (Gedung) ---
            const rightTranslateY = Math.min(scrollY * 1.5 , 1820); // Tingkatkan kecepatan "tenggelam"
            const scale = Math.max(1 - scrollY * 0.00012, 0.93);
            const brightness = Math.max(1 - scrollY * 0.00045, 0.78);

            rightImage.style.transform = `translateY(${rightTranslateY}px) scale(${scale})`;
            rightImage.style.filter = `brightness(${brightness})`;

            // 2. Tambahkan kalkulasi untuk Konten Kiri
            const leftTranslateY = scrollY * 1.90; // Nilai Y dipertahankan
            const leftTranslateX = scrollY * -0.500;   // Tambahkan parameter X untuk gerakan diagonal
            const leftOpacity = Math.max(1 - scrollY * 0.00200, 0); // Sesuaikan kecepatan menghilang

            // Gabungkan X dan Y untuk menciptakan gerakan diagonal
            leftContent.style.transform = `translate(${leftTranslateX}px`;
            leftContent.style.opacity = leftOpacity;

            animationFrame = requestAnimationFrame(animateHero);
        };
        animationFrame = requestAnimationFrame(animateHero);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    return (
        <div className="landing-wrapper">
            <div className="background-glow-container"></div>
            <div className="particle-container">{particles}</div>
            <section className="hero-section">
                <div className="hero-flex-container">
                    <div className="hero-left-content" ref={heroLeftContentRef}>
                        <span className="welcome-text entrance-fade-down">Selamat Datang Di</span>

                        <h1 className="main-title">
                            {typedText}
                            <span className={`typing-cursor ${showSubtitle ? 'stop-blink' : ''}`}>|</span>
                        </h1>

                        <p className={`sub-title ${showSubtitle ? 'entrance-fade-up' : 'opacity-0'}`}>
                            Kementerian Pendidikan Dasar dan Menengah
                        </p>

                        {/* Pembungkus terluar untuk menjaga tata letak agar tetap terkunci */}
                        <div className="hero-logos-wrapper-cms">
                            {/* Kontainer untuk daftar logo mitra, akan menjadi wadah dinamis */}
                            <div className={`hero-logos-flex ${showSubtitle ? 'entrance-fade-up-delay' : 'opacity-0'}`}>
                                {/* Setiap logo dibungkus dalam div-nya sendiri untuk pengelolaan CMS yang lebih baik */}
                                <div className="logo-item-cms">
                                    {/* Gambar logo mitra pertama */}
                                    <img src={Mitra4} alt="Pendidikan Bermutu" className="bottom-logo" />
                                </div>
                                <div className="logo-item-cms">
                                    {/* Gambar logo mitra kedua */}
                                    <img src={Mitra5} alt="Kemendikdasmen Ramah" className="bottom-logo" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="hero-right-cms">
                        <img
                            ref={heroImageRef}
                            src={Background}
                            alt="Visual Gedung dan Latar Belakang BPMP"
                            className="cms-dynamic-image"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HeroSection;
