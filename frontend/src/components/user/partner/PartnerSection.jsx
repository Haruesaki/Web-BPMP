import { useEffect, useRef, useState } from 'react';
import axiosInstance from '../../../api/axiosInstance';
import './PartnerSection.css';
import Mitra1Jpg from "../../../assets/source/Unila.jpeg";
import Mitra1Png from "../../../assets/source/Unila.jpeg";
import Mitra2 from "../../../assets/source/Unila.jpeg";
import Mitra4 from "../../../assets/source/Unila.jpeg";
import Mitra5 from "../../../assets/source/Unila.jpeg";

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getFullUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('blob:') || url.startsWith('http')) return url;
  return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

const fallbackMitra = [Mitra1Jpg, Mitra5, Mitra2, Mitra4, Mitra1Png];

const PartnerSection = ({ customMitraList, isPreviewMode = false }) => {
    const trackRef = useRef(null);
    const partnersSectionRef = useRef(null);
    const [fetchedMitra, setFetchedMitra] = useState(null);
    const [loopCopies, setLoopCopies] = useState(2);

    useEffect(() => {
      if (customMitraList) return;

      const fetchMitra = async () => {
        try {
          const res = await axiosInstance.get('/api/beranda/mitra');
          const data = res.data?.data || [];
          if (data.length > 0) {
            setFetchedMitra(data.map(m => getFullUrl(m.url_logo)));
          } else {
            setFetchedMitra([]);
          }
        } catch (error) {
          console.error("Gagal mengambil logo mitra:", error);
        }
      };
      fetchMitra();
    }, [customMitraList]);

    const activeMitraList = customMitraList ? customMitraList : (fetchedMitra === null ? fallbackMitra : fetchedMitra);
    const showPlaceholder = activeMitraList.length === 0;

    useEffect(() => {
        if (activeMitraList.length === 0) return;

        const calculateAndSetCopies = () => {
            const track = trackRef.current;
            const section = partnersSectionRef.current;
            if (!track || !section) return;
            const firstGroup = track.querySelector('.partner-logo-group');
            if (!firstGroup) return;

            const groupWidth = firstGroup.getBoundingClientRect().width;
            const screenWidth = isPreviewMode 
                ? (section.clientWidth || window.innerWidth) 
                : window.innerWidth;

            if (groupWidth > 0 && screenWidth > 0) {
                const requiredCopies = Math.ceil(screenWidth / groupWidth) + 3;
                setLoopCopies(prev => Math.max(prev, requiredCopies));
            }
        };

        const timer = setTimeout(calculateAndSetCopies, 50);
        window.addEventListener('resize', calculateAndSetCopies);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', calculateAndSetCopies);
        };
    }, [activeMitraList, isPreviewMode]);

    useEffect(() => {
        const track = trackRef.current;
        const partnersSection = partnersSectionRef.current;
        if (!track || !partnersSection) return;

        let animationId;
        let observer;
        let resizeObserver;

        const logoFrames = track.querySelectorAll('.partner-logo-frame');
        logoFrames.forEach((frame) => frame.style.removeProperty('opacity'));
        let isSectionVisible = false;
        let loopWidth = 0;
        let layoutInitialized = false;
        let translateX = 0;
        let lastScrollY = window.scrollY;
        let currentVelocity = 0;
        let lastTime = 0;

        const getAnimationSettings = () => {
            const screenWidth = isPreviewMode ? (partnersSectionRef.current?.clientWidth || window.innerWidth) : window.innerWidth;

            if (screenWidth <= 370) {
                return {
                    screenWidth,
                    baseSpeedPerSecond: 40,
                    scrollSensitivityPerSecond: 10,
                    maxRotation: 28, // Rotasi logo di tepi layar
                    minScale: 0.86,  // Ukuran logo di titik tengah
                    maxScale: 1.05,  // Ukuran logo di sisi kanan/kiri
                    maxDepth: 260,   // Jarak kedalaman 3D
                    perspective: 620,// Kekuatan efek perspektif
                };
            }

            if (screenWidth <= 953) {
                return {
                    screenWidth,
                    baseSpeedPerSecond: 50,
                    scrollSensitivityPerSecond: 16,
                    maxRotation: 38, // Rotasi logo di tepi layar
                    minScale: 0.9,   // Ukuran logo di titik tengah
                    maxScale: 1.2,   // Ukuran logo di sisi kanan/kiri
                    maxDepth: 380,   // Jarak kedalaman 3D
                    perspective: 700,// Kekuatan efek perspektif
                };
            }

            if (screenWidth <= 1280) {
                return {
                    screenWidth,
                    baseSpeedPerSecond: 70,
                    scrollSensitivityPerSecond: 24,
                    maxRotation: 38, // Rotasi logo di tepi layar
                    minScale: 1.1,   // Ukuran logo di titik tengah
                    maxScale: 1.4,   // Ukuran logo di sisi kanan/kiri
                    maxDepth: 540,   // Jarak kedalaman 3D
                    perspective: 760,// Kekuatan efek perspektif
                };
            }

            return {
                screenWidth,
                baseSpeedPerSecond: 120,
                scrollSensitivityPerSecond: 38,
                maxRotation: 50, // Rotasi logo di tepi layar
                minScale: 2.4,   // Ukuran logo di titik tengah
                maxScale: 4.5,   // Ukuran logo di sisi kanan/kiri
                maxDepth: 600,   // Jarak kedalaman 3D
                perspective: 180,// Kekuatan efek perspektif
            };
        };

        const measureLoopWidth = () => {
            const groups = track.querySelectorAll('.partner-logo-group');
            if (groups.length < 2) return;
 
            const previousLoopWidth = loopWidth;
            const firstGroupRect = groups[0].getBoundingClientRect();
            const secondGroupRect = groups[1].getBoundingClientRect();
            const measuredWidth = secondGroupRect.left - firstGroupRect.left;

            if (measuredWidth > 0) {
                loopWidth = measuredWidth;
                layoutInitialized = true;
                if (previousLoopWidth > 0 && previousLoopWidth !== loopWidth) {
                    translateX = (translateX / previousLoopWidth) * loopWidth;
                }
                normalizeTranslate();
            }
        };

        const normalizeTranslate = () => {
            if (!loopWidth) return;
            translateX = ((translateX % loopWidth) + loopWidth) % loopWidth;
            if (translateX > 0) translateX -= loopWidth;
        };

        function animate(currentTime) {
            if (!isSectionVisible) return;

            if (!lastTime) {
                lastTime = currentTime;
                animationId = requestAnimationFrame(animate);
                return;
            }
            const deltaTime = Math.min(currentTime - lastTime, 50);
            lastTime = currentTime;

            if (!layoutInitialized) {
                measureLoopWidth();
            }
            const animationSettings = getAnimationSettings();

            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - lastScrollY;
            lastScrollY = currentScrollY;
            currentVelocity += (scrollDelta - currentVelocity) * 0.06;

            const { baseSpeedPerSecond, scrollSensitivityPerSecond } = animationSettings;
            const rawSpeedPerSecond = baseSpeedPerSecond + (currentVelocity * scrollSensitivityPerSecond);
            const minSpeedPerSecond = baseSpeedPerSecond * 0.35;
            const maxSpeedPerSecond = baseSpeedPerSecond * 2.2;
            const totalSpeedPerSecond = Math.min(maxSpeedPerSecond, Math.max(minSpeedPerSecond, rawSpeedPerSecond));
            translateX -= totalSpeedPerSecond * (deltaTime / 1000);

            if (layoutInitialized && loopWidth > 0) {
                normalizeTranslate();
            }
            track.style.transform = `translate3d(${translateX}px, 0, 0)`;

            if (!layoutInitialized) {
                animationId = requestAnimationFrame(animate);
                return;
            }

            const { screenWidth, maxRotation, minScale, maxScale, maxDepth, perspective } = animationSettings;
            const screenCenter = screenWidth / 2;
            const maxDistance = screenWidth;

            /*
            =========================================
              KONFIGURASI ANIMASI 3D LOGO
            =========================================
            - perspective: Mengatur kekuatan efek 3D. Nilai lebih kecil = lebih dramatis.
            - maxScale:    Ukuran logo saat berada di sisi kanan/kiri (paling dekat).
            - minScale:    Ukuran logo saat berada di titik tengah (paling jauh).
            - maxDepth:    Jarak kedalaman (mundur) logo saat di tengah.
            - maxRotation: Kemiringan maksimal logo saat berada di sisi layar.
            */
            for (let i = 0; i < logoFrames.length; i++) {
                const frame = logoFrames[i];
                const logo = frame.querySelector('.partner-logo');
                if (!logo) continue;
                const frameRect = frame.getBoundingClientRect();
                const logoCenter = frameRect.left + frameRect.width / 2;

                const distanceFromCenter = logoCenter - screenCenter;
                const normalizedDistance = Math.max(-1, Math.min(1, distanceFromCenter / maxDistance));
                const absNormalizedDistance = Math.abs(normalizedDistance);
                const depthProgress = 1 - absNormalizedDistance;
                const scale = minScale + (maxScale - minScale) * absNormalizedDistance;
                const rotationAngle = -maxRotation * normalizedDistance;
                const translateZ = -maxDepth * depthProgress;

                logo.style.transform = `perspective(${perspective}px) translateZ(${translateZ}px) rotateY(${rotationAngle}deg) scale(${scale})`;
            }

            animationId = requestAnimationFrame(animate);
        }

        observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isSectionVisible = entry.isIntersecting;
                    if (isSectionVisible) {
                        lastTime = 0;
                        animationId = requestAnimationFrame(animate);
                    } else {
                        if (animationId) cancelAnimationFrame(animationId);
                    }
                });
            },
            { threshold: 0.01 }
        );

        const startObserver = () => {
            if (partnersSectionRef.current) {
                observer.observe(partnersSectionRef.current);
            }
        };

        const firstGroup = track.querySelector('.partner-logo-group');
        if (firstGroup && 'ResizeObserver' in window) {
            resizeObserver = new ResizeObserver(measureLoopWidth);
            resizeObserver.observe(firstGroup);
        }
        window.addEventListener('resize', measureLoopWidth);

        if (document.readyState === 'complete') {
            startObserver();
        } else {
            window.addEventListener('load', startObserver);
        }

        return () => {
            if (observer) observer.disconnect();
            if (resizeObserver) resizeObserver.disconnect();
            if (animationId) cancelAnimationFrame(animationId);
            window.removeEventListener('load', startObserver);
            window.removeEventListener('resize', measureLoopWidth);
        };
    }, [activeMitraList, loopCopies, isPreviewMode]);

    return (
        <section className="partners-section" ref={partnersSectionRef}>
            <div className="partners-container">
                {showPlaceholder ? (
                    <div className="partner-placeholder-wrapper">
                        <i className="fa-solid fa-camera"></i>
                        <span>Image tidak ada</span>
                    </div>
                ) : (
                    <div className="partners-track" ref={trackRef}>
                        {Array.from({ length: loopCopies }).map((_, groupIndex) => (
                            <div className="partner-logo-group" key={groupIndex}>
                                {activeMitraList.map((mitra, index) => (
                                    <span className="partner-logo-frame" key={`${groupIndex}-${index}`}>
                                        <img
                                            src={mitra}
                                            alt={`Mitra Kerja BPMP ${index + 1}`}
                                            className="partner-logo"
                                        />
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default PartnerSection;
