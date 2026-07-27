import { useState, useEffect, useRef, useMemo, useLayoutEffect } from 'react';
import './HeroSection.css';
import axiosInstance from '../../api/axiosInstance';

const backendUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const getFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('http')) return url;
    return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const DEFAULT_HERO = {
    judul: 'Judul Website',
    subjudul: 'Deskripsi Website',
    url_gambar: null,
    logo_1: '',
    logo_2: '',
};

const pseudoRandom = (seed) => {
    const value = Math.sin(seed) * 10000;
    return value - Math.floor(value);
};

const HeroSection = () => {
    const [heroContent, setHeroContent] = useState(DEFAULT_HERO);
    const [typedText, setTypedText] = useState('');
    const [isMobileView, setIsMobileView] = useState(false);
    const [showSubtitle, setShowSubtitle] = useState(false);
    const heroImageRef = useRef(null); // Ref untuk gambar di dalam bingkai
    const landingWrapperRef = useRef(null); // Ref untuk wrapper utama
    const heroRightCmsRef = useRef(null); // Ref untuk wadah kanan (bingkai + gambar)
    const heroLeftContentRef = useRef(null); // 1. Tambahkan ref baru untuk konten kiri
    const fullText = heroContent.judul || DEFAULT_HERO.judul;
    const subtitle = heroContent.subjudul || DEFAULT_HERO.subjudul;
    const heroImage = heroContent.url_gambar || null;
    // logo_1/logo_2 berisi URL gambar upload. Hanya render bila benar URL/path
    // (kosong / data lama berupa nama = tidak menampilkan logo apa pun).
    const selectedLogos = [heroContent.logo_1, heroContent.logo_2]
        .filter((v) => v && (v.startsWith('/') || v.startsWith('http')))
        .map((v, index) => ({
            id: `logo-${index}`,
            name: `Logo ${index + 1}`,
            src: getFullUrl(v),
        }));

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
            const size = pseudoRandom(i + 1) * 1 + 3; // Ukuran antara 1px dan 4px
            const duration = pseudoRandom(i + 101) * 10 + 3; // Durasi antara 10s dan 20s
            const delay = pseudoRandom(i + 201) * 3; // Delay hingga 20s
            const left = pseudoRandom(i + 301) * 150; // Posisi horizontal acak

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

    // DETEKSI UKURAN LAYAR UNTUK ANIMASI KONDISIONAL
    useEffect(() => {
        const handleResize = () => {
            const isPotentiallyMobile = window.innerWidth <= 1040;
            const isVeryShortDesktop = window.innerHeight < 400; // Kondisi untuk "desktop mini"

            // 1. Tentukan apakah ini tampilan mobile (bukan "desktop mini")
            const isMobile = isPotentiallyMobile && !isVeryShortDesktop;
            setIsMobileView(isMobile);
        };

        handleResize(); // Panggil sekali saat mount untuk set state awal yang benar
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // EFEK ADAPTIF TERHADAP TINGGI NAVBAR
    useLayoutEffect(() => {
        const header = document.querySelector('.unified-header');
        const wrapper = landingWrapperRef.current;

        if (!header || !wrapper) return;

        let animationFrameId = null;

        const observer = new ResizeObserver(entries => {
            // Gunakan rAF untuk mencegah layout thrashing dan memastikan animasi mulus
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(() => {
                const entry = entries[0];
                if (entry) {
                    const height = entry.contentRect.height;
                    // Secara dinamis mengatur margin negatif untuk menarik background ke atas
                    // dan padding positif untuk mendorong konten ke bawah,
                    // agar konten selalu dimulai tepat di bawah navbar.
                    wrapper.style.marginTop = `-${height}px`;
                    wrapper.style.paddingTop = `${height}px`;
                }
            });
        });

        observer.observe(header);

        // Cleanup function untuk menghentikan observasi saat komponen di-unmount
        return () => {
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
        };
    }, []); // Dependensi kosong agar hanya berjalan sekali saat komponen dimuat

    // EFEK HERO PARALLAX
    useEffect(() => {
        let animationFrame;

        const rightContainer = heroRightCmsRef.current;
        const rightImage = heroImageRef.current;
        const leftContent = heroLeftContentRef.current;

        const animateHero = () => {
            if (!leftContent) return;

            const scrollY = window.scrollY;

            if (isMobileView) {
                // --- Animasi Scroll untuk Mobile ---
                // Konten Teks (kiri) tetap bergerak ke samping
                const leftOpacity = Math.max(1 - scrollY * 0.002, 0);
                leftContent.style.opacity = leftOpacity;
                const leftTranslateY = scrollY * 0.5;
                leftContent.style.transform = `translateY(${leftTranslateY}px)`;
                leftContent.style.filter = 'none';
                // Konten Gambar (kanan) diubah menjadi animasi tenggelam
                if (rightContainer) {
                    const rightTranslateY = scrollY * 0.6; // Kecepatan tenggelam
                    const rightOpacity = Math.max(1 - scrollY * 0.0025, 1); // Kecepatan menghilang
                    rightContainer.style.transform = `translateY(${rightTranslateY}px)`;
                    rightContainer.style.opacity = rightOpacity;
                }
            } else {
                // --- Animasi Parallax untuk Desktop ---
                const scaleDown = Math.max(1 - scrollY * 0.0001, 0.6);
                const blurValue = Math.min(scrollY * 0.007, 10);
                if (rightContainer && rightImage) {
                    const rightTranslateY = Math.min(scrollY * 1, 2000);
                    const brightness = Math.max(1 - scrollY * 0.00045, 0.58);
                    rightContainer.style.transform = `translateY(${rightTranslateY}px) scale(${scaleDown})`;
                    rightContainer.style.filter = `blur(${blurValue}px)`;
                    rightImage.style.transform = `scale(1)`;
                    rightImage.style.filter = `brightness(${brightness})`;
                }
                leftContent.style.opacity = '1';
                const leftTranslateY = Math.min(scrollY * 1, 2000);
                leftContent.style.transform = `translateY(${leftTranslateY}px) scale(${scaleDown})`;
                leftContent.style.filter = `blur(${blurValue}px)`;
            }

            animationFrame = requestAnimationFrame(animateHero);
        };
        animationFrame = requestAnimationFrame(animateHero);
        return () => cancelAnimationFrame(animationFrame);
    }, [isMobileView, heroImage]);

    return (
        <div className="landing-wrapper" ref={landingWrapperRef}>
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
                        <div className="hero-right-parallax-wrapper" ref={heroRightCmsRef}>
                            <div className="hero-right-cms">
                                <div className="bingkai-gambar-cms">
                                    <img
                                        ref={heroImageRef}
                                        src={heroImage}
                                        alt="Visual Gedung dan Latar Belakang BPMP"
                                        className="cms-dynamic-image"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default HeroSection;
