import React, { useState, useEffect, useRef } from 'react';
import './HeroSection.css';

// Import assets
import WOWOK from '../../assets/source/WOWOK.jpg';
import Mitra4 from '../../assets/source/Mitra (4).png';
import Mitra5 from '../../assets/source/Mitra (5).png';
import Background from '../../assets/source/section-landing.png';

const HeroSection = () => {
    const [typedText, setTypedText] = useState('');
    const [showSubtitle, setShowSubtitle] = useState(false);
    const fullText = "Balai Penjaminan Mutu Pendidikan Provinsi Lampung";
    const heroImageRef = useRef(null);

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

        if (heroImageRef.current) {
            heroImageRef.current.style.transformOrigin = 'right bottom';
        }

        const animateHero = () => {
            if (!heroImageRef.current) return;

            const scrollY = window.scrollY;
            const translateY = Math.min(scrollY * 1.1, 1320);
            const scale = Math.max(1 - scrollY * 0.00012, 0.93);
            const brightness = Math.max(1 - scrollY * 0.00045, 0.78);

            heroImageRef.current.style.transform = `translateY(${translateY}px) scale(${scale})`;
            heroImageRef.current.style.filter = `brightness(${brightness})`;

            animationFrame = requestAnimationFrame(animateHero);
        };

        animationFrame = requestAnimationFrame(animateHero);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    return (
        <div className="landing-wrapper">
            <div className="background-glow-container"></div>
            <section className="hero-section">
                <div className="hero-flex-container">
                    <div className="hero-left-content">
                        <span className="welcome-text entrance-fade-down">Selamat Datang Di</span>

                        <h1 className="main-title">
                            {typedText}
                            <span className={`typing-cursor ${showSubtitle ? 'stop-blink' : ''}`}>|</span>
                        </h1>

                        <p className={`sub-title ${showSubtitle ? 'entrance-fade-up' : 'opacity-0'}`}>
                            Kementerian Pendidikan Dasar dan Menengah
                        </p>

                        <div className={`hero-logos-flex ${showSubtitle ? 'entrance-fade-up-delay' : 'opacity-0'}`}>
                            <img src={Mitra4} alt="Pendidikan Bermutu" className="bottom-logo" />
                            <img src={Mitra5} alt="Kemendikdasmen Ramah" className="bottom-logo" />
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
