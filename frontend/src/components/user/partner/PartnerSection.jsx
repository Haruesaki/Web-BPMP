import React, { useEffect, useRef } from 'react';
import './PartnerSection.css';

// --- IMPORT ASSETS ---
import Mitra1Jpg from "../../../assets/source/Mitra (1).jpg";
import Mitra1Png from "../../../assets/source/Mitra (1).png";
import Mitra2 from "../../../assets/source/Mitra (2).png";
import Mitra3 from "../../../assets/source/Mitra (3).png";
import Mitra4 from "../../../assets/source/Mitra (4).png";
import Mitra5 from "../../../assets/source/Mitra (5).png";

const PartnerSection = () => {
    const trackRef = useRef(null);
    const partnersSectionRef = useRef(null);

    const mitraList = [Mitra1Jpg, Mitra5, Mitra2, Mitra3, Mitra1Png, Mitra4];

    // 1. LENS EFEK 3D LOGO MITRA
    useEffect(() => {
        const track = trackRef.current;
        const partnersSection = partnersSectionRef.current;
        let observerMitra;
        let animationFrameId;

        if (track && partnersSection) {
            const allLogos = track.querySelectorAll('.partner-logo');
            let isSectionVisible = false;

            function apply3DLensEffect() {
                if (!isSectionVisible) return;

                const screenCenter = window.innerWidth / 2;
                const maxDistance = window.innerWidth / 2;

                for (let i = 0; i < allLogos.length; i++) {
                    const rect = allLogos[i].getBoundingClientRect();

                    if (rect.width === 0) continue;

                    const logoCenter = rect.left + rect.width / 2;
                    const distanceFromCenter = Math.abs(screenCenter - logoCenter);

                    let normalized = distanceFromCenter / maxDistance;
                    if (normalized > 1) normalized = 1;

                    const scale = 0.65 + 0.95 * Math.pow(normalized, 2);

                    allLogos[i].style.transform = `scale(${scale}) translateZ(0)`;
                    allLogos[i].style.opacity = '1';
                    allLogos[i].style.filter = 'none';
                }

                animationFrameId = requestAnimationFrame(apply3DLensEffect);
            }

            observerMitra = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        isSectionVisible = entry.isIntersecting;
                        if (isSectionVisible) {
                            apply3DLensEffect();
                        } else {
                            if (animationFrameId) cancelAnimationFrame(animationFrameId);
                        }
                    });
                },
                { threshold: 0.01 }
            );

            const startObserver = () => {
                if (partnersSectionRef.current) {
                    observerMitra.observe(partnersSectionRef.current);
                }
            };

            if (document.readyState === 'complete') {
                startObserver();
            } else {
                window.addEventListener('load', startObserver);
            }
        }

        return () => {
            if (observerMitra) observerMitra.disconnect();
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            window.removeEventListener('load', () => { });
        };
    }, []);

    // 2. EFEK MARQUEE SCROLL VELOCITY 
    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        let percentX = 0;
        let lastScrollY = window.scrollY;
        let currentVelocity = 0;
        let animationFrameId;

        const animateMarquee = () => {
            const currentScrollY = window.scrollY;
            const scrollDelta = currentScrollY - lastScrollY;
            lastScrollY = currentScrollY;

            currentVelocity += (scrollDelta - currentVelocity) * 0.08;

            const baseSpeed = 0.04;
            const scrollSensitivity = 0.015;
            const totalSpeed = baseSpeed + (currentVelocity * scrollSensitivity);

            percentX -= totalSpeed;

            if (percentX <= -50) {
                percentX += 50;
            } else if (percentX > 0) {
                percentX -= 50;
            }

            track.style.transform = `translate3d(${percentX}%, 0, 0)`;
            animationFrameId = requestAnimationFrame(animateMarquee);
        };

        animationFrameId = requestAnimationFrame(animateMarquee);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <section className="partners-section" ref={partnersSectionRef}>
            <div className="partners-container">
                <div className="partners-track" ref={trackRef} style={{ gap: '0px' }}>
                    {[...mitraList, ...mitraList].map((mitra, index) => (
                        <img
                            key={index}
                            src={mitra}
                            alt={`Mitra Kerja BPMP ${index + 1}`}
                            className="partner-logo"
                            style={{ paddingRight: '7vw' }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PartnerSection;