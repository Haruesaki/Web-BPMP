import { useState, useEffect, useRef, useMemo } from 'react';
import './HeroSection.css';
import axiosInstance from '../../api/axiosInstance';

// Import assets
import Logo from '../../assets/source/Logo.png';
import Mitra4 from '../../assets/source/Mitra (4).png';
import Mitra5 from '../../assets/source/Mitra (5).png';

const DEFAULT_HERO = {
    judul: 'Judul Website',
    subjudul: 'Deskripsi Website',
    url_gambar: null,
    logo_1: 'Kemendikdasmen',
    logo_2: 'BPMP Lampung',
};

const LOGO_ASSETS = {
    Kemendikdasmen: Mitra5,
    'BPMP Lampung': Logo,
    'Dinas Pendidikan': Mitra4,
};

const pseudoRandom = (seed) => {
    const value = Math.sin(seed) * 10000;
    return value - Math.floor(value);
};

const HeroSection = () => {
    const [heroContent, setHeroContent] = useState(DEFAULT_HERO);
    const [typedText, setTypedText] = useState('');
    const [showSubtitle, setShowSubtitle] = useState(false);
    const heroImageRef = useRef(null);
    const heroLeftContentRef = useRef(null); // 1. Tambahkan ref baru untuk konten kiri
    const fullText = heroContent.judul || DEFAULT_HERO.judul;
    const subtitle = heroContent.subjudul || DEFAULT_HERO.subjudul;
    const heroImage = heroContent.url_gambar || null;
    const selectedLogos = [heroContent.logo_1, heroContent.logo_2]
        .filter((logoName) => logoName && logoName !== 'Pilih Logo Utama')
        .map((logoName, index) => ({
            id: `${logoName}-${index}`,
            name: logoName,
            src: LOGO_ASSETS[logoName],
        }))
        .filter((logo) => logo.src);

    useEffect(() => {
        let isMounted = true;

        const loadHeroContent = async () => {
            try {
                const response = await axiosInstance.get('/api/beranda/hero');
                const hero = response.data?.data;
                if (!hero || !isMounted) return;

                setHeroContent({
                    ...DEFAULT_HERO,
                    ...hero,
                    url_gambar: hero.url_gambar || null,
                });
            } catch (error) {
                console.error('Gagal mengambil Hero Beranda:', error);
            }
        };

        loadHeroContent();

        return () => {
            isMounted = false;
        };
    }, []);

    // EFEK PARTIKEL
    const particles = useMemo(() => {
        const particleCount = 50;
        return Array.from({ length: particleCount }).map((_, i) => {
            const size = pseudoRandom(i + 1) * 1 + 4; // Ukuran antara 1px dan 4px
            const duration = pseudoRandom(i + 101) * 8 + 3; // Durasi antara 10s dan 20s
            const delay = pseudoRandom(i + 201) * 3; // Delay hingga 20s
            const left = pseudoRandom(i + 301) * 120; // Posisi horizontal acak

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
            setTypedText('');
            setShowSubtitle(false);

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
            leftContent.style.transform = `translate(${leftTranslateX}px, ${leftTranslateY}px)`;
            leftContent.style.opacity = leftOpacity;

            animationFrame = requestAnimationFrame(animateHero);
        };
        animationFrame = requestAnimationFrame(animateHero);
        return () => cancelAnimationFrame(animationFrame);
    }, [heroImage]);

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
                            {subtitle}
                        </p>

                        {/* Pembungkus terluar untuk menjaga tata letak agar tetap terkunci */}
                        <div className="hero-logos-wrapper-cms">
                            {/* Kontainer untuk daftar logo mitra, akan menjadi wadah dinamis */}
                            <div className={`hero-logos-flex ${showSubtitle ? 'entrance-fade-up-delay' : 'opacity-0'}`}>
                                {selectedLogos.map((logo) => (
                                    <div className="logo-item-cms" key={logo.id}>
                                        <img src={logo.src} alt={logo.name} className="bottom-logo" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {heroImage && (
                        <div className="hero-right-cms">
                            <img
                                ref={heroImageRef}
                                src={heroImage}
                                alt="Visual Gedung dan Latar Belakang BPMP"
                                className="cms-dynamic-image"
                            />
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default HeroSection;
